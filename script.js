/* ═══════════════════════════════════════════════════════════════════
   RANJEET SINGH — PORTFOLIO JAVASCRIPT
   Preloader · Cursor · Nav · Scroll Animations · Parallax · Interactions
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ────────────────────────────────────────────────────────────────────
   PRELOADER
   ──────────────────────────────────────────────────────────────────── */
(function initPreloader() {
  const preloader   = document.getElementById('preloader');
  const countEl     = document.getElementById('preloader-count');
  const fillEl      = document.getElementById('preloader-fill');

  if (!preloader || !countEl || !fillEl) return;

  let current = 0;
  const duration = 1800; // ms
  const steps    = 60;
  const interval = duration / steps;

  const timer = setInterval(() => {
    current = Math.min(current + Math.ceil(100 / steps), 100);
    countEl.textContent        = current;
    fillEl.style.width         = current + '%';

    if (current >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.add('loaded');
        // trigger hero animations after load
        triggerHeroAnimations();
      }, 300);
    }
  }, interval);
})();

/* ────────────────────────────────────────────────────────────────────
   HERO CANVAS — 3D Neural Network Sphere
   ──────────────────────────────────────────────────────────────────── */
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const ACCENT      = '#C8FF00';
  const WHITE       = 'rgba(240,237,232,';
  
  let W, H;
  let particles = [];
  let animId;
  
  // 3D Rotation angles
  let rx = 0;
  let ry = 0;
  
  // Mouse interaction
  let mouse = { x: -999, y: -999, active: false };
  let targetRx = 0;
  let targetRy = 0;

  /* ── Resize ── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width  * devicePixelRatio;
    H = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    initParticles();
  }

  /* ── Particle factory (3D Sphere Distribution) ── */
  function initParticles() {
    particles = [];
    const count = 150; // number of nodes
    const radius = Math.min(W / devicePixelRatio, H / devicePixelRatio) * 0.35; // sphere radius
    
    // Fibonacci sphere distribution for even spacing
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; 
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      
      particles.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        ox: x * radius,
        oy: y * radius,
        oz: z * radius,
        r: Math.random() * 1.5 + 1,
        isAccent: Math.random() < 0.08,
        connections: [] // calculated dynamically
      });
    }
  }

  /* ── Draw ── */
  function draw() {
    const rw = W / devicePixelRatio;
    const rh = H / devicePixelRatio;
    const cx = rw / 2;
    const cy = rh / 2;

    ctx.clearRect(0, 0, rw, rh);

    // Auto-rotation + Mouse tilt
    if (!mouse.active) {
      targetRx += 0.002;
      targetRy += 0.003;
    }
    
    rx += (targetRx - rx) * 0.1;
    ry += (targetRy - ry) * 0.1;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);

    // Project 3D to 2D
    const projected = particles.map(p => {
      // Rotate Y
      let x1 = p.x * cosY - p.z * sinY;
      let z1 = p.z * cosY + p.x * sinY;
      // Rotate X
      let y2 = p.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + p.y * sinX;
      
      // Perspective
      const perspective = 400;
      const scale = perspective / (perspective + z2);
      
      return {
        ...p,
        px: cx + x1 * scale,
        py: cy + y2 * scale,
        scale: scale,
        z2: z2
      };
    });

    // Sort by Z index for proper depth drawing (back to front)
    projected.sort((a, b) => b.z2 - a.z2);

    // Draw Connections
    const MAX_DIST = 70;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const a = projected[i];
        const b = projected[j];
        
        // Only connect nodes close in 3D space
        const dx = a.ox - b.ox;
        const dy = a.oy - b.oy;
        const dz = a.oz - b.oz;
        const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist3D < MAX_DIST) {
          // Fade lines in the back
          const avgZ = (a.z2 + b.z2) / 2;
          const depthFade = Math.max(0.1, 1 - (avgZ + 200) / 400); 
          const useAccent = a.isAccent || b.isAccent;
          
          ctx.strokeStyle = useAccent
            ? `rgba(200,255,0,${depthFade * 0.5})`
            : `rgba(240,237,232,${depthFade * 0.15})`;
          ctx.lineWidth = 0.8 * ((a.scale + b.scale) / 2);
          
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }
      }
    }

    // Draw Nodes
    projected.forEach(p => {
      const depthFade = Math.max(0.2, 1 - (p.z2 + 200) / 400);
      
      ctx.beginPath();
      ctx.arc(p.px, p.py, Math.max(0.5, p.r * p.scale), 0, Math.PI * 2);
      if (p.isAccent) {
        ctx.fillStyle = ACCENT;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 10 * p.scale;
      } else {
        ctx.fillStyle = WHITE + depthFade + ')';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    animId = requestAnimationFrame(draw);
  }

  /* ── Mouse events ── */
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    
    // Tilt the sphere based on mouse position relative to center
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    targetRy = ((mouse.x - cx) / cx) * Math.PI; // -PI to PI
    targetRx = ((mouse.y - cy) / cy) * Math.PI * 0.5;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  /* ── Touch events ── */
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.active = true;
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    targetRy = ((mouse.x - cx) / cx) * Math.PI;
    targetRx = ((mouse.y - cy) / cy) * Math.PI * 0.5;
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    mouse.active = false;
  });

  /* ── Pause when off-screen (perf) ── */
  const visObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (!animId) draw();
      } else {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });
  }, { threshold: 0.1 });
  visObserver.observe(canvas);

  /* ── Init ── */
  resize();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animId);
      animId = null;
      resize();
      draw();
    }, 200);
  }, { passive: true });
})();


