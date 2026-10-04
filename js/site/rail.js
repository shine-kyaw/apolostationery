/* ==========================================================================
   APOLO — rails
   A horizontal shelf is plain native scrolling with scroll-snap: touch,
   trackpad and shift-wheel all just work. The arrow buttons only page it and
   grey themselves out at either end.
   ========================================================================== */

import { ICON } from './chrome.js';

export function wireRails(root = document) {
  for (const ctl of root.querySelectorAll('.rail-ctl:not([data-wired])')) {
    const rail = document.getElementById(ctl.dataset.for);
    if (!rail) continue;
    ctl.dataset.wired = '';
    const [prev, next] = ctl.querySelectorAll('[data-dir]');
    prev.innerHTML = ICON.arrow; next.innerHTML = ICON.arrow;

    const step = () => Math.max(240, rail.clientWidth * 0.8);
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
      ctl.hidden = max <= 0;
    };
    ctl.addEventListener('click', e => {
      const b = e.target.closest('[data-dir]'); if (!b) return;
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      rail.scrollBy({ left: step() * +b.dataset.dir, behavior: smooth ? 'smooth' : 'auto' });
    });
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update, { passive: true });
    new ResizeObserver(update).observe(rail);
    update();
  }
}
