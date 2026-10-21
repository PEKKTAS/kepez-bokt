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
// 2. HTML5 Canvas Native 2K Frame Sequencer (Fast Progressive Streaming)
// ==========================================================================
const TOTAL_FRAMES = 181;
const CRITICAL_FRAMES_COUNT = 10; // Fast initial buffer to unlock screen immediately
const FAILSAFE_TIMEOUT_MS = 2500;  // 2.5s maximum wait for network hiccups

const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderPercent = document.getElementById('preloader-percent');

const images = new Array(TOTAL_FRAMES);
const frameProxy = { frame: 0 };
let imagesLoaded = 0;
let isStarted = false;
let failsafeTimer = null;

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

// Helper to get nearest loaded frame if current frame is still streaming in background
function getBestAvailableFrame(index) {
  const target = Math.min(Math.max(Math.round(index), 0), TOTAL_FRAMES - 1);
  if (images[target] && images[target].complete && images[target].naturalWidth > 0) {
    return images[target];
  }
  // Search backward and forward for nearest completed frame to prevent blank flicker
  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = target - offset;
    if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    const next = target + offset;
    if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }
  return null;
}

// Render image on canvas with exact cover scaling at native resolution
function renderCurrentFrame() {
  const currentImg = getBestAvailableFrame(frameProxy.frame);
  if (!currentImg) return;

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

// Progressive Frame Loading
function preloadFrames() {
  resizeCanvas();

  let isLaunched = false;
  const CRITICAL_FRAMES_COUNT = 12;

  const launch = () => {
    if (isLaunched) return;
    isLaunched = true;
    if (failsafeTimer) clearTimeout(failsafeTimer);

    if (preloaderBar) preloaderBar.style.transform = 'scaleX(1)';
    if (preloaderPercent) preloaderPercent.textContent = '100%';

    setTimeout(() => {
      if (preloader) preloader.classList.add('fade-out');
      renderCurrentFrame();
      initHeroScrollAnimation();
      initOtherAnimations();
    }, 200);
  };

  // Fail-safe timer (guarantee site opens within 2 seconds even on slow connections)
  failsafeTimer = setTimeout(() => {
    launch();
  }, 2000);

  // Load all 181 frames in parallel
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    img.onload = () => {
      imagesLoaded++;
      const percent = Math.min(Math.round((imagesLoaded / CRITICAL_FRAMES_COUNT) * 100), 100);
      if (!isLaunched) {
        if (preloaderBar) preloaderBar.style.transform = `scaleX(${percent / 100})`;
        if (preloaderPercent) preloaderPercent.textContent = `${percent}%`;
      }

      if (i === 0) {
        renderCurrentFrame();
      }

      if (imagesLoaded >= CRITICAL_FRAMES_COUNT) {
        launch();
      }
    };

    img.onerror = () => {
      imagesLoaded++;
      if (imagesLoaded >= CRITICAL_FRAMES_COUNT) {
        launch();
      }
    };

    images[i] = img;
  }
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
      langBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });
}

