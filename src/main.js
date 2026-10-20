/* ==========================================================================
   KƏPƏZ BOKT — Interactive Main Controller
   Vite + Lenis + GSAP ScrollTrigger + 2K Canvas Frame Sequencer
   ========================================================================== */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==========================================================================
// 1. Lenis Smooth Scrolling Setup
// ==========================================================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1.0,
  touchMultiplier: 2.0,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.lenis = lenis;

// ==========================================================================
// 2. HTML5 Canvas Native 2K Frame Sequencer (2560x1440 Crystal Sharp)
// ==========================================================================
const TOTAL_FRAMES = 181;
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderPercent = document.getElementById('preloader-percent');

const images = [];
const frameProxy = { frame: 0 };
let imagesLoaded = 0;
let isFirstFrameReady = false;

function getFrameUrl(index) {
  const paddedIndex = String(index + 1).padStart(4, '0');
  return `/frames/frame_${paddedIndex}.webp`;
}

// Canvas sizing with DevicePixelRatio for razor-sharp Retina/4K rendering
function resizeCanvas() {
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  renderCurrentFrame();
}

window.addEventListener('resize', resizeCanvas);

// Render image on canvas with exact cover scaling at native resolution
function renderCurrentFrame() {
  const currentImg = images[Math.round(frameProxy.frame)];
  if (!currentImg || !currentImg.complete) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const cw = canvas.width;
  const ch = canvas.height;

  const imgW = currentImg.naturalWidth || 3840;
  const imgH = currentImg.naturalHeight || 2160;

  const canvasRatio = cw / ch;
  const imgRatio = imgW / imgH;

  let drawW, drawH, drawX, drawY;

  if (canvasRatio > imgRatio) {
    drawW = cw;
    drawH = cw / imgRatio;
    drawX = 0;
    drawY = (ch - drawH) / 2;
  } else {
    drawH = ch;
    drawW = ch * imgRatio;
    drawX = (cw - drawW) / 2;
    drawY = 0;
  }

  ctx.drawImage(currentImg, drawX, drawY, drawW, drawH);
}

// Progressive Frame Preloading
function preloadFrames() {
  resizeCanvas();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    img.onload = () => {
      imagesLoaded++;
      const progress = Math.round((imagesLoaded / TOTAL_FRAMES) * 100);

      if (preloaderBar) preloaderBar.style.width = `${progress}%`;
      if (preloaderPercent) preloaderPercent.textContent = `${progress}%`;

      // Render the very first frame immediately
      if (i === 0 && !isFirstFrameReady) {
        isFirstFrameReady = true;
        renderCurrentFrame();
      }

      if (imagesLoaded >= TOTAL_FRAMES) {
        onFramesLoaded();
      }
    };

    img.onerror = () => {
      imagesLoaded++;
      if (imagesLoaded >= TOTAL_FRAMES) {
        onFramesLoaded();
      }
    };

    images.push(img);
  }
}

function onFramesLoaded() {
  setTimeout(() => {
    if (preloader) preloader.classList.add('fade-out');
    initHeroScrollAnimation();
    initOtherAnimations();
  }, 250);
}

