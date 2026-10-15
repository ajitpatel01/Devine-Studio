/* ==========================================================================
   Devine Studio — motion engine
   One rAF loop drives smooth scroll, scroll-scrubbed text, parallax and the
   team image expansion. Everything else is IntersectionObserver + CSS.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  let vh = innerHeight;
  let vw = innerWidth;

  /* ------------------------------------------------------------------ *
   * Smooth scroll (Lenis when available, native otherwise)
   * ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  }
  const scrollY = () => (lenis ? lenis.scroll : window.scrollY);

  /* ------------------------------------------------------------------ *
   * Split text into words, preserving inline markup (<br>, <span>…)
   * ------------------------------------------------------------------ */
  function split(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--wi', i++);
            const inner = document.createElement('span');
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    return $$('.w', el);
  }
  $$('[data-split]').forEach(split);
  $$('.hero__lede').forEach(split);

  /* ------------------------------------------------------------------ *
   * Odometer — each digit is a vertical reel that spins and settles
   * ------------------------------------------------------------------ */
  const REEL = 4; // cycles of 0–9 per reel → room for multi-spin rolls
  const fmt = (el, v) => (el.dataset.format === 'comma' ? Number(v).toLocaleString('en-US') : String(v));
  class Odometer {
    constructor(el) {
      this.el = el;
      this.value = null;
      this.cols = [];
      this.shape = '';
      el.setAttribute('aria-label', fmt(el, el.dataset.count));
    }
    // digits become spinning reels; separators (",") stay put
    build(str) {
      this.el.textContent = '';
      this.cols = [];
      this.shape = str.replace(/\d/g, '0');
      [...str].forEach((ch) => {
        if (!/\d/.test(ch)) {
          const sep = document.createElement('span');
          sep.className = 'odo__sep';
          sep.setAttribute('aria-hidden', 'true');
          sep.textContent = ch;
          this.el.appendChild(sep);
          return;
        }
        const col = document.createElement('span');
        col.className = 'odo__col';
        col.setAttribute('aria-hidden', 'true');
        const strip = document.createElement('span');
        strip.className = 'odo__strip';
        for (let k = 0; k < REEL * 10; k++) {
          const d = document.createElement('span');
          d.textContent = k % 10;
          strip.appendChild(d);
        }
        col.appendChild(strip);
        this.el.appendChild(col);
        this.cols.push({ strip, idx: 0 });
      });
    }
    place(col, idx, ms = 0, delay = 0) {
      col.strip.style.transition = ms
        ? `transform ${ms}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
        : 'none';
      col.strip.style.transform = `translate3d(0, calc(${-idx} * var(--cell)), 0)`;
      col.idx = idx;
    }
    set(value, { intro = false } = {}) {
      const str = fmt(this.el, value);
      const digits = str.replace(/\D/g, '');
      const rebuilt = !this.cols.length || this.shape !== str.replace(/\d/g, '0');
      if (rebuilt) this.build(str);
      const dir = this.value == null || value >= this.value ? 1 : -1;
      this.value = value;
      this.el.setAttribute('aria-label', str);
      const n = this.cols.length;
      if (reduced) { this.cols.forEach((col, c) => this.place(col, +digits[c])); return; }

      // Normalise every reel to its middle cycle without animating, so the
      // next roll always has room to travel in either direction.
      this.cols.forEach((col) => this.place(col, (col.idx % 10) + 10));
      void this.el.offsetHeight;

      this.cols.forEach((col, c) => {
        const d = +digits[c];
        const fromRight = n - 1 - c;
        let target;
        if (intro || rebuilt) {
          // reveal: spin from 0, right-most reels spin the most
          this.place(col, 0);
          void col.strip.offsetHeight;
          target = Math.min(REEL - 1, 1 + fromRight) * 10 + d;
          this.place(col, target, 1500 + fromRight * 120, c * 60);
        } else {
          const cur = col.idx % 10;
          if (cur === d) return;
          target = dir > 0 ? (d > cur ? 10 + d : 20 + d) : (d < cur ? 10 + d : d);
          this.place(col, target, 1000 + fromRight * 80, c * 35);
        }
      });
    }
  }
  const odos = new Map();
  $$('.odo').forEach((el) => {
    const o = new Odometer(el);
    odos.set(el, o);
    // pre-render zeros at the right width so layout never jumps
    o.build(fmt(el, el.dataset.count).replace(/\d/g, '0'));
    o.cols.forEach((col) => o.place(col, 0));
  });

  /* ------------------------------------------------------------------ *
   * Reveal on enter
   * ------------------------------------------------------------------ */
  // A fully clipped [data-mask] has zero visible area, so Chrome never
  // reports it as intersecting — observe its parent and reveal on its behalf.
  const maskProxies = new Map();
  $$('[data-mask]').forEach((m) => {
    const host = m.parentElement;
    if (!maskProxies.has(host)) maskProxies.set(host, []);
    maskProxies.get(host).push(m);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (maskProxies.has(el)) {
        maskProxies.get(el).forEach((m) => m.classList.add('is-in'));
        if (!el.matches('[data-reveal], [data-split="rise"], [data-line], .odo, [data-io]')) { io.unobserve(el); return; }
      }
      el.classList.add('is-in');
      if (el.matches('.odo')) {
        const o = odos.get(el);
        setTimeout(() => o.set(+el.dataset.count, { intro: true }), +(el.dataset.delay || 0));
      }
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  $$('[data-reveal], [data-split="rise"], [data-line], .odo, [data-io]').forEach((el) => io.observe(el));
  maskProxies.forEach((_, host) => io.observe(host));

  /* ------------------------------------------------------------------ *
   * Scroll-linked effects
   * ------------------------------------------------------------------ */
  const scrubs = $$('[data-split="scrub"]').map((el) => ({ el, words: $$('.w', el), on: -1 }));
  const parallax = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed), y: 0 }));
  const team = $('.team');
  const teamFrame = team && $('.team__frame', team);
  const pdHeroBg = $('.pd-hero__bg');
  const desktop = () => vw > 809;

  function onScroll() {
    // word-by-word scrub
    scrubs.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.38));
      const on = Math.round(p * s.words.length);
      if (on === s.on) return;
      s.words.forEach((w, i) => w.classList.toggle('on', i < on));
      s.on = on;
    });

    // parallax
    if (desktop() && !reduced) {
      parallax.forEach((p) => {
        const r = p.el.getBoundingClientRect();
        const center = r.top - p.y + r.height / 2;
        const y = (center - vh / 2) * -p.speed;
        if (Math.abs(y - p.y) < 0.1) return;
        p.y = y;
        p.el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      });
    }

    // team image grows from inset card to full-bleed
    if (teamFrame && desktop() && !reduced) {
      const r = team.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 1.05));
      const e = 1 - Math.pow(1 - p, 3);
      teamFrame.style.setProperty('--inset-x', `${lerp(22, 0, e).toFixed(3)}%`);
      teamFrame.style.setProperty('--inset-r', `${lerp(12, 0, e).toFixed(2)}px`);
      teamFrame.style.setProperty('--img-s', lerp(1.22, 1, e).toFixed(4));
    }

    // project hero drifts slower than the page
    if (pdHeroBg && !reduced) {
      pdHeroBg.style.transform = `translate3d(0, ${(scrollY() * 0.35).toFixed(1)}px, 0)`;
    }
  }

  /* ------------------------------------------------------------------ *
   * Header: hide on scroll down, reveal on scroll up
   * ------------------------------------------------------------------ */
  const header = $('.header');
  let lastY = 0;
  function onHeader() {
    const y = scrollY();
    if (!header || body.classList.contains('menu-open')) { lastY = y; return; }
    header.classList.toggle('is-scrolled', y > 40);
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > 240);
      lastY = y;
    }
  }

  /* ------------------------------------------------------------------ *
   * Main loop
   * ------------------------------------------------------------------ */
  function raf(t) {
    if (lenis) lenis.raf(t);
    onScroll();
    onHeader();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  addEventListener('resize', () => { vh = innerHeight; vw = innerWidth; if (!desktop()) parallax.forEach((p) => { p.el.style.transform = ''; p.y = 0; }); });

  /* ------------------------------------------------------------------ *
   * Menu
   * ------------------------------------------------------------------ */
  const menuBtn = $('.menu-btn');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    header && header.classList.toggle('menu-open', open);
    header && header.classList.remove('is-hidden');
    menuBtn && menuBtn.setAttribute('aria-expanded', open);
    $('.menu') && $('.menu').setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    else root.style.overflow = open ? 'hidden' : '';
  }
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  $$('.menu a').forEach((a) => a.addEventListener('click', () => {
    if (a.getAttribute('href').startsWith('#') || a.pathname === location.pathname) setMenu(false);
  }));

  /* ------------------------------------------------------------------ *
   * Accordions (services + FAQ) — one open at a time
   * ------------------------------------------------------------------ */
  function accordion(itemSel, headSel) {
    const items = $$(itemSel);
    items.forEach((item) => {
      const head = $(headSel, item);
      head.setAttribute('aria-expanded', item.classList.contains('is-open'));
      head.addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((i) => { i.classList.remove('is-open'); $(headSel, i).setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', open);
        head.setAttribute('aria-expanded', open);
      });
    });
  }
  accordion('.acc__item', '.acc__head');
  accordion('.q', '.q__head');

  /* ------------------------------------------------------------------ *
   * Process steps — expanding cards with autoplay
   * ------------------------------------------------------------------ */
  const steps = $('.steps');
  if (steps) {
    const cards = $$('.step', steps);
    let active = 0;
    let hovering = false;
    const activate = (i) => {
      active = (i + cards.length) % cards.length;
      cards.forEach((c, k) => {
        c.classList.toggle('is-active', k === active);
        const bar = $('.step__progress i', c);
        if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
    };
    cards.forEach((c, i) => {
      c.addEventListener('mouseenter', () => { hovering = true; steps.classList.add('is-paused'); if (i !== active) activate(i); });
      c.addEventListener('click', () => activate(i));
      const bar = $('.step__progress i', c);
      bar && bar.addEventListener('animationend', () => { if (!hovering) activate(active + 1); });
    });
    steps.addEventListener('mouseleave', () => { hovering = false; steps.classList.remove('is-paused'); });
    activate(0);
  }

  /* ------------------------------------------------------------------ *
   * Pricing — Projects / Monthly care. The incoming set re-reveals and
   * its prices roll up from zero.
   * ------------------------------------------------------------------ */
  const sw = $('.switch');
  if (sw) {
    const labels = $$('.toggle__label');
    const sets = { projects: $('[data-set="projects"]'), care: $('[data-set="care"]') };
    let busy = false;
    const show = (care) => {
      if (busy) return;
      busy = true;
      sw.setAttribute('aria-checked', care);
      sw.setAttribute('aria-label', care ? 'Show fixed-price projects' : 'Show monthly care plans');
      labels[0].classList.toggle('off', care);
      labels[1].classList.toggle('off', !care);
      const out = care ? sets.projects : sets.care;
      const inn = care ? sets.care : sets.projects;
      out.classList.add('is-leaving');
      setTimeout(() => {
        out.hidden = true;
        out.classList.remove('is-leaving');
        inn.hidden = false;
        const cards = $$('.plan', inn);
        cards.forEach((c) => c.classList.remove('is-in'));
        void inn.offsetHeight;
        cards.forEach((c) => c.classList.add('is-in'));
        $$('.odo', inn).forEach((el) => {
          io.unobserve(el);
          setTimeout(() => odos.get(el).set(+el.dataset.count, { intro: true }), 150 + +(el.dataset.delay || 0));
        });
        busy = false;
      }, reduced ? 0 : 320);
    };
    sw.addEventListener('click', () => show(sw.getAttribute('aria-checked') !== 'true'));
    labels[0].addEventListener('click', () => sw.getAttribute('aria-checked') === 'true' && show(false));
    labels[1].addEventListener('click', () => sw.getAttribute('aria-checked') !== 'true' && show(true));
  }

  /* ------------------------------------------------------------------ *
   * Page transitions (charcoal veil) + intro
   * ------------------------------------------------------------------ */
  const veil = document.createElement('div');
  veil.className = 'veil';
  body.appendChild(veil);

  const entering = sessionStorage.getItem('veil') === '1';
  sessionStorage.removeItem('veil');
  if (entering && !reduced) {
    veil.style.transition = 'none';
    veil.style.transform = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      veil.style.transition = '';
      veil.style.transform = '';
      veil.classList.add('is-entering');
      setTimeout(() => veil.classList.remove('is-entering'), 1000);
    }));
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.origin !== location.origin || a.protocol === 'mailto:') return;
    if (a.pathname === location.pathname && a.search === location.search) {
      if (a.hash) {
        e.preventDefault();
        setMenu(false);
        const t = $(a.hash);
        if (t) lenis ? lenis.scrollTo(t, { offset: -20, duration: 1.6 }) : t.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (reduced) return;
    e.preventDefault();
    sessionStorage.setItem('veil', '1');
    veil.classList.add('is-leaving');
    setTimeout(() => { location.href = a.href; }, 700);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) veil.classList.remove('is-leaving'); });

  const start = () => setTimeout(() => body.classList.add('is-loaded'), entering ? 450 : 150);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);

  // landing on an anchor from another page
  if (location.hash) {
    const t = $(location.hash);
    t && setTimeout(() => (lenis ? lenis.scrollTo(t, { immediate: true }) : t.scrollIntoView()), 50);
  }

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
