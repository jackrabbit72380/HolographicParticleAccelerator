/*  Holographic Particle Accelerator — Build stamp
 *  Jackrabbit72380
 *  2026
 *
 *  A short build id at the bottom right of the panel, so it is obvious at a glance whether the
 *  browser is showing the deployed build or a cached copy of an older one — and out of the way of
 *  the controls, which all sit above it. The id is the version on this file's own URL, the same ?v=
 *  the page loads every script and stylesheet with, so the stamp always names the build that is
 *  actually running and there is no second copy of the number to keep in step.
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
    // Last thing in the panel's own scroll area, hard against the right edge: the bottom right
    // corner of the panel, where nothing else is.
    '.build-stamp{display:block;margin:18px 2px 0 auto;width:max-content;font-size:10px;line-height:1;',
    'color:#5f7488;font-variant-numeric:tabular-nums;letter-spacing:.02em;text-align:right;',
    'cursor:default;user-select:text}'
  ].join('');
  document.head.appendChild(style);

  function place() {
    const host = document.querySelector('#dock .wrap') || document.getElementById('wrap');
    if (!host) return;

    let stamp = host.querySelector('.build-stamp');
    if (!stamp) {
      stamp = document.querySelector('.build-stamp');
      if (!stamp) {
        stamp = document.createElement('span');
        stamp.className = 'build-stamp';
        // It is the last thing in the panel, and it stays there as sections are added or moved.
        host.appendChild(stamp);
      } else if (stamp.parentElement !== host) {
        host.appendChild(stamp);
      }
    }

    stamp.textContent = 'build ' + version;
    stamp.title = `Build ${version} — the version this page loaded`;
  }

  place();

  // Sections arrive after this file, so the stamp is put back at the end once the panel is built.
  const host = document.querySelector('#dock .wrap') || document.getElementById('wrap');
  if (host) {
    new MutationObserver(() => {
      const stamp = document.querySelector('.build-stamp');
      if (stamp && stamp.parentElement !== host) host.appendChild(stamp);
    }).observe(host, { childList: true });
  }
})();