// ==========================================================================
// 3. GSAP Hero & Video Scrubbing Timeline + Smoke Emergence Typography
// ==========================================================================
function initHeroScrollAnimation() {
  const heroSection = document.getElementById('hero-scroll-section');
  const stickyWrapper = heroSection.querySelector('.canvas-sticky-wrapper');
  const initialContent = document.getElementById('hero-initial-content');
  const endVeil = document.getElementById('video-end-veil');

  const k1 = document.getElementById('k-item-1');
  const k2 = document.getElementById('k-item-2');
  const k3 = document.getElementById('k-item-3');
  const k4 = document.getElementById('k-item-4');
  const kSlogan1 = document.getElementById('k-slogan-part-1');
  const kSlogan2 = document.getElementById('k-slogan-part-2');

  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      pin: stickyWrapper,
      anticipatePin: 1,
      onUpdate: (self) => {
        // Synchronized Header mode controller
        const header = document.getElementById('site-header');
        if (!header) return;

        // Keep body theme-milk active once clouds/veil appear
        if (self.progress >= 0.65) {
          document.body.classList.add('theme-milk');
        } else {
          document.body.classList.remove('theme-milk');
        }

        // User requirement: Do NOT show full header until the slogan completely disappears!
        // Slogan Part 2 fully dissolves into mist at progress 0.95.
        // We trigger the docked full header strictly when the slogan is 100% gone (progress >= 0.96).
        if (self.progress >= 0.96) {
          if (!header.classList.contains('header-mode-docked')) {
            header.classList.remove('header-mode-xray');
            header.classList.add('header-mode-docked');
          }
        } else {
          if (!header.classList.contains('header-mode-xray')) {
            header.classList.add('header-mode-xray');
            header.classList.remove('header-mode-docked');
          }
        }
      }
    }
  });

  // 1. Scrub through the 181 video frames (Reaches final summit cloud frame at time 96)
  heroTl.to(frameProxy, {
    frame: TOTAL_FRAMES - 1,
    ease: 'none',
    onUpdate: renderCurrentFrame,
    duration: 96,
  }, 0);

  // 2. Initial Hero Content at bottom fades out smoothly at start of scroll
  heroTl.to(initialContent, {
    opacity: 0,
    y: 30,
    scale: 0.96,
    duration: 7,
    ease: 'power2.out',
    pointerEvents: 'none',
  }, 0);

  // 3. Pure Massive Kinetic Typography with Smoke Emergence & Generous Crystal-Clear Reading Holds
  function addSmokeBullet(el, startAt, inDuration, holdDuration, outDuration, directionX) {
    const enteredAt = startAt + inDuration;
    const leaveAt = enteredAt + holdDuration;

    // Phase 1: Smoke emergence into crystal clarity
    heroTl.fromTo(el,
      {
        autoAlpha: 0,
        filter: 'blur(30px)',
        scale: 1.06,
        x: directionX,
        yPercent: -50,
        y: 18,
      },
      {
        autoAlpha: 1,
        filter: 'blur(0px)',
        scale: 1,
        x: 0,
        yPercent: -50,
        y: 0,
        duration: inDuration,
        ease: 'power2.out',
      },
      startAt
    );

    // Phase 2: Generous Reading Hold — 100% visible, completely sharp (blur 0px), imperceptible micro-float
    heroTl.to(el,
      {
        autoAlpha: 1,
        filter: 'blur(0px)',
        scale: 1,
        x: 0,
        yPercent: -50,
        y: -4,
        duration: holdDuration,
        ease: 'none',
      },
      enteredAt
    );

    // Phase 3: Smooth dissolution into mist
    heroTl.to(el,
      {
        autoAlpha: 0,
        filter: 'blur(30px)',
        scale: 0.94,
        yPercent: -50,
        y: -26,
        duration: outDuration,
        ease: 'power2.in',
      },
      leaveAt
    );
  }

  // Bullet 1: Left (100 min və daha artıq kredit)
  // Enters 8-11.5, HOLDS 11.5-27.5 (16 units hold!), Leaves 27.5-31
  addSmokeBullet(k1, 8, 3.5, 16, 3.5, -40);

  // Bullet 2: Right (Ofisə gəlmədən rəsmiləşdirmə)
  // Enters 31-34.5, HOLDS 34.5-50.5 (16 units hold!), Leaves 50.5-54
  addSmokeBullet(k2, 31, 3.5, 16, 3.5, 40);

  // Bullet 3: Left (Dəyərindən 120 faiz daha çox)
  // Enters 54-57.5, HOLDS 57.5-73.5 (16 units hold!), Leaves 73.5-77
  addSmokeBullet(k3, 54, 3.5, 16, 3.5, -40);

  // Bullet 4: Right (1 Gün ərzində qızılın təhvil-təslim)
  // Enters 77-80.5, HOLDS 80.5-96.5 (16 units hold!), Leaves 96.5-100
  addSmokeBullet(k4, 77, 3.5, 16, 3.5, 40);

  // 4. Veil blends the clouds into the uniform milk-white background
  heroTl.fromTo(endVeil,
    { opacity: 0 },
    { opacity: 1, duration: 16, ease: 'power2.inOut' },
    100
  );

  // 5. Final Cloud Slogan — Progressive Multi-Part Cinematic Reveal in Clouds
  // Part 1: "Hədəfləriniz nə qədər yüksəkdirsə,"
  // Enters from mist: 97-102
  heroTl.fromTo(kSlogan1,
    {
      autoAlpha: 0,
      filter: 'blur(35px)',
      scale: 1.08,
      xPercent: -50,
      yPercent: -50,
      y: 20,
    },
    {
      autoAlpha: 1,
      filter: 'blur(0px)',
      scale: 1,
      xPercent: -50,
      yPercent: -50,
      y: 0,
      duration: 5,
      ease: 'power2.out',
    },
    97
  );

  // Part 1 Long Reading Hold (22 units of dedicated scroll!):
  heroTl.to(kSlogan1,
    {
      autoAlpha: 1,
      filter: 'blur(0px)',
      scale: 1,
      xPercent: -50,
      yPercent: -50,
      y: -4,
      duration: 22,
      ease: 'none',
    },
    102
  );

  // Part 1 Dissolves into mist: 124-129
  heroTl.to(kSlogan1,
    {
      autoAlpha: 0,
      filter: 'blur(30px)',
      scale: 0.95,
      xPercent: -50,
      yPercent: -50,
      y: -26,
      duration: 5,
      ease: 'power2.in',
    },
    124
  );

  // Part 2: "dəstəyimiz bir o qədər güclüdür."
  // Enters seamlessly as Part 1 dissolves: 128-133
  heroTl.fromTo(kSlogan2,
    {
      autoAlpha: 0,
      filter: 'blur(35px)',
      scale: 1.08,
      xPercent: -50,
      yPercent: -50,
      y: 20,
    },
    {
      autoAlpha: 1,
      filter: 'blur(0px)',
      scale: 1,
      xPercent: -50,
      yPercent: -50,
      y: 0,
      duration: 5,
      ease: 'power2.out',
    },
    128
  );

  // Part 2 Long Reading Hold (22 units of dedicated scroll!):
  heroTl.to(kSlogan2,
    {
      autoAlpha: 1,
      filter: 'blur(0px)',
      scale: 1,
      xPercent: -50,
      yPercent: -50,
      y: -4,
      duration: 22,
      ease: 'none',
    },
    133
  );

  // Part 2 Glides up and dissolves smoothly as user leaves hero into Bento Grid:
  heroTl.to(kSlogan2,
    {
      autoAlpha: 0,
      filter: 'blur(30px)',
      scale: 0.95,
      xPercent: -50,
      yPercent: -50,
      y: -30,
      duration: 7,
      ease: 'power2.in',
    },
    155
  );

  // Dedicated buffer hold: Slogan is 100% gone, providing pure clean space before entering Bento
  heroTl.to({}, { duration: 8 }, 162);
}

