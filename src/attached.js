/*  Holographic Particle Accelerator — the guide window's side of the connection
 *  Jackrabbit72380
 *  2026
 *
 *  The panel usually lives inside the particle window, where src/dock.js hands src/controller.js a
 *  handle to the engine running in the same page. Opened as its own window — which is what the
 *  panel's Window placement does — this document is the child of the particle window instead, and
 *  controller.js finds no handle of its own.
 *
 *  The opener is same-origin, so its handle is this window's handle: it is offered here before
 *  controller.js runs, and kept offered in case that one was not ready yet. Nothing is opened or
 *  navigated — the particle window stays exactly as it is, animation running.
 */

(() => {
  'use strict';

  if (!window.opener || window.opener === window) return;

  function offer() {
    const opener = window.opener;
    if (!opener) return;
    try {
      if (opener.closed) return;
      const handle = opener.HPA_PLAYER || (opener.HPA ? opener : null);
      if (handle && handle.HPA) window.HPA_PLAYER = handle;
    } catch (error) {
      /* the opener went to another origin: leave it alone */
    }
  }

  offer();
  window.setInterval(offer, 500);
})();
