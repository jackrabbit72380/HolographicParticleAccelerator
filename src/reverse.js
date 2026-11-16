/*  Holographic Particle Accelerator — Reverse cycle
 *  Jackrabbit72380
 *  2026
 *
 *  One checkbox in Timing: build the target up, let it turn three whole times, then dissolve it out
 *  until nothing is left in view and start again.
 *
 *  No new engine behaviour is needed for any of that. The engine's cycle is assemble, hold, fade —
 *  and the endless turn runs straight through both of the last two. So "three turns" is a hold as
 *  long as three turns take at the speed the panel is actually set to, and "until the particles are
 *  out of view" is the fade. Loop has to be on, or the cycle never comes round again.
 */

(() => {
  'use strict';

  function engine() {
    return window.HPA && window.HPA.config ? window.HPA : null;
  }

  const TURNS = 3;
  const DISSOLVE_MS = 2600;

  const timing = Array.from(document.querySelectorAll('#sections > .section')).find((node) => {
    const heading = node.querySelector('h2');
    return heading && heading.textContent === 'Timing';
  });
  if (!timing) return;

  let row = timing.querySelector('.buttons');
  if (!row) {
    row = document.createElement('div');
    row.className = 'buttons';
    timing.appendChild(row);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Reverse — turn three times, then dissolve';
  button.title = 'Build up, turn three times, dissolve out of view, then start over';
  button.setAttribute('role', 'checkbox');
  button.style.marginTop = '8px';
  row.appendChild(button);

  let on = false;
  let saved = null;

  // How long three whole turns take, at the turn the particle window is set to right now.
  function turnMs() {
    const settings = engine();
    const speed = Math.abs(Number(settings && settings.config ? settings.config.ROTATE_SPEED : 0)) || 0;
    return speed > 0.01 ? ((TURNS * Math.PI * 2) / speed) * 1000 : 12000;
  }

  function paint() {
    button.classList.toggle('on', on);
    button.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function apply(hold) {
    const settings = engine();
    if (!settings) return;
    settings.set({ LOOP: true, HOLD_MS: Math.round(hold), FADE_MS: DISSOLVE_MS });
  }

  button.addEventListener('click', () => {
    const settings = engine();
    if (!settings) return;

    on = !on;
    if (on) {
      saved = {
        LOOP: settings.config.LOOP,
        HOLD_MS: settings.config.HOLD_MS,
        FADE_MS: settings.config.FADE_MS
      };
      apply(turnMs());
    } else if (saved) {
      settings.set({ LOOP: saved.LOOP, HOLD_MS: saved.HOLD_MS, FADE_MS: saved.FADE_MS });
      saved = null;
    }
    paint();
  });

  // Changing the turn speed changes how long three turns take. Re-setting the hold restarts the
  // cycle, so it is only pushed when it has really moved.
  window.setInterval(() => {
    if (!on) return;
    const settings = engine();
    if (!settings) return;
    const wanted = Math.round(turnMs());
    if (Math.abs(wanted - (Number(settings.config.HOLD_MS) || 0)) > 400) apply(wanted);
  }, 1500);

  const reset = document.getElementById('reset');
  if (reset) {
    reset.addEventListener('click', () => {
      on = false;
      saved = null;
      paint();
    });
  }

  paint();
})();
