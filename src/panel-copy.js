/*  Holographic Particle Accelerator — Copy
 *  Jackrabbit72380
 *  2026
 *
 *  The panel's wording, finished off from outside the files that write it. Two kinds of tidying:
 *
 *    — The Capture buttons are cut down to short labels, with the full wording in the tooltip,
 *      and gathered into one grid so the set takes two rows instead of four.
 *    — A handful of sentences and running messages are reworded, and the status line is kept in
 *      the same voice as the rest of the panel.
 *
 *  Everything else is already written in sentence case; it was the stylesheet's uppercase rule
 *  that shouted, and that has gone.
 */

(() => {
  'use strict';

  const sections = document.getElementById('sections');
  if (!sections) return;

  /*--- Capture: short labels, two rows ---*/

  const capture = Array.from(sections.querySelectorAll('.section')).find((node) => {
    const heading = node.querySelector('h2');
    return heading && heading.textContent === 'Capture';
  });

  if (capture) {
    const style = document.createElement('style');
    style.textContent = [
      '.capture-buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}',
      '.capture-buttons button{padding:7px 2px;font-size:11px;text-align:center;white-space:nowrap}'
    ].join('');
    document.head.appendChild(style);

    // One group of buttons rather than two lists, so the whole set fits in two rows.
    const groups = Array.from(capture.querySelectorAll('.buttons'));
    const grid = groups.shift();
    for (const group of groups) {
      for (const button of Array.from(group.querySelectorAll('button'))) grid.appendChild(button);
      group.remove();
    }
    grid.classList.add('capture-buttons');

    // Short labels, with the full wording kept as the tooltip.
    const SHORT = {
      'PNG frame': ['PNG', 'Save this frame as a PNG image'],
      'WebP frame': ['WebP', 'Save this frame as a WebP image'],
      'Record WebM 5s': ['WebM 5 s', 'Record five seconds as WebM video'],
      'WebM 10s': ['WebM 10 s', 'Record ten seconds as WebM video'],
      'Record MP4 8s': ['MP4', 'Record eight seconds as MP4, where the browser supports it'],
      'Model (.obj)': ['.obj', 'Download the target as a Wavefront .obj model'],
      'Model (.ply)': ['.ply', 'Download the target as a Stanford .ply model']
    };

    for (const button of grid.querySelectorAll('button')) {
      const label = button.textContent.trim();
      const entry = SHORT[label];
      if (!entry) continue;
      button.textContent = entry[0];
      button.title = entry[1];
    }
  }

  /*--- Wording ---*/

  // Exact substrings, as the panel writes them, and the reading that replaces them.
  const WORDING = [
    ['which axis that goes round', 'which axis it goes round'],
    ['Rebuild loop, off.', 'Rebuild loop, switched off.'],
    ['the `?nocaption` flag', 'the “?nocaption” flag'],
    ['Audio file plays locally', 'An audio file plays locally']
  ];

  const swap = (text) => WORDING.reduce((out, [from, to]) => out.split(from).join(to), text);

  const walker = document.createTreeWalker(sections, NodeFilter.SHOW_TEXT);
  const texts = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node);

  for (const node of texts) {
    const fixed = swap(node.nodeValue);
    if (fixed !== node.nodeValue) node.nodeValue = fixed;
  }

  /*--- The status line ---*/

  // Its messages are built with the numbers and letters the running app happens to have, so the
  // finished line is read back and put into words here.
  const statusEl = document.getElementById('status');
  if (statusEl) {
    const TIDY = [
      [/^turning about ([XYZ])$/, 'turning about the $1 axis'],
      [/^recording (\d+)s…$/, 'recording $1 s…']
    ];

    let writing = false;
    const tidy = () => {
      if (writing) return;
      const now = statusEl.textContent;
      let next = now;
      for (const [pattern, replacement] of TIDY) {
        if (pattern.test(next)) next = next.replace(pattern, replacement);
      }
      if (next === now) return;
      writing = true;
      statusEl.textContent = next;
      writing = false;
    };

    tidy();
    new MutationObserver(tidy).observe(statusEl, { childList: true, characterData: true, subtree: true });
  }
})();