// ==========================================================================
// 5. Bento Grid Interactive 3D Visual Micro-Tilt (Cards Remain Stable)
// ==========================================================================
function initBentoTilt() {
  const cards = document.querySelectorAll('.bento-card');

  cards.forEach((card) => {
    const visual = card.querySelector('.bento-3d-visual');
    if (!visual) return;

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

      // Card plate stays stationary. Only the 3D chrome visual tilts and floats:
      gsap.to(visual, {
        x: xPct * 16,
        y: yPct * 12 - 6,
        rotationZ: xPct * 3.5,
        rotationY: xPct * 7,
        scale: 1.08,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(visual, {
        x: 0,
        y: 0,
        rotationZ: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto'
      });
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
      start: 'top 85%',
      once: true
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
// 8. 3D Card Scroll Choreography (Horizontal 360 Spin on Scroll + Mouse Physics)
// ==========================================================================
function initCardShowcase3D() {
  const stage = document.getElementById('card-stage-container');
  const cardRig = document.getElementById('card-3d');
  const flipper = document.getElementById('card-flipper');
  const shadow = document.getElementById('card-shadow');
  const glare = document.getElementById('card-glare');
  const glareBack = document.getElementById('card-glare-back');
  const header = document.getElementById('card-hero-header');
  const footer = document.getElementById('card-hero-footer');

  if (!cardRig || !flipper) return;

  // 1. Initial State:
  // Card starts directly horizontal (no vertical fall).
  // Text blocks start hidden, to be gracefully revealed on scroll during the 360 rotation.
  gsap.set(cardRig, {
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
    transformPerspective: 1600,
    transformOrigin: 'center center'
  });

  gsap.set(flipper, {
    rotationY: 0,
    transformOrigin: 'center center'
  });

  if (shadow) {
    gsap.set(shadow, {
      scaleX: 1,
      opacity: 0.75
    });
  }

  if (header) {
    gsap.set(header, {
      opacity: 0,
      y: -26,
      filter: 'blur(12px)',
      pointerEvents: 'none'
    });
  }

  if (footer) {
    gsap.set(footer, {
      opacity: 0,
      y: 26,
      filter: 'blur(12px)',
      pointerEvents: 'none'
    });
  }

  // 2. ScrollTrigger Pinned Scrub Timeline:
  // As user scrolls through the section, card executes a 360° turn in the REVERSED direction (0 -> -360°).
  // Showing front (0°), back Card_new.png (-180°), and front again (-360°).
  // Simultaneously, text blocks emerge and finish their reveal right as the full 360 rotation completes!
  const pinTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#card',
      start: 'top top',
      end: '+=1400',
      pin: true,
      scrub: 1.0,
      anticipatePin: 1
    }
  });

  // 360 spin on flipper - REVERSED DIRECTION (-360)
  pinTl.to(flipper, {
    rotationY: -360,
    ease: 'power1.inOut',
    duration: 1.0
  }, 0);

  // Dynamic shadow scaling in sync with edge-on rotations at -90° and -270°
  if (shadow) {
    pinTl.to(shadow, {
      keyframes: [
        { scaleX: 1.0, opacity: 0.75, duration: 0 },
        { scaleX: 0.18, opacity: 0.35, duration: 0.25, ease: 'power1.in' },
        { scaleX: 1.0, opacity: 0.75, duration: 0.25, ease: 'power1.out' },
        { scaleX: 0.18, opacity: 0.35, duration: 0.25, ease: 'power1.in' },
        { scaleX: 1.0, opacity: 0.75, duration: 0.25, ease: 'power1.out' }
      ],
      duration: 1.0
    }, 0);
  }

  // Text blocks emerge smoothly along with the scroll spin, fully revealed at 1.0
  if (header) {
    pinTl.to(header, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      pointerEvents: 'auto',
      ease: 'power2.out',
      duration: 0.75
    }, 0.25);
  }

  if (footer) {
    pinTl.to(footer, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      pointerEvents: 'auto',
      ease: 'power2.out',
      duration: 0.75
    }, 0.25);
  }

  // Reading hold at the end of the full spin and text reveal
  pinTl.to({}, { duration: 0.45 });

  // 3. Interactive Mouse Physics & Specular Glare Tracking
  if (stage) {
    let bounds;
    function updateBounds() {
      bounds = stage.getBoundingClientRect();
    }
    stage.addEventListener('mouseenter', updateBounds);
    window.addEventListener('resize', updateBounds);

    stage.addEventListener('mousemove', (e) => {
      if (!bounds) updateBounds();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const xNorm = (mouseX / bounds.width - 0.5) * 2;
      const yNorm = (mouseY / bounds.height - 0.5) * 2;

      const rotX = -yNorm * 9;
      const rotY = xNorm * 13;
      const rotZ = xNorm * 1.2;

      gsap.to(cardRig, {
        rotateX: rotX,
        rotateY: rotY,
        rotateZ: rotZ,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      if (shadow) {
        gsap.to(shadow, {
          x: xNorm * 16,
          y: yNorm * 6,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }

      const glareX = (xNorm + 1) * 50;
      const glareY = (yNorm + 1) * 50;
      const glareStyle = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, transparent 60%)`;
      if (glare) glare.style.background = glareStyle;
      if (glareBack) glareBack.style.background = glareStyle;
    });

    stage.addEventListener('mouseleave', () => {
      gsap.to(cardRig, {
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

      const defaultGlare = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)`;
      if (glare) glare.style.background = defaultGlare;
      if (glareBack) glareBack.style.background = defaultGlare;
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

// Kick off frame preloader on DOM load or immediately if already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preloadFrames);
} else {
  preloadFrames();
}
