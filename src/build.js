/*  Holographic Particle Accelerator — Build stamp
 *  Jackrabbit72380
 *  2026
 *
 *  A short build id in the corner of the panel, so it is obvious at a glance whether the browser
 *  is showing the deployed build or a cached copy of an older one. The id is the version on this
 *  file's own URL — the same ?v= the page loads every script and stylesheet with — so the stamp
 *  always names the build that is actually running, and there is no second copy of the number to
 *  keep in step.
 */

(() => {
  'use strict';

  const here = document.currentScript;
  let version = 'dev';

  try {
    const url = new URL(here && here.src ? here.src : window.location.href, window.location.href);
    version = url.searchParams.get('v') || 'dev';
  } catch (error) {
    /* an odd URL: the stamp still says something */
  }

  const style = document.createElement('style');
  style.textContent = [
    '.build-stamp{flex:none;font-size:10px;line-height:1;color:#5f7488;',
    'font-variant-numeric:tabular-nums;letter-spacing:.02em;cursor:default;user-select:text}'
  ].join('');
  document.head.appendChild(style);

  function place() {
    const bar = document.querySelector('#dock .dock-bar') || document.querySelector('.bar');
    if (!bar) return;

    let stamp = bar.querySelector('.build-stamp');
    if (!stamp) {
      stamp = document.createElement('span');
      stamp.className = 'build-stamp';
      bar.appendChild(stamp);
    }
    stamp.textContent = 'build ' + version;
    stamp.title = `Build ${version} — the version this page loaded`;
  }

  place();
})();
