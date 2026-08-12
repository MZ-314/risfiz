(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let siteData = null;

  const FALLBACK_DATA = {
    site: {
      title: 'RisFiz',
      relationshipStart: '2024-11-01',
      fiz: { name: 'Mustafiz Ahmed', nickname: 'Fiz', city: 'Guwahati', state: 'Assam', country: 'India', email: 'aimjetkhalifa10@gmail.com' },
      ris: { name: 'Rismaditi Arinda', nickname: 'Ris', city: 'Bontang', country: 'Indonesia', email: 'rismaditiarindaa@gmail.com' },
    },
    roots: {
      title_en: 'Before We Began',
      title_id: 'Sebelum Kita Mulai',
      text_en: 'Every plant has roots beneath the soil — moments that grew quietly before 1 November 2024.',
      text_id: 'Setiap tanaman punya akar di bawah tanah — momen-momen yang tumbuh diam-diam sebelum 1 November 2024.',
    },
    memories: [
      { date: '2026', sortDate: '2026-01-01', image: 'assets/images/memory-1.svg', caption_en: 'A recent moment.', caption_id: 'Momen terbaru.' },
      { date: '1 November 2024', sortDate: '2024-11-01', image: 'assets/images/memory-3.svg', caption_en: 'The day we began.', caption_id: 'Hari kita mulai.' },
    ],
  };

  const LEAF_OUTER = 'M140 10 C50 22 15 100 20 185 C25 265 70 350 140 355 C210 350 255 265 260 185 C265 100 230 22 140 10 Z';
  const LEAF_INNER = 'M140 36 C68 46 38 108 42 178 C46 242 78 308 140 312 C202 308 234 242 238 178 C242 108 212 46 140 36 Z';

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
          document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
          refreshPlantVine();
        }, 800);
      }, 1200);
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
    renderRoots();
    initForms();
  }

  // --- Site info ---
  function renderSiteInfo() {
    const site = siteData?.site;
    if (!site) return;

    const fullnames = document.getElementById('hero-fullnames');
    if (fullnames && site.fiz && site.ris) {
      fullnames.textContent = `${site.fiz.name} & ${site.ris.name}`;
    }

    const since = document.getElementById('hero-since');
    if (since && site.relationshipStart) {
      const d = new Date(site.relationshipStart + 'T00:00:00');
      since.textContent = `Since ${formatDate(d)}`;
    }

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

    const footer = document.getElementById('footer-names');
    if (footer) {
      footer.textContent = `${site.title || 'RisFiz'} · Since 1 November 2024`;
    }

    document.title = site.title || 'RisFiz';
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function giantLeafHtml(mem, i) {
    const clipId = `leafClip${i}`;
    const img = escapeHtml(mem.image);
    return `
      <div class="giant-leaf">
        <div class="node-anchor" aria-hidden="true"></div>
        <svg class="giant-leaf-svg" viewBox="0 0 280 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Memory: ${escapeHtml(mem.date)}">
          <defs>
            <clipPath id="${clipId}">
              <path d="${LEAF_INNER}"/>
            </clipPath>
          </defs>
          <path class="leaf-body" d="${LEAF_OUTER}" fill="#4a7c59" stroke="#243E2E" stroke-width="2.5"/>
          <image class="leaf-photo" href="${img}" x="40" y="34" width="200" height="276"
            preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
          <path d="${LEAF_OUTER}" fill="none" stroke="#243E2E" stroke-width="1.5" opacity="0.35"/>
          <path d="M140 36 L140 308" stroke="#243E2E" stroke-width="1.8" fill="none" opacity="0.22"/>
          <path d="M140 72 Q178 88 215 78" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
          <path d="M140 72 Q102 88 65 78" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
          <path d="M140 130 Q185 148 220 135" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
          <path d="M140 130 Q95 148 60 135" stroke="#243E2E" stroke-width="1" fill="none" opacity="0.18"/>
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
    requestAnimationFrame(drawPlantVine);
    setTimeout(drawPlantVine, 150);
    setTimeout(drawPlantVine, 500);
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
    const spread = Math.min(w * 0.44, 200);
    const deep = rootsH * 0.9;
    let s = '';

    s += `<ellipse cx="${baseX}" cy="${baseY + 6}" rx="${spread + 20}" ry="16" fill="#7a6b52" opacity="0.1"/>`;
    s += `<ellipse cx="${baseX}" cy="${baseY + 10}" rx="${spread * 0.7}" ry="8" fill="#5c4f3e" opacity="0.08"/>`;

    const roots = [
      { d: `M ${baseX} ${baseY} C ${baseX - spread * 0.15} ${baseY + deep * 0.15}, ${baseX - spread * 0.55} ${baseY + deep * 0.35}, ${baseX - spread} ${baseY + deep * 0.5} C ${baseX - spread * 0.85} ${baseY + deep * 0.7}, ${baseX - spread * 0.5} ${baseY + deep * 0.88}, ${baseX - spread * 0.25} ${baseY + deep}`, w: 7, c: '#4a3f35' },
      { d: `M ${baseX} ${baseY} C ${baseX + spread * 0.12} ${baseY + deep * 0.12}, ${baseX + spread * 0.5} ${baseY + deep * 0.32}, ${baseX + spread * 0.92} ${baseY + deep * 0.48} C ${baseX + spread * 0.75} ${baseY + deep * 0.68}, ${baseX + spread * 0.4} ${baseY + deep * 0.85}, ${baseX + spread * 0.18} ${baseY + deep * 0.95}`, w: 7, c: '#4a3f35' },
      { d: `M ${baseX} ${baseY} Q ${baseX - 8} ${baseY + deep * 0.45}, ${baseX - 20} ${baseY + deep * 0.75}`, w: 5, c: '#3a3228' },
      { d: `M ${baseX} ${baseY} Q ${baseX + 10} ${baseY + deep * 0.42}, ${baseX + 25} ${baseY + deep * 0.72}`, w: 5, c: '#3a3228' },
      { d: `M ${baseX} ${baseY} C ${baseX + 5} ${baseY + deep * 0.2}, ${baseX - 5} ${baseY + deep * 0.55}, ${baseX} ${baseY + deep * 0.82}`, w: 6, c: '#2f5240' },
      { d: `M ${baseX - spread * 0.4} ${baseY + deep * 0.38} Q ${baseX - spread * 0.65} ${baseY + deep * 0.55}, ${baseX - spread * 0.55} ${baseY + deep * 0.72}`, w: 3.5, c: '#5a4d42' },
      { d: `M ${baseX + spread * 0.35} ${baseY + deep * 0.36} Q ${baseX + spread * 0.6} ${baseY + deep * 0.52}, ${baseX + spread * 0.48} ${baseY + deep * 0.7}`, w: 3.5, c: '#5a4d42' },
      { d: `M ${baseX - spread * 0.15} ${baseY + deep * 0.22} Q ${baseX - spread * 0.35} ${baseY + deep * 0.38}, ${baseX - spread * 0.28} ${baseY + deep * 0.55}`, w: 2.5, c: '#6b5a45' },
      { d: `M ${baseX + spread * 0.12} ${baseY + deep * 0.2} Q ${baseX + spread * 0.3} ${baseY + deep * 0.36}, ${baseX + spread * 0.22} ${baseY + deep * 0.52}`, w: 2.5, c: '#6b5a45' },
      { d: `M ${baseX - spread * 0.7} ${baseY + deep * 0.52} Q ${baseX - spread * 0.85} ${baseY + deep * 0.65}, ${baseX - spread * 0.6} ${baseY + deep * 0.78}`, w: 2, c: '#6b5a45' },
      { d: `M ${baseX + spread * 0.65} ${baseY + deep * 0.5} Q ${baseX + spread * 0.8} ${baseY + deep * 0.63}, ${baseX + spread * 0.55} ${baseY + deep * 0.76}`, w: 2, c: '#6b5a45' },
    ];

    roots.forEach((r) => {
      s += `<path d="${r.d}" fill="none" stroke="${r.c}" stroke-width="${r.w}" stroke-linecap="round" opacity="0.85"/>`;
    });

    return s;
  }

  function drawPlantVine() {
    const container = document.getElementById('plant-container');
    const svg = document.getElementById('plant-vine-svg');
    const nodes = container?.querySelectorAll('.plant-node');
    if (!container || !svg || !nodes?.length) return;

    const w = container.offsetWidth;
    const nodesEl = document.getElementById('plant-memories');
    const rootsZone = document.getElementById('roots-zone');
    const rootsH = Math.max(rootsZone?.offsetHeight || 0, 200);
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

    svg.setAttribute('width', w);
    svg.setAttribute('height', totalH);
    svg.setAttribute('viewBox', `0 0 ${w} ${totalH}`);

    const containerRect = container.getBoundingClientRect();
    const nodeData = [];

    nodes.forEach((node, i) => {
      const anchor = node.querySelector('.node-anchor');
      const leaf = node.querySelector('.giant-leaf');
      const anchorRect = anchor.getBoundingClientRect();
      const leafRect = leaf.getBoundingClientRect();
      const dir = i % 2 === 0 ? 1 : -1;
      const onLeft = node.classList.contains('plant-node--left');

      nodeData.push({
        y: anchorRect.top - containerRect.top,
        petioleX: leafRect.left - containerRect.left + leafRect.width / 2,
        petioleY: leafRect.top - containerRect.top,
        dir,
        onLeft,
        vineX: cx + dir * sway,
      });
    });

    let vineD = `M ${cx} 8`;
    let prevY = 8;
    const vinePoints = [];

    nodeData.forEach((nd, i) => {
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

  function renderRoots() {
    const roots = siteData?.roots;
    if (!roots) return;

    const title = document.getElementById('roots-title');
    const subtitle = document.getElementById('roots-subtitle');
    const textEn = document.getElementById('roots-text-en');
    const textId = document.getElementById('roots-text-id');

    if (title) title.textContent = roots.title_en || 'Before We Began';
    if (subtitle) subtitle.textContent = roots.title_id || 'Sebelum Kita Mulai';
    if (textEn) textEn.textContent = roots.text_en || '';
    if (textId) textId.textContent = roots.text_id || '';
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

  // --- Nav highlight ---
  function initNav() {
    const links = document.querySelectorAll('.nav-link');
    const sections = ['hero', 'plant', 'messages'];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((link) => {
              link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
            });
          }
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
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