function triggerHeroAnimations() {
  // Reveal words with stagger
  document.querySelectorAll('.word[data-delay]').forEach(el => {
    const delay = parseInt(el.dataset.delay, 10) || 0;
    setTimeout(() => el.classList.add('visible'), delay);
  });

  // Reveal clip elements
  document.querySelectorAll('.reveal-clip[data-delay]').forEach(el => {
    const delay = parseInt(el.dataset.delay, 10) || 0;
    setTimeout(() => el.classList.add('visible'), delay);
  });
}

/* ────────────────────────────────────────────────────────────────────
   CUSTOM CURSOR (desktop only)
   ──────────────────────────────────────────────────────────────────── */
(function initCursor() {
  // Only on true pointer devices
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor     = document.getElementById('cursor');
  const dot        = cursor?.querySelector('.cursor__dot');
  const ring       = cursor?.querySelector('.cursor__ring');
  if (!cursor || !dot || !ring) return;

  let dotX = 0, dotY = 0;
  let ringX = 0, ringY = 0;
  let mouseX = 0, mouseY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dotX   = mouseX;
    dotY   = mouseY;
  });

  function animateCursor() {
    // Ring lags slightly behind
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    dot.style.transform  = `translate(calc(${dotX}px - 50%), calc(${dotY}px - 50%))`;
    ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;

    rafId = requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Cursor states on hoverable elements
  const hoverEls = document.querySelectorAll('a, button, .magnetic, .project-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover', 'cursor--magnetic'));
  });

  const magneticEls = document.querySelectorAll('.magnetic');
  magneticEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('cursor--magnetic');
      cursor.classList.remove('cursor--hover');
    });
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--magnetic'));
  });
})();

/* ────────────────────────────────────────────────────────────────────
   MAGNETIC BUTTON EFFECT (desktop only)
   ──────────────────────────────────────────────────────────────────── */
