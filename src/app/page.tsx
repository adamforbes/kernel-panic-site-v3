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
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415640/statement__2-1_evfouk.png';
const CARD_BACK =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415599/card-back_lnlye1.png';
const CARD_BACK_TASK =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1768417735/card-back_task_f0xo5c.png';

const CAROUSEL_CARDS = [
  {
    label: 'Tasks',
    desc: 'Tasks represent the user\'s requirements. Each player has their own pair of tasks and works on them in parallel!',
    image: 'https://res.cloudinary.com/dkcuvaird/image/upload/v1768417762/task-16_pmqvfh.png',
    back: CARD_BACK_TASK,
    square: true,
  },
  {
    label: 'Actions',
    desc: 'Actions are operation cards that players use to edit storage counters. Everyone plays actions simultaneously in real time, as fast as they can!',
    image: CARD_PLACEHOLDER,
    square: false,
  },
  {
    label: 'Bugs',
    desc: 'Bugs are tricky actions with unexpected effects. Bugs apply to one of your private storage counters, just like statements.',
    image: 'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415593/bug-3_afurnf.png',
    square: false,
  },
  {
    label: 'Outages',
    desc: 'Outages are even more dangerous than bugs. When you draw an outage, announce it to everyone and play it immediately! (It does not go into your hand.)',
    image: 'https://res.cloudinary.com/dkcuvaird/image/upload/v1768415616/outage-2_ewi3nj.png',
    square: false,
  },
];

const CURSOR_SIZE = 96;
const DITHER_DURATION = 200; // ms
const MOBILE_BREAKPOINT = 768;

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
type SlideId = 'hero' | 'text' | 'split' | 'splitL' | 'splitR' | 'cards';
const DESKTOP_SLIDES: SlideId[] = ['hero', 'text', 'split', 'cards'];
const MOBILE_SLIDES: SlideId[] = ['hero', 'text', 'splitL', 'splitR', 'cards'];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displaySlide, setDisplaySlide] = useState(0);
  const [ditherPhase, setDitherPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoFont, setLogoFont] = useState(REDACTION_WEIGHTS[0]);
  const [cardsFlipped, setCardsFlipped] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
  }, []);

  // Animation loop: decay velocity, pick font weight based on current velocity
  useEffect(() => {
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
  }, []);

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
  }, []);

  const goBack = useCallback(() => {
    if (!isFirst) changeSlide(currentSlide - 1);
  }, [isFirst, currentSlide, changeSlide]);

  const goNext = useCallback(() => {
    if (!isLast) changeSlide(currentSlide + 1);
  }, [isLast, currentSlide, changeSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goBack, goNext]);

  const [splitRatios, setSplitRatios] = useState<{ left: number; right: number }>({ left: 0, right: 0 });

  const handleImageLoad = useCallback((side: 'left' | 'right', e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setSplitRatios(prev => ({ ...prev, [side]: ratio }));
  }, []);

  const [inBackZone, setInBackZone] = useState(false);

  const handleContentMouseMove = useCallback((e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    setCursorVisible(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    setInBackZone(x < 0.25);
  }, []);

  const handleContentMouseLeave = useCallback(() => {
    setCursorVisible(false);
  }, []);

  return (
    <div className={styles.viewport}>
      {/* Outer bevel layer 1: white top-left, black bottom-right */}
      <div className={styles.bevelOuter1}>
        {/* Outer bevel layer 2: lighter gray top-left, dark gray bottom-right */}
        <div className={styles.bevelOuter2}>
          {/* Window body — gray chrome area */}
          <div className={styles.windowBody}>
            {/* Title bar */}
            <div className={styles.titleBar}>
              <span className={styles.titleText}>Kernel Panic : Board Game</span>
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
                        <img
                          src={SPLIT_IMAGE_LEFT}
                          alt="Hand grabbing Kernel Panic cards"
                          className={styles.slideImage}
                          onLoad={(e) => handleImageLoad('left', e)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={styles.splitPane}
                  style={splitRatios.right ? { aspectRatio: `${splitRatios.right}` } : undefined}
                >
                  <div className={styles.bevelInner1}>
                    <div className={styles.bevelInner2}>
                      <div className={styles.content}>
                        <img
                          src={SPLIT_IMAGE_RIGHT}
                          alt="Hand full of clickers"
                          className={styles.slideImage}
                          onLoad={(e) => handleImageLoad('right', e)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Single content well */
              <div className={styles.bevelInner1}>
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
                      <img
                        src={HERO_IMAGE}
                        alt="Kernel Panic board game"
                        className={styles.slideImage}
                      />
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
                        <p className={styles.slideBody}>
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
                        <p className={styles.slideBody}>
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
                        <p className={styles.slideBody}>
                          The game ends the moment the 10-minute timer expires.
                          Your team&apos;s final score is based on the complexity
                          of your completed Tasks and the number of Danger Actions
                          successfully navigated. Every game is a race to optimize
                          your performance and set a new high score!
                        </p>
                      </div>
                    )}

                    {/* Mobile: individual split images */}
                    {currentSlideId === 'splitL' && (
                      <img
                        src={SPLIT_IMAGE_LEFT}
                        alt="Hand grabbing Kernel Panic cards"
                        className={styles.slideImage}
                      />
                    )}
                    {currentSlideId === 'splitR' && (
                      <img
                        src={SPLIT_IMAGE_RIGHT}
                        alt="Hand full of clickers"
                        className={styles.slideImage}
                      />
                    )}

                    {/* Card carousel */}
                    {currentSlideId === 'cards' && (
                      <div className={styles.slideCarousel} ref={carouselRef}>
                        {CAROUSEL_CARDS.map((card, i) => (
                          <div key={card.label} className={styles.carouselItem}>
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
                            <span className={`${styles.carouselLabel} ${cardsFlipped ? styles.carouselLabelVisible : ''}`}
                              style={{ transitionDelay: `${0.1 + i * 0.2 + 0.6}s` }}
                            >{card.label}</span>
                            <p className={`${styles.carouselDesc} ${cardsFlipped ? styles.carouselDescVisible : ''}`}
                              style={{ transitionDelay: `${0.1 + i * 0.2 + 0.7}s` }}
                            >{card.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Button bar */}
            <div className={styles.buttonBar}>
              <button className={styles.btn}>
                <u>B</u>UY NOW
              </button>
              <div className={styles.navButtons}>
                <button
                  className={styles.btn}
                  disabled={isFirst}
                  onClick={(e) => {
                    e.stopPropagation();
                    goBack();
                  }}
                >
                  &lsaquo; <u>B</u>ack
                </button>
                <button
                  className={styles.btn}
                  disabled={isLast}
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                >
                  <u>N</u>ext &rsaquo;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom oversized cursor */}
      {cursorVisible && (() => {
        const cursorMap: Record<string, string> = {
          hero: '/cursors/register_private.svg',
          text: '/cursors/register_cyan.svg',
          split: '/cursors/register_magenta.svg',
          splitL: '/cursors/register_magenta.svg',
          splitR: '/cursors/register_magenta.svg',
          cards: '/cursors/register_yellow.svg',
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
