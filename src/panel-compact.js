/*  Holographic Particle Accelerator — Panel
 *  Jackrabbit72380
 *  2026
 *
 *  Keeps the control panel readable: the long notes of a section become one small "i" pill level
 *  with its heading, and the text itself opens in a card at that pill — never in the panel, where
 *  it used to push the controls about and sit under the buttons. It also takes the Equalizer ring
 *  button off the Visualizer section, because the same target already sits in the Target list as
 *  Equalizer (audio bars) — one way in is enough.
 */

(() => {
  'use strict';

  const sections = document.getElementById('sections');
  if (!sections) return;

  const style = document.createElement('style');
  style.textContent = [
    '.section{position:relative}',
    '.info-pill{position:absolute;top:9px;right:2px;width:18px;height:18px;margin:0;padding:0;',
    'border-radius:50%;border:1px solid rgba(143,216,255,.45);background:transparent;color:inherit;',
    'font:600 11px/1 system-ui,sans-serif;cursor:pointer;opacity:.7;z-index:2}',
    '.info-pill:hover,.info-pill.open{opacity:1;border-color:#8fd8ff}',
    '.section h2{padding-right:22px}',
    '.info-card{position:absolute;top:30px;right:0;z-index:30;width:min(320px,100%);max-height:56vh;',
    'overflow-y:auto;background:#0e1620;border:1px solid #26405a;border-radius:8px;padding:10px 12px;',
    'box-shadow:0 18px 40px rgba(0,0,0,.6);text-align:left}',
    '.info-card[hidden]{display:none!important}',
    '.info-card .note{margin:0 0 8px;font-size:11.5px;line-height:1.5}',
    '.info-card .note:last-child{margin-bottom:0}'
  ].join('');
  document.head.appendChild(style);

  /*--- One way into the audio ring ---*/

  const ring = Array.from(sections.querySelectorAll('button')).find(
    (button) => /^equalizer ring$/i.test(button.textContent.trim())
  );

  if (ring) {
    const section = ring.closest('.section');
    ring.remove();

    const title = section && section.querySelector('h2');
    if (title && title.textContent.trim() === 'Visualizer') title.textContent = 'Band height';

    const note = section && section.querySelector('.note');
    if (note) {
      note.textContent = 'How far the audio lifts each point — one setting for the target and the background layer. Equalizer and Grid are in the Target list.';
    }
  }

  /*--- The notes live in the pill ---*/

  // A section can hold several notes, and the heading has room for one pill, so they share it.
  const bySection = new Map();
  for (const note of sections.querySelectorAll('.note')) {
    const section = note.closest('.section');
    if (!section) continue;
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push(note);
  }

  let opened = null;

  function closeCard() {
    if (!opened) return;
    opened.card.hidden = true;
    opened.pill.classList.remove('open');
    opened.pill.setAttribute('aria-expanded', 'false');
    opened = null;
  }

  document.addEventListener('click', (event) => {
    if (!opened) return;
    if (opened.card.contains(event.target) || opened.pill.contains(event.target)) return;
    closeCard();
  }, true);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCard();
  });

  for (const [section, notes] of bySection) {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.hidden = true;
    card.setAttribute('role', 'note');

    // The notes move into the card rather than being copied, so text the panel rewrites later —
    // the Show section's description of the running mode, for one — stays current.
    for (const note of notes) {
      card.appendChild(note);
      note.hidden = false;
    }
    section.appendChild(card);

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'info-pill';
    pill.textContent = 'i';
    pill.title = 'What this section does';
    pill.setAttribute('aria-expanded', 'false');
    section.appendChild(pill);

    const entry = { pill, card };
    pill.addEventListener('click', () => {
      const wasOpen = opened === entry;
      closeCard();
      if (wasOpen) return;
      card.hidden = false;
      pill.classList.add('open');
      pill.setAttribute('aria-expanded', 'true');
      opened = entry;
    });
  }
})();