(function initMagnetic() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect    = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top  + rect.height / 2;
      const distX   = (e.clientX - centerX) * 0.35;
      const distY   = (e.clientY - centerY) * 0.35;
      btn.style.transform = `translate(${distX}px, ${distY}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ────────────────────────────────────────────────────────────────────
   NAVIGATION — scroll state + active link + mobile menu
   ──────────────────────────────────────────────────────────────────── */
(function initNav() {
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const overlay    = document.getElementById('mobile-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const navLinks    = document.querySelectorAll('.nav__link');
  const sections    = document.querySelectorAll('section[id]');

  // Scroll state
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink();
  }, { passive: true });

  // Active nav link based on scroll
  function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
      const top    = sec.offsetTop - 120;
      const bottom = top + sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bottom) {
        current = sec.id;
      }
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  // Mobile menu toggle
  function openMenu() {
    mobileMenu?.classList.add('open');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  overlay?.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ESC key closes menu
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

/* ────────────────────────────────────────────────────────────────────
   SCROLL ANIMATIONS — IntersectionObserver
   ──────────────────────────────────────────────────────────────────── */
(function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el    = entry.target;
      const delay = parseInt(el.dataset.delay, 10) || 0;

      setTimeout(() => {
        el.classList.add('visible');
      }, delay);

      observer.unobserve(el);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  // Observe all animated elements
  document.querySelectorAll(
    '.anim-fade-up, .anim-project, .reveal-clip:not(.hero__eyebrow):not(.hero__role):not(.hero__cta)'
  ).forEach(el => observer.observe(el));

  // Separate observer for project cards (slightly different threshold)
  const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay, 10) || 0;
      setTimeout(() => el.classList.add('visible'), delay);
      projectObserver.unobserve(el);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.anim-project').forEach(el => projectObserver.observe(el));
})();

/* ────────────────────────────────────────────────────────────────────
   STAT COUNTER ANIMATION
   ──────────────────────────────────────────────────────────────────── */
(function initCounters() {
  const statEls = document.querySelectorAll('.stat__number[data-count]');
  if (!statEls.length) return;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const dur    = 1500;
      const step   = 16;
      const inc    = target / (dur / step);
      let current  = 0;

      const timer = setInterval(() => {
        current += inc;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, step);

      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => counterObserver.observe(el));
})();

/* ────────────────────────────────────────────────────────────────────
   SKILL BAR ANIMATION
   ──────────────────────────────────────────────────────────────────── */
(function initSkillBars() {
  const fills = document.querySelectorAll('.skill-bar__fill[data-width]');
  if (!fills.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const fill  = entry.target;
      const width = fill.dataset.width;
      // Small delay for visual effect
      setTimeout(() => {
        fill.style.width = width + '%';
      }, 200);
      observer.unobserve(fill);
    });
  }, { threshold: 0.5 });

  fills.forEach(f => observer.observe(f));
})();

/* ────────────────────────────────────────────────────────────────────
   ROLE CYCLER
   ──────────────────────────────────────────────────────────────────── */
(function initRoleCycler() {
  const items = document.querySelectorAll('.role__item');
  if (items.length < 2) return;

  let current = 0;

  // Set initial widths by finding the longest item
  let maxWidth = 0;
  const cycler = document.querySelector('.role__cycler');

  items.forEach(item => {
    item.style.position = 'absolute';
    item.style.top = '0';
    item.style.left = '0';
  });

  // Start first item visible
  items[0].classList.add('active');
  items[0].style.position = 'relative';

  setInterval(() => {
    const oldItem = items[current];
    current = (current + 1) % items.length;
    const newItem = items[current];

    // Exit old
    oldItem.classList.remove('active');
    oldItem.classList.add('exit');
    oldItem.style.position = 'absolute';

    // Enter new
    newItem.style.position = 'relative';
    newItem.classList.add('active');

    setTimeout(() => {
      oldItem.classList.remove('exit');
    }, 700);

  }, 2800);
})();

/* ────────────────────────────────────────────────────────────────────
   PARALLAX — hero shapes on scroll (reduced on mobile)
   ──────────────────────────────────────────────────────────────────── */
(function initParallax() {
  const shape1 = document.getElementById('shape1');
  const shape2 = document.getElementById('shape2');
  const shape3 = document.getElementById('shape3');

  if (!shape1) return;

  const isMobile  = () => window.innerWidth <= 768;
  const factor    = () => isMobile() ? 0.03 : 0.06;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const sy = window.scrollY;
      const f  = factor();
      if (shape1) shape1.style.transform = `translateY(${sy * f}px)`;
      if (shape2) shape2.style.transform = `translateY(${sy * f * -1.2}px)`;
      if (shape3) shape3.style.transform = `translateY(${sy * f * 0.8}px)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();

/* ────────────────────────────────────────────────────────────────────
   SMOOTH ANCHOR SCROLL
   ──────────────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ────────────────────────────────────────────────────────────────────
   WHATSAPP FLOATING CTA — Pulse + Tooltip
   ──────────────────────────────────────────────────────────────────── */
(function initWhatsApp() {
  const btn = document.getElementById('wa-float');
  if (!btn) return;

  // Show after a short delay so it doesn't fight the preloader
  setTimeout(() => {
    btn.classList.add('wa-visible');
  }, 2500);

  // Hide on scroll down, show on scroll up
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > lastScroll && current > 300) {
      btn.classList.add('wa-hidden');
    } else {
      btn.classList.remove('wa-hidden');
    }
    lastScroll = current;
  }, { passive: true });
})();

/* ────────────────────────────────────────────────────────────────────
   PROJECT CARD TILT — subtle 3D hover (desktop)
   ──────────────────────────────────────────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotX   = ((y - centerY) / centerY) * -3;
      const rotY   = ((x - centerX) / centerX) *  3;
      card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ────────────────────────────────────────────────────────────────────
   3D IMAGE MOUSE / TOUCH INTERACTION
   ──────────────────────────────────────────────────────────────────── */
(function init3DIconInteraction() {
  if (window.matchMedia('(hover: none)').matches) return; // skip on touch-only

  document.querySelectorAll('.project-card').forEach(card => {
    const iconContainer = card.querySelector('.proj-3d-img-container');
    if (!iconContainer) return;

    let rafId;
    let currentRX = 0, currentRY = 0;
    let targetRX  = 0, targetRY  = 0;
    let isHovered = false;

    card.addEventListener('mouseenter', () => {
      isHovered = true;
      iconContainer.style.animationPlayState = 'paused';
      animateToMouse();
    });

    card.addEventListener('mousemove', (e) => {
      if (!isHovered) return;
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2); // -1 → 1
      const dy     = (e.clientY - cy) / (rect.height / 2); // -1 → 1
      
      // Tilt up/down and left/right
      targetRX = dy * -15;  
      targetRY = dx * 15;  
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      cancelAnimationFrame(rafId);
      // Restore CSS animation smoothly
      iconContainer.style.transform = '';
      iconContainer.style.animationPlayState = 'running';
    });

    function animateToMouse() {
      if (!isHovered) return;
      currentRX += (targetRX - currentRX) * 0.1;
      currentRY += (targetRY - currentRY) * 0.1;
      iconContainer.style.transform = `perspective(500px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(1.1)`;
      rafId = requestAnimationFrame(animateToMouse);
    }
  });
})();

(function initSectionProgress() {
  const sections = document.querySelectorAll('section[id]');
  const dots     = document.querySelectorAll('.progress-dot');

  if (!dots.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id  = entry.target.id;
        dots.forEach(d => d.classList.toggle('active', d.dataset.section === id));
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => observer.observe(s));
})();
