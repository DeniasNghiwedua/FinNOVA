/* Original vanilla-JS motion, inspired by 21st.dev's Number Ticker pattern. */
'use strict';
window.finovaMotion = (() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const values = new Map();
  let observer, animations = [], lastRoute, lastWorkspace;
  const ease = t => 1 - Math.pow(1 - t, 3);

  function enhance(root, route, workspace) {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations = [];
    if (workspace !== lastWorkspace) { values.clear(); lastWorkspace = workspace; }
    const changedRoute = route !== lastRoute;
    lastRoute = route;
    if (preference.matches || !Element.prototype.animate) return;

    const play = (node, frames, options = {}) => {
      const animation = node.animate(frames, {
        duration: 550, easing: 'cubic-bezier(.22,1,.36,1)', ...options
      });
      animations.push(animation);
    };
    // Keep the real amount available to assistive technology throughout the tween.
    root.querySelectorAll('.stat-card strong').forEach(node => {
      const finalText = node.textContent;
      const match = finalText.match(/^(.*?)([\d,]+(?:\.\d+)?)(%?)$/);
      if (!match) return;
      const target = Number(match[2].replaceAll(',', ''));
      if (!Number.isFinite(target)) return;
      const key = route + ':' + node.closest('.stat-card').querySelector('small').textContent;
      const previous = values.get(key) ?? 0;
      values.set(key, target);
      if (previous === target) return;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      node.setAttribute('aria-label', finalText);
      node.replaceChildren(visual);
      const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;
      const formatter = new Intl.NumberFormat('en-NA', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      });
      let started, frame;
      const finish = () => { cancelAnimationFrame(frame); node.textContent = finalText; };
      animations.push({ cancel: finish });
      function tick(now) {
        if (!node.isConnected || preference.matches) { finish(); return; }
        started ??= now;
        const progress = Math.min(1, (now - started) / 700);
        visual.textContent = match[1] + formatter.format(previous + (target - previous) * ease(progress)) + match[3];
        if (progress < 1) frame = requestAnimationFrame(tick);
        else finish();
      }
      visual.textContent = finalText;
      frame = requestAnimationFrame(tick);
    });

    // Reveal on navigation only; typing and opening dialogs should leave cards still.
    if (changedRoute) {
      const selectors = '.hero > .pill, .hero > h1, .hero > .lead, .hero-actions, .hero-preview, .inner-hero, .section-head, .feature-card, .step, .cta, .about-card, .page-intro, .stat-card, .chart-grid > .panel, .manage-card';
      const nodes = [...root.querySelectorAll(selectors)];
      const reveal = node => {
        play(node, [{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }], {
          delay: Math.min(nodes.indexOf(node) % 6 * 65, 260), fill: 'backwards'
        });
      };
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
          });
        }, { threshold: 0.08 });
        nodes.forEach(node => observer.observe(node));
      } else nodes.forEach(reveal);
      root.querySelectorAll('.bar-chart .bar, .preview-bars span, .budget-track > *, .feature-illustration i').forEach((node, i) => {
        play(node, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { delay: i % 12 * 35, duration: 650 });
      });
    }
    root.querySelectorAll('.modal, .auth-panel, .palette-box, .onboarding-panel').forEach(node => {
      play(node, [{ opacity: 0, translate: '0 12px', scale: '.98' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 240 });
    });
  }
  preference.addEventListener('change', () => {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations = [];
  });
  return { enhance };
})();
