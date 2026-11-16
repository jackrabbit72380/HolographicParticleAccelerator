/*  Holographic Particle Accelerator — the guide window's own notes
 *  Jackrabbit72380
 *  2026
 *
 *  src/panel-compact.js puts every note of the control panel behind its section's "i" pill. The
 *  guide window has one section of its own above that panel — Particle window, with Open, Bring to
 *  front and Close — and its note was still a paragraph sitting under the buttons, which is the
 *  clutter the pill exists to keep out.
 *
 *  This gives any section outside the panel the same treatment: the note goes in a card, the card
 *  opens from a pill beside the heading, and nothing is left lying about under the controls. The
 *  pill and card styles are panel-compact.js's, which this page loads first.
 */

(() => {
  'use strict';

  const sections = Array.from(document.querySelectorAll('.section'));
  if (!sections.length) return;

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

  for (const section of sections) {
    // The control panel's sections have their pills already.
    if (section.closest('#sections')) continue;
    if (section.querySelector('.info-pill')) continue;

    const notes = Array.from(section.querySelectorAll('.note')).filter((note) => !note.closest('.info-card'));
    if (!notes.length) continue;

    const card = document.createElement('div');
    card.className = 'info-card';
    card.hidden = true;
    card.setAttribute('role', 'note');

    // The notes move into the card rather than being copied, so text that changes later — the
    // connection line, for one — stays current.
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
