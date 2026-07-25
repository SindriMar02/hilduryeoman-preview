/* ══════════════════════════════════════════════════════════════
   COPPERMINE — app.js
   Vertical-bars bg + rolling-list ported from 21st.dev to vanilla.
   ══════════════════════════════════════════════════════════════ */
(() => {
  const CM = window.CM || { all: [] };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const byHandle = {}; CM.all.forEach(p => (byHandle[p.h] = p));
  const pick = hs => (hs || []).map(h => byHandle[h]).filter(Boolean);
  const px = (u, w) => (u ? u + (u.includes('?') ? '&' : '?') + 'width=' + w : '');
  const isk = n => (n || 0).toLocaleString('de-DE') + ' kr';
  const catLabel = p => (p.v && p.v !== 'Coppermine' ? p.v : (p.ty || 'Coppermine'));
  const editorial = (CM.campaign || []);

  /* ── designed product card, with real size chips that add to bag ── */
  const esc = s => String(s).replace(/"/g, '&quot;');
  const prod = (p, i) => {
    // cards render at most 380px wide, so 620 still covers 2x screens
    const main = px(p.img[0], 620), alt = px(p.img[1] || p.img[0], 620);
    const price = p.cp ? `<span class="prod__price"><s>${isk(p.cp)}</s>${isk(p.p)}</span>` : `<span class="prod__price">${isk(p.p)}</span>`;
    // chip shows just the size token ("S / Navy Blue" → "S"); full variant kept for the bag
    const sizes = (p.sz && p.sz.length)
      ? p.sz.map(v => {
          const label = String(v.s).split('/')[0].trim() || v.s;
          return `<button class="sz" data-h="${esc(p.h)}" data-s="${esc(label)}" title="${esc(v.s)}${v.a ? '' : ' — sold out'}"${v.a ? '' : ' disabled'}>${label}</button>`;
        }).join('')
      : `<button class="sz" data-h="${esc(p.h)}" data-s="">+ Add</button>`;
    return `<article class="prod rv">
      <div class="prod__im">
        <span class="prod__ix">${String(i + 1).padStart(2, '0')}</span>
        <img class="main" src="${main}" alt="${p.t}" loading="lazy"/>
        <img class="alt" src="${alt}" alt="" aria-hidden="true" loading="lazy"/>
        <div class="prod__sizes"><span class="mono">Add</span>${sizes}</div>
      </div>
      <div class="prod__meta"><div><div class="prod__name">${p.t}</div><div class="prod__cat">(${catLabel(p)})</div></div>${price}</div>
    </article>`;
  };
  const railT = $('#railT'); if (railT) railT.innerHTML = pick(CM.featuredNew).map(prod).join('');
  const railST = $('#railST'); if (railST) railST.innerHTML = pick(CM.own).map(prod).join('');

  /* ── rolling-list categories (21st.dev rolling-list, ported) ── */
  const cnt = CM.counts || {};
  const catData = [
    { name: 'Dresses', count: String(cnt.dresses || 0).padStart(2, '0'), pool: CM.dresses },
    { name: 'Jewellery', count: String(cnt.jewellery || 0).padStart(2, '0'), pool: CM.jewellery },
    { name: 'Tops', count: String(cnt.tops || 0).padStart(2, '0'), pool: CM.tops },
    { name: 'Shoes', count: String(cnt.shoes || 0).padStart(2, '0'), pool: CM.shoes }
  ];
  const cats = $('#cats');
  if (cats) cats.innerHTML = catData.map((c, i) => {
    const p = pick(c.pool)[i % Math.max(pick(c.pool).length, 1)] || pick(c.pool)[0];
    const img = p ? px(p.img[0], 620) : '';
    return `<a class="roll-item" href="#">
      <div class="roll-clip"><div class="roll-move">
        <div class="roll-state"><span class="roll-h">${c.name}</span></div>
        <div class="roll-state"><span class="roll-h roll-h--hover">${c.name}</span></div>
      </div></div>
      <span class="roll-cat">(${c.count})</span>
      <div class="roll-img">${img ? `<img src="${img}" alt="${c.name}" loading="lazy"/>` : ''}<span class="roll-img__tint"></span></div>
    </a>`;
  }).join('');

  /* ── lookbook horizontal-pan frames ── */
  const panTrack = $('#panTrack');
  if (panTrack) {
    const specimens = pick(CM.featuredNew).slice(1, 11);
    let e = 0, frames = [];
    specimens.forEach((p, i) => {
      if (i % 3 === 0) frames.push(`<figure class="pan__i pan__i--tall"><img src="${px(editorial[e++ % editorial.length], 900)}" alt="Coppermine FW’25" loading="lazy"/><figcaption class="pan__cap">Reykjavík — FW’25</figcaption></figure>`);
      frames.push(`<figure class="pan__i pan__i--prod"><img src="${px(p.img[0], 620)}" alt="${p.t}" loading="lazy"/><figcaption class="pan__cap">${p.t}</figcaption></figure>`);
    });
    panTrack.insertAdjacentHTML('beforeend', frames.join(''));
  }

  /* ── as-worn wall: 3 auto-scrolling columns of her campaign imagery ── */
  const seenWall = $('#seenWall');
  if (seenWall) {
    const shots = (CM.wall || []).slice(0, 12);
    const cols = [[], [], []];
    shots.forEach((u, i) => cols[i % 3].push(u));
    const card = u => `<figure class="seen__card"><img src="${px(u, 560)}" alt="Hildur Yeoman, worn" loading="lazy"/></figure>`;
    seenWall.innerHTML = cols.map((col, ci) => `<div class="seen__col ${ci % 2 ? 'seen__col--down' : 'seen__col--up'}">${col.map(card).join('') + col.map(card).join('')}</div>`).join('');
  }

  /* ── drag rails ── */
  const dragify = el => {
    if (!el) return;
    let down = false, sx = 0, sl = 0, moved = 0;
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; down = true; moved = 0; sx = e.clientX; sl = el.scrollLeft; el.classList.add('drag'); el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!down) return; const d = e.clientX - sx; moved = Math.abs(d); el.scrollLeft = sl - d; });
    const up = () => { down = false; el.classList.remove('drag'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
    el.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  };
  dragify($('#rail')); dragify($('#railS'));

  /* ══ GLITCHING LOGO (header + footer) ══
     Masked clip replaces the static mark. Only reveals once it can actually play,
     so a blocked/missing clip leaves the crisp PNG in place. The footer instance
     is paused while off screen so it never decodes for nothing. */
  $$('[data-glogo]').forEach(wrap => {
    const v = $('.glogo__v', wrap);
    if (!v || reduced) return;                       // reduced motion keeps the PNG
    const reveal = () => wrap.classList.add('on');
    v.addEventListener('loadeddata', reveal, { once: true });
    v.addEventListener('playing', reveal, { once: true });
    v.addEventListener('error', () => wrap.classList.remove('on'));
    const kick = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!v.src && v.querySelector('source')) v.load(); kick(); }
        else if (!v.paused) v.pause();
      }, { rootMargin: '15% 0px', threshold: 0.01 }).observe(wrap);
    } else kick();
    document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); });
  });

  /* ══ RAIL ARROW BUTTONS ══ */
  const railById = id => document.getElementById(id);
  const syncRnav = () => $$('.rnav__b').forEach(b => {
    const el = railById(b.dataset.rail); if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    b.disabled = +b.dataset.dir < 0 ? el.scrollLeft <= 2 : el.scrollLeft >= max;
  });
  $$('.rnav__b').forEach(b => b.addEventListener('click', () => {
    const el = railById(b.dataset.rail); if (!el) return;
    const card = el.querySelector('.prod');
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * .8;
    el.scrollBy({ left: step * +b.dataset.dir, behavior: reduced ? 'auto' : 'smooth' });
  }));
  ['rail', 'railS'].forEach(id => { const el = railById(id); if (el) el.addEventListener('scroll', syncRnav, { passive: true }); });
  addEventListener('resize', syncRnav, { passive: true });
  syncRnav();

  /* ══ BAG (real add-to-bag flow, persisted) ══ */
  const bagEl = $('#bag'), bagItems = $('#bagItems'), bagCount = $('#bagCount'),
        bagQtyEl = $('#bagQty'), bagTotal = $('#bagTotal'), bagGo = $('#bagGo');
  let lines = [];
  try { lines = JSON.parse(localStorage.getItem('cm_bag') || '[]'); } catch (e) { lines = []; }
  const save = () => { try { localStorage.setItem('cm_bag', JSON.stringify(lines)); } catch (e) {} };
  const bagN = () => lines.reduce((n, l) => n + l.q, 0);
  const bagSum = () => lines.reduce((n, l) => n + l.q * l.p, 0);

  function renderBag() {
    const n = bagN();
    if (bagCount) bagCount.textContent = '(' + n + ')';
    if (bagQtyEl) bagQtyEl.textContent = '(' + n + ')';
    if (bagTotal) bagTotal.textContent = isk(bagSum());
    if (bagGo) bagGo.disabled = n === 0;
    if (!bagItems) return;
    bagItems.innerHTML = n === 0
      ? `<p class="bag__empty">Your bag is empty.<br>Pick a size on any piece to add it.</p>`
      : lines.map((l, i) => `<div class="bag__it">
          <div class="bag__im"><img src="${px(l.img, 240)}" alt="${esc(l.t)}"/></div>
          <div>
            <div class="bag__n">${l.t}</div>
            ${l.s ? `<div class="bag__sz">Size ${l.s}</div>` : ''}
            <div class="bag__qty">
              <button data-q="-1" data-i="${i}" aria-label="Decrease quantity">−</button>
              <span>${l.q}</span>
              <button data-q="1" data-i="${i}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="bag__right">
            <span class="bag__p">${isk(l.q * l.p)}</span>
            <button class="bag__x" data-rm="${i}">Remove</button>
          </div>
        </div>`).join('');
  }
  const openBag = on => {
    if (!bagEl) return;
    bagEl.setAttribute('aria-hidden', String(!on));
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (lenis) { on ? lenis.stop() : lenis.start(); }
  };
  function addToBag(handle, size, btn) {
    const p = byHandle[handle]; if (!p) return;
    const key = handle + '|' + size;
    const hit = lines.find(l => l.k === key);
    if (hit) hit.q++; else lines.push({ k: key, h: handle, t: p.t, s: size, p: p.p, img: p.img[0], q: 1 });
    save(); renderBag(); openBag(true);
    if (btn) { btn.classList.add('added'); setTimeout(() => btn.classList.remove('added'), 700); }
  }
  document.addEventListener('click', e => {
    const sz = e.target.closest('.sz');
    if (sz && !sz.disabled) { e.preventDefault(); addToBag(sz.dataset.h, sz.dataset.s || '', sz); return; }
    if (e.target.closest('#bagBtn')) { openBag(true); return; }
    if (e.target.closest('#bagClose') || e.target.closest('#bagScrim')) { openBag(false); return; }
    const q = e.target.closest('[data-q]');
    if (q) { const l = lines[+q.dataset.i]; if (l) { l.q += +q.dataset.q; if (l.q < 1) lines.splice(+q.dataset.i, 1); save(); renderBag(); } return; }
    const rm = e.target.closest('[data-rm]');
    if (rm) { lines.splice(+rm.dataset.rm, 1); save(); renderBag(); return; }
    if (e.target.closest('#bagGo')) { if (bagItems) bagItems.innerHTML = `<p class="bag__empty">Checkout is not wired up in this prototype.<br>It would hand off to Shopify checkout here.</p>`; }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && bagEl && bagEl.getAttribute('aria-hidden') === 'false') openBag(false); });
  renderBag();

  const nf = $('#newsForm');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); const v = $('#newsEmail').value.trim(), m = $('#newsMsg'); const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); m.textContent = ok ? 'You’re in. See you at Laugavegur 7.' : 'Enter a valid email.'; if (ok) nf.reset(); });
  /* ══ MOBILE MENU + the sndr-studio toggle animation ══ */
  const burger = $('#burger'), menu = $('#menu');
  if (burger) {
    const icon = $('.sm-icon', burger), lineH = $('.sm-icon-line:not(.sm-icon-line-v)', burger),
          lineV = $('.sm-icon-line-v', burger), textInner = $('.sm-toggle-textinner', burger);
    const labelOpen = burger.dataset.labelOpen || 'Menu', labelClose = burger.dataset.labelClose || 'Close';
    let spin, roll, primed = false;
    const prime = () => {
      if (primed || !window.gsap || !lineV) return; primed = true;
      gsap.set(lineH, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(lineV, { rotate: 90, transformOrigin: '50% 50%' });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
    };

    /* plus -> X: long 225deg spin opening, quick unwind closing */
    const animateIcon = opening => {
      if (!icon || !window.gsap) return;
      prime(); spin && spin.kill();
      if (reduced) { gsap.set(icon, { rotate: opening ? 225 : 0 }); return; }
      spin = opening
        ? gsap.to(icon, { rotate: 225, duration: .8, ease: 'power4.out', overwrite: 'auto' })
        : gsap.to(icon, { rotate: 0, duration: .35, ease: 'power3.inOut', overwrite: 'auto' });
    };

    /* MENU/CLOSE roller: stack alternating lines, then roll to the last */
    const animateText = opening => {
      if (!textInner) return;
      roll && roll.kill();
      const current = opening ? labelOpen : labelClose, target = opening ? labelClose : labelOpen;
      const put = words => { textInner.textContent = ''; words.forEach(w => { const s = document.createElement('span'); s.className = 'sm-toggle-line'; s.textContent = w; textInner.appendChild(s); }); };
      if (reduced || !window.gsap) { put([target]); return; }
      const seq = [current]; let last = current;
      for (let i = 0; i < 3; i++) { last = last === labelOpen ? labelClose : labelOpen; seq.push(last); }
      if (last !== target) seq.push(target);
      seq.push(target);
      put(seq);
      gsap.set(textInner, { yPercent: 0 });
      roll = gsap.to(textInner, { yPercent: -((seq.length - 1) / seq.length) * 100, duration: .9, ease: 'power4.out' });
    };

    const setMenu = o => {
      document.body.classList.toggle('menu-open', o);
      burger.setAttribute('aria-expanded', String(o));
      burger.setAttribute('aria-label', o ? labelClose : labelOpen);
      menu.setAttribute('aria-hidden', String(!o));
      animateIcon(o); animateText(o);
    };

    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    /* Menu links navigate explicitly: the generic anchor handler relied on
       lenis.scrollTo, which silently no-ops when Lenis is stopped or starved,
       so these links did nothing at all. */
    $$('#menu a').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      e.preventDefault(); e.stopPropagation();
      const t = document.querySelector(id);
      setMenu(false);
      setTimeout(() => goTo(t), 130);        // let the panel start closing first
    }));
    addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
  }

  /* ── film sound toggle (default muted; auto-mutes when scrolled away) ── */
  const reel = $('#reel'), sndBtn = $('#sndToggle'), reelYt = $('#reelYt');
  if (reel && sndBtn && reelYt) {
    let soundOn = false;
    const post = (func, args = []) => { try { reelYt.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {} };
    const setSound = on => {
      soundOn = on;
      post(on ? 'unMute' : 'mute');
      if (on) post('setVolume', [100]);
      reel.classList.toggle('on', on);
      sndBtn.setAttribute('aria-pressed', String(on));
      sndBtn.querySelector('.snd__label').textContent = on ? 'Sound on' : 'Sound off';
    };
    sndBtn.addEventListener('click', () => setSound(!soundOn));
    /* Mobile browsers frequently ignore the iframe's autoplay= param, so ask the
       player directly (muted playback is permitted) whenever the film scrolls in. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { post('mute'); post('playVideo'); }
        else { if (soundOn) setSound(false); post('pauseVideo'); }
      }, { threshold: .2 }).observe(reel);
    }
    // and once the player is ready, in case it loaded already in view
    reelYt.addEventListener('load', () => { post('mute'); post('playVideo'); });
  }

  /* ── anchor navigation ──
     Always restarts Lenis first (it may have been stopped by the bag) and hard
     falls back to a native scroll if the smooth scroll never lands. */
  let lenis;
  function goTo(target) {
    if (!target) return;
    const startY = window.scrollY;
    const y = Math.max(0, target.getBoundingClientRect().top + startY - 40);
    if (lenis && !reduced) { try { lenis.start(); lenis.scrollTo(y, { duration: 1.1 }); } catch (e) { window.scrollTo({ top: y }); } }
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    /* Rescue only a genuinely dead scroll: if we have barely budged after 700ms
       the smooth scroll never engaged. Checking distance-to-target instead would
       wrongly interrupt a long but working animation. */
    setTimeout(() => {
      if (Math.abs(window.scrollY - startY) < 40 && Math.abs(window.scrollY - y) > 240) {
        window.scrollTo({ top: y, behavior: 'auto' });
      }
    }, 700);
  }
  $$('a[href^="#"]').forEach(a => {
    if (a.closest('#menu')) return;                 // menu links handle themselves
    a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (!id || id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); goTo(t);
    });
  });

  /* ── nav hide on scroll-down ── */
  const nav = $('#nav'); let lastY = 0;
  const navUpdate = y => { if (y > lastY && y > 240) { nav.classList.add('hide'); nav.classList.remove('show'); } else { nav.classList.add('show'); nav.classList.remove('hide'); } lastY = y; };

  /* ── reveal ── */
  const rv = $$('.head, .prod, .roll-item, .budin__row, .news, .hero__cta');
  rv.forEach(el => el.classList.add('rv'));
  if (reduced || !('IntersectionObserver' in window)) rv.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    rv.forEach(el => io.observe(el));
    setTimeout(() => rv.forEach(el => { if (el.getBoundingClientRect().top < innerHeight * 1.3) el.classList.add('in'); }), 2600);
  }

  /* ── marquee seamless ── */
  const marq = $('#marq'); if (marq && !reduced) marq.innerHTML += marq.innerHTML;

  /* ══ GRAIN-GRADIENT BACKGROUND (paper-design grain-gradient, ported from 21st.dev) ══ */
  function shaderBackground() {
    if (reduced) return;
    const canvas = $('#bars'); if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false }); if (!gl) return;
    const VERT = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
