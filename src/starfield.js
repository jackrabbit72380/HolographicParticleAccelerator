/*  Holographic Particle Accelerator — Starfield
 *  Jackrabbit72380
 *  2026
 *
 *  A field of stars, as a source for either layer: the background can be a starfield, and so can
 *  the target, and both get the same controls for it.
 *
 *  Still frame — the stars hold where they are and the field's own turn carries them round.
 *  Fly at camera — the field rushes straight at you: the layer grows towards the camera while its
 *    brightness fades, so the stars sweep past the edges, and the new field starts where the old
 *    one has faded out, which is why the reset is not a jump. For the target, which has no
 *    brightness of its own, the rush is a zoom — the stars grow until they are past the frame.
 *
 *  Density, spread and depth change the field itself, so they ask the engine to sample it again;
 *  the fly speed only changes the rush.
 */

(() => {
  'use strict';

  const HPA = window.HPA;
  if (!HPA || !HPA.shapes) return;

  const TARGET_SRC = 'starfield';
  const LAYER_SRC = 'starfield:layer';

  const field = {
    target: { density: 2400, spread: 1, depth: 3, speed: 1.4, fly: false },
    background: { density: 3200, spread: 1.2, depth: 3, speed: 1.4, fly: false }
  };

  /*--- The field itself ---*/

  function stars(which) {
    const settings = field[which];
    const config = HPA.config || {};
    // The target is measured in world units; the layer is drawn scaled up around the viewer.
    const scale = which === 'target' ? (Number(config.MASK_HEIGHT) || 4.6) * 0.5 : 1;
    const count = Math.max(200, Math.round(settings.density));
    const points = [];

    for (let i = 0; i < count; i++) {
      const up = Math.random() * 2 - 1;
      const round = Math.random() * Math.PI * 2;
      const shell = Math.cbrt(Math.random());
      const ring = Math.sqrt(Math.max(0, 1 - up * up));
      const radius = shell * settings.spread * scale;

      points.push({
        x: radius * ring * Math.cos(round),
        y: radius * ring * Math.sin(round),
        z: radius * up * (settings.depth / 3),
        wait: Math.random(),
        band: Math.floor(Math.random() * 64),
        height: 0.15 + Math.random() * 0.5
      });
    }
    return points;
  }

  HPA.shapes[TARGET_SRC] = () => stars('target');
  HPA.shapes[LAYER_SRC] = () => stars('background');

  /*--- Keeping the two layers in step ---*/

  function usingStarfield(which) {
    const config = HPA.config || {};
    return which === 'target' ? config.MASK_SRC === TARGET_SRC : config.LAYER_SRC === LAYER_SRC;
  }

  function resample(which) {
    if (!usingStarfield(which)) return;
    if (which === 'target') HPA.set({ MODE: 'shape', MASK_SRC: TARGET_SRC });
    else HPA.set({ LAYER_SRC: LAYER_SRC });
  }

  /*--- The rush ---*/

  const phase = { target: 0, background: 0 };
  const base = { target: null, background: null };
  let frame = 0;
  let lastTick = 0;

  function remember(which) {
    if (base[which]) return;
    const config = HPA.config || {};
    base[which] = which === 'target'
      ? { ZOOM: Number(config.ZOOM) || 1 }
      : { scale: Number(config.LAYER_SCALE) || 3, alpha: Number(config.LAYER_ALPHA) || 0.6 };
  }

  function forget(which) {
    const saved = base[which];
    if (!saved) return;
    HPA.set(which === 'target' ? { ZOOM: saved.ZOOM } : { LAYER_SCALE: saved.scale, LAYER_ALPHA: saved.alpha });
    base[which] = null;
  }

  function rush() {
    const now = performance.now();
    const seconds = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0;
    lastTick = now;

    let busy = false;
    for (const which of ['target', 'background']) {
      const settings = field[which];
      if (!settings.fly || !usingStarfield(which)) continue;
      busy = true;
      remember(which);

      phase[which] = (phase[which] + seconds * settings.speed * 0.28) % 1;
      const along = phase[which];

      if (which === 'background') {
        // Out to six times the size, with the field bright on the way in and gone by the restart.
        const envelope = Math.min(1, along * 6) * (along > 0.72 ? Math.max(0, (1 - along) / 0.28) : 1);
        HPA.set({
          LAYER_SCALE: 1.1 + along * 5,
          LAYER_ALPHA: (base.background ? base.background.alpha : 0.6) * envelope
        });
      } else {
        // The target has no brightness, so the zoom does the work: the stars grow until they are
        // past the frame, and the field restarts once it is behind the camera.
        HPA.set({ ZOOM: 1 + along * 5.2 });
      }
    }

    if (!busy) {
      frame = 0;
      lastTick = 0;
      for (const which of ['target', 'background']) {
        phase[which] = 0;
        forget(which);
      }
      return;
    }
    frame = window.requestAnimationFrame(rush);
  }

  function startRush() {
    if (frame) return;
    frame = window.requestAnimationFrame(rush);
  }

  /*--- The panels ---*/

  function panel(title) {
    return Array.from(document.querySelectorAll('#sections .layer-panel-inner')).find((node) => {
      const heading = node.querySelector('h2');
      return heading && heading.textContent === title;
    }) || null;
  }

  function labelled(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function keepOption(select, value, label) {
    const add = () => {
      if (Array.from(select.options).some((option) => option.value === value)) return;
      const option = labelled('option', '', label);
      option.value = value;
      select.appendChild(option);
    };
    add();
    // The background's list is rebuilt whenever a file is loaded or the layer changes.
    new MutationObserver(add).observe(select, { childList: true });
  }

  function build(which) {
    const name = which === 'target' ? 'Target' : 'Background';
    const host = panel(name);
    if (!host) return;

    const settings = field[which];

    const heading = labelled('div', 'row wide');
    heading.appendChild(labelled('span', 'label', 'Starfield'));
    host.appendChild(heading);

    const sliders = [
      { label: 'Stars', key: 'density', min: 200, max: 8000, step: 100, show: (v) => `${Math.round(v)}`, resample: true },
      { label: 'Spread', key: 'spread', min: 0.2, max: 2.5, step: 0.05, show: (v) => `${v.toFixed(2)}×`, resample: true },
      { label: 'Depth', key: 'depth', min: 0.2, max: 3, step: 0.1, show: (v) => `${v.toFixed(1)}×`, resample: true },
      { label: 'Fly speed', key: 'speed', min: 0, max: 4, step: 0.1, show: (v) => `${v.toFixed(1)}×`, resample: false }
    ];

    for (const spec of sliders) {
      const row = labelled('div', 'row');
      const shown = labelled('span', 'value', spec.show(settings[spec.key]));
      const input = labelled('input');
      input.type = 'range';
      input.min = spec.min;
      input.max = spec.max;
      input.step = spec.step;
      input.value = settings[spec.key];
      row.append(labelled('span', 'label', spec.label), shown, input);
      host.appendChild(row);

      input.addEventListener('input', () => {
        const value = Number(input.value);
        settings[spec.key] = value;
        shown.textContent = spec.show(value);
        if (spec.resample) resample(which);
      });
    }

    const buttons = labelled('div', 'buttons');
    const still = labelled('button', '', 'Still frame');
    const fly = labelled('button', '', 'Fly at camera');
    const again = labelled('button', '', 'New field');
    still.type = 'button';
    fly.type = 'button';
    again.type = 'button';
    still.title = 'Hold the stars where they are';
    fly.title = 'Send the field straight at the camera';
    again.title = 'Lay out a new field of stars';
    buttons.append(still, fly, again);
    host.appendChild(buttons);

    function paint() {
      still.classList.toggle('on', !settings.fly);
      fly.classList.toggle('on', settings.fly);
      still.setAttribute('aria-checked', settings.fly ? 'false' : 'true');
      fly.setAttribute('aria-checked', settings.fly ? 'true' : 'false');
    }

    still.setAttribute('role', 'checkbox');
    fly.setAttribute('role', 'checkbox');
    still.addEventListener('click', () => {
      settings.fly = false;
      paint();
      phase[which] = 0;
      forget(which);
    });
    fly.addEventListener('click', () => {
      settings.fly = true;
      paint();
      startRush();
    });
    again.addEventListener('click', () => resample(which));

    paint();
  }

  /*--- Where the field can be chosen ---*/

  function wire() {
    const backgroundPanel = panel('Background');
    const targetPanel = panel('Target');
    if (!backgroundPanel || !targetPanel) return;

    // The background's list is rebuilt from scratch whenever the layer changes or a file is loaded,
    // which also blanks its value, so the starfield option is put back and re-chosen as a whole.
    const backgroundSelect = backgroundPanel.querySelector('select');
    if (backgroundSelect) {
      let last = backgroundSelect.value;
      backgroundSelect.addEventListener('change', () => { last = backgroundSelect.value; });

      const keep = () => {
        if (!Array.from(backgroundSelect.options).some((option) => option.value === LAYER_SRC)) {
          const option = labelled('option', '', 'Starfield (stars)');
          option.value = LAYER_SRC;
          backgroundSelect.appendChild(option);
        }
        if (last === LAYER_SRC && backgroundSelect.value !== LAYER_SRC) backgroundSelect.value = LAYER_SRC;
      };

      keep();
      new MutationObserver(keep).observe(backgroundSelect, { childList: true });
    }

    const targetSelect = targetPanel.querySelector('select');
    if (targetSelect) {
      keepOption(targetSelect, TARGET_SRC, 'Starfield (stars)');
      targetSelect.addEventListener('change', () => {
        if (targetSelect.value === TARGET_SRC) HPA.set({ MODE: 'shape', MASK_SRC: TARGET_SRC });
        else if (usingStarfield('target')) forget('target');
      });
    }

    build('target');
    build('background');
  }

  // The layer panels are built by src/layers.js, which runs before this file in the player page.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
