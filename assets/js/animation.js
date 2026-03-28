

(function () {
  'use strict';

  const grid       = document.getElementById('partnersGrid');
  const centerCard = document.getElementById('partnerCard');

  if (!grid || !centerCard) {
    console.warn('[animation.js] #partnersGrid or #partnerCard not found.');
    return;
  }

  const logoCards = Array.from(grid.querySelectorAll('.logo-card'));

  /* ── Timing config ── */
  const STAGGER_SPREAD   = 40;   /* ms between each card spreading OUT */
  const STAGGER_COLLAPSE = 30;   /* ms between each card collapsing IN */
  const DURATION_SPREAD  = 3000;  /* ms — spread animation              */
  const DURATION_COLLAPSE= 3000;  /* ms — collapse animation            */

  /* ── Easing functions ── */
  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ── Helpers ── */
  function getCenter(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function getCurrentState(card) {
    const tf    = card.style.transform || '';
    const match = tf.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    return {
      x:  match ? parseFloat(match[1]) : 0,
      y:  match ? parseFloat(match[2]) : 0,
      op: card.style.opacity !== '' ? parseFloat(card.style.opacity) : 1,
    };
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── Per-card RAF animator ── */
  const anims = new Map();

  function animateCard(card, fromX, fromY, toX, toY, fromOp, toOp, duration, delay, easeFn) {
    if (anims.has(card)) cancelAnimationFrame(anims.get(card));

    const startTime = performance.now() + delay;

    function step(now) {
      const elapsed = now - startTime;
      if (elapsed < 0) { anims.set(card, requestAnimationFrame(step)); return; }
      const t = Math.min(elapsed / duration, 1);
      const e = easeFn(t);
      card.style.transform = `translate(${fromX + (toX - fromX) * e}px, ${fromY + (toY - fromY) * e}px)`;
      card.style.opacity   = String(fromOp + (toOp - fromOp) * e);
      if (t < 1) anims.set(card, requestAnimationFrame(step));
      else        anims.delete(card);
    }

    anims.set(card, requestAnimationFrame(step));
  }

  /* ── Offset map: card → { x, y } pixels needed to reach center ── */
  const offsetMap = new Map();

  function computeOffsets() {
    /* Strip transforms first so getBoundingClientRect gives natural positions */
    logoCards.forEach(c => { c.style.transform = ''; });
    const cc = getCenter(centerCard);
    logoCards.forEach(card => {
      const lc = getCenter(card);
      offsetMap.set(card, { x: cc.x - lc.x, y: cc.y - lc.y });
    });
  }

  /* ── Initial state: all logos hidden behind the partner card ── */
  function initCollapsed() {
    computeOffsets();
    logoCards.forEach(card => {
      const o = offsetMap.get(card);
      card.style.transform = `translate(${o.x}px, ${o.y}px)`;
      card.style.opacity   = '0';
    });
  }

  /* ── Hover IN: logos spread out from center to their grid positions ── */
  function spreadOut() {
    shuffle(logoCards).forEach((card, i) => {
      const cur = getCurrentState(card);
      animateCard(
        card,
        cur.x, cur.y,
        0, 0,         /* target: natural layout position */
        cur.op, 1,    /* fade in                         */
        DURATION_SPREAD,
        i * STAGGER_SPREAD,
        easeOutBack   /* springy pop-out feel            */
      );
    });
  }

  /* ── Hover OUT: logos collapse back behind the partner card ── */
  function collapseIn() {
    shuffle(logoCards).forEach((card, i) => {
      const cur = getCurrentState(card);
      const o   = offsetMap.get(card);
      animateCard(
        card,
        cur.x, cur.y,
        o.x, o.y,     /* target: center of partner card  */
        cur.op, 0,    /* fade out                        */
        DURATION_COLLAPSE,
        i * STAGGER_COLLAPSE,
        easeInOutCubic
      );
    });
  }

  /* ── Auto-loop timing ── */
  const PAUSE_SPREAD   = 1500;  /* ms to hold after fully spread out  */
  const PAUSE_COLLAPSE = 800;   /* ms to hold after fully collapsed    */

  function totalSpreadDuration() {
    return DURATION_SPREAD + logoCards.length * STAGGER_SPREAD + PAUSE_SPREAD;
  }
  function totalCollapseDuration() {
    return DURATION_COLLAPSE + logoCards.length * STAGGER_COLLAPSE + PAUSE_COLLAPSE;
  }

  let loopTimer = null;

  function runLoop() {
    spreadOut();
    loopTimer = setTimeout(() => {
      collapseIn();
      loopTimer = setTimeout(runLoop, totalCollapseDuration());
    }, totalSpreadDuration());
  }

  /* ── Bootstrap after layout is fully rendered ── */
  window.addEventListener('load', () => {
    initCollapsed();
    runLoop();
  });

  /* ── Recompute on resize so offsets stay accurate ── */
  window.addEventListener('resize', () => {
    computeOffsets();
  });

})();
