const revealSelector = 'main section, .course-card, [data-scroll-reveal]';

export function initRevealAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  const prepare = (root) => {
    if (root instanceof Element && root.matches(revealSelector)) {
      root.classList.add('motion-reveal');
      observer.observe(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll(revealSelector).forEach((element) => {
        element.classList.add('motion-reveal');
        observer.observe(element);
      });
    }
  };

  document.querySelectorAll('#categories .grid > a, #about .grid > div, #statistics-strip .grid > div')
    .forEach((element) => element.setAttribute('data-scroll-reveal', ''));
  prepare(document);

  const contentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) prepare(node);
      });
    });
  });
  contentObserver.observe(document.body, { childList: true, subtree: true });
}
