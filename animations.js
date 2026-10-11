/**
 * MuddaCraft Studio - Animation Controller
 * Wires in:
 * 1. Lenis (Smooth Inertia Scrolling)
 * 2. GSAP & ScrollTrigger (Parallax, Section Reveals, Staggering)
 * 3. React Bits Inspired Elements (Ambient Floating Canvas, Spotlight Cards, Magnetic Buttons, Shiny Text)
 */

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initAmbientCanvas();
  initGSAPAnimations();
  initReactBitsInteractions();
});

// ==========================================================================
// 1. Lenis Smooth Scrolling
// ==========================================================================
let lenisInstance = null;

function initLenis() {
  if (typeof Lenis === 'undefined') {
    console.log('Lenis running in native fallback mode.');
    return;
  }

  lenisInstance = new Lenis({
    duration: 1.25,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
  });

  // Connect Lenis with GSAP ScrollTrigger if available
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenisInstance.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenisInstance.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  } else {
    // Standalone Lenis requestAnimationFrame loop
    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Smooth scroll for anchor navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        lenisInstance.scrollTo(targetElement, { offset: -80 });
      }
    });
  });
}

// ==========================================================================
// 2. React Bits: Ambient Organic Cane-Fiber Canvas Background
// ==========================================================================
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  });

  // Particles representing soft golden cane reeds & ambient sunlight flecks
  const particleCount = 28;
  const particles = [];
  const mouse = { x: -1000, y: -1000, radius: 120 };

  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1.2,
      length: Math.random() * 12 + 6,
      angle: Math.random() * Math.PI,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.3 - 0.15,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.4 ? 'rgba(212, 163, 115,' : 'rgba(184, 80, 40,'
    });
  }

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Mouse subtle repulsion
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        p.x -= (dx / dist) * force * 2;
        p.y -= (dy / dist) * force * 2;
      }

      // Draw elongated organic reed fiber
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.moveTo(-p.length / 2, 0);
      ctx.lineTo(p.length / 2, 0);
      ctx.strokeStyle = `${p.color} ${p.opacity})`;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    });

    requestAnimationFrame(renderParticles);
  }

  renderParticles();
}

// ==========================================================================
// 3. GSAP & ScrollTrigger Animations
// ==========================================================================
function initGSAPAnimations() {
  if (typeof gsap === 'undefined') return;

  // Hero Section Entrance Timeline
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });

  heroTL
    .from('.hero-tag', { opacity: 0, y: -20, delay: 0.1 })
    .from('.hero-title', { opacity: 0, y: 30, duration: 1.1 }, '-=0.6')
    .from('.hero-description', { opacity: 0, y: 20 }, '-=0.7')
    .from('.hero-actions .btn-primary, .hero-actions .btn-secondary', {
      opacity: 0,
      y: 20,
      stagger: 0.15
    }, '-=0.6')
    .from('.hero-image-wrapper', {
      opacity: 0,
      scale: 0.95,
      y: 40,
      duration: 1.2,
      ease: 'power2.out'
    }, '-=0.9');

  // Hero Card 3D Interactive Mouse Tilt
  const heroWrapper = document.querySelector('.hero-image-wrapper');
  const heroCard = document.querySelector('.hero-card');

  if (heroWrapper && heroCard) {
    heroWrapper.addEventListener('mousemove', (e) => {
      const rect = heroWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(heroCard, {
        rotationY: x * 0.04,
        rotationX: -y * 0.04,
        transformPerspective: 900,
        ease: 'power1.out',
        duration: 0.4
      });
    });

    heroWrapper.addEventListener('mouseleave', () => {
      gsap.to(heroCard, {
        rotationY: 0,
        rotationX: 0,
        ease: 'power2.out',
        duration: 0.8
      });
    });
  }

  // Value Proposition Features Stagger on Scroll
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.from('.feature-item', {
      scrollTrigger: {
        trigger: '.features-bar',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Story Steps Progressive Reveal
    gsap.utils.toArray('.step-card').forEach((step, index) => {
      gsap.from(step, {
        scrollTrigger: {
          trigger: step,
          start: 'top 88%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -30,
        duration: 0.7,
        delay: index * 0.1,
        ease: 'power2.out'
      });
    });
  }
}

// ==========================================================================
// 4. React Bits: Spotlight Cards & Magnetic Buttons
// ==========================================================================
function initReactBitsInteractions() {
  // A. Spotlight Effect on Product Cards (Tracks mouse coordinates inside card)
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // B. Magnetic Pull on Primary Action Buttons
  const magneticButtons = document.querySelectorAll('.btn-primary, .cart-button');

  magneticButtons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      if (typeof gsap !== 'undefined') {
        gsap.to(btn, {
          x: x * 0.25,
          y: y * 0.25,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)'
        });
      } else {
        btn.style.transform = 'translate(0px, 0px)';
      }
    });
  });

  // Make the hero brand headline feature React Bits Shiny Text
  const heroSpan = document.querySelector('.hero-title span');
  if (heroSpan) {
    heroSpan.classList.add('shiny-text');
  }
}
