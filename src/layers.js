/*  Holographic Particle Accelerator — Layers
 *  Jackrabbit72380
 *  2026
 *
 *  One panel per layer, behind one dropdown. The Layer selector offers Target and Background and
 *  shows that layer's whole panel: its on/off, its source, and the same four properties — size,
 *  turn, brightness, band height. Only one is on screen at a time, so the target is not listed
 *  twice, once at the top of the panel and once here.
 *
 *  The Target panel is the panel's own Target section, moved in whole rather than rebuilt: its
 *  Load…, Rebuild, Random, shape list, 90° tilt box and all of controller.js's logic stay exactly
 *  as they were, and nothing about importing a picture or a mesh changes. Those three and the
 *  layer's own on/off share one row, so the target's actions take a line rather than two.
 *
 *  The engine draws the background from its own LAYER_* settings, and has no size, turn or
 *  brightness of its own for the target, so the target layer's controls drive the settings only it
 *  moves: ZOOM, ROTATE_SPEED, GLOW and EQ_HEIGHT. Target off is a blank shape, because the engine
 *  has no opacity for the target and a shape with no points is the one thing that draws nothing.
 */

(() => {
  'use strict';

  const root = document.getElementById('sections');
  if (!root) return;

  // The shapes the background can be, without the ones that only make sense as a target:
  // an imported mesh lives in memory, and a picture is flat.
  const SHAPES = [
    ['ball', 'Ball (3D)'],
    ['cube', 'Cube (3D)'],
    ['torus', 'Torus (3D)'],
    ['atom', 'Atom (3D)'],
    ['helix', 'Helix (3D)'],
    ['pyramid', 'Pyramid (3D)'],
    ['star', 'Star (3D)'],
    ['spear', 'Spear (3D)'],
    ['equalizer', 'Equalizer (audio bars)'],
    ['grid', 'Grid (audio bars)'],
    ['blob3d', 'Blob (3D, audio)']
  ];

  const BLANK = 'hpaBlank';
  const turn = Math.PI * 2;
  const BAND = 2.2;         // world height a full band height means, as EQ_HEIGHT ships

  function engine() {
    const offered = window.HPA_PLAYER;
    if (offered && offered !== window) {
      try {
        if (!offered.closed && offered.HPA) return offered.HPA;
      } catch (error) {
        /* the particle window is not ours to read */
      }
    }
    return window.HPA || null;
  }

  function apply(patch) {
    const api = engine();
    if (api && api.set) api.set(patch);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /*--- What the engine needs registered ---*/

  // The layer's band height is baked into the heights of its points, so each shape is registered
  // a second time under its own name; the target keeps the shared setting.
  let bandHeight = 0.5;

  function registerShapes() {
    const api = engine();
    if (!api || !api.shapes || api.shapes.hpaLayerShapes) return;

    api.shapes[BLANK] = () => [];

    for (const [value] of SHAPES) {
      const base = api.shapes[value];
      if (typeof base !== 'function') continue;
      api.shapes[value + ':layer'] = () =>
        base().map((point) => Object.assign({}, point, { height: (Number(point.height) || 0) * bandHeight }));
    }
    api.shapes.hpaLayerShapes = true;
  }

  /*--- Files for the background ---*/

  let fileCount = 0;
  const loaded = new Map();

  // A point cloud from anything the panel can read: a picture, an .obj, or an ASCII .ply.
  function fit(points, world) {
    if (!points.length) return points;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    const centreX = (minX + maxX) / 2;
    const centreY = (minY + maxY) / 2;
    const centreZ = (minZ + maxZ) / 2;
    const reach = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const scale = (world * 0.62) / reach;

    for (const p of points) {
      p.x = (p.x - centreX) * scale;
      p.y = (p.y - centreY) * scale;
      p.z = (p.z - centreZ) * scale;
      p.wait = Math.random();
      if (p.height === undefined) p.height = 0.3;
      if (p.band === undefined) p.band = 0;
    }
    return points;
  }

  function imagePoints(file, world) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('that image would not open')); };
      image.onload = () => {
        const width = 130;
        const height = Math.max(2, Math.round(width * ((image.height || 1) / (image.width || 1))));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        URL.revokeObjectURL(url);

        const points = [];
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const at = (y * width + x) * 4;
            const alpha = pixels[at + 3] / 255;
            const light = (pixels[at] * 0.299 + pixels[at + 1] * 0.587 + pixels[at + 2] * 0.114) / 255;
            const ink = alpha < 0.12 ? 0 : Math.abs(light - 0.5) * 2;
            if (ink < 0.35) continue;
            points.push({
              x: (x + Math.random()) / width - 0.5,
              y: 0.5 - (y + Math.random()) / height,
              z: (Math.random() - 0.5) * 0.04
            });
          }
        }
        resolve(fit(points, world));
      };
      image.src = url;
    });
  }

  function meshPoints(vertices, faces, world) {
    const points = [];
    if (!faces.length) {
      for (const vertex of vertices) points.push({ x: vertex[0], y: vertex[1], z: vertex[2] });
      return fit(points, world);
    }

    // Area-weighted over the triangles, so a dense corner fills in as densely as the file says.
    const areas = faces.map((face) => {
      let total = 0;
      for (let i = 1; i < face.length - 1; i++) {
        const a = vertices[face[0]];
        const b = vertices[face[i]];
        const c = vertices[face[i + 1]];
        if (!a || !b || !c) continue;
        const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        total += Math.hypot(
          ab[1] * ac[2] - ab[2] * ac[1],
          ab[2] * ac[0] - ab[0] * ac[2],
          ab[0] * ac[1] - ab[1] * ac[0]
        ) / 2;
      }
      return total;
    });
    const sum = areas.reduce((a, b) => a + b, 0) || 1;
    const wanted = 16000;

    faces.forEach((face, index) => {
      const share = Math.max(1, Math.round((areas[index] / sum) * wanted));
      for (let n = 0; n < share; n++) {
        let u = Math.random();
        let v = Math.random();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        const a = vertices[face[0]];
        const b = vertices[face[1]] || a;
        const c = vertices[face[2]] || a;
        if (!a) continue;
        points.push({
          x: a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
          y: a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
          z: a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v
        });
      }
    });
    return fit(points, world);
  }

  function objPoints(text, world) {
    const vertices = [];
    const faces = [];
    for (const line of text.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === 'v') vertices.push([Number(parts[1]) || 0, Number(parts[2]) || 0, Number(parts[3]) || 0]);
      else if (parts[0] === 'f') {
        const face = parts.slice(1).map((token) => parseInt(token.split('/')[0], 10) - 1).filter((i) => i >= 0);
        if (face.length >= 3) faces.push(face);
      }
    }
    if (!vertices.length) throw new Error('no vertices in that .obj');
    return meshPoints(vertices, faces, world);
  }

  function plyPoints(text, world) {
    if (/^format\s+binary/i.test(text.slice(0, 400))) throw new Error('export that .ply as ASCII, or use .obj');
    const lines = text.split('\n');
    let count = 0;
    let headerEnd = 0;
    let index = 0;
    for (; index < lines.length; index++) {
      const line = lines[index].trim();
      if (/^element\s+vertex\s+(\d+)/i.test(line)) count = parseInt(RegExp.$1, 10);
      if (/^end_header/i.test(line)) { headerEnd = index + 1; break; }
    }
    const vertices = [];
    for (let i = headerEnd; i < headerEnd + count && i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length < 3) continue;
      vertices.push([Number(parts[0]) || 0, Number(parts[1]) || 0, Number(parts[2]) || 0]);
    }
    if (!vertices.length) throw new Error('no vertices in that .ply');
    return meshPoints(vertices, [], world);
  }

  async function pointsFor(file) {
    const api = engine();
    const world = Number((api && api.config && api.config.MASK_HEIGHT) || 4.6);
    const name = String(file.name || '').toLowerCase();

    if (/^image\//i.test(file.type || '') || /\.(png|jpe?g|webp|gif|avif|svg)$/.test(name)) return imagePoints(file, world);
    if (name.endsWith('.obj')) return objPoints(await file.text(), world);
    if (name.endsWith('.ply')) return plyPoints(await file.text(), world);
    throw new Error('use an image, .obj or .ply');
  }

  /*--- The target list keeps the blob ---*/

  const targetSelect = root.querySelector('select');
  if (targetSelect && !Array.from(targetSelect.options).some((option) => option.value === 'blob3d')) {
    const option = el('option', '', 'Blob (3D, audio)');
    option.value = 'blob3d';
    const meshOption = Array.from(targetSelect.options).find((item) => item.value === 'mesh');
    targetSelect.insertBefore(option, meshOption || null);
    targetSelect.addEventListener('change', () => {
      if (targetSelect.value === 'blob3d') apply({ MODE: 'shape', MASK_SRC: 'blob3d' });
    });
  }

  /*--- The Layers panel: a dropdown, and a panel for each layer ---*/

  const style = document.createElement('style');
  style.textContent = [
    '.section .layer-panel-inner{border:0;border-radius:0;background:none;padding:0;margin:0}',
    '.layer-panel-inner[hidden]{display:none!important}',
    '.section > h2 + .buttons, .layer-panel-inner > .buttons{margin-bottom:6px}',

    // The target's whole row of actions, on one line: no wrapping, and each button takes an equal
    // share of the width, so the four of them fit where two rows used to be.
    '.target-actions{flex-wrap:nowrap;gap:6px}',
    '.target-actions > button{flex:1 1 0;min-width:0;white-space:nowrap;overflow:hidden;',
    'text-overflow:ellipsis;padding-left:6px;padding-right:6px}'
  ].join('');
  document.head.appendChild(style);

  const panel = el('div', 'section');
  panel.appendChild(el('h2', '', 'Layers'));

  const chooserRow = el('div', 'row wide');
  chooserRow.appendChild(el('span', 'label', 'Layer'));
  const layerSelect = el('select');
  for (const [value, label] of [['target', 'Target'], ['background', 'Background']]) {
    const option = el('option', '', label);
    option.value = value;
    layerSelect.appendChild(option);
  }
  chooserRow.appendChild(layerSelect);
  panel.appendChild(chooserRow);

  // The Target panel is the Target section itself, moved in with everything it already had.
  const targetSection = Array.from(root.children).find((node) => {
    const heading = node.querySelector('h2');
    return heading && heading.textContent === 'Target';
  });
  if (!targetSection) return;
  targetSection.classList.add('layer-panel-inner');

  const backgroundPanel = el('div', 'section layer-panel-inner');
  backgroundPanel.appendChild(el('h2', '', 'Background'));

  /*--- State ---*/

  let current = 'target';
  let targetOn = true;
  let backgroundOn = false;
  let lastTarget = 'ball';
  let chosenBackground = 'ball:layer';

  const sliders = [];

  function toggleButton(what) {
    const button = el('button', '', 'On');
    button.type = 'button';
    button.setAttribute('role', 'checkbox');
    button.title = `Show or hide the ${what} layer`;
    return button;
  }

  // Each panel opens with its own on/off, right under its heading.
  const targetToggle = toggleButton('target');
  const backgroundToggle = toggleButton('background');

  function toggleRow(button) {
    const row = el('div', 'buttons');
    row.appendChild(button);
    return row;
  }

  // In the Target panel's own button row rather than under it: Load…, Rebuild, Random and this
  // switch belong together, and four short buttons fit on one line. src/target-load.js swaps the
  // two load buttons for one Load… in that same row afterwards, and leaves the rest of it alone.
  const targetButtons = targetSection.querySelector('.buttons');
  if (targetButtons) {
    targetButtons.classList.add('target-actions');
    targetButtons.appendChild(targetToggle);

    for (const button of Array.from(targetButtons.querySelectorAll('button'))) {
      if (/^random shape$/i.test(button.textContent.trim())) {
        button.textContent = 'Random';
        button.title = 'Pick a random shape for the target';
      }
    }
  } else {
    targetSection.appendChild(toggleRow(targetToggle));
  }

  backgroundPanel.appendChild(toggleRow(backgroundToggle));

  /*--- The four properties, once for each layer ---*/

  const PROPS = {
    target: [
      {
        label: 'Size', min: 0.8, max: 8, step: 0.1,
        read: (c) => Number(c.ZOOM) || 1,
        write: (v) => ({ ZOOM: v }),
        show: (v) => `${v.toFixed(1)}×`
      },
      {
        label: 'Turn', min: -0.5, max: 0.5, step: 0.005,
        read: (c) => (Number(c.ROTATE_SPEED) || 0) / turn,
        write: (v) => ({ ROTATE_SPEED: v * turn }),
        show: (v) => `${v.toFixed(3)} turns/s`
      },
      {
        // The engine has no brightness for the target, so this is its glow, read as a percentage
        // of the range the Look section calls Glow falloff.
        label: 'Brightness', min: 0, max: 100, step: 1,
        read: (c) => ((Number(c.GLOW) || 2) - 2) * 5,
        write: (v) => ({ GLOW: 2 + v / 5 }),
        show: (v) => `${Math.round(v)}%`
      },
      {
        label: 'Band height', min: 0, max: 2, step: 0.05,
        read: (c) => (Number(c.EQ_HEIGHT) || BAND) / BAND,
        write: (v) => ({ EQ_HEIGHT: v * BAND }),
        show: (v) => `${v.toFixed(2)}×`
      }
    ],
    background: [
      {
        label: 'Size', min: 0.8, max: 8, step: 0.1,
        read: (c) => Number(c.LAYER_SCALE) || 3,
        write: (v) => ({ LAYER_SCALE: v }),
        show: (v) => `${v.toFixed(1)}×`
      },
      {
        label: 'Turn', min: -0.5, max: 0.5, step: 0.005,
        read: (c) => (Number(c.LAYER_SPIN) || 0) / turn,
        write: (v) => ({ LAYER_SPIN: v * turn }),
        show: (v) => `${v.toFixed(3)} turns/s`
      },
      {
        label: 'Brightness', min: 0, max: 100, step: 1,
        read: (c) => (Number(c.LAYER_ALPHA) || 0) * 100,
        write: (v) => ({ LAYER_ALPHA: v / 100 }),
        show: (v) => `${Math.round(v)}%`
      },
      {
        // Baked into the layer's own points, so it is the one setting that needs a rebuild.
        label: 'Band height', min: 0, max: 2, step: 0.05,
        read: () => bandHeight,
        write: (v) => { bandHeight = v; return { LAYER_BAND: v }; },
        show: (v) => `${v.toFixed(2)}×`
      }
    ]
  };

  function sliderRow(spec, layer, parent) {
    const row = el('div', 'row');
    const shown = el('span', 'value', spec.show(spec.min));
    const input = el('input');
    input.type = 'range';
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step;
    input.value = spec.min;
    row.append(el('span', 'label', spec.label), shown, input);
    parent.appendChild(row);

    input.addEventListener('input', () => {
      const value = Number(input.value);
      shown.textContent = spec.show(value);
      const patch = spec.write(value);
      apply(patch);
      // A changed band height is only baked into the points when the layer is rebuilt.
      if (layer === 'background' && 'LAYER_BAND' in patch && backgroundOn) {
        apply({ LAYER_SRC: chosenBackground });
      }
    });

    sliders.push({ spec, layer, shown, input });
  }

  /*--- The background panel's source ---*/

  const sourceRow = el('div', 'row wide');
  sourceRow.appendChild(el('span', 'label', 'Source'));
  const sourceSelect = el('select');
  sourceRow.appendChild(sourceSelect);
  backgroundPanel.appendChild(sourceRow);

  const loadRow = el('div', 'buttons');
  const loadButton = el('button', '', 'Load…');
  loadButton.type = 'button';
  loadRow.appendChild(loadButton);
  backgroundPanel.appendChild(loadRow);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,.obj,.ply';
  fileInput.hidden = true;
  backgroundPanel.appendChild(fileInput);

  /*--- Filling both panels ---*/

  // The target's sliders go with the rest of its settings, above its note.
  const targetAnchor = targetSection.querySelector('.note');
  for (const spec of PROPS.target) {
    sliderRow(spec, 'target', targetSection);
    if (targetAnchor) targetSection.insertBefore(targetSection.lastChild, targetAnchor);
  }

  for (const spec of PROPS.background) sliderRow(spec, 'background', backgroundPanel);

  // The Layers panel takes the Target section's place at the top of the panel, so there is one
  // place for the layers and the rest of the settings carry on below them.
  root.insertBefore(panel, targetSection);
  panel.appendChild(targetSection);
  panel.appendChild(backgroundPanel);

  /*--- Keeping the panel and the engine in step ---*/

  function fillSources() {
    sourceSelect.textContent = '';

    for (const [value, label] of SHAPES) {
      const option = el('option', '', label);
      option.value = value + ':layer';
      sourceSelect.appendChild(option);
    }
    for (const [key, label] of loaded) {
      const option = el('option', '', label);
      option.value = key;
      sourceSelect.appendChild(option);
    }
    sourceSelect.value = chosenBackground;
  }

  function refreshSliders() {
    const api = engine();
    const config = (api && api.config) || {};

    for (const { spec, shown, input } of sliders) {
      if (document.activeElement === input) continue;
      const raw = Number(spec.read(config));
      const value = Number.isFinite(raw) ? Math.min(spec.max, Math.max(spec.min, raw)) : spec.min;
      input.value = value;
      shown.textContent = spec.show(value);
    }
  }

  function showLayer(which) {
    current = which;
    layerSelect.value = which;
    targetSection.hidden = which !== 'target';
    backgroundPanel.hidden = which !== 'background';
  }

  function updateFlags() {
    for (const [button, on, what] of [
      [targetToggle, targetOn, 'target'],
      [backgroundToggle, backgroundOn, 'background']
    ]) {
      const label = on ? 'On' : 'Off';
      if (button.textContent !== label) button.textContent = label;
      button.classList.toggle('on', on);
      button.setAttribute('aria-checked', on ? 'true' : 'false');
      button.title = `Show or hide the ${what} layer`;
    }

    sourceSelect.disabled = !backgroundOn;
    loadButton.disabled = !backgroundOn;
  }

  layerSelect.addEventListener('change', () => showLayer(layerSelect.value));

  targetToggle.addEventListener('click', () => {
    const api = engine();
    if (!api) return;

    targetOn = !targetOn;
    if (targetOn) {
      apply({ MODE: 'shape', MASK_SRC: lastTarget && lastTarget !== BLANK ? lastTarget : 'ball' });
    } else {
      if (api.config.MASK_SRC && api.config.MASK_SRC !== BLANK) lastTarget = api.config.MASK_SRC;
      apply({ MODE: 'shape', MASK_SRC: BLANK });
    }
    updateFlags();
  });

  backgroundToggle.addEventListener('click', () => {
    if (!engine()) return;
    backgroundOn = !backgroundOn;
    apply({ LAYER_SRC: backgroundOn ? chosenBackground : 'off' });
    updateFlags();
  });

  sourceSelect.addEventListener('change', () => {
    chosenBackground = sourceSelect.value;
    if (backgroundOn) apply({ LAYER_SRC: chosenBackground });
  });

  loadButton.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;

    const status = document.getElementById('status');
    if (status) status.textContent = `reading ${file.name.slice(0, 24)}`;

    try {
      const points = await pointsFor(file);
      const api = engine();
      if (!api || !api.shapes) throw new Error('this page has no engine');
      if (!points.length) throw new Error('nothing to sample in that file');

      const key = `hpaLayer:${++fileCount}`;
      api.shapes[key] = () => points;
      loaded.set(key, file.name.replace(/\.[^.]+$/, '').slice(0, 22));

      chosenBackground = key;
      backgroundOn = true;
      fillSources();
      updateFlags();
      apply({ LAYER_SRC: key });
      if (status) status.textContent = 'background ready';
    } catch (error) {
      if (status) status.textContent = String(error.message).slice(0, 64);
    }
  });

  registerShapes();
  fillSources();
  updateFlags();
  showLayer('target');
  refreshSliders();

  /*--- Following the engine ---*/

  function reading() {
    const api = engine();
    const config = api && api.config ? api.config : null;
    if (!config) return null;
    return {
      mask: String(config.MASK_SRC || ''),
      layer: String(config.LAYER_SRC || 'off'),
      mode: String(config.MODE || '')
    };
  }

  let lastReading = reading();
  let lastLayer = lastReading ? lastReading.layer : '';

  function sync() {
    const now = reading();
    if (!now) return;

    if (now.mask !== BLANK && now.mode === 'shape') lastTarget = now.mask;
    targetOn = now.mask !== BLANK;
    backgroundOn = now.layer !== 'off';
    if (backgroundOn) chosenBackground = now.layer;

    // A file loaded here, or a layer chosen elsewhere, has to appear in the Source list.
    if (now.layer !== lastLayer) {
      lastLayer = now.layer;
      if (document.activeElement !== sourceSelect) fillSources();
    }
    lastReading = now;

    updateFlags();
    refreshSliders();
  }

  // Everything else in the panel can move these: Reset, the Target list, Camera's Zoom, Look's Glow
  // falloff, the Band height section, the Show modes. So the panel keeps watching the engine rather
  // than trusting the state it last painted.
  window.setInterval(sync, 600);

  const resetButton = document.getElementById('reset');
  if (resetButton) {
    resetButton.addEventListener('click', () => window.setTimeout(() => {
      fillSources();
      updateFlags();
    }, 600));
  }
})();
