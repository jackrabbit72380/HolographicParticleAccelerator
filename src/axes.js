/*  Holographic Particle Accelerator — Turn, tumble and roll as on/off switches
 *  Jackrabbit72380
 *  2026
 *
 *  The engine turns the target about exactly one axis: Y is the turntable, X tumbles it end over
 *  end, Z rolls it. That is right for the slider-and-one-axis panel it started as, but it means the
 *  three can never be on together. This file makes them three independent on/off switches instead,
 *  so any two or all three can run at once:
 *
 *  Turn    — the engine's own turn about Y, on when the spin speed is not zero.
 *  Tumble  — a continuous pitch about X.
 *  Roll    — a continuous roll about Z.
 *
 *  The engine has no setting for a second and third axis, so tumble and roll are applied where the
 *  model matrix is handed to WebGL: getUniformLocation is wrapped to remember which matrix is which
 *  by name (locations are opaque objects), and uniformMatrix4fv multiplies uModel by the extra
 *  rotation before it goes out. The layer the camera sits inside is drawn with the same uniform, so
 *  it is recognised and left alone — only the target turns on the extra axes. Nothing is touched
 *  unless tumble or roll is actually on, and if the engine ever renames that matrix the switches
 *  simply stop adding rotation instead of breaking the page.
 */

