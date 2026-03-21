# **Product Requirements Document: Board Game Landing Page — v2**

## **1\. Project Overview**

A single-page website for Kernel Panic (the board game) built around one central interaction metaphor: **a desktop being infected by popup windows.** The hero image fills the entire screen and never scrolls away. As the user scrolls down, Win95-style dialog windows cascade onto the screen one by one, each covering a beat of the narrative. Scrolling back up dismisses them in reverse order.

**Crucially: this is the box art come to life.** The box top artwork is itself a Win95 desktop overrun by cascading popup windows — the same chaos, the same chrome, the same green-on-black brand moments. The website is the physical product animated and made interactive. This continuity is intentional and should feel inevitable.

## **2\. Core Design Principles**

* **The Website IS the Box Art:** The box top depicts a Win95 desktop overwhelmed by popup windows. The website literalizes that image. Users are stepping inside the box.
* **The Desktop as Canvas:** The hero photo sits fixed behind everything as the "wallpaper." It never leaves. All content happens on top of it.
* **Scroll = System Infection:** Each scroll milestone spawns a new popup window. The more you scroll, the more "infected" the screen becomes. Reversing the scroll reverses the infection.
* **Each Window is Self-Contained:** Every content beat lives inside its own Win95 window — title bar, beveled border, content. No traditional page sections.
* **Fewest Clicks to Purchase:** The path to checkout is never more than one click.
* **Controlled Chaos:** The cascade feels accidental, but is carefully choreographed — windows never fully obscure each other's key content, and the stacking order tells the story.

## **3\. Visual Style & Aesthetic**

### **Color Palette**
The palette is derived directly from the box art. Two modes coexist:

* **Window Chrome (Win95 gray):** `#c0c0c0` background, `#000080` active title bar, `#ffffff` / `#808080` for borders and details. This is the OS layer.
* **Window Content (brand black + green):** Pure black (`#000000`) backgrounds inside windows, phosphor green (`#00ff41`) for the logo, headings, and key brand text. White or light gray for body copy. This is the game layer.
* **No amber. No midnight blue. Green and black only** for branded content.

### **The Logo Treatment**
The KERNEL PANIC logo on the box uses bold italic display type in phosphor green on pure black, with a subtle glow/halation effect — as if rendered on an old CRT. This treatment should be carried faithfully into the website wherever the logo appears.

### **Window Chrome**
* Authentic Win95: flat `#c0c0c0` title bar, cobalt blue (`#000080`) when active, beveled outset border using `#ffffff` / `#808080` / `#c0c0c0`.
* **No close, minimize, or maximize buttons.** The windows cannot be dismissed. You are trapped.
* Title bar text in MS Sans Serif (system font stack). All window chrome stays period-accurate.

### **Window Content**
* Pure black interior backgrounds.
* Phosphor green for headings and logo moments.
* Redaction (all weights) for all type inside windows — headings and body both.
* The contrast between the gray, utilitarian chrome and the dark, branded interior is the visual tension that makes it work.

### **Card Design Language**
The game cards are themselves Win95 windows — this is not a metaphor, it is the literal design. Each card is composed as one or two stacked Win95 dialog boxes with authentic chrome. This means displaying real card images on the website requires no adaptation; they slot into the popup storm visually and feel inevitable.

Key card anatomy to carry into the site:
* **Title bar:** card name in bold system font, cobalt blue background — identical to site window chrome.
* **Split body:** left panel is pure black with phosphor green pixel art illustrating the card's mechanic; right panel is Win95 gray with rule text in Redaction, large and clean. Example text in italic Redaction.
* **Card type label:** "Statement" (and likely other types) appears below the window frame in system font — a label outside the chrome, not inside it.
* **Two-window structure:** cards have a primary window (the effect) and a smaller secondary window stacked below (showing a resource/access mechanic — e.g. "Access White" with pixel-art networked computers).
* **Pixel art style:** card artwork is pure pixel art — green on black, no gradients, chunky blocky pixels. Iconically represents the card's mechanical concept. Same energy as early OS icons or 8-bit sprite work.
* **Dithered card border:** the outer card edge uses a bitmap dither pattern, giving physical texture even as a flat image.
* **Color discipline:** green, black, and Win95 gray only. Blue only for active title bars. No exceptions on the cards, and this should hold across the site too.

### **Window Naming Convention**
Title bars use file-name style labels — exactly as seen on the box art (`tagline.txt`, `logo_final_final2.png`, `credits.txt`, `studio.svg`). Website windows should follow the same convention: evocative, file-system-plausible names, not marketing labels.

### **Background / Desktop Wallpaper**
The hero photo: the physical game box shot on a textured neutral surface with dramatic diagonal shadows (venetian blind / window light). The box sits as a luxury object. This photo is the "wallpaper" the entire experience floats over. It should feel premium and tactile against the utilitarian Win95 chrome above it.

### **Background Noise**
The box art uses repeating cascading windows filled with alternating green and red/blue vertical bar patterns as a background texture. A subtle version of this — muted, low-opacity — can be used as the desktop wallpaper texture or as decorative fill behind the hero photo to reinforce the system-overload atmosphere.

