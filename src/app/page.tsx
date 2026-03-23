'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './page.module.css';

const HERO_IMAGE =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057287/spread-of-cards_kernel-panic_big_2_jfrhya.png';
const SPLIT_IMAGE_LEFT =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057297/hand-grabbing_kernal-panic_szoeuv.jpg';
const SPLIT_IMAGE_RIGHT =
  'https://res.cloudinary.com/dkcuvaird/image/upload/v1774057296/hand-full-of-clickers_kernel-panic_rc4fd9.jpg';

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

  const handleContentMouseMove = useCallback((e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    setCursorVisible(true);
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
                  if (x < 0.25 && !isFirst) goBack();
                  else if (!isLast) goNext();
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
                <div className={styles.splitPane}>
                  <div className={styles.bevelInner1}>
                    <div className={styles.bevelInner2}>
                      <div className={styles.content}>
                        <img
                          src={SPLIT_IMAGE_LEFT}
                          alt="Hand grabbing Kernel Panic cards"
                          className={styles.slideImage}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.splitPane}>
                  <div className={styles.bevelInner1}>
                    <div className={styles.bevelInner2}>
                      <div className={styles.content}>
                        <img
                          src={SPLIT_IMAGE_RIGHT}
                          alt="Hand full of clickers"
                          className={styles.slideImage}
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

                    {/* Card showcase */}
                    {currentSlideId === 'cards' && (
                      <div className={styles.slideCards}>
                        <div className={styles.cardStack}>
                          <div className={styles.card}>
                            <div className={styles.cardTitleBar}>
                              <span>Add/Subtract 1</span>
                            </div>
                            <div className={styles.cardContent}>
                              <div className={styles.cardSymbol}>+1<br />-1</div>
                            </div>
                            <div className={styles.cardType}>Statement</div>
                          </div>
                          <div className={`${styles.card} ${styles.cardCyan}`}>
                            <div
                              className={`${styles.cardTitleBar} ${styles.cardTitleCyan}`}
                            >
                              <span>Access Cyan</span>
                            </div>
                            <div className={styles.cardContentCyan}>
                              <div className={styles.cardAccessIcon}>
                                <span className={styles.iconComputer}>&#9000;</span>
                                <span className={styles.iconWire}>&mdash;&mdash;&mdash;</span>
                                <span className={styles.iconComputer}>&#9000;</span>
                              </div>
                            </div>
                          </div>
                        </div>
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
      {cursorVisible && (
        <img
          src={
            currentSlideId === 'hero' ? '/cursors/register_private.svg'
            : currentSlideId === 'text' ? '/cursors/register_cyan.svg'
            : currentSlideId === 'split' || currentSlideId === 'splitL' || currentSlideId === 'splitR' ? '/cursors/register_magenta.svg'
            : '/cursors/register_yellow.svg'
          }
          alt=""
          className={styles.customCursor}
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: CURSOR_SIZE,
            height: CURSOR_SIZE,
          }}
        />
      )}
    </div>
  );
}