(() => {
  'use strict';

  const state = {
    turn: true,
    tumble: false,
    roll: false,
    tumbleBase: 0,
    rollBase: 0,
    anchor: (typeof performance !== 'undefined' ? performance.now() : Date.now())
  };

  const DEFAULT_RATE = 0.4;   // radians per second, the engine's shipped ROTATE_SPEED

  function now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  // The extra axes go round at whatever the panel's Turn says, and keep moving when Turn is the one
  // switched off, so tumble or roll on their own is not a frozen picture.
  function rate() {
    const api = window.HPA;
    const speed = Number(api && api.config ? api.config.ROTATE_SPEED : 0) || 0;
    return speed || DEFAULT_RATE;
  }

  // Where an axis has got to. Read from the clock rather than added up per frame, so the two
  // matrices drawn each frame (the layer, then the target) get the same angle.
  function angleOf(on, base) {
    return on ? base + ((now() - state.anchor) / 1000) * rate() : base;
  }

  // Called before an axis changes, so the angle it has reached is kept and the clock restarts.
  function freeze() {
    const moved = ((now() - state.anchor) / 1000) * rate();
    if (state.tumble) state.tumbleBase += moved;
    if (state.roll) state.rollBase += moved;
    state.anchor = now();
  }

  /*--- The two matrices ---*/

  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        out[column * 4 + row] =
          a[row] * b[column * 4] +
          a[4 + row] * b[column * 4 + 1] +
          a[8 + row] * b[column * 4 + 2] +
          a[12 + row] * b[column * 4 + 3];
      }
    }
    return out;
  }

  function pitch(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  function rollMatrix(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  function composed(model) {
    let out = model;
    if (state.tumble) out = multiply(pitch(angleOf(true, state.tumbleBase)), out);
    if (state.roll) out = multiply(rollMatrix(angleOf(true, state.rollBase)), out);
    return out;
  }

  /*--- Where the model matrix is handed to WebGL ---*/

  const names = new WeakMap();

  // The background layer is drawn with the same uModel uniform, and rolling the shell the camera sits
  // inside would throw it across the frame, so only the target is turned. The engine marks the layer
  // with an opened-up depth shade of exactly 40 and starts each frame with the projection.
  const LAYER_HALF_DEPTH = 40;
  let inLayer = false;

  function wrapContext(ctor) {
    const proto = ctor && ctor.prototype;
    if (!proto || !proto.getUniformLocation || !proto.uniformMatrix4fv) return;

    const getUniformLocation = proto.getUniformLocation;
    const uniformMatrix4fv = proto.uniformMatrix4fv;
    const uniform1f = proto.uniform1f;

    proto.getUniformLocation = function (program, name) {
      const location = getUniformLocation.call(this, program, name);
      if (location && typeof name === 'string') names.set(location, name);
      return location;
    };

    proto.uniform1f = function (location, value) {
      if (location && names.get(location) === 'uHalfDepth') inLayer = value === LAYER_HALF_DEPTH;
      return uniform1f.call(this, location, value);
    };

    proto.uniformMatrix4fv = function (location, transpose, value) {
      const name = location && names.get(location);
      if (name === 'uProjection') inLayer = false;
      if ((state.tumble || state.roll) && !inLayer && name === 'uModel' && value && value.length === 16) {
        return uniformMatrix4fv.call(this, location, transpose, composed(value));
      }
      return uniformMatrix4fv.call(this, location, transpose, value);
    };
  }

  wrapContext(window.WebGL2RenderingContext);
  wrapContext(window.WebGLRenderingContext);

  /*--- The three switches ---*/

  function setup() {
    // The standalone controller window has no canvas of its own; there the three axis buttons still
    // pick the axis of the window they are driving.
    const api = window.HPA;
    if (!api || !api.config) return;

    const buttons = Array.from(document.querySelectorAll('#sections button')).filter((button) =>
      /^[YXZ] — /.test(String(button.textContent).trim())
    );
    if (buttons.length < 3) return;

    const made = {};

    function replace(button, label, title, onClick) {
      const fresh = button.cloneNode(true);
      fresh.textContent = label;
      fresh.title = title;
      fresh.setAttribute('role', 'checkbox');
      fresh.classList.remove('on');
      button.parentNode.replaceChild(fresh, button);
      fresh.addEventListener('click', onClick);
      return fresh;
    }

    for (const button of buttons) {
      const was = String(button.textContent).toLowerCase();

      if (was.includes('tumble')) {
        made.tumble = replace(button, 'Tumble', 'Tumble the target end over end, with or without the turn', () => {
          freeze();
          state.tumble = !state.tumble;
          paint();
        });
      } else if (was.includes('roll')) {
        made.roll = replace(button, 'Roll', 'Roll the target in its own plane, with or without the turn', () => {
          freeze();
          state.roll = !state.roll;
          paint();
        });
      } else {
        made.turn = replace(button, 'Turn', 'Turn the target on its turntable, with or without tumble and roll', () => {
          const settings = window.HPA && window.HPA.config;
          if (!settings) return;
          if (Number(settings.ROTATE_SPEED) || 0) {
            state.lastSpeed = Math.abs(Number(settings.ROTATE_SPEED));
            api.set({ ROTATE_SPEED: 0 });
          } else {
            api.set({ ROTATE_SPEED: state.lastSpeed || DEFAULT_RATE });
          }
          paint();
        });
      }
    }

    function paint() {
      for (const [key, button] of Object.entries(made)) {
        if (!button) continue;
        const on = Boolean(state[key]);
        button.classList.toggle('on', on);
        button.setAttribute('aria-checked', on ? 'true' : 'false');
      }
    }

    // Reset, the Layers turn slider and the Camera spin speed all move the same setting, so the Turn
    // switch follows the engine rather than the state it last painted.
    window.setInterval(() => {
      const settings = window.HPA && window.HPA.config;
      if (!settings) return;
      const speed = Number(settings.ROTATE_SPEED) || 0;
      if (speed) state.lastSpeed = Math.abs(speed);
      const turn = speed !== 0;
      if (turn !== state.turn) {
        state.turn = turn;
        paint();
      }
    }, 600);

    const reset = document.getElementById('reset');
    if (reset) {
      reset.addEventListener('click', () => {
        freeze();
        state.tumble = false;
        state.roll = false;
        paint();
      });
    }

    state.turn = Number(api.config.ROTATE_SPEED) || 0 ? true : false;
    paint();
  }

  // The panel is built by controller.js, which runs as this page's own scripts load, so the buttons
  // are found on the first frame after the document is parsed rather than guessed at.
  function waitForButtons(tries = 0) {
    const found = Array.from(document.querySelectorAll('#sections button')).some((button) =>
      /^[YXZ] — /.test(String(button.textContent).trim())
    );
    if (found) {
      setup();
      return;
    }
    if (tries < 120) window.setTimeout(() => waitForButtons(tries + 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForButtons());
  } else {
    waitForButtons();
  }
})();