### **Animation**
* Window spawn: fast scale from ~95% + opacity, 80–120ms, no easing curves. Feels like an OS dialog, not a web animation.
* Slight random offsets and rotations (±3°) baked in per window to feel uncontrolled.
* No spring physics. No smooth CSS transitions beyond the snap-in.

### **Typography**
* **Window title bars:** MS Sans Serif system stack — never Redaction here.
* **All content inside windows:** Redaction (Regular, Bold, Italic as needed).
* **Official tagline (confirmed from box art):** *"A real-time puzzle game of chaotically concurrent computation"*

## **4\. Scroll Interaction Model**

The page has a tall scroll container (`~600vh`) but all visual content is `position: fixed`. Scroll position maps to window visibility:

* **At rest (0vh):** Hero photo only. No windows. The box sits alone on screen.
* **Each scroll threshold:** One new window animates in.
* **Scrolling back up:** Windows dismiss in reverse order (last in, first out).
* **Window positioning:** Pre-defined positions with slight random offsets. Fan out across the screen — not centered, not grid-aligned. See box art for density and overlap reference.

## **5\. Window Inventory (Scroll Order)**

### **Window 1 — The Pitch**
* **Window Title:** `tagline.txt`
* **Trigger:** First scroll threshold
* **Position:** Center, prominent. First hit.
* **Content:** The official tagline in large type. Green on black.
* **Copy:** *"A real-time puzzle game of chaotically concurrent computation"*

### **Window 2 — The Logo**
* **Window Title:** `logo_final_final2.png`
* **Trigger:** Second scroll threshold
* **Position:** Center or slightly left, overlapping Window 1 partially
* **Content:** The KERNEL PANIC logo — large, phosphor green, CRT glow treatment, pure black background. No other content. Iconic.

### **Window 3 — Gallery (The Cards)**
* **Window Title:** `components.png`
* **Trigger:** Third scroll threshold
* **Position:** Upper-right, overlapping prior windows
* **Content:** Show actual card images — 3–4 cards arranged in a slightly fanned, overlapping stack. The cards are already designed as Win95 windows so they read as native to this environment. Cards tilt subtly on hover (CSS 3D). No re-rendering needed; the real card art is the asset. Show enough of each card's pixel art and rule text to be legible and intriguing.

### **Window 4 — Tutorial (How to Play)**
* **Window Title:** `setup_wizard.exe — Step 1 of 4`
* **Trigger:** Fourth scroll threshold
* **Position:** Center-lower, overlapping prior windows
* **Content:** Click-through walkthrough of a round of play. Each "Next >" advances the step. Progress bar. Feels like a software install dialog.

### **Window 5 — Newsletter (Lead Gen)**
* **Window Title:** `patch_notes_signup.txt`
* **Trigger:** Fifth scroll threshold
* **Position:** Lower-left
* **Content:** Single email input. Minimal copy. Submit = "Install."
* **Copy:** *`> enter email to receive patch notes_`*

### **Window 6 — Buy Now (Conversion)**
* **Window Title:** `BUY_NOW.exe`
* **Trigger:** Sixth scroll threshold
* **Position:** Upper area, highest z-index — the most prominent window on screen
* **Content:** Product name, price, one button. The button is the only red element on the page — vibrant, alarming, impossible to miss.

### **Window 7 — Credits / Footer**
* **Window Title:** `credits.txt`
* **Trigger:** Appears alongside Window 6
* **Position:** Bottom-right, small, partially behind other windows
* **Content:** "Designed by Michael Patashnik / Art by Adam Forbes" and "Published by Red Pup Games" — exactly as it appears on the box. Green monospace. Copyright line.

## **6\. Persistent Elements**

### **Buy Now Window**
Window 6 stays at the highest z-index once spawned. It cannot be buried.

### **Taskbar (Optional)**
* Win95 taskbar fixed to the bottom of the viewport.
* Start button (decorative), system clock, `BUY_NOW.exe` in the tray.
* Clicking `BUY_NOW.exe` re-focuses Window 6 if it exists.

## **7\. Technical Requirements**

* **Scroll Engine:** Map `window.scrollY` to a 0–1 progress value. Each window has a `triggerAt` threshold. Crossing it spawns the window; uncrossing it dismisses it.
* **Fixed Layout:** Page body is tall to enable scroll. All visuals are `position: fixed`. No layout shift, no scroll jank.
* **Window Component:** Reusable React component. Accepts title, position, z-index, content. Win95 chrome only — no control buttons.
* **Typeface:** Redaction (all weights) loaded for window content. MS Sans Serif stack for chrome. Logo uses Redaction Bold Italic with a CSS `text-shadow` glow to approximate the CRT halation on the box.
* **Card Interaction:** CSS 3D transforms for hover tilt in Window 3. No heavy WebGL needed.
* **Performance:** Hero image preloaded. Window content loads eagerly.

## **8\. Reference**

* **Hero image:** `https://res.cloudinary.com/dkcuvaird/image/upload/v1768516328/kernel-panic_mockup_b90knu.png`
* **Box art:** The physical box top is the primary visual reference. The website is this image, animated.
* **Visual tone:** Adware/malware popup storm — cascading overlapping dialogs, fanning out, each partially occluding the last. Chaotic but composed.
