/*  Holographic Particle Accelerator — Record from the start
 *  Jackrabbit72380
 *  2026
 *
 *  The Capture buttons record whatever is on screen when they are pressed, which is mid-turn if
 *  the target assembled a while ago. This one asks the particle window to rebuild first — the
 *  target goes back to the first frame of its assembly — and then records one whole build, so the
 *  file opens on the shape arriving rather than on a shape already there.
 *
 *  The length is the build's own: assemble, hold, fade, as the Timing section has them. With the
 *  loop off there is no fade, but the turn carries on, so the same length still shows the build.
 */

(() => {
  'use strict';

  const statusEl = document.getElementById('status');
  const setStatus = (text, tone = '') => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'status ' + tone;
  };

  function engine() {
    const offered = window.HPA_PLAYER;
    if (offered && offered !== window) {
      try {
        if (!offered.closed && offered.HPA) return offered.HPA;
      } catch (error) {
        /* the particle window is not ours to read */
      }
    }
    return window.HPA || null;
  }

  const capture = Array.from(document.querySelectorAll('#sections .section')).find((section) => {
    const heading = section.querySelector('h2');
    return heading && heading.textContent === 'Capture';
  });
  if (!capture) return;

  // The short-label grid the panel's copy pass leaves behind, or the plain list without it.
  const grid = capture.querySelector('.capture-buttons') || capture.querySelector('.buttons');
  if (!grid) return;

  if (typeof MediaRecorder === 'undefined') return;

  // Beside WebM and MP4, the label says which recording this is: the whole build, from frame one.
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Record from start';
  button.title = 'Record one whole build as WebM, from the first frame of the assembly';
  grid.appendChild(button);

  const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  function download(blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `holographic-particle-accelerator-build-${stamp()}.webm`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 20000);
  }

  button.addEventListener('click', async () => {
    const api = engine();
    if (!api || !api.record) return setStatus('open the particle window first', 'bad');

    const config = api.config || {};
    const field = (key, fallback) => Math.max(0, Number(config[key]) || fallback);
    const ms = Math.round(Math.min(60000, Math.max(2000,
      field('ASSEMBLY_MS', 7000) + field('HOLD_MS', 12000) + field('FADE_MS', 1200))));

    button.disabled = true;
    button.textContent = 'Recording…';
    setStatus(`recording the build (${(ms / 1000).toFixed(1)} s)…`, 'busy');

    try {
      // Back to the first frame first, so the recording opens on the shape arriving.
      if (api.rebuild) await api.rebuild();
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const blob = await api.record({ ms, mime, bitrate: 14000000 });
      download(blob);
      setStatus(`saved webm (${(blob.size / 1048576).toFixed(1)} MB)`, '');
    } catch (error) {
      setStatus(String((error && error.message) || error), 'bad');
    } finally {
      button.disabled = false;
      button.textContent = 'Record from start';
    }
  });
})();
