/*  Holographic Particle Accelerator — where the panel sits
 *  Jackrabbit72380
 *  2026
 *
 *  The panel is docked down the right-hand side. That is the right place most of the time and the
 *  wrong one when the picture wants the whole screen, so it has five placements and Home walks
 *  through them:
 *
 *  right → left → top → bottom → window → right …
 *
 *  Right, left, top and bottom slide the panel in from that edge, open as it arrives. Top and bottom
 *  are wide and short, so the sections lay out in columns across them instead of one long strip.
 *
 *  Window is the one that separates the two: the panel is not docked at all, and the controller
 *  opens in its own 1280 × 720 window, centred on the screen, driving this particle window from
 *  outside it. Close that window and the panel comes back to the right-hand side.
 *
 *  The placement is remembered, so a reload brings the panel back where it was left.
 */

(() => {
  'use strict';

  const dock = document.getElementById('dock');
  if (!dock) return;

  const ORDER = ['right', 'left', 'top', 'bottom', 'center'];
  const NAMES = { right: 'Right', left: 'Left', top: 'Top', bottom: 'Bottom', center: 'Window' };
  const STORE = 'hpa-guide-placement';
  const POPUP = 'hpa-guide';
  const WIDTH = 1280;
  const HEIGHT = 720;

  const style = document.createElement('style');
  style.textContent = [
    '#dock.place-left{left:0;right:auto;border-left:0;border-right:1px solid #1b2836;box-shadow:20px 0 50px rgba(0,0,0,.6)}',
    '#dock.place-left:not(.open){transform:translateX(-100%)}',
    '#dock.place-left.open{transform:none}',

    '#dock.place-top{top:0;bottom:auto;left:0;right:0;width:auto;height:min(54vh,420px);border-left:0;border-bottom:1px solid #1b2836;box-shadow:0 20px 50px rgba(0,0,0,.6)}',
    '#dock.place-top:not(.open){transform:translateY(-100%)}',
    '#dock.place-top.open{transform:none}',

    '#dock.place-bottom{top:auto;bottom:0;left:0;right:0;width:auto;height:min(54vh,420px);border-left:0;border-top:1px solid #1b2836;box-shadow:0 -20px 50px rgba(0,0,0,.6)}',
    '#dock.place-bottom:not(.open){transform:translateY(100%)}',
    '#dock.place-bottom.open{transform:none}',

    // Wide and short: the sections read better side by side than in one tall strip.
    '#dock.place-top #sections,#dock.place-bottom #sections{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:0 14px;align-items:start}',

    // In window placement the panel lives in its own window instead.
    '#dock.place-center{display:none!important}'
  ].join('');
  document.head.appendChild(style);

  /*--- The button in the panel's own bar ---*/

  const bar = dock.querySelector('.dock-bar');
  let button = null;

  if (bar) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost';
    button.title = 'Where the panel sits — Home cycles right, left, top, bottom, window';
    bar.appendChild(button);
  }

  /*--- The guide window ---*/

  let guide = null;

  function guideUrl() {
    return new URL('controller.html', window.location.href).href;
  }

  function openGuide() {
    if (guide && !guide.closed) {
      try { guide.focus(); } catch (error) { /* it can keep its own focus */ }
      return guide;
    }

    const width = Math.min(WIDTH, screen.availWidth || WIDTH);
    const height = Math.min(HEIGHT, screen.availHeight || HEIGHT);
    const left = (Number(screen.availLeft) || 0) + Math.max(0, Math.round((screen.availWidth - width) / 2));
    const top = (Number(screen.availTop) || 0) + Math.max(0, Math.round((screen.availHeight - height) / 2));

    let opened = null;
    try {
      opened = window.open(
        guideUrl(),
        POPUP,
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      opened = null;
    }

    if (!opened) {
      const status = document.getElementById('status');
      if (status) status.textContent = 'popup blocked — allow popups for the guide window';
      placement = 'right';
      paint();
      return null;
    }

    // Some browsers ignore the placement in the features string; this is the same request again.
    try {
      opened.moveTo(left, top);
      opened.resizeTo(width, height);
      opened.focus();
    } catch (error) {
      /* the window manager said no */
    }

    guide = opened;
    return guide;
  }

  function closeGuide() {
    if (!guide) return;
    try { if (!guide.closed) guide.close(); } catch (error) { /* already gone */ }
    guide = null;
  }

  /*--- Placement ---*/

  let placement = 'right';

  function paint() {
    for (const name of ORDER) dock.classList.toggle('place-' + name, name === placement);
    if (button) {
      button.textContent = NAMES[placement];
      button.setAttribute('aria-label', `Panel placement: ${NAMES[placement]}`);
    }
  }

  function setPlacement(next, options = {}) {
    if (!ORDER.includes(next)) return;
    placement = next;

    if (next === 'center') {
      openGuide();
    } else {
      closeGuide();
      // Arriving at an edge opens the panel; it never slides in closed and leaves you guessing.
      dock.classList.add('open');
      dock.setAttribute('aria-hidden', 'false');
      const hint = document.getElementById('dock-hint');
      if (hint) hint.hidden = true;
    }

    paint();

    if (options.save !== false) {
      try { localStorage.setItem(STORE, placement); } catch (error) { /* private mode */ }
    }
  }

  function cycle() {
    const at = ORDER.indexOf(placement);
    setPlacement(ORDER[(at + 1) % ORDER.length]);
  }

  // Home belongs to the panel now. dock.js still has its own Home listener that opens and closes
  // the panel; this one runs first and stops it, so one press means one thing.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Home' || event.ctrlKey || event.metaKey || event.altKey) return;

    const field = event.target;
    if (field && (field.isContentEditable ||
      (field.tagName === 'INPUT' && ['text', 'color', 'search', 'email', 'url'].includes(field.type)) ||
      field.tagName === 'TEXTAREA')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    cycle();
  }, true);

  if (button) button.addEventListener('click', cycle);

  /*--- Starting where it was left ---*/

  let remembered = '';
  try { remembered = localStorage.getItem(STORE) || ''; } catch (error) { /* private mode */ }

  setPlacement(ORDER.includes(remembered) ? remembered : 'right', { save: false });

  // A closed guide window gives the panel back to the particle window rather than leaving nothing.
  window.setInterval(() => {
    if (placement !== 'center') return;
    if (guide && !guide.closed) return;
    setPlacement('right');
  }, 700);
})();
