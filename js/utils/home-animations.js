function animateCount(element) {
  const target = Number(element.dataset.countTarget);
  const suffix = element.dataset.countSuffix || '';
  if (!Number.isFinite(target)) return;

  const formatter = new Intl.NumberFormat('en-US');
  const duration = 1300;
  const startTime = performance.now();
  element.textContent = `0${suffix}`;

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = 1 - ((1 - progress) ** 4);
    element.textContent = `${formatter.format(Math.round(target * easedProgress))}${suffix}`;
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function initStatisticCounters() {
  const statsSection = document.querySelector('#statistics-strip');
  const counters = [...document.querySelectorAll('[data-count-target]')];
  if (!statsSection || !counters.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    counters.forEach(animateCount);
    observer.disconnect();
  }, { threshold: 0.35 });

  observer.observe(statsSection);
}

function initHeroTilt() {
  const visual = document.querySelector('[data-hero-parallax]');
  const card = visual?.querySelector('.home-hero-card');
  if (!visual || !card || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let frameId = 0;
  let nextTransform = '';

  visual.addEventListener('pointermove', (event) => {
    const bounds = visual.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    nextTransform = `perspective(850px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;

    if (!frameId) {
      frameId = requestAnimationFrame(() => {
        card.style.transform = nextTransform;
        frameId = 0;
      });
    }
  });

  visual.addEventListener('pointerleave', () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    card.style.transform = 'perspective(850px) rotateX(0deg) rotateY(0deg)';
  });
}

export function initHomeAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initStatisticCounters();
  initHeroTilt();
}
