/*  Holographic Particle Accelerator — Close guide, as a ×
 *  Jackrabbit72380
 *  2026
 *
 *  The panel's bar carries Close guide in words, which is a lot of the row for one job. Here it
 *  becomes a single × in a small box at the far right: the same button, the same handler and the
 *  same title, less of the bar. Anything reading to a screen reader still hears "Close guide".
 *
 *  src/placement.js puts the button in the bar and keeps it last; this only changes what it looks
 *  like, and puts the wording back if the bar is ever rebuilt.
 */

(() => {
  'use strict';

  const bar = document.querySelector('#dock .dock-bar');
  if (!bar) return;

  const style = document.createElement('style');
  style.textContent = [
    // A tight square, at the end of the row rather than sharing it out. The phone rules give bar
    // buttons a thumb-sized box; this one is smaller on purpose, so it says so itself.
    '#dock .dock-bar .x-button{flex:none;width:26px;height:26px;min-height:0;padding:0;',
    'font:400 16px/1 system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;',
    'border-radius:6px;margin-left:auto}'
  ].join('');
  document.head.appendChild(style);

  function convert() {
    const button = Array.from(bar.querySelectorAll('button')).find((candidate) =>
      /^close guide$/i.test(candidate.textContent.trim()));
    if (!button) return;

    button.textContent = '×';
    button.classList.add('x-button');
    button.setAttribute('aria-label', 'Close guide');
    button.title = 'Close the guide — Home brings it back (Esc)';
  }

  convert();
  new MutationObserver(convert).observe(bar, { childList: true, characterData: true, subtree: true });
})();
