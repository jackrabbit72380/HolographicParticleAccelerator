/*  Holographic Particle Accelerator — the canvas always fills the view it is drawn for
 *  Jackrabbit72380
 *  2026
 *
 *  The engine sizes its drawing buffer from window.innerWidth and window.innerHeight, and works out
 *  the perspective from that buffer's shape. The canvas on the page was sized with 100vw × 100vh
 *  instead — and on a phone those are not the same thing: 100vh is the viewport with the address bar
 *  put away, while innerHeight is the viewport you can actually see. Whenever the two disagree the
 *  browser stretches one shape into the other, which is what made the object look squashed and
 *  stretched on a phone.
 *
 *  So the box is measured here, in the same pixels the engine uses, and kept there as the address
 *  bar slides away, the keyboard opens, or the phone is turned over. The drawing buffer stays the
 *  engine's business: this only sets the size the buffer is displayed at, and both ends then agree
 *  on the shape.
 */

(() => {
  'use strict';

  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  let lastWidth = 0;
  let lastHeight = 0;

  function fit() {
    const view = window.visualViewport;
    // innerWidth/innerHeight is what the engine measures, so that is what is matched. visualViewport
    // is only a fallback for the browsers that keep the two apart for a moment after a gesture.
    const width = Math.round(window.innerWidth || (view && view.width) || 0);
    const height = Math.round(window.innerHeight || (view && view.height) || 0);
    if (!width || !height) return;
    if (width === lastWidth && height === lastHeight) return;

    lastWidth = width;
    lastHeight = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  fit();

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => window.setTimeout(fit, 260));
  window.addEventListener('load', fit);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fit);
    window.visualViewport.addEventListener('scroll', fit);
  }

  // Phones settle their viewport a moment after the first paint, so it is measured again as they do.
  for (const delay of [120, 400, 900]) window.setTimeout(fit, delay);
})();
