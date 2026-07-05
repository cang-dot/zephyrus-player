/**
 * Zephyrus Player Intro - Main Script
 * Blue theme · Splash Animation · Glitch Effects · Content Reveals
 */

(function() {
  'use strict';

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Frenzy Effects ---- */
  class FrenzyEffects {
    constructor() {
      this.container = null;
      this.active = false;
      this.to = null;
      this.init();
    }

    init() {
      this.container = document.createElement('div');
      this.container.className = 'frenzy-glitch';
      const s = document.createElement('div'); s.className = 'frenzy-scanlines';
      const r = document.createElement('div'); r.className = 'frenzy-rgb-shift';
      this.container.appendChild(s);
      this.container.appendChild(r);
      document.body.appendChild(this.container);

      let t;
      window.addEventListener('scroll', () => {
        this.activate();
        clearTimeout(t);
        t = setTimeout(() => this.deactivate(), 200);
      });
      setInterval(() => { if (this.active && Math.random() < 0.3) this.trigger(); }, 2500);
    }

    activate() { this.active = true; this.container.classList.add('active'); }
    deactivate() { this.active = false; this.container.classList.remove('active'); }

    trigger() {
      this.container.classList.add('glitching');
      clearTimeout(this.to);
      this.to = setTimeout(() => this.container.classList.remove('glitching'), 150);
    }
  }

  /* ---- Splash ---- */
  function initSplash() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined')
      return setTimeout(initSplash, 100);
    gsap.registerPlugin(ScrollTrigger);
    if (reducedMotion()) return;

    // Hiding the splash-viewport after full scroll
    const tl = gsap.timeline();

    // Entry
    tl.from('#spLeft', { x: '-100%', duration: 8, ease: 'none' });
    tl.from('#spRight', { x: '100%', y: '100%', duration: 8, ease: 'none' }, 0);
    tl.from('#spBottom', { y: '100%', duration: 7, ease: 'none' }, 0);
    tl.from('#spDivider', { scaleX: 0, duration: 6, ease: 'none' }, 3);
    tl.from('#spNameTop', { y: 40, autoAlpha: 0, duration: 7, ease: 'none' }, 4);
    tl.from('#spNameBottom', { y: -40, autoAlpha: 0, duration: 7, ease: 'none' }, 4);
    tl.to('#spLeftText', { autoAlpha: 1, duration: 4, ease: 'none' }, 6);

    // Hold
    tl.to({}, { duration: 10 });

    // Exit
    tl.to('#spNameTop', { y: 40, autoAlpha: 0, duration: 5, ease: 'none' });
    tl.to('#spNameBottom', { y: -40, autoAlpha: 0, duration: 5, ease: 'none' }, '<');
    tl.to('#spDivider', { scaleX: 0, duration: 4, ease: 'none' }, '<');
    tl.to('#spLeftText', { autoAlpha: 0, duration: 3, ease: 'none' }, '<');

    // Fill
    tl.to('#spLeft', { width: '50vw', duration: 7, ease: 'none' });
    tl.to('#spRight', { width: '50vw', x: '-50vw', duration: 7, ease: 'none' }, '<');
    tl.to('#spBottom', { height: '100vh', duration: 7, ease: 'none' }, '<');
    tl.to('#spExitL', { scaleX: 1, duration: 6, ease: 'none' }, '<');
    tl.to('#spExitR', { scaleX: 1, duration: 6, ease: 'none' }, '<');
    tl.to('#spFade', { opacity: 1, duration: 4, ease: 'none' }, '-=3');

    // Hide viewport after fade
    tl.to('#splashViewport', { autoAlpha: 0, duration: 0.5, ease: 'none' }, '-=0.5');

    ScrollTrigger.create({
      trigger: '#splashStage',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      animation: tl
    });

    autoScrollToEntry();
  }

  function autoScrollToEntry() {
    const hint = document.getElementById('scrollHint');
    if (!hint) return;

    let cancelled = false;
    const target = window.innerHeight;

    const onScroll = () => {
      if (!cancelled && window.scrollY > target + 30) {
        cancelled = true;
        hint.classList.remove('hidden');
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    setTimeout(() => {
      if (cancelled) return;
      window.scrollTo({ top: target, behavior: 'smooth' });
    }, 400);

    setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      hint.classList.remove('hidden');
      window.removeEventListener('scroll', onScroll);
    }, 2000);
  }

  /* ---- Content Reveals ---- */
  function initContent() {
    if (reducedMotion()) return;

    gsap.set('.hero-badge, .hero h1, .hero-desc, .hero-actions', { opacity: 0, y: 30 });

    const hero = gsap.timeline({
      scrollTrigger: { trigger: '#hero', start: 'top 80%', once: true }
    });
    hero.to('.hero-badge', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    hero.to('.hero h1', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.08);
    hero.to('.hero-desc', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.18);
    hero.to('.hero-actions', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.3);

    gsap.set('.feature-card', { opacity: 0, y: 50 });
    gsap.to('.feature-card', {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: '.features-grid', start: 'top 85%', once: true }
    });

    gsap.set('.hscroll-card', { opacity: 0, y: 40 });
    gsap.to('.hscroll-card', {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '#hscrollSection', start: 'top 75%', once: true }
    });

    gsap.set('.tech-visual', { opacity: 0, x: -60 });
    gsap.to('.tech-visual', {
      opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#tech', start: 'top 75%', once: true }
    });

    gsap.set('.tech-content', { opacity: 0, x: 60 });
    gsap.to('.tech-content', {
      opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#tech', start: 'top 75%', once: true }
    });

    gsap.set('.metric', { opacity: 0, y: 28 });
    gsap.to('.metric', {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '#metrics', start: 'top 85%', once: true }
    });

    gsap.set('.style-card', { opacity: 0, y: 36 });
    gsap.to('.style-card', {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.styles-grid', start: 'top 85%', once: true }
    });

    gsap.set('.cta h2, .cta p, .cta .btn', { opacity: 0, y: 20 });
    const cta = gsap.timeline({
      scrollTrigger: { trigger: '#finalCta', start: 'top 80%', once: true }
    });
    cta.to('.cta h2', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' });
    cta.to('.cta p', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.12);
    cta.to('.cta .btn', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.28);
  }

  /* ---- Horizontal Scroll ---- */
  function initHScroll() {
    const track = document.getElementById('hscrollTrack');
    if (!track) return;
    const w = track.scrollWidth - window.innerWidth + 200;
    gsap.set(track.querySelectorAll('.hscroll-card'), { opacity: 1, y: 0 });
    gsap.to(track, {
      x: -w, ease: 'none',
      scrollTrigger: { trigger: '#hscrollSection', start: 'top 65%', end: `+=${w}`, scrub: 1, pin: true, anticipatePin: 1 }
    });
  }

  /* ---- Boot ---- */
  async function boot() {
    await new Promise(r => {
      const c = () => { if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') r(); else setTimeout(c, 50); };
      c();
    });
    gsap.registerPlugin(ScrollTrigger);

    const fx = new FrenzyEffects();
    initSplash();
    initContent();
    initHScroll();

    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('mouseenter', () => gsap.to(card, { scale: 1.02, duration: 0.3 }));
      card.addEventListener('mouseleave', () => gsap.to(card, { scale: 1, duration: 0.3 }));
      card.addEventListener('click', () => fx && fx.trigger());
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
