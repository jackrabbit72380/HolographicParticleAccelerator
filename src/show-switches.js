/*  Holographic Particle Accelerator — Show as four switches
 *  Jackrabbit72380
 *  2026
 *
 *  The Show section offers its four options as one-at-a-time mode buttons: Off, Inside spin, Music
 *  visualizer, Rainbow. Those are really three different things that can be wanted together — the
 *  camera can sit inside the particles while the tint walks and the zoom breathes — so this file
 *  replaces them with four on/off switches:
 *
 *  Inside spin — sits the camera in among the particles and keeps it turning forever.
 *  Music visualizer — the zoom breathes and the tint follows the audio level.
 *  Rainbow — the tint sweeps the wheel on its own.
 *  Off — the switch that is lit when the other three are all off; pressing it clears them.
 *
 *  Inside spin drives the panel's own Inside view and Infinite rotation controls rather than the
 *  engine directly, so those two keep showing what they are doing.
 */

(() => {
  'use strict';

  function engine() {
    const offered = window.HPA_PLAYER;
    if (offered && offered !== window) {
      try {
        if (!offered.closed && offered.HPA) return offered.HPA;
      } catch (error) {
        /* not ours to read */
      }
    }
    return window.HPA || null;
  }

  function section(title) {
    return Array.from(document.querySelectorAll('#sections > .section')).find((node) => {
      const heading = node.querySelector('h2');
      return heading && heading.textContent === title;
    }) || null;
  }

  function byText(row, starts) {
    return Array.from(row.querySelectorAll('button')).find((button) =>
      String(button.textContent).trim().toLowerCase().indexOf(starts) === 0
    ) || null;
  }

  const state = { inside: false, visualizer: false, rainbow: false, litInfinite: false };

  const showSection = section('Show');
  const cameraSection = section('Camera');
  if (!showSection || !cameraSection) return;

  const row = showSection.querySelector('.buttons');
  if (!row) return;

  const originals = Array.from(row.querySelectorAll('button'));
  const offButton = byText(row, 'off');
  const insideButton = byText(row, 'inside spin');
  const visualizerButton = byText(row, 'music visualizer');
  const rainbowButton = byText(row, 'rainbow');
  if (originals.length !== 4 || !offButton || !insideButton || !visualizerButton || !rainbowButton) return;

  const insideView = byText(cameraSection, 'inside view');
  const outsideView = byText(cameraSection, 'outside view');
  const infiniteToggle = Array.from(cameraSection.querySelectorAll('button')).find((button) =>
    String(button.textContent).trim().toLowerCase().indexOf('infinite rotation') === 0
  ) || null;

  function api() {
    const found = engine();
    return found && found.config ? found : null;
  }

  // A switch keeps the class, the size and the label it already had; only its state changes.
  function switchify(button, onClick) {
    const fresh = button.cloneNode(true);
    fresh.setAttribute('role', 'checkbox');
    button.parentNode.replaceChild(fresh, button);
    fresh.addEventListener('click', onClick);
    return fresh;
  }

  let insideSwitch = insideButton;
  let visualizerSwitch = visualizerButton;
  let rainbowSwitch = rainbowButton;

  function paint() {
    const allOff = !state.inside && !state.visualizer && !state.rainbow;
    for (const [button, on] of [
      [offButton, allOff],
      [insideSwitch, state.inside],
      [visualizerSwitch, state.visualizer],
      [rainbowSwitch, state.rainbow]
    ]) {
      if (!button) continue;
      button.classList.toggle('on', on);
      button.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  /*--- The autopilot ---*/

  function applyShow() {
    const settings = api();
    if (!settings || !settings.show) return;
    const mode = state.rainbow && !state.visualizer
      ? 'rainbow'
      : state.visualizer
        ? 'visualizer'
        : 'off';
    settings.show({ mode, visualizer: state.visualizer, rainbow: state.rainbow });
  }

  /*--- The camera ---*/

  function applyInside() {
    if (state.inside) {
      if (insideView && api() && api().config.VIEW !== 'inside') insideView.click();
      // Endless means no rebuild, which is what the panel's own Infinite rotation switch does.
      if (infiniteToggle && !infiniteToggle.classList.contains('on')) {
        state.litInfinite = true;
        infiniteToggle.click();
      }
    } else {
      if (outsideView && api() && api().config.VIEW === 'inside') outsideView.click();
      if (state.litInfinite && infiniteToggle && infiniteToggle.classList.contains('on')) {
        infiniteToggle.click();
      }
      state.litInfinite = false;
    }
  }

  function clearAll() {
    if (state.inside) {
      state.inside = false;
      applyInside();
    }
    state.visualizer = false;
    state.rainbow = false;
    applyShow();
    paint();
  }

  insideSwitch = switchify(insideButton, () => {
    state.inside = !state.inside;
    applyInside();
    paint();
  });

  visualizerSwitch = switchify(visualizerButton, () => {
    state.visualizer = !state.visualizer;
    applyShow();
    paint();
  });

  rainbowSwitch = switchify(rainbowButton, () => {
    state.rainbow = !state.rainbow;
    applyShow();
    paint();
  });

  // The off switch is the one that is lit when nothing else is: pressing it clears what is on.
  offButton.setAttribute('role', 'checkbox');
  offButton.addEventListener('click', clearAll);

  /*--- Following the engine ---*/

  // The preset and the two sliders push the autopilot the one-at-a-time way, so the switches put
  // their own parts back after them rather than letting a slider quietly drop one.
  showSection.addEventListener('input', () => window.setTimeout(applyShow, 0));
  showSection.addEventListener('change', () => window.setTimeout(applyShow, 0));

  function sync() {
    const settings = api();
    if (!settings) return;

    const show = settings.show && settings.show.state ? settings.show.state() : null;
    if (show) {
      state.visualizer = show.visualizer === true || show.mode === 'visualizer';
      state.rainbow = show.rainbow === true || show.mode === 'rainbow';
    }
    state.inside = String(settings.config.VIEW || '') === 'inside';
    paint();
  }

  sync();
  window.setInterval(sync, 600);
})();