// ==========================================================================
// 4. Creative Header Controller (Apple-Style Expansion & Dockable X-Ray Logo)
// ==========================================================================
function initHeaderScrollTrigger() {
  const header = document.getElementById('site-header');
  if (!header) return;

  // Initialize in pure X-Ray mode (dead-center logo, zero background plate)
  header.classList.add('header-mode-xray');
  header.classList.remove('header-mode-docked');

  initLanguageSelector();
}

function initLanguageSelector() {
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      langBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ==========================================================================
// 5. Bento Grid Interactive 3D Micro-Tilt
// ==========================================================================
function initBentoTilt() {
  const cards = document.querySelectorAll('.bento-card[data-tilt]');

  cards.forEach((card) => {
    let bounds;

    function updateBounds() {
      bounds = card.getBoundingClientRect();
    }

    card.addEventListener('mouseenter', updateBounds);
    window.addEventListener('resize', updateBounds);

    card.addEventListener('mousemove', (e) => {
      if (!bounds) updateBounds();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const xPct = (mouseX / bounds.width - 0.5) * 2;
      const yPct = (mouseY / bounds.height - 0.5) * 2;

      const rotateX = -yPct * 6;
      const rotateY = xPct * 8;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        transformPerspective: 1000,
        ease: 'power2.out',
        duration: 0.4,
      });

      const visual = card.querySelector('.bento-3d-visual');
      if (visual) {
        gsap.to(visual, {
          x: xPct * 16,
          y: yPct * 12,
          rotationZ: xPct * 3,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        ease: 'power3.out',
        duration: 0.6,
      });

      const visual = card.querySelector('.bento-3d-visual');
      if (visual) {
        gsap.to(visual, {
          x: 0,
          y: 0,
          rotationZ: 0,
          duration: 0.65,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      }
    });
  });

  // Staggered reveal for cards
  gsap.from('.bento-card', {
    y: 50,
    opacity: 0,
    stagger: 0.15,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.bento-grid',
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  });
}

// ==========================================================================
// 7. Cashback 3D Parallax & Video Coins (Desynchronized Spin)
// ==========================================================================
function initCashbackSection() {
  const coinLeft = document.getElementById('coin-left');
  const coinRight = document.getElementById('coin-right');

  // HTML5 video autoplay & coin animation desynchronization
  const videoLeft = document.querySelector('#coin-left .coin-video');
  const videoRight = document.querySelector('#coin-right .coin-video');

  if (videoLeft && videoRight) {
    videoLeft.muted = true;
    videoRight.muted = true;

    // Desynchronize: Start the right coin video ~1.2s ahead so their spins are distinct
    const desyncRightCoin = () => {
      try {
        const dur = videoRight.duration || 4.017;
        videoRight.currentTime = (videoLeft.currentTime + 1.2) % dur;
      } catch (e) {}
    };

    if (videoRight.readyState >= 1) {
      desyncRightCoin();
    } else {
      videoRight.addEventListener('loadedmetadata', desyncRightCoin, { once: true });
    }

    videoRight.addEventListener('play', () => {
      // Ensure phase offset is maintained if browser synced them
      if (Math.abs(videoRight.currentTime - videoLeft.currentTime) < 0.2) {
        try {
          const dur = videoRight.duration || 4.017;
          videoRight.currentTime = (videoLeft.currentTime + 1.2) % dur;
        } catch (e) {}
      }
    }, { once: true });

    videoLeft.play().catch(() => {});
    videoRight.play().catch(() => {});

    const fallbackPlay = () => {
      videoLeft.play().catch(() => {});
      videoRight.play().catch(() => {});
    };
    document.addEventListener('touchstart', fallbackPlay, { once: true });
    document.addEventListener('click', fallbackPlay, { once: true });
  }

  // Responsive Parallax via ScrollTrigger matchMedia
  const mm = gsap.matchMedia();

  // Desktop (min-width: 769px): Left coin lower, right coin higher with asymmetric parallax
  mm.add('(min-width: 769px)', () => {
    if (coinLeft) {
      gsap.fromTo(coinLeft,
        { y: 40 },
        {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: '#cashback',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        }
      );
    }

    if (coinRight) {
      gsap.fromTo(coinRight,
        { y: -30 },
        {
          y: 50,
          ease: 'none',
          scrollTrigger: {
            trigger: '#cashback',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.4
          }
        }
      );
    }
  });

  // Mobile (max-width: 768px): Only coin-left is displayed above 15% block with subtle parallax
  mm.add('(max-width: 768px)', () => {
    if (coinLeft) {
      gsap.fromTo(coinLeft,
        { y: 15 },
        {
          y: -15,
          ease: 'none',
          scrollTrigger: {
            trigger: '#cashback',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.0
          }
        }
      );
    }
  });
}

// ==========================================================================
// 8. 3D Card Scroll Choreography (Vertical Unfold -> Level -> Kinetic Text Reveal)
// ==========================================================================
function initCardShowcase3D() {
  const stage = document.getElementById('card-stage-container');
  const card = document.getElementById('card-3d');
  const shadow = document.getElementById('card-shadow');
  const glare = document.getElementById('card-glare');
  const header = document.getElementById('card-hero-header');
  const footer = document.getElementById('card-hero-footer');
  const perkCards = document.querySelectorAll('.card-perk-card');

  if (!card) return;

  // 1. Initial State:
  // ONLY the vertical card is floating directly under 15% section.
  // Texts are completely invisible with smoky blur.
  gsap.set(card, {
    rotationZ: -90,
    rotationX: 18,
    rotationY: -14,
    scale: 0.94,
    y: 0,
    transformPerspective: 1400,
    transformOrigin: 'center center'
  });

  if (shadow) {
    gsap.set(shadow, {
      scaleX: 0.65,
      opacity: 0.65
    });
  }

  if (header) {
    gsap.set(header, {
      opacity: 0,
      y: -35,
      filter: 'blur(22px)',
      pointerEvents: 'none'
    });
  }

  if (footer) {
    gsap.set(footer, {
      opacity: 0,
      y: 40,
      filter: 'blur(22px)',
      pointerEvents: 'none'
    });
  }

  if (perkCards.length) {
    gsap.set(perkCards, {
      opacity: 0,
      y: 20
    });
  }

  // 2. ScrollTrigger Pinned Scrub Timeline:
  // As user scrolls, vertical card unfolds horizontally, then texts smoke-reveal!
  const pinTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#card',
      start: 'top top',
      end: '+=1600',
      pin: true,
      scrub: 0.8,
      anticipatePin: 1
    }
  });

  // Step A (0 -> 1.0s):
  // Vertical card rotates into a clean, horizontal orientation
  pinTl.to(card, {
    rotationZ: 0,
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    ease: 'power2.inOut',
    duration: 1.0
  }, 0);

  if (shadow) {
    pinTl.to(shadow, {
      scaleX: 1.0,
      opacity: 1,
      ease: 'power2.inOut',
      duration: 1.0
    }, 0);
  }

  // Step B (1.05s -> 1.85s):
  // ONLY AFTER the card is horizontal, texts appear with kinetic blur reveal
  if (header) {
    pinTl.to(header, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      pointerEvents: 'auto',
      ease: 'power3.out',
      duration: 0.75
    }, 1.05);
  }

  if (footer) {
    pinTl.to(footer, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      pointerEvents: 'auto',
      ease: 'power3.out',
      duration: 0.75
    }, 1.15);
  }

  if (perkCards.length) {
    pinTl.to(perkCards, {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      ease: 'power2.out',
      duration: 0.5
    }, 1.3);
  }

  // Step C (1.85s -> 2.2s):
  // Hold composition settled in view for interactive reading and mouse tilt
  pinTl.to({}, { duration: 0.35 });

  // 3. Interactive Mouse Physics & Specular Glare Tracking
  if (stage) {
    let bounds;
    function updateBounds() {
      bounds = stage.getBoundingClientRect();
    }
    stage.addEventListener('mouseenter', updateBounds);
    window.addEventListener('resize', updateBounds);

    stage.addEventListener('mousemove', (e) => {
      // Only apply mouse physics if card has rotated into horizontal zone
      if (pinTl.progress() < 0.8) return;

      if (!bounds) updateBounds();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const xNorm = (mouseX / bounds.width - 0.5) * 2;
      const yNorm = (mouseY / bounds.height - 0.5) * 2;

      const rotX = -yNorm * 10;
      const rotY = xNorm * 14;
      const rotZ = xNorm * 1.0;

      gsap.to(card, {
        rotateX: rotX,
        rotateY: rotY,
        rotateZ: rotZ,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      if (shadow) {
        gsap.to(shadow, {
          x: xNorm * 18,
          y: yNorm * 8,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }

      if (glare) {
        const glareX = (xNorm + 1) * 50;
        const glareY = (yNorm + 1) * 50;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, transparent 60%)`;
      }
    });

    stage.addEventListener('mouseleave', () => {
      if (pinTl.progress() < 0.8) return;

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto'
      });

      if (shadow) {
        gsap.to(shadow, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      }

      if (glare) {
        glare.style.background = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)`;
      }
    });
  }
}

// ==========================================================================
// 9. Master Animation Initializer
// ==========================================================================
function initOtherAnimations() {
  initHeaderScrollTrigger();
  initBentoTilt();
  initCashbackSection();
  initCardShowcase3D();
}

// Kick off frame preloader on DOM load
window.addEventListener('DOMContentLoaded', () => {
  preloadFrames();
});
