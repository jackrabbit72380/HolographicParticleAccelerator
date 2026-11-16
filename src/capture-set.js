/*  Holographic Particle Accelerator — Capture and Export
 *  Jackrabbit72380
 *  2026
 *
 *  Two sections, sorted by what they make. Capture keeps moving pictures: one WebM button and one
 *  MP4 button, both governed by a single video length, so the panel no longer offers four different
 *  fixed durations and two still frames nobody asked for. Export has the target as a model file,
 *  written out as .obj or .ply, which is what those two buttons were doing down at the bottom of
 *  Capture.
 *
 *  The recording itself is the engine's own: playerApi().record({ ms, mime }) captures the particle
 *  window's canvas, so the caption overlay is still not in the frame. All this decides is how long
 *  the recording runs, and which file it lands in.
 */

(() => {
  'use strict';

  const sections = document.getElementById('sections');
  if (!sections) return;

  const engine = () => {
    const offered = window.HPA_PLAYER;
    if (offered && offered !== window) {
      try {
        if (!offered.closed && offered.HPA) return offered.HPA;
      } catch (error) {
        /* the particle window is not ours to read */
      }
    }
    return window.HPA || null;
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const capture = Array.from(sections.querySelectorAll('.section')).find((node) => {
    const heading = node.querySelector('h2');
    return heading && heading.textContent.trim() === 'Capture';
  });
  if (!capture) return;

  /*--- What goes, and what stays ---*/

  // Labels as the panel writes them, and as src/panel-copy.js shortens them.
  const wasPng = (t) => /^png(\s+frame)?$/i.test(t);
  const wasWebp = (t) => /^webp(\s+frame)?$/i.test(t);
  const wasWebm = (t) => /^(record\s+)?webm(\s*(5|10)\s*s)?$/i.test(t);
  const wasMp4 = (t) => /^(record\s+)?mp4(\s*\d+\s*s)?$/i.test(t);
  const wasModel = (t, ext) => new RegExp(`^(\\.${ext}|model\\s*\\(\\.${ext}\\))`, 'i').test(t);

  const isGone = (t) => wasPng(t) || wasWebp(t) || wasWebm(t) || wasMp4(t) || wasModel(t, 'obj') || wasModel(t, 'ply');

  const row = capture.querySelector('.buttons');
  if (!row) return;

  for (const button of Array.from(capture.querySelectorAll('button'))) {
    if (isGone(button.textContent.trim())) button.remove();
  }

  // panel-copy.js gathers the section's rows into one grid; the leftovers go, and the row this
  // file fills is a plain row of buttons again.
  for (const other of Array.from(capture.querySelectorAll('.buttons'))) {
    if (other !== row && !other.querySelector('button')) other.remove();
  }
  row.textContent = '';
  row.classList.remove('capture-buttons');

  /*--- One length for both formats ---*/

  let seconds = 5;

  const lengthRow = el('div', 'row');
  const lengthValue = el('span', 'value', `${seconds} s`);
  const lengthInput = el('input');
  lengthInput.type = 'range';
  lengthInput.min = '1';
  lengthInput.max = '30';
  lengthInput.step = '1';
  lengthInput.value = String(seconds);
  lengthInput.title = 'How long the recording runs';
  lengthRow.append(el('span', 'label', 'Video length'), lengthValue, lengthInput);

  lengthInput.addEventListener('input', () => {
    seconds = Number(lengthInput.value) || 5;
    lengthValue.textContent = `${seconds} s`;
  });

  /*--- Record ---*/

  function stampName() {
    const now = new Date();
    const two = (value) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-` +
      `${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
  }

  function say(text) {
    const status = document.getElementById('status');
    if (status) status.textContent = text;
  }

  async function record(mime, ext) {
    const api = engine();
    if (!api || !api.record) return say('no particle window to record');

    say(`recording ${seconds} s…`);
    try {
      const blob = await api.record({ ms: seconds * 1000, mime, bitrate: 14000000 });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `holographic-particle-accelerator-${stampName()}.${ext}`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 20000);
      say(`saved ${ext} (${(blob.size / 1048576).toFixed(1)} MB)`);
    } catch (error) {
      say(String((error && error.message) || error).slice(0, 64));
    }
  }

  const WEBM = 'video/webm;codecs=vp9';
  const MP4 = 'video/mp4;codecs=avc1.42E01E';
  const supports = (mime) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime);

  const webmButton = el('button', '', 'WebM');
  webmButton.type = 'button';
  webmButton.title = 'Record the particle window as WebM video, for the length set above';
  webmButton.addEventListener('click', () => record(WEBM, 'webm'));

  const mp4Button = el('button', '', 'MP4');
  mp4Button.type = 'button';
  mp4Button.title = supports(MP4)
    ? 'Record the particle window as MP4 video, for the length set above'
    : 'This browser cannot record MP4 from a canvas';
  mp4Button.disabled = !supports(MP4);
  mp4Button.addEventListener('click', () => record(MP4, 'mp4'));

  webmButton.disabled = !supports(WEBM);

  row.append(webmButton, mp4Button);
  row.after(lengthRow);

  /*--- Export ---*/

  const exportSection = el('div', 'section');
  exportSection.appendChild(el('h2', '', 'Export'));

  const exportRow = el('div', 'buttons');
  exportSection.appendChild(exportRow);

  for (const [format, label, title] of [
    ['obj', '.obj', 'Download the target as a Wavefront .obj model'],
    ['ply', '.ply', 'Download the target as a Stanford .ply model']
  ]) {
    const button = el('button', '', label);
    button.type = 'button';
    button.title = title;
    button.addEventListener('click', () => {
      const api = engine();
      if (api && api.exportModel) api.exportModel(format);
    });
    exportRow.appendChild(button);
  }

  // The model note belongs with the model buttons, wherever they now live.
  const modelNote = Array.from(capture.querySelectorAll('.note')).find((note) =>
    /^the model is the chosen target/i.test(note.textContent.trim()));
  if (modelNote) {
    modelNote.hidden = false;

    // The panel's other notes sit behind their section's pill; this one gets the same treatment
    // where that card is in use (the particle window's panel), and stays plain where it is not.
    if (document.querySelector('#sections .info-card')) {
      const card = el('div', 'info-card');
      card.hidden = true;
      card.setAttribute('role', 'note');
      card.appendChild(modelNote);
      exportSection.appendChild(card);

      const pill = el('button', 'info-pill', 'i');
      pill.type = 'button';
      pill.title = 'What this section does';
      pill.setAttribute('aria-expanded', 'false');
      pill.addEventListener('click', () => {
        const opening = card.hidden;
        card.hidden = !opening;
        pill.classList.toggle('open', opening);
        pill.setAttribute('aria-expanded', opening ? 'true' : 'false');
      });
      exportSection.appendChild(pill);
    } else {
      exportSection.appendChild(modelNote);
    }
  }

  capture.after(exportSection);
})();
