(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      scrollToTarget(target);
    });
  });

  /* ---------- Page reveal ---------- */
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loaderBar');
  const count = document.getElementById('loaderCount');
  const onReady = [];
  const finishLoad = () => {
    root.classList.add('is-loaded');
    onReady.forEach((fn) => fn());
    setTimeout(() => root.classList.add('is-done'), 1400);
  };
  if (reduceMotion || !loader) {
    finishLoad();
  } else {
    if (lenis) lenis.stop();
    const minTime = 1100, t0 = performance.now();
    let loaded = document.readyState === 'complete';
    window.addEventListener('load', () => { loaded = true; });
    const step = (now) => {
      const elapsed = now - t0;
      // creep to 90% while assets load, then run to 100
      const cap = loaded ? 1 : 0.9;
      const p = Math.min(cap, elapsed / minTime);
      bar.style.transform = `scaleX(${p})`;
      count.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(() => { finishLoad(); if (lenis) lenis.start(); }, 180);
    };
    requestAnimationFrame(step);
    // never trap the page behind the loader
    setTimeout(() => { if (!root.classList.contains('is-loaded')) { finishLoad(); if (lenis) lenis.start(); } }, 4000);
  }

  /* ---------- Scroll-driven: nav, progress, sticky CTA, parallax ---------- */
  const nav = document.getElementById('nav');
  const sticky = document.getElementById('stickyCta');
  const signup = document.getElementById('signup');
  const progress = document.getElementById('progress');
  const heroBg = document.getElementById('heroBg');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  let lastY = window.scrollY, ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > vh * 0.6 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;

    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    const s = signup.getBoundingClientRect();
    sticky.classList.toggle('is-on', y > vh * 0.8 && !(s.top < vh && s.bottom > 0));

    if (!reduceMotion) {
      if (y < vh * 1.2) heroBg.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
      parallax.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const off = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${off}px, 0)`;
      });
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------- Active nav link ---------- */
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) sectionIO.observe(s); });

  /* ---------- Scroll reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- Stat count-up ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, target = Number(el.dataset.count), dur = 900, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  if (!reduceMotion) document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- $40,000 count-up ---------- */
  const prize = document.getElementById('prizeCount');
  if (!reduceMotion) {
    prize.textContent = '0';
    onReady.push(() => {
      const target = 40000, dur = 2000, t0 = performance.now() + 450;
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - t0) / dur));
        prize.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Kickoff countdown (Oct 10, 12–4 PM ET) ---------- */
  const start = new Date('2026-10-10T12:00:00-04:00').getTime();
  const end = new Date('2026-10-10T16:00:00-04:00').getTime();
  const els = ['d', 'h', 'm', 's'].map((k) => document.getElementById('cd-' + k));
  const label = document.getElementById('clockLabel');
  const pad2 = (n) => String(n).padStart(2, '0');
  const updateClock = () => {
    const now = Date.now();
    let diff = start - now;
    if (now >= start && now < end) { label.textContent = 'Live now · ends in'; diff = end - now; }
    else if (now >= end) { label.textContent = "That's a wrap"; diff = 0; }
    diff = Math.max(0, diff);
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
          m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    [d, h, m, s].forEach((v, i) => { els[i].textContent = pad2(v); });
  };
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Magnetic buttons ---------- */
  if (!reduceMotion && canHover) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const lbl = btn.querySelector('.btn__label');
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
        if (lbl) lbl.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1), background .4s, color .4s, box-shadow .4s';
        btn.style.transform = '';
        if (lbl) lbl.style.transform = '';
        setTimeout(() => { btn.style.transition = ''; }, 700);
      });
    });
  }

  /* ---------- Card tilt + shine ---------- */
  if (!reduceMotion && canHover) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-8px)`;
        card.style.setProperty('--shine', `${(x + 0.5) * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
        card.style.removeProperty('--shine');
      });
    });
  }

  /* ---------- Reaction warm-up ---------- */
  const padBtn = document.getElementById('pad');
  const big = document.getElementById('padBig');
  const small = document.getElementById('padSmall');
  const bestEl = document.getElementById('bestTime');
  let state = 'idle', timer = null, goAt = 0;
  let best = null;
  try { best = Number(localStorage.getItem('yc-best')) || null; } catch (_) {}
  const showBest = () => { bestEl.textContent = best ? best + ' ms' : '—'; };
  showBest();

  const verdict = (ms) => {
    if (ms < 200) return 'Jack should be nervous';
    if (ms < 260) return 'Leaderboard material';
    if (ms < 330) return 'Solid. Go again';
    return 'Tap to try again';
  };
  const set = (s, b, sm) => { state = s; padBtn.dataset.state = s; big.textContent = b; small.textContent = sm; };

  const trigger = () => {
    if (state === 'idle' || state === 'result' || state === 'early') {
      set('wait', 'Wait…', 'Tap when it turns green');
      timer = setTimeout(() => { goAt = performance.now(); set('go', 'Tap!', 'Now'); }, 1200 + Math.random() * 2300);
    } else if (state === 'wait') {
      clearTimeout(timer);
      set('early', 'Too early', 'Tap to retry');
    } else if (state === 'go') {
      const ms = Math.round(performance.now() - goAt);
      if (!best || ms < best) {
        best = ms;
        try { localStorage.setItem('yc-best', String(ms)); } catch (_) {}
        showBest();
      }
      set('result', ms + ' ms', verdict(ms));
    }
  };
  // pointerdown is snappier than click for a reaction test
  padBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); trigger(); });
  padBtn.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); trigger(); }
  });

  /* ---------- Sign-up form (front-end only; wire to an endpoint later) ---------- */
  const form = document.getElementById('form');
  const err = document.getElementById('formError');
  const done = document.getElementById('formDone');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.textContent = '';
    let firstBad = null;
    ['first', 'last', 'email'].forEach((name) => {
      const input = form.elements[name];
      const bad = !input.value.trim() || (name === 'email' && !input.checkValidity());
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !firstBad) firstBad = input;
    });
    if (firstBad) {
      err.textContent = 'Add your name and a valid email.';
      firstBad.focus();
      return;
    }
    done.hidden = false;
  });
})();
