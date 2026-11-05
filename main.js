const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (window.gsap && !reducedMotion.matches) {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-brand-top', { autoAlpha: 0, y: 12, duration: .55 })
    .from('.hero-logo-mark', { autoAlpha: 0, x: -24, duration: .85 }, '-=.23')
    .from('.hero-glyph', { autoAlpha: 0, y: 18, duration: .82, stagger: .09, clearProps: 'transform,opacity,visibility' }, '-=.62')
    .from('.hero-signal', { scaleX: 0, transformOrigin: 'left center', duration: .78, clearProps: 'transform' }, '-=.54')
    .from('.hero-acronym-item', { autoAlpha: 0, y: 14, duration: .58, stagger: .075, clearProps: 'transform,opacity,visibility' }, '-=.41')
    .from('.hero-brand-bottom', { autoAlpha: 0, y: 12, duration: .6, clearProps: 'transform,opacity,visibility' }, '-=.29');

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.reveal').forEach((element) => {
      gsap.from(element, { scrollTrigger: { trigger: element, start: 'top 90%', once: true }, opacity: 0, y: 26, duration: .7, ease: 'power3.out' });
    });
  }
}
