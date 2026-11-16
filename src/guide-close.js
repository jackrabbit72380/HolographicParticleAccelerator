/*  Holographic Particle Accelerator — closing the guide window
 *  Jackrabbit72380
 *  2026
 *
 *  When the panel is opened as its own window — the Window placement in the particle window's
 *  panel — this is the page inside it. Its own bar already carries Reset and a link back to the
 *  particle window, so a Close guide button goes at the end of that row, top right, and closes the
 *  window it is in.
 *
 *  The panel's existing "Close" is a different thing: it closes the particle window, not this one.
 *  It is renamed here so the two can never be mistaken for each other again.
 */

(() => {
  'use strict';

  const actions = document.querySelector('.bar-actions');
  if (!actions) return;

  const particleClose = document.getElementById('close-player');
  if (particleClose && /^close$/i.test(String(particleClose.textContent).trim())) {
    particleClose.textContent = 'Close particle window';
    particleClose.title = 'Close the particle window this panel is driving';
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ghost';
  button.textContent = 'Close guide';
  button.title = 'Close this guide window — the panel goes back inside the particle window';

  button.addEventListener('click', () => {
    window.close();

    // A window the browser will not let go: say so rather than looking like a dead button.
    if (!window.closed) {
      const status = document.getElementById('status');
      if (status) status.textContent = 'this window cannot close itself — close the tab';
    }
  });

  actions.appendChild(button);
})();
