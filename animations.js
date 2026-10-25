/**
 * MuddaCraft Studio - Purposeful GSAP & Motion Design
 * Built using official GreenSock best practices:
 * - GPU-accelerated transforms (y, opacity, scale)
 * - prefers-reduced-motion safety
 * - Minimal, high-craft scroll reveals without layout thrashing
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if GSAP is available
  if (typeof gsap === 'undefined') return;

  // Respect prefers-reduced-motion
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // 1. Subtle Hero Entrance Timeline
    const heroTl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });

    heroTl
      .from(".hero-tag", { y: -12, opacity: 0, duration: 0.5 })
      .from(".hero-title", { y: 20, opacity: 0, duration: 0.9 }, "-=0.3")
      .from(".hero-subtitle", { y: 15, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(".hero-actions", { y: 15, opacity: 0, duration: 0.6 }, "-=0.4")
      .from(".hero-illustration-frame, .hero-image-card", { scale: 0.97, opacity: 0, duration: 1 }, "-=0.8");


    // 2. ScrollTrigger reveals for key content blocks
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Section titles reveal
      gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
          scrollTrigger: {
            trigger: header,
            start: "top 85%",
            toggleActions: "play none none none"
          },
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out"
        });
      });

      // Product cards batch animation
      ScrollTrigger.batch('.product-card', {
        start: "top 90%",
        onEnter: batch => {
          gsap.from(batch, {
            y: 30,
            opacity: 0,
            stagger: 0.12,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto"
          });
        }
      });

      // Why Mudha cards stagger
      gsap.from('.why-card', {
        scrollTrigger: {
          trigger: '.why-grid',
          start: "top 85%",
          toggleActions: "play none none none"
        },
        y: 25,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: "power2.out"
      });

      // Craftsmanship split section
      gsap.from('.craft-image-frame', {
        scrollTrigger: {
          trigger: '.craft-grid',
          start: "top 80%",
          toggleActions: "play none none none"
        },
        x: -25,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      });

      gsap.from('.craft-content', {
        scrollTrigger: {
          trigger: '.craft-grid',
          start: "top 80%",
          toggleActions: "play none none none"
        },
        x: 25,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      });

      // Bulk B2B card reveal
      gsap.from('.bulk-form-card', {
        scrollTrigger: {
          trigger: '.bulk-section',
          start: "top 75%",
          toggleActions: "play none none none"
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out"
      });
    }
  });

  // Micro-interaction on add-to-cart clicks
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-quick-add') || e.target.closest('.btn-add-modal')) {
      const badge = document.querySelector('.cart-count');
      if (badge && typeof gsap !== 'undefined') {
        gsap.fromTo(badge, 
          { scale: 1.4 }, 
          { scale: 1, duration: 0.35, ease: "back.out(2)" }
        );
      }
    }
  });
});