// Seven packed vectors + eight colour vectors = 15 fragment uniform vectors,
// one below WebGL1's guaranteed minimum. Macros preserve the public u_* API.
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, OKLab toggle
uniform vec4 u_space;      // offset.xy, pointer.xy
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
// Keep hash inputs inside mediump's guaranteed ±2^14 range.
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Even, un-structured white noise for film grain (Dave Hoskins hash12). The
// multiply hash above is fine for value noise but shows a faint axis-aligned
// mesh at integer fragment coords, which reads as a net over flat areas.
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

// --- OKLab colour mixing (perceptual), gated by u_oklab -----------------------
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  // max() guards the sRGB branch: out-of-gamut OKLab interpolations can send a
  // channel negative, and pow(negative, …) is NaN which mix()/step() would
  // then propagate. The linear branch clips such channels to 0 downstream.
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

// Mix through the recipe colours; x is clamped to 0..1. WebGL1 forbids
// dynamic uniform indexing in fragment shaders, hence the constant loop.
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  vec2 q = p;
  q.x += sin(q.y * 2.1 + t * 0.2) * (0.08 + u_intensity * 0.32);
  q.y += cos(q.x * 2.7 - t * 0.17) * (0.06 + u_intensity * 0.26);
  float wave = 0.5 + 0.5 * sin(q.x * 2.8 + q.y * 1.9 + fbm(q * 2.0) * 3.0);
  float coarse = hash21(floor((uv + t * 0.002) * (90.0 + u_paramA * 260.0)) + u_seed);
  float grain = (coarse - 0.5) * u_paramA * 0.42;
  return palette(clamp(wave + grain, 0.0, 1.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  // Cursor modes 1–3 are local distortions. Push shifts the same screen-space
  // coordinates before field transforms, so Zoom/Rotate don't change its feel.
  if (u_cursorPresence > 0.001) {
    // u_mouse is normalized to -1..1 in canvas space. Convert it to the same
    // aspect-corrected screen space as p so effects stay under the cursor.
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence
        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(
          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }

  // Keep presets that read uv (rather than p) in the same warped space.
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  // Field transform: rotate, pan, pointer push, slow drift.
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  // Organic domain warp.
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  // Shade, with an optional soft 5-tap blur.
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  // Post: contrast, saturation, hue, brightness, vignette, grain.
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
    const compile = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(prog, n);
    const U = { colors: u('u_colors'), scene: u('u_scene'), shape: u('u_shape'), surface: u('u_surface'), finish: u('u_finish'), transform: u('u_transform'), space: u('u_space'), cursor: u('u_cursor') };
    // Coppermine palette: obsidian field, one molten-copper band, grain
    const base = [0.968, 0.953, 0.937];
    const colors = [[0.945, 0.925, 0.905], [0.905, 0.862, 0.845], [0.62, 0.28, 0.46], base, base, base, base, base];
    const P = { colorCount: 4, scale: 1.92, intensity: 0.7, paramA: 0.26, warp: 0.06, detail: 2.624, contrast: 1.0, brightness: 0.004, saturation: 0.8, hue: 0, vignette: 0.12, blur: 0, grain: 0.04, seed: 1, rotate: 1.9373, drift: 0.02, oklab: 0, timeScale: 0.8 };
    gl.uniform3fv(U.colors, new Float32Array(colors.flat()));
    gl.uniform4f(U.shape, P.scale, P.intensity, P.paramA, P.warp);
    gl.uniform4f(U.surface, P.detail, P.contrast, P.brightness, P.saturation);
    gl.uniform4f(U.finish, P.hue, P.vignette, P.blur, P.grain);
    gl.uniform4f(U.transform, P.seed, P.rotate, P.drift, P.oklab);
    gl.uniform4f(U.cursor, 0, 2, 0.65, 0.46);
    gl.uniform4f(U.space, 0, 0, 0, 0);
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = Math.max(1, Math.round(innerWidth * dpr)), h = Math.max(1, Math.round(innerHeight * dpr));
      const s = Math.min(1, Math.sqrt(2000000 / Math.max(1, w * h)));
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
    };
    resize(); addEventListener('resize', resize, { passive: true });
    const t0 = performance.now();
    let last = 0;
    const render = now => {
      requestAnimationFrame(render);
      // skip work entirely while the video wall owns the GPU, or when tab is hidden
      if (window.__cmShaderPaused || document.hidden) return;
      // cap to ~40fps: this is a slow ambient gradient, 60fps buys nothing visually
      if (now - last < 25) return;
      last = now;
      gl.uniform4f(U.scene, canvas.width, canvas.height, ((now - t0) / 1000) * P.timeScale, P.colorCount);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    requestAnimationFrame(render);
  }

  /* ══ Lenis + GSAP ══ */
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    lenis.on('scroll', ({ scroll }) => navUpdate(scroll));
  } else addEventListener('scroll', () => navUpdate(scrollY), { passive: true });

  /* ══ scroll choreography ══ */
  const choreograph = () => {
    if (!hasGsap || reduced) {
      const wrap = $('#film'); if (wrap) { wrap.style.overflowX = 'auto'; wrap.style.overflowY = 'hidden'; dragify(wrap); }
      return;
    }
    /* hero parallax */
    gsap.to('#heroFig', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    /* campaign uncrop + zoom-out */
    const cf = $('#campFrame');
    if (cf) {
      const o = { c: 13 };
      gsap.to(o, { c: 0, ease: 'none', scrollTrigger: { trigger: '.camp', start: 'top bottom', end: 'top 12%', scrub: true }, onUpdate: () => (cf.style.clipPath = `inset(${o.c}% ${o.c * 1.45}%)`) });
      gsap.fromTo('.camp__img', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.camp', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    /* horizontal scroll-hijack lookbook */
    const wrap = $('#film'), track = $('#panTrack'), prog = $('#panProg');
    if (wrap && track) {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: wrap, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: self => { if (prog) prog.style.width = (self.progress * 100).toFixed(2) + '%'; }
        }
      });
    }
    /* as-seen-on headline reveal */
    gsap.from('.seen__overlay > *', { y: 20, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.seen', start: 'top 70%' } });
  };
  const heroIn = () => {
    if (reduced || !hasGsap) return;
    gsap.from('.hero__head > *, .hero__cta > *', { y: 14, opacity: 0, duration: .9, stagger: .08, ease: 'power2.out', delay: .05 });
    gsap.from('.hero__word', { yPercent: 14, opacity: 0, duration: 1.15, ease: 'power3.out', delay: .2 });
  };

  /* ══ preloader ══ */
  let booted = false;
  const boot = () => { if (booted) return; booted = true; document.body.classList.add('ready'); shaderBackground(); choreograph(); heroIn(); if (hasGsap) ScrollTrigger.refresh(); };
  setTimeout(boot, 3600);   // fail-safe: the loader can never stick

  /* Y2K glitch reveal. Inline opacity, set the moment the clip renders a frame,
     so no stylesheet rule can win over it. Still logo stays if it cannot play. */
  const glitch = $('#loadGlitch'), still = $('#loadStill');
  if (glitch) {
    const showGlitch = () => {
      if (reduced) return;                       // reduced motion keeps the still
      glitch.style.opacity = '1';
      if (still) still.style.opacity = '0';
    };
    glitch.addEventListener('loadeddata', showGlitch, { once: true });
    glitch.addEventListener('playing', showGlitch, { once: true });
    if (glitch.readyState >= 2) showGlitch();    // already buffered from cache
    glitch.addEventListener('error', () => {     // clip unavailable: keep the still
      glitch.style.opacity = '0';
      if (still) still.style.opacity = '1';
    });
    if (!reduced) { const p = glitch.play(); if (p && p.catch) p.catch(() => {}); }
  }

  /* ══ GLITCH SFX — synthesised, no audio file shipped ══
     Web Audio costs 0 KB, which matters on a loading screen, and it can be timed
     to the clip. Browsers suspend AudioContext until a user gesture, so this
     attempts to start immediately and otherwise fires on the first interaction. */
  function glitchSfx() {
    if (reduced) return () => {};
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return () => {};
    let ctx, noiseBuf, master;

    /* built lazily on first play: never create an AudioContext that may go unused */
    const init = () => {
      if (ctx) return true;
      try { ctx = new AC(); } catch (e) { return false; }
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      master = ctx.createGain();
      master.gain.value = 0.16;                   // deliberately restrained
      master.connect(ctx.destination);
      return true;
    };

    // tape/VHS tear: filtered noise burst with a sweeping band
    const tear = (t, dur, f0, f1) => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7;
      bp.frequency.setValueAtTime(f0, t);
      bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur + 0.02);
    };
    // digital artefact: hard square blip
    const blip = (t, dur, freq) => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    };
    // power-down sweep at the end
    const sweep = (t, dur) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(900, t);
      o.frequency.exponentialRampToValueAtTime(60, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    };

    let fired = false;
    return () => {
      if (fired) return;
      if (!init()) return;
      fired = true;
      const go = () => {
        const t = ctx.currentTime + 0.02;
        tear(t, 0.16, 400, 5200);
        blip(t + 0.05, 0.04, 1860);
        tear(t + 0.30, 0.10, 3000, 700);
        blip(t + 0.38, 0.03, 990);
        blip(t + 0.44, 0.025, 2400);
        tear(t + 0.72, 0.20, 800, 6000);
        blip(t + 0.95, 0.05, 640);
        tear(t + 1.25, 0.12, 5000, 900);
        blip(t + 1.42, 0.03, 1500);
        tear(t + 1.70, 0.09, 1200, 4000);
        sweep(t + 1.95, 0.55);
      };
      if (ctx.state === 'suspended') ctx.resume().then(go).catch(() => {});
      else go();
    };
  }
  const playGlitch = glitchSfx();
  playGlitch();                                   // works if autoplay is permitted
  // otherwise: fire on the very first interaction
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(ev =>
    addEventListener(ev, () => playGlitch(), { once: true, passive: true }));

  if (reduced || !hasGsap) boot();
  else gsap.delayedCall(2.5, boot);                // hold on the glitch, then wipe
})();
