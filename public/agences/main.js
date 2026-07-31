// ===== Nav : fond au scroll =====
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ===== Révélation au scroll =====
// Arrivée via une ancre (#methode, #contact…) : tout est visible d'emblée,
// pas d'attente d'animation sur du contenu déjà à l'écran.
const revealables = document.querySelectorAll('.reveal');
if (location.hash) revealables.forEach((el) => el.classList.add('in'));
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealables.forEach((el) => io.observe(el));

// ===== Stage hero : la transformation J1 → J60 au survol =====
// 60 frames extraites de la vidéo (1 frame = 1 jour). La position du
// pointeur sur la scène pilote le jour affiché ; au repos, la scène
// oscille lentement entre les deux états.
(() => {
  const stage = document.getElementById('stage');
  const tilt = document.getElementById('stageTilt');
  const canvas = document.getElementById('morphCanvas');
  const dayLabel = document.getElementById('dayLabel');
  const scrubFill = document.getElementById('scrubFill');
  const hint = document.getElementById('stageHint');
  if (!stage || !canvas) return;

  const ctx = canvas.getContext('2d');
  const N = 60;
  const LAST = N - 1;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // --- Tout l'état est déclaré avant le premier chargement (pas de TDZ
  //     possible depuis les callbacks réseau)
  const frames = new Array(N).fill(null);
  let cur = 0, target = 0;
  let mode = 'wait';          // wait → intro → idle | pointer (reduced : final)
  let introT0 = 0;
  let lastPointerAt = 0;
  let idlePhase = 0;
  let rx = 0, ry = 0, trx = 0, tryy = 0;
  let running = true;
  let cw = 0, ch = 0;
  let drawnFrame = -1, dirty = true;
  let tier1Done = false;

  const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function nearest(i) {
    if (frames[i]) return frames[i];
    for (let d = 1; d < N; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (w > 0 && (w !== cw || h !== ch)) {
      cw = w; ch = h;
      canvas.width = cw; canvas.height = ch;
      dirty = true;
    }
  }

  function draw(idx) {
    const img = nearest(idx);
    if (!img || cw === 0 || (idx === drawnFrame && !dirty)) return;
    drawnFrame = idx; dirty = false;
    // frames 16/9 détourées sur blanc : image entière, aucun recadrage
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    fadeCorners();
  }

  // Filet de sécurité : la scène 3D source contient, tout au fond des quatre
  // coins, un bord de sol/particules que le détourage par frame ne blanchit
  // jamais complètement (le bâtiment ne s'approche jamais de ces zones, dans
  // aucune des 60 frames — sûr à estomper sans jamais mordre sur le sujet).
  function fadeCorners() {
    const r = Math.max(cw, ch) * 0.22;
    [[0, 0], [cw, 0], [0, ch], [cw, ch]].forEach(([cx, cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(0, cx - r), Math.max(0, cy - r), r, r);
    });
  }

  function setUI(idx) {
    if (dayLabel) dayLabel.textContent = 'J' + (idx + 1);
    if (scrubFill) scrubFill.style.width = (idx / LAST) * 100 + '%';
  }

  function startIntro() {
    if (reduced || mode !== 'wait') return;
    mode = 'intro';
    introT0 = performance.now();
  }

  // --- Chargement progressif : passes de plus en plus denses
  const src = (i) => `/agences/frames/f${String(i + 1).padStart(2, '0')}.jpg`;
  const queue = [];
  const seen = new Set();
  [6, 2, 1].forEach((step) => {
    for (let i = 0; i < N; i += step) {
      if (!seen.has(i)) { seen.add(i); queue.push(i); }
    }
    if (!seen.has(LAST)) { seen.add(LAST); queue.push(LAST); }
  });
  const TIER1 = Math.floor(N / 6);
  function loadNext(k) {
    if (k >= queue.length) return;
    const i = queue[k];
    const img = new Image();
    const done = (ok) => {
      if (ok) frames[i] = img;
      if (!tier1Done && k >= TIER1) { tier1Done = true; startIntro(); }
      dirty = true;
      loadNext(k + 1);
    };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = src(i);
  }

  resize();
  new ResizeObserver(resize).observe(canvas);
  loadNext(0);

  // --- Mouvement réduit : aucune animation spontanée (ni intro, ni oscillation,
  //     ni bascule 3D). La scène reste pilotable au doigt / à la souris : c'est un
  //     mouvement demandé par le visiteur, pas subi — et sans ça, elle s'affiche
  //     figée sur J60 et se lit comme un composant cassé.
  if (reduced) {
    mode = 'manual';
    const finish = () => {
      resize();
      if (nearest(0)) { draw(0); setUI(0); }
      else setTimeout(finish, 250);
    };
    finish();
  }

  if (hint && coarse) hint.textContent = 'Glissez — la même agence, de J1 à J60.';

  // --- Interaction pointeur
  stage.addEventListener('pointermove', (e) => {
    if (mode === 'wait' || mode === 'intro') return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    mode = 'pointer';
    lastPointerAt = performance.now();
    target = px * LAST;
    if (!reduced) {           // bascule 3D : du mouvement non demandé, on s'en passe
      tryy = (px - 0.5) * 7;  // rotateY : suit la souris
      trx = (0.5 - py) * 5;   // rotateX
    }
  });
  stage.addEventListener('pointerleave', () => {
    trx = 0; tryy = 0;
  });

  // --- Boucle d'animation
  function frame(now) {
    if (!running) return;

    if (mode === 'intro') {
      const t = Math.min(1, (now - introT0) / 4200);
      target = easeInOut(t) * LAST;
      if (t >= 1) { mode = 'idle'; idlePhase = Math.PI / 2; }
    } else if (mode === 'pointer' && !reduced && now - lastPointerAt > 3500) {
      mode = 'idle';
      idlePhase = Math.asin(Math.min(1, Math.max(-1, (cur / LAST) * 2 - 1)));
    } else if (mode === 'idle') {
      idlePhase += 0.0045;    // oscillation complète ~23 s
      target = (Math.sin(idlePhase) * 0.5 + 0.5) * LAST;
    }

    // Mouvement réduit : on colle au doigt, sans inertie ajoutée.
    cur += reduced ? (target - cur) : (target - cur) * 0.09;
    const idx = Math.round(Math.min(LAST, Math.max(0, cur)));
    draw(idx);
    setUI(idx);

    rx += (trx - rx) * 0.08;
    ry += (tryy - ry) * 0.08;
    tilt.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Pause de la boucle hors viewport
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) requestAnimationFrame(frame);
    });
  }, { threshold: 0.05 }).observe(stage);
})();
