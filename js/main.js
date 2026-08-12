(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let siteData = null;
  let syncNavActive = () => {};

  const FALLBACK_DATA = {
    site: {
      title: 'RisFiz',
      relationshipStart: '2024-11-01',
      fiz: { name: 'Mustafiz Ahmed', nickname: 'Fiz', city: 'Guwahati', state: 'Assam', country: 'India', email: 'aimjetkhalifa10@gmail.com' },
      ris: { name: 'Rismaditi Arinda', nickname: 'Ris', city: 'Bontang', country: 'Indonesia', email: 'rismaditiarindaa@gmail.com' },
    },
    memories: [
      { date: '2026', sortDate: '2026-01-01', image: 'assets/images/memory-1.png', caption_en: 'A recent moment.', caption_id: 'Momen terbaru.' },
      { date: '1 November 2024', sortDate: '2024-11-01', image: 'assets/images/memory-3.svg', caption_en: 'The day we began.', caption_id: 'Hari kita mulai.' },
    ],
  };

  const LEAF_OUTER = 'M140 10 C50 22 15 100 20 185 C25 265 70 350 140 355 C210 350 255 265 260 185 C265 100 230 22 140 10 Z';
  const LEAF_INNER = 'M140 36 C68 46 38 108 42 178 C46 242 78 308 140 312 C202 308 234 242 238 178 C242 108 212 46 140 36 Z';
  // 1:1 photo area centered inside the leaf (viewBox 280×360)
  const LEAF_PHOTO = { x: 46, y: 84, size: 188 };

  const LEAF_MINI = 'M20 4 C8 6 2 16 3 26 C4 36 12 46 20 48 C28 46 36 36 37 26 C38 16 32 6 20 4 Z';

  // --- Background leaves (pond drift + path-parting cursor) ---
  function initBgLeaves() {
    const container = document.getElementById('bg-leaves');
    if (!container) return;

    const count = prefersReducedMotion ? 48 : 72;

    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'bg-leaf';
      const size = 18 + Math.random() * 14;
      const rot = Math.random() * 360;
      const opacity = 0.14 + Math.random() * 0.26;
      const greens = ['#4a7c59', '#3a6b50', '#5a9c6a', '#2f5240'];
      const fill = greens[Math.floor(Math.random() * greens.length)];

      leaf.style.width = size + 'px';
      leaf.style.height = size * 1.3 + 'px';
      leaf.style.setProperty('--rot', rot + 'deg');
      leaf.style.setProperty('--opacity', opacity);

      if (prefersReducedMotion) {
        leaf.style.left = Math.random() * 100 + '%';
        leaf.style.top = Math.random() * 100 + '%';
      }

      leaf.innerHTML = `
        <div class="bg-leaf-inner">
          <svg viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="${LEAF_MINI}" fill="${fill}" stroke="#243E2E" stroke-width="1.1" stroke-linejoin="round"/>
            <path d="M20 10 L20 42" stroke="#243E2E" stroke-width="0.7" opacity="0.35"/>
            <path d="M20 16 Q28 18 32 16" stroke="#243E2E" stroke-width="0.5" opacity="0.25"/>
            <path d="M20 16 Q12 18 8 16" stroke="#243E2E" stroke-width="0.5" opacity="0.25"/>
          </svg>
        </div>
      `;
      container.appendChild(leaf);
    }

    if (!prefersReducedMotion) {
      initLeafInteraction();
    }
  }

  function initLeafInteraction() {
    const container = document.getElementById('bg-leaves');
    if (!container) return;

    const leaves = Array.from(container.querySelectorAll('.bg-leaf'));
    const state = new Map();

    const DRIFT_SPEED = 0.04;
    const PATH_HALF_WIDTH = 62;
    const PART_PUSH = 2.1;
    const PUSH_DECAY = 0.988;
    const MARGIN = 60;

    let prevMX = -9999;
    let prevMY = -9999;

    function viewport() {
      return { w: window.innerWidth, h: window.innerHeight };
    }

    function pickTarget(x, y, w, h) {
      let tx;
      let ty;
      let tries = 0;
      do {
        tx = MARGIN + Math.random() * (w - MARGIN * 2);
        ty = MARGIN + Math.random() * (h - MARGIN * 2);
        tries++;
      } while (Math.hypot(tx - x, ty - y) < Math.min(w, h) * 0.38 && tries < 12);
      return { tx, ty };
    }

    function aimTrajectory(s, w, h) {
      const dist = Math.hypot(s.targetX - s.x, s.targetY - s.y) || 1;
      const speed = DRIFT_SPEED + Math.random() * 0.025;
      s.driftVx = ((s.targetX - s.x) / dist) * speed;
      s.driftVy = ((s.targetY - s.y) / dist) * speed;
    }

    function spawnLeaf(s, w, h) {
      s.x = MARGIN + Math.random() * (w - MARGIN * 2);
      s.y = MARGIN + Math.random() * (h - MARGIN * 2);
      const target = pickTarget(s.x, s.y, w, h);
      s.targetX = target.tx;
      s.targetY = target.ty;
      aimTrajectory(s, w, h);
    }

    function wrapLeaf(s, w, h, leafW, leafH) {
      if (s.x < -leafW) s.x = w + leafW * 0.5;
      if (s.x > w + leafW) s.x = -leafW * 0.5;
      if (s.y < -leafH) s.y = h + leafH * 0.5;
      if (s.y > h + leafH) s.y = -leafH * 0.5;
    }

    function partAlongPath(s, lx, ly, x0, y0, x1, y1) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 9) return;

      let t = ((lx - x0) * dx + (ly - y0) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const cx = x0 + t * dx;
      const cy = y0 + t * dy;

      const px = lx - cx;
      const py = ly - cy;
      const perpDist = Math.hypot(px, py);
      if (perpDist > PATH_HALF_WIDTH || perpDist < 0.5) return;

      const falloff = (1 - perpDist / PATH_HALF_WIDTH) ** 1.4;
      const segLen = Math.sqrt(lenSq);
      const strength = PART_PUSH * falloff * Math.min(segLen / 14, 2.2);

      s.pushVx += (px / perpDist) * strength;
      s.pushVy += (py / perpDist) * strength;
    }

    leaves.forEach((leaf) => {
      const inner = leaf.querySelector('.bg-leaf-inner');
      const { w, h } = viewport();
      const s = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        driftVx: 0,
        driftVy: 0,
        pushVx: 0,
        pushVy: 0,
        rot: 0,
        inner,
      };
      spawnLeaf(s, w, h);
      state.set(leaf, s);
      leaf.style.left = s.x + 'px';
      leaf.style.top = s.y + 'px';
    });

    function tick() {
      requestAnimationFrame(tick);

      const { w, h } = viewport();

      leaves.forEach((leaf) => {
        const s = state.get(leaf);
        const leafW = leaf.offsetWidth;
        const leafH = leaf.offsetHeight;

        s.x += s.driftVx;
        s.y += s.driftVy;

        s.pushVx *= PUSH_DECAY;
        s.pushVy *= PUSH_DECAY;
        s.x += s.pushVx;
        s.y += s.pushVy;

        if (Math.hypot(s.x - s.targetX, s.y - s.targetY) < 48) {
          const target = pickTarget(s.x, s.y, w, h);
          s.targetX = target.tx;
          s.targetY = target.ty;
          aimTrajectory(s, w, h);
        }

        wrapLeaf(s, w, h, leafW, leafH);

        leaf.style.left = s.x + 'px';
        leaf.style.top = s.y + 'px';

        s.rot += (s.pushVx - s.pushVy) * 0.08;
        s.rot *= 0.97;
        s.inner.style.transform = `rotate(calc(var(--rot) + ${s.rot}deg))`;
      });
    }

    function onPointerMove(x, y) {
      if (prevMX > -9000) {
        const segLen = Math.hypot(x - prevMX, y - prevMY);
        if (segLen > 2) {
          leaves.forEach((leaf) => {
            const s = state.get(leaf);
            const lx = s.x + leaf.offsetWidth * 0.5;
            const ly = s.y + leaf.offsetHeight * 0.5;
            partAlongPath(s, lx, ly, prevMX, prevMY, x, y);
          });
        }
      }
      prevMX = x;
      prevMY = y;
    }

    requestAnimationFrame(tick);

    window.addEventListener(
      'mousemove',
      (e) => onPointerMove(e.clientX, e.clientY),
      { passive: true }
    );

    window.addEventListener(
      'touchstart',
      (e) => {
        const t = e.touches[0];
        if (t) onPointerMove(t.clientX, t.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        const t = e.touches[0];
        if (t) onPointerMove(t.clientX, t.clientY);
      },
      { passive: true }
    );

    document.addEventListener('mouseleave', () => {
      prevMX = prevMY = -9999;
    });

    window.addEventListener('touchend', () => {
      prevMX = prevMY = -9999;
    }, { passive: true });
  }

  // --- Envelope ---
  function initEnvelope() {
    const screen = document.getElementById('envelope-screen');
    const envelope = document.getElementById('envelope');
    const main = document.getElementById('main-content');
    const nav = document.getElementById('site-nav');
    const musicToggle = document.getElementById('music-toggle');
    let opened = false;

    function openEnvelope() {
      if (opened) return;
      opened = true;
      envelope.classList.add('opened');

      setTimeout(() => {
        screen.classList.add('opening');
        main.classList.remove('hidden');
        nav.classList.remove('hidden');
        musicToggle.classList.remove('hidden');

        setTimeout(() => {
          screen.style.display = 'none';
          window.scrollTo({ top: 0, behavior: 'smooth' });
          refreshPlantVine();
          syncNavActive();
        }, 650);
      }, 420);
    }

    envelope.addEventListener('click', openEnvelope);
    envelope.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEnvelope();
      }
    });
  }

  // --- Scroll reveal ---
  function initReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  // --- Load data ---
  async function loadData() {
    try {
      const res = await fetch('memories.json');
      siteData = await res.json();
    } catch {
      siteData = FALLBACK_DATA;
    }
    renderSiteInfo();
    renderPlant();
    initForms();
    syncNavActive();
    setTimeout(syncNavActive, 300);
    setTimeout(syncNavActive, 1000);
  }

  // --- Site info ---
  function renderSiteInfo() {
    const site = siteData?.site;
    if (!site) return;

    const daysEl = document.getElementById('hero-days');
    if (daysEl && site.relationshipStart) {
      const start = new Date(site.relationshipStart + 'T00:00:00');
      const now = new Date();
      const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      daysEl.textContent = `${diff} days together`;
    }

    const dist = document.getElementById('hero-distance');
    if (dist && site.fiz && site.ris) {
      const fizLoc = site.fiz.state
        ? `${site.fiz.city}, ${site.fiz.state}`
        : `${site.fiz.city}, ${site.fiz.country}`;
      dist.textContent = `${fizLoc}  ↔  ${site.ris.city}, ${site.ris.country}`;
    }

    document.title = site.title || 'RisFiz';
  }

  function giantLeafHtml(mem, i) {
    const clipId = `leafClip${i}`;
    const squareClipId = `leafSquare${i}`;
    const img = escapeHtml(mem.image);
    const { x, y, size } = LEAF_PHOTO;
    return `
      <div class="giant-leaf">
        <div class="node-anchor" aria-hidden="true"></div>
        <svg class="giant-leaf-svg" viewBox="0 0 280 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Memory: ${escapeHtml(mem.date)}">
          <defs>
            <clipPath id="${clipId}">
              <path d="${LEAF_INNER}"/>
            </clipPath>
            <clipPath id="${squareClipId}">
              <rect x="${x}" y="${y}" width="${size}" height="${size}"/>
            </clipPath>
          </defs>
          <path class="leaf-body" d="${LEAF_OUTER}" fill="#4a7c59" stroke="#243E2E" stroke-width="2.5"/>
          <g clip-path="url(#${clipId})">
            <g clip-path="url(#${squareClipId})">
              <image class="leaf-photo" href="${img}" x="${x}" y="${y}" width="${size}" height="${size}"
                preserveAspectRatio="xMidYMid meet"/>
            </g>
          </g>
          <path d="${LEAF_OUTER}" fill="none" stroke="#243E2E" stroke-width="1.5" opacity="0.35"/>
          <path d="M140 36 L140 308" stroke="#243E2E" stroke-width="1.8" fill="none" opacity="0.22"/>
          <path d="M140 72 Q178 88 215 78" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
          <path d="M140 72 Q102 88 65 78" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
          <path d="M140 130 Q185 148 220 135" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
          <path d="M140 130 Q95 148 60 135" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.15"/>
          <path d="M140 190 Q175 205 205 195" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.15"/>
          <path d="M140 190 Q105 205 75 195" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.15"/>
          <path class="leaf-petiole" d="M140 10 L140 0" stroke="#2f5240" stroke-width="5" stroke-linecap="round"/>
        </svg>
        <div class="plant-card">
          <p class="plant-date">${escapeHtml(mem.date)}</p>
          <p class="plant-caption-en">${escapeHtml(mem.caption_en)}</p>
          <p class="plant-caption-id">${escapeHtml(mem.caption_id)}</p>
        </div>
      </div>
    `;
  }

  // --- Plant timeline ---
  function renderPlant() {
    const container = document.getElementById('plant-memories');
    if (!container || !siteData?.memories?.length) return;
    container.innerHTML = '';

    const sorted = [...siteData.memories].sort(
      (a, b) => new Date(b.sortDate || b.date) - new Date(a.sortDate || a.date)
    );

    sorted.forEach((mem, i) => {
      const item = document.createElement('article');
      item.className = 'plant-node';
      item.dataset.index = i;
      item.style.animationDelay = i * 0.12 + 's';
      item.innerHTML = giantLeafHtml(mem, i);
      container.appendChild(item);
    });

    scheduleVineDraw();
  }

  function refreshPlantVine() {
    positionLeaves();
    const redraw = () => requestAnimationFrame(drawPlantVine);
    redraw();
    setTimeout(redraw, 150);
    setTimeout(redraw, 500);
    setTimeout(redraw, 800);
    syncNavActive();
  }

  function scheduleVineDraw() {
    refreshPlantVine();

    const plantContainer = document.getElementById('plant-container');
    if (!plantContainer || plantContainer.dataset.vineBound) return;
    plantContainer.dataset.vineBound = '1';

    window.addEventListener('resize', debounce(refreshPlantVine, 150));

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(debounce(refreshPlantVine, 80)).observe(plantContainer);
    }

    const plantSection = document.getElementById('plant');
    if (plantSection) {
      new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) refreshPlantVine();
        },
        { threshold: 0.05 }
      ).observe(plantSection);
    }

    plantContainer.addEventListener('load', refreshPlantVine, true);
  }

  function positionLeaves() {
    const container = document.getElementById('plant-container');
    const nodes = container?.querySelectorAll('.plant-node');
    if (!container || !nodes?.length) return;

    const w = container.offsetWidth;
    if (w < 1) return;

    const cx = w / 2;
    const sway = Math.min(w * 0.34, 180);

    nodes.forEach((node, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const vineX = cx + dir * sway;
      const onLeft = vineX > cx;
      node.classList.toggle('plant-node--left', onLeft);
      node.classList.toggle('plant-node--right', !onLeft);
    });
  }

  function smallLeafSvg(x, y, angle, scale) {
    const s = scale || 1;
    return `
      <g transform="translate(${x}, ${y}) rotate(${angle}) scale(${s})">
        <path d="M0 22 C-14 14 -16 4 -9 -4 C-4 -10 0 -12 0 -12 C0 -12 4 -10 9 -4 C16 4 14 14 0 22 Z"
          fill="#4a7c59" stroke="#243E2E" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M0 -8 L0 20" stroke="#243E2E" stroke-width="0.6" fill="none" opacity="0.5"/>
      </g>
    `;
  }

  function rootsSvg(baseX, baseY, w, rootsH) {
    const spread = Math.min(w * 0.5, 240);
    const deep = rootsH * 1.2;
    const bx = baseX;
    const by = baseY;
    let s = '';

    s += `
      <defs>
        <radialGradient id="soilGrad" cx="50%" cy="15%" r="80%">
          <stop offset="0%" stop-color="#8a7355" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#4a3728" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="${bx}" cy="${by + 6}" rx="${spread * 0.68}" ry="18" fill="url(#soilGrad)"/>
    `;

    function branchCubic(x1, y1, c1x, c1y, c2x, c2y, x2, y2, width, color, opacity = 0.86) {
      const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
      s += `<path d="${d}" fill="none" stroke="#2a1f18" stroke-width="${width + 2}"
        stroke-linecap="round" opacity="${opacity * 0.14}"/>`;
      s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"
        stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
    }

    function growBranch(x, y, angleDeg, length, width, depth, bend, side) {
      if (depth <= 0 || length < 5 || width < 0.4) return { x, y, angle: angleDeg };

      const rad = (angleDeg * Math.PI) / 180;
      const perp = rad + Math.PI / 2;
      const wave = side * (16 + depth * 4);
      const sag = length * 0.06;

      const endX = x + Math.cos(rad) * length + Math.cos(perp) * wave * 0.5;
      const endY = y + Math.sin(rad) * length + sag + Math.sin(perp) * wave * 0.35;

      const c1x = x + Math.cos(rad) * length * 0.2 + Math.cos(perp) * (bend + wave * 1.1);
      const c1y = y + Math.sin(rad) * length * 0.2 + Math.sin(perp) * (bend + wave) * 0.65 + sag * 0.15;
      const c2x = x + Math.cos(rad) * length * 0.8 - Math.cos(perp) * wave * 0.7;
      const c2y = y + Math.sin(rad) * length * 0.8 - Math.sin(perp) * wave * 0.45 + sag * 0.75;

      const colors = ['#3d5c44', '#4a3728', '#5c4636', '#6b5340', '#7a6348', '#8a7355'];
      const color = colors[Math.min(depth, colors.length - 1)];

      branchCubic(x, y, c1x, c1y, c2x, c2y, endX, endY, width, color, 0.8 + depth * 0.03);

      const endAngle = (Math.atan2(endY - y, endX - x) * 180) / Math.PI;
      const forkT = 0.52 + side * 0.04;
      const forkX = x + (endX - x) * forkT + Math.cos(perp) * wave * 0.12;
      const forkY = y + (endY - y) * forkT + sag * 0.2;
      const forkSpread = 13 + depth * 3;

      growBranch(
        forkX,
        forkY,
        endAngle - forkSpread - side * 1.5,
        length * 0.7,
        width * 0.55,
        depth - 1,
        bend * 0.5,
        -side
      );
      growBranch(
        forkX,
        forkY,
        endAngle + forkSpread + side * 1.5,
        length * 0.68,
        width * 0.53,
        depth - 1,
        bend * 0.5,
        side
      );

      if (depth >= 3) {
        growBranch(
          forkX,
          forkY,
          endAngle + side * 6,
          length * 0.4,
          width * 0.36,
          depth - 2,
          -bend * 0.35,
          side * 0.6
        );
      }

      return { x: endX, y: endY, angle: endAngle };
    }

    // Gentle crown — stem meets soil
    growBranch(bx, by - 3, 93, deep * 0.12, 6.5, 2, 4, 0);

    // Main roots — meandering outward like real fibrous roots
    const mains = [
      { angle: 124, len: spread * 0.56, width: 5.8, depth: 4, bend: -22, side: -1 },
      { angle: 106, len: spread * 0.5, width: 5.2, depth: 4, bend: -12, side: -1 },
      { angle: 93, len: deep * 0.62, width: 5.2, depth: 4, bend: 5, side: 1 },
      { angle: 74, len: spread * 0.5, width: 5.2, depth: 4, bend: 12, side: 1 },
      { angle: 56, len: spread * 0.56, width: 5.8, depth: 4, bend: 22, side: 1 },
    ];

    mains.forEach((m) => growBranch(bx, by + 3, m.angle, m.len, m.width, m.depth, m.bend, m.side));

    // Loose side tendrils near crown
    growBranch(bx - 3, by + 5, 138, spread * 0.38, 3.8, 3, -14, -1);
    growBranch(bx + 3, by + 5, 42, spread * 0.38, 3.8, 3, 14, 1);
    growBranch(bx - 6, by + 8, 118, spread * 0.28, 2.8, 2, -8, -1);
    growBranch(bx + 6, by + 8, 62, spread * 0.28, 2.8, 2, 8, 1);

    return s;
  }

  function leafPetiolePoint(svgLeaf, container) {
    const pt = svgLeaf.createSVGPoint();
    pt.x = 140;
    pt.y = 0;
    const ctm = svgLeaf.getScreenCTM();
    if (!ctm) return null;
    const screen = pt.matrixTransform(ctm);
    const cr = container.getBoundingClientRect();
    return {
      x: screen.x - cr.left,
      y: screen.y - cr.top,
    };
  }

  function domToSvgCoords(container, svg, x, y, viewW, viewH) {
    const cr = container.getBoundingClientRect();
    const sr = svg.getBoundingClientRect();
    const scaleX = sr.width > 0 ? viewW / sr.width : 1;
    const scaleY = sr.height > 0 ? viewH / sr.height : 1;
    return {
      x: (x - (sr.left - cr.left)) * scaleX,
      y: (y - (sr.top - cr.top)) * scaleY,
    };
  }

  function drawPlantVine() {
    const container = document.getElementById('plant-container');
    const svg = document.getElementById('plant-vine-svg');
    const nodes = container?.querySelectorAll('.plant-node');
    if (!container || !svg || !nodes?.length) return;

    const w = container.offsetWidth;
    const nodesEl = document.getElementById('plant-memories');
    const rootsH = 200;
    const nodesBottom = nodesEl ? nodesEl.offsetTop + nodesEl.offsetHeight : 0;

    let h = container.offsetHeight;
    if (w < 1) return;

    if (h < 1 && nodes.length) {
      const last = nodes[nodes.length - 1];
      h = last.offsetTop + last.offsetHeight + rootsH;
    }

    const totalH = Math.max(h, nodesBottom + rootsH);

    const cx = w / 2;
    const sway = Math.min(w * 0.34, 180);

    container.style.minHeight = `${totalH}px`;
    svg.style.height = `${totalH}px`;
    svg.setAttribute('width', w);
    svg.setAttribute('height', totalH);
    svg.setAttribute('viewBox', `0 0 ${w} ${totalH}`);

    const nodeData = [];

    nodes.forEach((node, i) => {
      const svgLeaf = node.querySelector('.giant-leaf-svg');
      if (!svgLeaf) return;

      const petiole = leafPetiolePoint(svgLeaf, container);
      if (!petiole) return;

      const mapped = domToSvgCoords(container, svg, petiole.x, petiole.y, w, totalH);
      const dir = i % 2 === 0 ? 1 : -1;
      const onLeft = node.classList.contains('plant-node--left');

      nodeData.push({
        y: mapped.y,
        petioleX: mapped.x,
        petioleY: mapped.y,
        dir,
        onLeft,
        vineX: cx + dir * sway,
      });
    });

    let vineD = `M ${cx} 8`;
    let prevY = 8;
    const vinePoints = [];

    nodeData.forEach((nd) => {
      const dir = nd.dir;
      const targetX = nd.vineX;
      const y = nd.y;
      const segment = y - prevY;
      const cp1x = cx + dir * sway * 1.15;
      const cp2x = targetX + dir * sway * 0.2;
      const cp1y = prevY + segment * 0.2;
      const cp2y = prevY + segment * 0.78;

      vineD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${y}`;
      vinePoints.push({ x: targetX, y, ...nd });
      prevY = y;
    });

    const endDir = nodeData.length % 2 === 0 ? 1 : -1;
    const lastVineX = vinePoints.length ? vinePoints[vinePoints.length - 1].x : cx;
    const stemJoinY = nodesBottom || prevY + 40;

    vineD += ` C ${cx + endDir * sway * 0.25} ${prevY + 35}, ${lastVineX} ${stemJoinY - 25}, ${lastVineX} ${stemJoinY}`;

    let svgContent = `
      <defs>
        <linearGradient id="vineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#5a9c6a"/>
          <stop offset="50%" stop-color="#3a6b50"/>
          <stop offset="85%" stop-color="#2f5240"/>
          <stop offset="100%" stop-color="#3d3228"/>
        </linearGradient>
        <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3a6b50"/>
          <stop offset="100%" stop-color="#4a7c59"/>
        </linearGradient>
        <linearGradient id="rootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2f5240"/>
          <stop offset="40%" stop-color="#4a3f35"/>
          <stop offset="100%" stop-color="#3a3228"/>
        </linearGradient>
      </defs>
      <path class="vine-shadow" d="${vineD}" fill="none" stroke="#1a2e22" stroke-width="18" stroke-linecap="round" opacity="0.12"/>
      <path class="vine-main" d="${vineD}" fill="none" stroke="url(#vineGrad)" stroke-width="11" stroke-linecap="round"/>
    `;

    vinePoints.forEach((pt) => {
      const midX = (pt.x + pt.petioleX) / 2;
      const midY = (pt.y + pt.petioleY) / 2 - 30;
      const branchD = `M ${pt.x} ${pt.y} Q ${midX} ${midY}, ${pt.petioleX} ${pt.petioleY}`;

      svgContent += `<path class="vine-branch" d="${branchD}" fill="none" stroke="url(#branchGrad)" stroke-width="5" stroke-linecap="round"/>`;

      const leafSide = pt.onLeft ? -1 : 1;
      svgContent += smallLeafSvg(pt.x, pt.y, leafSide * -45, 1.05);
      svgContent += smallLeafSvg(pt.x, pt.y, leafSide * 40 + 180, 0.9);
      svgContent += smallLeafSvg(pt.x + leafSide * 8, pt.y + 14, leafSide * -75, 0.75);
    });

    let curlY = 60;
    const curlStep = (stemJoinY || totalH) / (nodeData.length * 2 + 3);
    while (curlY < (stemJoinY || totalH) - 40) {
      const side = curlY % (curlStep * 2) < curlStep ? 1 : -1;
      const curlX = cx + side * sway * 0.7;
      svgContent += `<path d="M ${curlX} ${curlY} Q ${curlX + side * 20} ${curlY + 15}, ${curlX + side * 8} ${curlY + 28}"
        fill="none" stroke="#3a6b50" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`;
      svgContent += smallLeafSvg(curlX + side * 10, curlY + 20, side * -60, 0.72);
      curlY += curlStep;
    }

    svgContent += rootsSvg(lastVineX, stemJoinY, w, rootsH);

    svg.innerHTML = svgContent;
  }

  // --- Messages (FormSubmit) ---
  function initForms() {
    const fizForm = document.getElementById('form-fiz');
    const risForm = document.getElementById('form-ris');
    const fizEmail = siteData?.site?.fiz?.email;
    const risEmail = siteData?.site?.ris?.email;

    if (fizForm && risEmail) {
      fizForm.addEventListener('submit', handleFormSubmit('form-fiz-status', fizForm, {
        action: `https://formsubmit.co/ajax/${encodeURIComponent(risEmail)}`,
        from: 'Fiz',
      }));
    }

    if (risForm && fizEmail) {
      risForm.addEventListener('submit', handleFormSubmit('form-ris-status', risForm, {
        action: `https://formsubmit.co/ajax/${encodeURIComponent(fizEmail)}`,
        from: 'Ris',
      }));
    }
  }

  function handleFormSubmit(statusId, form, meta) {
    let sending = false;

    return async (e) => {
      e.preventDefault();
      if (sending) return;

      const honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) return;

      const status = document.getElementById(statusId);
      const btn = form.querySelector('button[type="submit"]');
      const messageEl = form.querySelector('[name="message"]');
      const originalText = btn.textContent;

      if (!messageEl || !messageEl.value.trim()) {
        showStatus(status, 'Please write a message first.', 'error');
        return;
      }

      sending = true;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const formData = new FormData(form);
      formData.set('message', messageEl.value.trim());
      formData.set('name', meta.from);
      formData.set('_subject', `A message from ${meta.from}`);
      formData.set('_template', 'table');
      formData.set('_captcha', 'false');

      try {
        const res = await fetch(meta.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          showStatus(status, "Sent! They'll get it in their inbox.", 'success');
          form.reset();
        } else {
          showStatus(status, data.message || 'Something went wrong. Try again?', 'error');
        }
      } catch {
        showStatus(
          status,
          'Your message was likely sent. If Kaspersky blocked the confirmation, wait before sending again — only retry if they did not get it.',
          'warning'
        );
        form.reset();
      }

      sending = false;
      btn.disabled = false;
      btn.textContent = originalText;
    };
  }

  function showStatus(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `form-status form-status-${type}`;
    el.classList.remove('hidden');
    const duration = type === 'warning' ? 12000 : 5000;
    setTimeout(() => el.classList.add('hidden'), duration);
  }

  // --- Music ---
  function initMusic() {
    const toggle = document.getElementById('music-toggle');
    const audio = document.getElementById('ambient-audio');
    if (!toggle || !audio) return;

    toggle.classList.add('muted');

    toggle.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          await audio.play();
          toggle.classList.remove('muted');
          toggle.classList.add('playing');
        } else {
          audio.pause();
          toggle.classList.add('muted');
          toggle.classList.remove('playing');
        }
      } catch {
        toggle.classList.add('muted');
        toggle.classList.remove('playing');
      }
    });

    audio.addEventListener('error', () => {
      toggle.style.display = 'none';
    });
  }

  // --- Parallax hero ---
  function initParallax() {
    if (prefersReducedMotion) return;
    const hero = document.getElementById('hero');
    if (!hero) return;

    window.addEventListener(
      'scroll',
      () => {
        const scrolled = window.scrollY;
        const content = hero.querySelector('.hero-content');
        if (content && scrolled < window.innerHeight) {
          content.style.transform = `translateY(${scrolled * 0.12}px)`;
          content.style.opacity = 1 - scrolled / (window.innerHeight * 0.85);
        }
      },
      { passive: true }
    );
  }

  // --- Nav ---
  function initNav() {
    const links = document.querySelectorAll('.nav-link');

    function navOffset() {
      const nav = document.getElementById('site-nav');
      return (nav?.offsetHeight || 56) + 20;
    }

    function sectionPageTop(section) {
      return section.getBoundingClientRect().top + window.scrollY;
    }

    function setActive(id) {
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }

    function updateActive() {
      const hero = document.getElementById('hero');
      const plant = document.getElementById('plant');
      const messages = document.getElementById('messages');
      if (!hero || !plant || !messages) return;

      const line = navOffset() + 12;
      const scrollBottom = window.scrollY + window.innerHeight;
      const pageBottom = document.documentElement.scrollHeight;
      const messagesRect = messages.getBoundingClientRect();
      const plantRect = plant.getBoundingClientRect();
      const messagesPageTop = messagesRect.top + window.scrollY;

      const atPageBottom = scrollBottom >= pageBottom - 20;
      const scrolledIntoMessages = scrollBottom > messagesPageTop + 100;
      const messagesOnScreen =
        messagesRect.bottom > line && messagesRect.top < window.innerHeight * 0.9;

      if (atPageBottom || scrolledIntoMessages || messagesOnScreen) {
        setActive('messages');
      } else if (plantRect.top <= line) {
        setActive('plant');
      } else {
        setActive('hero');
      }
    }

    function scrollToSection(id) {
      if (id === 'hero') {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      } else {
        const target = document.getElementById(id);
        if (!target) return;
        const top = sectionPageTop(target) - navOffset();
        window.scrollTo({
          top: Math.max(0, top),
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }

      setActive(id);
      if (!prefersReducedMotion) {
        setTimeout(updateActive, 450);
        setTimeout(updateActive, 950);
      }
    }

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href')?.slice(1);
        if (id) scrollToSection(id);
      });
    });

    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', debounce(updateActive, 150));
    syncNavActive = updateActive;
    updateActive();
  }

  // --- Utils ---
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    initBgLeaves();
    initEnvelope();
    initReveal();
    loadData();
    initMusic();
    initParallax();
    initNav();
  });
})();
