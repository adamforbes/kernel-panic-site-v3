'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './page.module.css';

const HERO_IMAGE =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057287/spread-of-cards_kernel-panic_big_2_jfrhya.png';
const SPLIT_IMAGE_LEFT =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057297/hand-grabbing_kernal-panic_szoeuv.jpg';
const SPLIT_IMAGE_RIGHT =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057296/hand-full-of-clickers_kernel-panic_rc4fd9.jpg';
const CARD_PLACEHOLDER =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415583/statement__2_fhpvuq.png';
const CARD_BACK =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415599/card-back_lnlye1.png';
const PRODUCT_IMAGE =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057309/box-open_kernel-panic_wozhcl.jpg';
const CARD_BACK_TASK =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1768417735/card-back_task_f0xo5c.png';

const CAROUSEL_CARDS = [
  {
    label: 'Tasks',
    desc: 'Complete tasks to earn chips for your team. Finish yours solo or help others with theirs, all in parallel.',
    image: 'https://res.cloudinary.com/dkcuvaird/image/upload/v1768417762/task-16_pmqvfh.png',
    back: CARD_BACK_TASK,
    square: true,
  },
  {
    label: 'Actions',
    desc: 'Actions edit your storage counters. Play fast, as many as you can, to finish your tasks.',
    image: CARD_PLACEHOLDER,
    square: false,
  },
  {
    label: 'Bugs',
    desc: 'Brace yourself for the unexpected. Bugs add chaos to your counters. Or are they features?',
    image: 'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415593/bug-3_afurnf.png',
    square: false,
  },
  {
    label: 'Outages',
    desc: 'Emergency! Play this immediately. Hopefully your team is prepared.',
    image: 'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415616/outage-2_ewi3nj.png',
    square: false,
  },
];

const CURSOR_SIZE = 96;
const DITHER_DURATION = 200; // ms
const MOBILE_BREAKPOINT = 1024;

// Redaction weights for logo flicker — low numbers = full serif, high = more pixelated
const REDACTION_WEIGHTS = [
  "'Redaction 70'",   // base (most pixelated)
  "'Redaction 50'",
  "'Redaction 35'",
  "'Redaction 20'",
  "'Redaction 10'",
  "'Redaction'",      // full serif (least pixelated)
  "'Redaction 10'",
  "'Redaction 35'",
  "'Redaction 50'",
  "'Redaction 100'",  // most pixelated
  "'Redaction 70'",
];

// Desktop slides: 0=hero, 1=text, 2=split, 3=cards
// Mobile slides:  0=hero, 1=text, 2=splitL, 3=splitR, 4=cards
type SlideId = 'hero' | 'text' | 'split' | 'splitL' | 'splitR' | 'cards' | 'buy';
const DESKTOP_SLIDES: SlideId[] = ['hero', 'text', 'split', 'cards', 'buy'];
const MOBILE_SLIDES: SlideId[] = ['hero', 'text', 'splitL', 'splitR', 'cards', 'buy'];

function getSlideFromHash(slides: SlideId[]): number {
  if (typeof window === 'undefined') return 0;
  const hash = window.location.hash.replace('#', '') as SlideId;
  const idx = slides.indexOf(hash);
  return idx >= 0 ? idx : 0;
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displaySlide, setDisplaySlide] = useState(0);
  const [initialHashApplied, setInitialHashApplied] = useState(false);
  const [ditherPhase, setDitherPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [logoFont, setLogoFont] = useState(REDACTION_WEIGHTS[0]);
  const [cardsFlipped, setCardsFlipped] = useState(false);
  const [idlePopups, setIdlePopups] = useState<{ id: number; x: number; y: number }[]>([]);
  const [activeCarouselCard, setActiveCarouselCard] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const spawnTimerRef = useRef<ReturnType<typeof setInterval>>();
  const popupIdRef = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Track image loading for shimmer states
  const handleImageLoaded = useCallback((src: string) => {
    setLoadedImages(prev => {
      if (prev.has(src)) return prev;
      return new Set(prev).add(src);
    });
  }, []);

  // Ref callback that fires synchronously on mount — catches images that are
  // already cached/complete before React can attach the onLoad handler.
  const handleImageRef = useCallback((el: HTMLImageElement | null, src: string) => {
    if (el && el.complete && el.naturalWidth > 0) {
      handleImageLoaded(src);
    }
  }, [handleImageLoaded]);

  // Track active carousel card via IntersectionObserver (set up after render)
  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;
    const items = carouselRef.current.querySelectorAll('[data-carousel-item]');
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.carouselItem);
            if (!isNaN(idx)) setActiveCarouselCard(idx);
          }
        });
      },
      { root: carouselRef.current, threshold: 0.6 }
    );
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [isMobile, displaySlide]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // On mount (and after isMobile is resolved), read hash and jump to that slide
  useEffect(() => {
    if (initialHashApplied) return;
    const slidesList = isMobile ? MOBILE_SLIDES : DESKTOP_SLIDES;
    const idx = getSlideFromHash(slidesList);
    if (idx > 0) {
      setCurrentSlide(idx);
      setDisplaySlide(idx);
    }
    setInitialHashApplied(true);
  }, [isMobile, initialHashApplied]);

  // Listen for browser back/forward (popstate) to sync slide from hash
  useEffect(() => {
    const handlePopState = () => {
      const slidesList = isMobile ? MOBILE_SLIDES : DESKTOP_SLIDES;
      const idx = getSlideFromHash(slidesList);
      setCurrentSlide(idx);
      setDisplaySlide(idx);
      setDitherPhase('in');
      setTimeout(() => setDitherPhase('idle'), DITHER_DURATION);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobile]);

  const slides = isMobile ? MOBILE_SLIDES : DESKTOP_SLIDES;
  const totalSlides = slides.length;
  const currentSlideId = slides[displaySlide];

  const isFirst = currentSlide === 0;
  const isLast = currentSlide === totalSlides - 1;

  const [cardsSettled, setCardsSettled] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [tappedCard, setTappedCard] = useState<number | null>(null);

  // Trigger card flip when arriving at the cards slide
  useEffect(() => {
    if (currentSlideId === 'cards') {
      setCardsFlipped(false);
      setCardsSettled(false);
      const t1 = setTimeout(() => setCardsFlipped(true), 100);
      const t2 = setTimeout(() => setCardsSettled(true), 1600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setCardsFlipped(false);
      setCardsSettled(false);
      setHoveredCard(null);
      setTappedCard(null);
    }
  }, [currentSlideId]);

  // Idle popup spawner on buy slide
  const clearIdleTimers = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearInterval(spawnTimerRef.current);
  }, []);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimers();
    if (currentSlideId !== 'buy' || isMobile) return;
    idleTimerRef.current = setTimeout(() => {
      spawnTimerRef.current = setInterval(() => {
        setIdlePopups(prev => [
          ...prev,
          {
            id: popupIdRef.current++,
            x: Math.random() * 80 + 5,  // 5–85% to stay in bounds
            y: Math.random() * 70 + 5,  // 5–75%
          },
        ]);
      }, 1000);
    }, 10000);
  }, [currentSlideId, isMobile, clearIdleTimers]);

  // Start/reset idle timer when entering buy slide or on interaction
  useEffect(() => {
    if (currentSlideId === 'buy') {
      setIdlePopups([]);
      popupIdRef.current = 0;
      resetIdleTimer();
    } else {
      clearIdleTimers();
      setIdlePopups([]);
    }
    return clearIdleTimers;
  }, [currentSlideId, resetIdleTimer, clearIdleTimers]);

  // Reset idle timer on any mouse/touch/key activity while on buy slide
  useEffect(() => {
    if (currentSlideId !== 'buy') return;
    const reset = () => {
      setIdlePopups([]);
      resetIdleTimer();
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('touchstart', reset);
    window.addEventListener('keydown', reset);
    return () => {
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('touchstart', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [currentSlideId, resetIdleTimer]);

  // Per-card mouse tracking — tilt toward cursor + lighting
  const handleCardMouseMove = useCallback((e: React.MouseEvent, index: number) => {
    const el = cardRefs.current[index];
    if (!el || !cardsSettled) return;
    const rect = el.getBoundingClientRect();
    // Normalized -1 to 1 from card center
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    // Tilt: card tilts toward cursor (gravity pull)
    const tiltY = nx * 12;  // max 12deg
    const tiltX = -ny * 8;  // max 8deg, inverted for natural feel
    el.style.setProperty('--tilt-x', `${tiltX}deg`);
    el.style.setProperty('--tilt-y', `${tiltY}deg`);
    // Shine position (percentage)
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--shine-x', `${shineX}%`);
    el.style.setProperty('--shine-y', `${shineY}%`);
    // Shadow shifts opposite to tilt
    const shadowX = -nx * 8;
    const shadowY = -ny * 8;
    el.style.boxShadow = `${shadowX}px ${shadowY + 4}px 14px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.12)`;
    setHoveredCard(index);
  }, [cardsSettled]);

  const handleCardMouseLeave = useCallback((index: number) => {
    const el = cardRefs.current[index];
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.boxShadow = '';
    setHoveredCard(null);
  }, []);

  // Mobile: tap to toggle tilt toward center
  const handleCardTap = useCallback((index: number) => {
    if (!isMobile || !cardsSettled) return;
    const el = cardRefs.current[index];
    if (!el) return;
    if (tappedCard === index) {
      // Un-tilt
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--shine-x', '50%');
      el.style.setProperty('--shine-y', '30%');
      el.style.boxShadow = '';
      setTappedCard(null);
    } else {
      // Tilt toward viewer
      el.style.setProperty('--tilt-x', '-6deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--shine-x', '50%');
      el.style.setProperty('--shine-y', '20%');
      el.style.boxShadow = '0px 6px 16px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.12)';
      setTappedCard(index);
    }
  }, [isMobile, cardsSettled, tappedCard]);

  // Mouse-velocity-driven logo flicker
  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocityRef = useRef(0);
  const decayRef = useRef<ReturnType<typeof requestAnimationFrame>>();

  useEffect(() => {
    if (isMobile) return; // Skip mouse tracking on mobile
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      // Accumulate velocity, capped at 1
      velocityRef.current = Math.min(1, velocityRef.current + speed * 0.008);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Animation loop: decay velocity, pick font weight based on current velocity
  useEffect(() => {
    if (isMobile) return; // Skip RAF loop on mobile
    const bgWeights = [
      "'Redaction 70'", "'Redaction 100'", "'Redaction 50'",
      "'Redaction 35'", "'Redaction 20'", "'Redaction 10'", "'Redaction'",
    ];
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      // Decay velocity toward 0
      velocityRef.current *= Math.pow(0.0001, dt / 1000); // decays rapidly when mouse stops
      if (velocityRef.current < 0.01) velocityRef.current = 0;

      const v = velocityRef.current;

      if (v > 0.05) {
        // Pick a random weight — more extreme at higher velocity
        const bgRange = Math.ceil(v * bgWeights.length);
        const bgIdx = Math.floor(Math.random() * bgRange);
        setLogoFont(bgWeights[Math.min(bgIdx, bgWeights.length - 1)]);

      } else {
        // Settled — return to default
        setLogoFont("'Redaction 70'");
      }

      decayRef.current = requestAnimationFrame(tick);
    };

    decayRef.current = requestAnimationFrame(tick);
    return () => {
      if (decayRef.current) cancelAnimationFrame(decayRef.current);
    };
  }, [isMobile]);

  const changeSlide = useCallback((newSlide: number) => {
    // Clear any pending timer from a previous transition
    clearTimeout(timerRef.current);
    // Immediately swap to new content and restart dither-in
    setDisplaySlide(newSlide);
    setCurrentSlide(newSlide);
    setDitherPhase('in');
    timerRef.current = setTimeout(() => {
      setDitherPhase('idle');
    }, DITHER_DURATION);
    // Update URL hash so the slide persists on refresh / is shareable
    const slidesList = isMobile ? MOBILE_SLIDES : DESKTOP_SLIDES;
    const slideId = slidesList[newSlide];
    if (slideId) {
      window.history.pushState(null, '', `#${slideId}`);
    }
  }, [isMobile]);

  const goBack = useCallback(() => {
    if (!isFirst) changeSlide(currentSlide - 1);
  }, [isFirst, currentSlide, changeSlide]);

  const goNext = useCallback(() => {
    if (!isLast) changeSlide(currentSlide + 1);
  }, [isLast, currentSlide, changeSlide]);

  // Keyboard navigation (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goBack, goNext, isMobile]);

  // Swipe navigation for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Only trigger if horizontal swipe > 50px and more horizontal than vertical
    if (absDx > 50 && absDx > absDy * 1.5) {
      if (dx < 0) goNext();
      else goBack();
    }
    touchStartRef.current = null;
  }, [goBack, goNext]);

  const [splitRatios, setSplitRatios] = useState<{ left: number; right: number }>({ left: 0, right: 0 });

  const handleImageLoad = useCallback((side: 'left' | 'right', e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setSplitRatios(prev => ({ ...prev, [side]: ratio }));
  }, []);

  const [inBackZone, setInBackZone] = useState(false);

  const handleContentMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setCursorPos({ x: e.clientX, y: e.clientY });
    setCursorVisible(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    setInBackZone(x < 0.25);
  }, [isMobile]);

  const handleContentMouseLeave = useCallback(() => {
    if (isMobile) return;
    setCursorVisible(false);
  }, [isMobile]);

  return (
    <div className={styles.viewport} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Outer bevel layer 1: white top-left, black bottom-right */}
      <div className={styles.bevelOuter1}>
        {/* Outer bevel layer 2: lighter gray top-left, dark gray bottom-right */}
        <div className={styles.bevelOuter2}>
          {/* Window body — gray chrome area */}
          <div className={styles.windowBody}>
            {/* Title bar */}
            <div className={styles.titleBar} onClick={() => changeSlide(0)} style={{ cursor: 'pointer' }}>
              <img src="/kp-icon.svg" alt="" className={styles.titleIcon} />
              <span className={styles.titleText}>A:\KERNEL_PANIC</span>
            </div>

            {/* Content well */}
            {currentSlideId === 'split' ? (
              /* Split panel — two sunken bevels side by side */
              <div
                className={styles.splitContainer}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width;
                  if (x < 0.25) { if (!isFirst) goBack(); }
                  else { if (!isLast) goNext(); }
                }}
                onMouseMove={handleContentMouseMove}
                onMouseLeave={handleContentMouseLeave}
              >
                {ditherPhase !== 'idle' && (
                  <div
                    className={`${styles.ditherOverlay} ${
                      ditherPhase === 'out' ? styles.ditherOut : styles.ditherIn
                    }`}
                  />
                )}
                <div
                  className={styles.splitPane}
                  style={splitRatios.left ? { aspectRatio: `${splitRatios.left}` } : undefined}
                >
                  <div className={styles.bevelInner1}>
                    <div className={styles.bevelInner2}>
                      <div className={styles.content}>
                        {!loadedImages.has(SPLIT_IMAGE_LEFT) && <div className={styles.imageLoading} />}
                        <img
                          ref={(el) => handleImageRef(el, SPLIT_IMAGE_LEFT)}
                          src={SPLIT_IMAGE_LEFT}
                          alt="Hand grabbing Kernel Panic cards"
                          className={styles.slideImage}
                          onLoad={(e) => { handleImageLoad('left', e); handleImageLoaded(SPLIT_IMAGE_LEFT); }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.imageCaption}>Play action cards as fast as you can</div>
                </div>

                {/* Wire + Lock connector — flex child filling the gap */}
                <div className={styles.dataCableContainer}>
                  <img src="/statement/wire.svg" alt="" className={styles.wire} />
                  <img src="/statement/lock.svg" alt="" className={styles.lock} />
                </div>

                <div
                  className={styles.splitPane}
                  style={splitRatios.right ? { aspectRatio: `${splitRatios.right}` } : undefined}
                >
                  <div className={styles.bevelInner1}>
                    <div className={styles.bevelInner2}>
                      <div className={styles.content}>
                        {!loadedImages.has(SPLIT_IMAGE_RIGHT) && <div className={styles.imageLoading} />}
                        <img
                          ref={(el) => handleImageRef(el, SPLIT_IMAGE_RIGHT)}
                          src={SPLIT_IMAGE_RIGHT}
                          alt="Hand full of clickers"
                          className={styles.slideImage}
                          onLoad={(e) => { handleImageLoad('right', e); handleImageLoaded(SPLIT_IMAGE_RIGHT); }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.imageCaption}>Track scores with clicker tokens</div>
                </div>
              </div>
            ) : currentSlideId === 'buy' ? (
              /* Buy slide — image left, Win95 CTA window right */
              <div
                className={styles.buySlideContainer}
                onMouseMove={handleContentMouseMove}
                onMouseLeave={handleContentMouseLeave}
              >
                {ditherPhase !== 'idle' && (
                  <div
                    className={`${styles.ditherOverlay} ${
                      ditherPhase === 'out' ? styles.ditherOut : styles.ditherIn
                    }`}
                  />
                )}
                {/* Left: product image — flexible width, fully visible */}
                <div className={styles.buySlideImagePane}>
                  <div className={styles.bevelInner1}>
                    <div className={styles.bevelInner2}>
                      <div className={styles.content}>
                        {!loadedImages.has(PRODUCT_IMAGE) && <div className={styles.imageLoading} />}
                        <img
                          ref={(el) => handleImageRef(el, PRODUCT_IMAGE)}
                          src={PRODUCT_IMAGE}
                          alt="Kernel Panic board game — open box"
                          className={styles.slideImage}
                          onLoad={() => handleImageLoaded(PRODUCT_IMAGE)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right: Win95 floating window with CTA */}
                <div className={styles.buySlideCtaPane}>
                  <div className={`${styles.buyWindow} ${styles.desktopOnly}`}>
                    <div className={styles.buyWindowBevelOuter}>
                      <div className={styles.buyWindowTitleBar}>
                        <span className={styles.buyWindowTitleText}>purchase.exe</span>
                      </div>
                      <div className={styles.buyWindowContent}>
                        <div className={styles.buySlideCtaInner}>
                          <div className={styles.buySlideLogoContainer}>
                            <div className={styles.buySlideLogoBg} aria-hidden="true" style={{ fontFamily: `${logoFont}, serif` }}>
                              <span className={styles.buySlideLogoLine}>KERNEL</span>
                              <span className={styles.buySlideLogoLine}>PANIC</span>
                            </div>
                            <div className={styles.buySlideLogoFg}>
                              <span className={styles.buySlideLogoLine}>KERNEL</span>
                              <span className={styles.buySlideLogoLine}>PANIC</span>
                            </div>
                          </div>
                          <p className={styles.buySlidePrice}>$35</p>
                          <a
                            href="https://redpupgames.square.site/"
                            className={styles.buySlideCtaButton}
                          >
                            BUY NOW
                          </a>
                          <span className={styles.buySlideSubtext}>Opens Square checkout</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.mobileBuyCta} ${styles.mobileOnly}`}>
                    <p className={styles.mobileBuyPrice}>$35</p>
                    <a
                      href="https://redpupgames.square.site/"
                      className={styles.buySlideCtaButton}
                    >
                      BUY NOW
                    </a>
                  </div>
                </div>

                {/* Idle popup windows — miniature clones of purchase.exe */}
                {idlePopups.map((popup) => (
                  <a
                    key={popup.id}
                    href="https://redpupgames.square.site/"
                    className={styles.idlePopup}
                    style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
                  >
                    <div className={styles.buyWindow}>
                      <div className={styles.buyWindowBevelOuter}>
                        <div className={styles.buyWindowTitleBar}>
                          <span className={styles.buyWindowTitleText}>purchase.exe</span>
                        </div>
                        <div className={styles.buyWindowContent}>
                          <div className={styles.buySlideCtaInner}>
                            <div className={styles.buySlideLogoContainer}>
                              <div className={styles.buySlideLogoBg} aria-hidden="true" style={{ fontFamily: `${logoFont}, serif` }}>
                                <span className={styles.buySlideLogoLine}>KERNEL</span>
                                <span className={styles.buySlideLogoLine}>PANIC</span>
                              </div>
                              <div className={styles.buySlideLogoFg}>
                                <span className={styles.buySlideLogoLine}>KERNEL</span>
                                <span className={styles.buySlideLogoLine}>PANIC</span>
                              </div>
                            </div>
                            <p className={styles.buySlidePrice}>$35</p>
                            <span className={styles.buySlideCtaButton}>BUY NOW</span>
                            <span className={styles.buySlideSubtext}>Opens Square checkout</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              /* Single content well */
              <div className={`${styles.bevelInner1}${(currentSlideId === 'splitL' || currentSlideId === 'splitR') ? ` ${styles.mobileImageSlide}` : ''}`}>
                <div className={styles.bevelInner2}>
                  <div
                    ref={contentRef}
                    className={styles.content}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      if (x < 0.25 && !isFirst) goBack();
                      else if (!isLast) goNext();
                    }}
                    onMouseMove={handleContentMouseMove}
                    onMouseLeave={handleContentMouseLeave}
                  >
                    {/* Dither transition overlay */}
                    {ditherPhase !== 'idle' && (
                      <div
                        className={`${styles.ditherOverlay} ${
                          ditherPhase === 'out' ? styles.ditherOut : styles.ditherIn
                        }`}
                      />
                    )}

                    {/* Hero image */}
                    {currentSlideId === 'hero' && (
                      <>
                        {!loadedImages.has(HERO_IMAGE) && <div className={styles.imageLoading} />}
                        <img
                          ref={(el) => handleImageRef(el, HERO_IMAGE)}
                          src={HERO_IMAGE}
                          alt="Kernel Panic board game"
                          className={styles.slideImage}
                          onLoad={() => handleImageLoaded(HERO_IMAGE)}
                        />
                      </>
                    )}

                    {/* Game description */}
                    {currentSlideId === 'text' && (
                      <div className={styles.slideText} data-win95-scroll>
                        <div className={styles.logoContainer}>
                          <div className={styles.logoBg} aria-hidden="true" style={{ fontFamily: `${logoFont}, serif` }}>
                            <span className={styles.logoLine}>KERNEL</span>
                            <span className={styles.logoLine}>PANIC</span>
                          </div>
                          <div className={styles.logoFg}>
                            <span className={styles.logoLine}>KERNEL</span>
                            <span className={styles.logoLine}>PANIC</span>
                          </div>
                        </div>

                        <h1 className={styles.slideHeading}>
                          Race against a 10 minute timer in this cooperative
                          no-turns puzzle game.
                        </h1>

                        <button className={styles.btn} onClick={(e) => { e.stopPropagation(); setIsReadmeOpen(true); }} style={{ marginTop: '20px' }}>
                          LEARN MORE
                        </button>
                        
                        {isReadmeOpen && (
                          <div className={styles.readmeWindow} onClick={(e) => { e.stopPropagation(); }}>
                            <div className={styles.readmeWindowTitleBar}>
                              <span className={styles.readmeWindowTitleText}>readme.txt</span>
                              <button className={styles.readmeWindowCloseBtn} aria-label="Close" onClick={(e) => { e.stopPropagation(); setIsReadmeOpen(false); }}>X</button>
                            </div>
                            <div className={styles.readmeWindowContent} data-win95-scroll onScroll={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
                              <p className={styles.readmeText}>
                                Race the clock as a team of processors in a digital
                                device! In this real-time puzzle game, you have 10
                                minutes to complete as many tasks as possible. Your goal
                                is to satisfy Task cards by calculating specific
                                two-digit numbers on local and shared Storage Counters.
                                You&apos;ll calculate values using a hand of Action
                                cards: Statements let you perform math operations to
                                reach your target numbers whereas Accesses copy numbers
                                between your local storage counters and the shared
                                storage counters. Once you get the hang of things, add
                                Danger Actions to the deck for a greater challenge! This
                                included bonus pack introduces Bugs with inconvenient
                                effects and Outages that trigger immediately to disrupt
                                the entire team.
                              </p>
                              <p className={styles.readmeText}>
                                There are no turns in Kernel Panic. Everyone plays
                                simultaneously, drawing from a shared action deck and
                                computing as quickly as they can. Collaboration is all
                                but mandatory: Many tasks are too complex for one
                                processor to solve alone, requiring you to compute
                                useful numbers for teammates to use or work together on
                                shared requirements. Just be careful&mdash;most tasks
                                have conflicting conditions, so helping one teammate
                                with their Task might accidentally clobber
                                another&apos;s hard work.
                              </p>
                              <p className={styles.readmeText}>
                                The game ends the moment the 10-minute timer expires.
                                Your team&apos;s final score is based on the complexity
                                of your completed Tasks and the number of Danger Actions
                                successfully navigated. Every game is a race to optimize
                                your performance and set a new high score!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mobile: individual split images with captions */}
                    {currentSlideId === 'splitL' && (
                      <>
                        {!loadedImages.has(SPLIT_IMAGE_LEFT) && <div className={styles.imageLoading} />}
                        <img
                          ref={(el) => handleImageRef(el, SPLIT_IMAGE_LEFT)}
                          src={SPLIT_IMAGE_LEFT}
                          alt="Hand grabbing Kernel Panic cards"
                          className={styles.slideImage}
                          onLoad={() => handleImageLoaded(SPLIT_IMAGE_LEFT)}
                        />
                      </>
                    )}
                    {currentSlideId === 'splitR' && (
                      <>
                        {!loadedImages.has(SPLIT_IMAGE_RIGHT) && <div className={styles.imageLoading} />}
                        <img
                          ref={(el) => handleImageRef(el, SPLIT_IMAGE_RIGHT)}
                          src={SPLIT_IMAGE_RIGHT}
                          alt="Hand full of clickers"
                          className={styles.slideImage}
                          onLoad={() => handleImageLoaded(SPLIT_IMAGE_RIGHT)}
                        />
                      </>
                    )}

                    {/* Card carousel */}
                    {currentSlideId === 'cards' && (
                      <div className={styles.slideCarousel} ref={carouselRef}>
                        {/* Top row: cards, bottom-aligned */}
                        <div className={styles.carouselCardsRow}>
                          {CAROUSEL_CARDS.map((card, i) => (
                            <div key={card.label} className={styles.carouselColumn}>
                              <div className={`${styles.card3d} ${card.square ? styles.card3dSquare : ''}`}>
                                <div
                                  ref={el => { cardRefs.current[i] = el; }}
                                  className={`${styles.cardInner} ${cardsFlipped ? styles.flipped : ''} ${cardsSettled ? styles.settled : ''} ${hoveredCard === i ? styles.hovering : ''}`}
                                  onMouseMove={(e) => handleCardMouseMove(e, i)}
                                  onMouseLeave={() => handleCardMouseLeave(i)}
                                  onClick={() => handleCardTap(i)}
                                >
                                  <div className={`${styles.cardFace} ${styles.cardFront}`}>
                                    <img
                                      src={card.image}
                                      alt={card.label}
                                      className={styles.card3dImage}
                                    />
                                    <div className={`${styles.cardShine} ${hoveredCard === i || tappedCard === i ? styles.cardShineVisible : ''}`} />
                                  </div>
                                  <div className={`${styles.cardFace} ${styles.cardBack}`}>
                                    <img
                                      src={card.back || CARD_BACK}
                                      alt="Card back"
                                      className={styles.card3dImage}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Bottom row: labels + descriptions, top-aligned */}
                        <div className={styles.carouselTextRow}>
                          {CAROUSEL_CARDS.map((card, i) => (
                            <div key={card.label} className={styles.carouselColumn}>
                              <span className={`${styles.carouselLabel} ${cardsFlipped ? styles.carouselLabelVisible : ''}`}
                                style={{ transitionDelay: `${0.1 + i * 0.2 + 0.6}s` }}
                              >{card.label}</span>
                              <p className={`${styles.carouselDesc} ${cardsFlipped ? styles.carouselDescVisible : ''}`}
                                style={{ transitionDelay: `${0.1 + i * 0.2 + 0.7}s` }}
                              >{card.desc}</p>
                            </div>
                          ))}
                        </div>
                        {/* Mobile: individual card+text items (hidden on desktop) */}
                        {CAROUSEL_CARDS.map((card, i) => (
                          <div key={`m-${card.label}`} className={styles.carouselItemMobile} data-carousel-item={i}>
                            <div className={`${styles.card3d} ${card.square ? styles.card3dSquare : ''}`}>
                              <div
                                className={`${styles.cardInner} ${cardsFlipped ? styles.flipped : ''} ${cardsSettled ? styles.settled : ''}`}
                                onClick={() => handleCardTap(i)}
                              >
                                <div className={`${styles.cardFace} ${styles.cardFront}`}>
                                  <img src={card.image} alt={card.label} className={styles.card3dImage} />
                                </div>
                                <div className={`${styles.cardFace} ${styles.cardBack}`}>
                                  <img src={card.back || CARD_BACK} alt="Card back" className={styles.card3dImage} />
                                </div>
                              </div>
                            </div>
                            <span className={`${styles.carouselLabel} ${cardsFlipped ? styles.carouselLabelVisible : ''}`}
                              style={{ transitionDelay: `${0.1 + i * 0.2 + 0.6}s` }}
                            >{card.label}</span>
                            <p className={`${styles.carouselDesc} ${cardsFlipped ? styles.carouselDescVisible : ''}`}
                              style={{ transitionDelay: `${0.1 + i * 0.2 + 0.7}s` }}
                            >{card.desc}</p>
                          </div>
                        ))}
                        {/* Pagination dots (mobile only, rendered via CSS) */}
                        <div className={styles.carouselDots}>
                          {CAROUSEL_CARDS.map((_, i) => (
                            <span
                              key={i}
                              className={`${styles.carouselDot} ${activeCarouselCard === i ? styles.carouselDotActive : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile image captions — flex children of windowBody, outside bevel */}
            {currentSlideId === 'splitL' && (
              <div className={styles.imageCaption}>Play action cards as fast as you can</div>
            )}
            {currentSlideId === 'splitR' && (
              <div className={styles.imageCaption}>Track scores with clicker tokens</div>
            )}

            {/* Button bar */}
            <div className={styles.buttonBar}>
              {currentSlideId === 'buy' ? (
                <a
                  href="https://redpupgames.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    transition: 'opacity 0.1s'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  <img src="https://res.cloudinary.com/dkcuvaird/image/upload/v1774826320/VECTOR__REDPUP_MAIN_COLOR_h5v501.svg" alt="Red Pup Games" style={{ height: '24px', width: 'auto' }} />
                </a>
              ) : (
                <a
                  href="https://redpupgames.square.site/"
                  className={styles.btn}
                >
                  <u>B</u>UY NOW
                </a>
              )}
              <div className={styles.navButtons}>
                <button
                  className={styles.btn}
                  disabled={isFirst}
                  onClick={(e) => {
                    e.stopPropagation();
                    goBack();
                  }}
                >
                  {isMobile ? '←' : <>&lsaquo; <u>B</u>ack</>}
                </button>
                <button
                  className={styles.btn}
                  disabled={isLast}
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                >
                  {isMobile ? '→' : <><u>N</u>ext &rsaquo;</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom oversized cursor (hidden on mobile) */}
      {!isMobile && cursorVisible && (() => {
        const cursorMap: Record<string, string> = {
          hero: '/cursors/register_private.svg',
          text: '/cursors/register_cyan.svg',
          split: '/cursors/register_magenta.svg',
          splitL: '/cursors/register_magenta.svg',
          splitR: '/cursors/register_magenta.svg',
          cards: '/cursors/register_yellow.svg',
          buy: '/cursors/register_private.svg',
        };
        const prevSlideId = currentSlide > 0 ? slides[currentSlide - 1] : null;
        const cursorSrc = (inBackZone && !isFirst && prevSlideId)
          ? cursorMap[prevSlideId]
          : cursorMap[currentSlideId];
        return <img
          src={cursorSrc}
          alt=""
          className={styles.customCursor}
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: CURSOR_SIZE,
            height: CURSOR_SIZE,
          }}
        />;
      })()}
    </div>
  );
}
