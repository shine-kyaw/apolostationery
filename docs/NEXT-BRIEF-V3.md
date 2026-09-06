# NEXT BRIEF — APOLO STATIONERY V3

> **Status: not started.** This is the client's next-session direction, saved
> verbatim. Read [HANDOFF.md](HANDOFF.md) first for the current state of the
> code, the bug history, and the "in flight" item that should be closed before
> anything else.
>
> **Note on §27 (technology):** the existing project is deliberately
> vanilla — no build step, no GSAP, no Three.js. This brief explicitly reopens
> that decision. Any library added must earn its place; see §42.

---

## APOLO STATIONERY — V3
### MAXIMUM CREATIVE INTERACTIVE BRAND EXPERIENCE

You are now taking over an existing APOLO Stationery website/hero-film project.
This is NOT a request to simply add a few animations.

I want you to act as a:

* Creative Director
* Art Director
* Motion Designer
* Interactive Experience Designer
* Product Experience Designer
* UX/UI Designer
* Brand Designer
* Creative Frontend Engineer
* Interaction Engineer
* Performance Engineer
* Mobile Experience Designer
* Critical Design Reviewer

Your job is to take the existing implementation and push it substantially
further until it feels like a high-end interactive stationery brand experience,
not a normal stationery website.

You have maximum creative freedom.
Do not be conservative.
Do not assume the current implementation is good enough.
Do not simply preserve every existing decision.

You are allowed to redesign, restructure, replace, refactor, or completely
rethink parts of the experience when doing so creates a substantially better
result.

However:
Do not destroy the existing concept just for the sake of making something
different. The existing concept should be treated as raw creative material that
can be evolved.

---

### 01 — FIRST: UNDERSTAND THE EXISTING PROJECT

Before changing anything:

1. Inspect the entire repository.
2. Read all existing documentation.
3. Inspect the existing HTML, CSS, JavaScript and asset architecture.
4. Inspect the actual product assets.
5. Understand how the current hero film works.
6. Run the website locally.
7. Experience the website yourself from beginning to end.
8. Test scrolling.
9. Test every interactive element.
10. Test desktop.
11. Test mobile.
12. Test different viewport sizes.
13. Inspect console errors.
14. Inspect network errors.
15. Inspect performance.
16. Inspect asset loading.
17. Inspect animation timing.
18. Inspect typography.
19. Inspect composition.
20. Inspect the relationship between the animation and the actual APOLO products.

Do not begin coding immediately.
First build a mental model of the current experience.

### 02 — PERFORM A BRUTALLY HONEST DESIGN AUDIT

Before implementation, determine:

**What is currently working?**
Identify the strongest elements of the existing experience. Examples: strongest
scene, strongest transition, strongest product presentation, strongest visual
idea, strongest interaction, strongest typography, strongest brand moment,
strongest use of whitespace, strongest use of color, strongest cinematic moment.

**What is currently weak?**
Identify every major weakness you can find. Do not wait for me to tell you.
Examples: boring transitions, weak pacing, awkward spacing, generic animations,
poor hierarchy, weak product photography, products appearing unnaturally,
animation feeling disconnected from the brand, too much empty space, too much
visual noise, weak CTA, poor mobile experience, excessive scrolling, poor
responsiveness, weak typography, lack of interaction, interaction without
purpose, visual repetition, cheap-looking effects, excessive gradients,
excessive blur, poor depth, poor camera movement, inconsistent motion language,
lack of narrative, lack of payoff.

Be critical. You are not reviewing this project as its developer. You are
reviewing it as an extremely demanding creative director.

### 03 — ASK YOURSELF WHAT SHOULD BE PRESERVED

Before redesigning anything, identify the DNA that must survive. The experience
should continue to feel like APOLO. Do not turn the site into a random
futuristic portfolio website. The brand must remain recognizable.

Preserve and strengthen the relevant existing identity: stationery, paper,
drawing, school, creativity, products, youthful energy, playful design, APOLO
visual identity, actual product photography, notebook/exercise-book language,
physical materials, tactile feeling.

If an existing visual idea is strong, improve it rather than replacing it
unnecessarily.

### 04 — CORE CREATIVE DIRECTION

The existing central concept is:

**THE PAGE THAT FILLS ITSELF**

A blank page becomes a drawing. The drawing becomes a house. The house becomes a
notebook. The notebook becomes a ruled exercise book. The page fills with real
APOLO products. The camera pulls back. The world resolves into APOLO.

This should remain the conceptual foundation unless you discover a clearly
superior evolution.

But now transform it from *a cinematic scroll animation* into *an interactive
brand world*. The user should feel like they are moving through a physical APOLO
universe. The website should feel like: a stationery desk + notebook + product
catalogue + interactive film + creative playground.

Do not make it feel like a generic SaaS landing page. Do not make it feel like a
template. Do not make it feel like a conventional ecommerce site.

### 05 — INTERACTIVITY IS NOW A MAJOR PRIORITY

I specifically want the experience to become interactive. However, interaction
must have meaning.

Do NOT add random: particles, cursor trails, spinning objects, floating blobs,
unnecessary 3D, random hover effects, gimmicky WebGL, excessive parallax.

Every interaction should reinforce the brand or improve discovery. Ask: "Why
would the user want to interact with this?" If there is no good answer, don't add
it.

### 06 — CREATE A HIGHLY INTERACTIVE PRODUCT DISCOVERY SYSTEM

Product interaction should be one of the major improvements. The products should
no longer feel like static images sitting on a page. Create a system where users
can meaningfully explore APOLO products.

**Product hover** — when the user approaches a product: product subtly lifts,
shadow changes, lighting changes, surrounding objects react, product becomes more
visually important, information appears naturally. Avoid generic "scale(1.05)"
hover effects. Make the interaction feel physical.

**Product selection** — when the user clicks/taps a product, it could: move
forward, rotate slightly, become isolated, open a detail view, reveal product
information, reveal category, reveal additional images, show its physical
characteristics, transition into another section. The transition should feel like
interacting with a physical stationery object.

**Product spotlight** — create a beautiful product spotlight mode. The background
could simplify. The selected product becomes the hero. The camera could move
closer. Typography and information should appear around the object. Think:
premium product presentation + stationery catalogue + interactive film.

### 07 — PRODUCT DISCOVERY SHOULD FEEL LIKE EXPLORATION

Do not immediately dump product cards into a grid. Instead consider: products
scattered naturally across a desk, notebook pages, categories represented
physically, products entering the scene, products arranged into compositions,
products interacting with paper, products becoming part of drawings, product
groups forming visual stories.

The product catalogue should feel like part of the world. Not an unrelated
ecommerce component.

### 08 — CREATE A FULL WEBSITE EXPERIENCE

Do not stop at the hero. Turn the project into a complete brand experience.
Design the transition from the hero into the rest of the website.

Potential architecture: Scene 01 opening / blank page · Scene 02 drawing ·
Scene 03 transformation · Scene 04 notebook world · Scene 05 product world ·
Scene 06 product exploration · Scene 07 brand story · Scene 08 product
categories · Scene 09 featured products · Scene 10 creative / stationery
universe · Scene 11 brand identity · Scene 12 final APOLO CTA.

But do NOT blindly follow this list. You should determine the best information
architecture. The result should feel like one continuous experience rather than
unrelated sections stacked vertically.

### 09 — MAKE THE TRANSITIONS THE MAIN DESIGN LANGUAGE

One of the biggest opportunities is transitions. Do not use fade in, fade out,
slide up, basic scale, or generic reveal animations for everything. Instead
create transformations.

* Paper → house: the notebook line itself becomes the structure.
* House → notebook: the geometry folds/reshapes into a notebook.
* Notebook → product world: notebook lines become the composition grid.
* Product world → catalogue: objects reorganize themselves into a new layout.
* Product → detail: the camera moves toward the physical product.
* Detail → next product: the product itself becomes the transition.
* Brand → CTA: the visual language resolves naturally.

The goal: the interface should transform rather than switch.

### 10 — CREATE A REAL CAMERA SYSTEM

Treat the website like a camera. Not a collection of DOM sections. Develop a
consistent virtual camera language. The camera can push in, pull out, pan, orbit,
track, tilt, change focus, shift depth, move between planes, change perspective.

But motion should remain controlled. Avoid motion sickness. Avoid unnecessary
camera movement. Use camera movement to tell the story.

### 11 — ADD DEPTH

Create a convincing sense of physical depth: paper plane, product plane, desk
plane, background plane, shadows, reflections, depth of field, perspective,
lighting, object scale.

Even if everything remains technically 2D, the user should feel like they are
looking into a physical world.

### 12 — MAKE THE PRODUCTS FEEL PHYSICAL

The products are extremely important. Do not treat them as ordinary `<img>`
elements. Create physical behavior.

A pencil can roll slightly, slide, stop naturally, cast a changing shadow.
A pen can rotate, move across paper, leave a visual trace.
A notebook can open, shift, turn, reveal another layer.
Scissors can subtly rotate, create a recognizable silhouette.
Glue can move like a physical object.

But only use interactions that make sense for the object. The goal is physical
plausibility, not physics-demo gimmicks.

### 13 — CREATE A MATERIAL SYSTEM

Different objects should feel different. Paper should feel like paper. Plastic
like plastic. Metal like metal. Ink like ink. Graphite like graphite.

Use shadows, highlights, texture, subtle grain, lighting, motion, occlusion and
depth to create material distinction. Do not rely on excessive filters.

### 14 — DESIGN A COHERENT LIGHTING SYSTEM

Create a consistent lighting direction across the experience. Lighting should
evolve naturally as the camera moves.

Opening: soft daylight. Drawing: focused desk light. Product world: bright clean
product lighting. Product detail: more dramatic controlled lighting. Final brand
scene: strong APOLO identity lighting.

The lighting should help tell the story.

### 15 — MAKE SCROLLING FEEL INTENTIONAL

Scrolling should not simply move the page. Scrolling controls the cinematic
experience. Consider scroll velocity, scroll direction, scroll progress, scene
progress, camera movement, object movement, transition timing.

If the user scrolls slowly the animation should have time to breathe. If they
scroll quickly the system should remain coherent. Do not allow fast scrolling to
completely destroy the narrative.

### 16 — ADD SCENE CHAPTERS

Create an internal scene/chapter system, e.g. INTRO · DRAW · TRANSFORM ·
NOTEBOOK · PRODUCTS · EXPLORE · BRAND · END.

This should make the experience easier to control and improve. Potentially
provide a progress indicator, chapter navigation, scene transitions, replay, and
jump-to-section. But keep the UI minimal. Do not cover the experience with HUD
elements.

### 17 — DESIGN A BEAUTIFUL NAVIGATION SYSTEM

Create a navigation system appropriate for the brand. Do not automatically use a
generic hamburger menu. Explore something more interesting: notebook tabs, page
navigation, stationery labels, floating paper navigation, a subtle index system,
category markers.

The final choice should be yours. The navigation must be intuitive, fast,
accessible, mobile friendly and visually integrated.

### 18 — CREATE PRODUCT CATEGORIES AS EXPERIENCES

Categories should not just be text links. Pens could visually introduce a
pen-based world. Pencils could introduce drawing. Notebooks could introduce
paper. School Supplies could introduce a desk. Use visual storytelling. Each
category transition should feel intentional.

### 19 — CREATE A PRODUCT DETAIL EXPERIENCE

When a user selects a product, create a high-quality detail transition.
Potential information: product name, category, product type, visual details,
usage, related products.

Do not overcrowd the screen. Prioritize: product → visual → essential
information.

### 20 — CREATE A "DESK WORLD"

Consider creating a large interactive desk environment containing notebooks,
pencils, pens, scissors, glue, rulers, paper, drawings and school objects. The
user can explore the desk. Objects should respond subtly to interaction. This can
become one of the main interactive sections.

### 21 — ADD MAGNETIC / PHYSICAL UI

Where appropriate, use subtle physical interaction: CTA slightly follows the
cursor, product cards have magnetic movement, buttons have physical press
behavior, navigation tabs shift slightly, products respond to proximity.

Keep it elegant. Never let interaction become annoying.

### 22 — DESIGN THE CURSOR SYSTEM YOURSELF

You have complete freedom to decide whether a custom cursor is appropriate. If
you implement one it should be subtle, useful, branded, responsive and
mobile-safe. Potential states: default, product, clickable, navigation, zoom,
drag.

Do not make a giant flashy cursor simply because custom cursors are fashionable.

### 23 — SOUND DESIGN

You decide the best sound strategy. Consider paper movement, pencil movement,
subtle clicks, product interactions, transitions, CTA interaction, ambient desk
sound, optional music.

Sound must never become annoying. Provide mute/unmute, graceful fade, sensible
default behavior, no unexpected autoplay problems. If sound does not meaningfully
improve the experience, keep it subtle.

### 24 — TYPOGRAPHY

Review the existing typography from scratch. Check hierarchy, font sizes, line
height, letter spacing, alignment, responsive scaling, product labels,
navigation, CTA, metadata.

Typography should feel like part of the physical stationery system. Explore
relationships between handwritten-style elements, editorial typography, notebook
labels, product typography and brand typography. But do not create a chaotic type
system.

### 25 — RESPONSIVE DESIGN IS NOT OPTIONAL

Mobile should NOT be "desktop but smaller." Design mobile independently.

Test 320px, 375px, 390px, 430px, tablet, laptop, desktop, large desktop.

Create mobile-specific composition, camera framing, object positioning,
transitions, navigation, product exploration and touch interactions. If a desktop
interaction does not work on touch, invent a better mobile interaction. Do not
simply disable it.

### 26 — TOUCH INTERACTION

On mobile consider tap, long press, drag, swipe, pinch where useful, touch
proximity, scroll-controlled interaction. Do not overload the user with gestures.
Use gestures only when discoverable.

### 27 — PERFORMANCE

You are free to use whatever technology is appropriate. Do not artificially
restrict yourself to the existing technical approach if a better solution is
justified. You may consider GSAP, ScrollTrigger, Lenis, WebGL, Three.js, shaders,
canvas, SVG, advanced CSS, other appropriate libraries.

But: do not add technology simply because it is impressive. Every dependency must
have a purpose. The final website must remain fast.

Optimize images, textures, fonts, animation, rendering, GPU usage, memory, mobile
performance. Avoid unnecessarily huge JavaScript bundles.

### 28 — PERFORMANCE MODES

Create intelligent fallbacks: High quality (full visual experience), Balanced
(reduced effects), Performance (reduced rendering complexity), Reduced motion
(accessible simplified motion).

Do not make the fallback feel broken. It should feel intentionally designed.

### 29 — ACCESSIBILITY

Include reduced motion, keyboard navigation, focus states, readable contrast,
semantic structure, accessible buttons, accessible navigation, meaningful labels,
touch targets. Do not sacrifice accessibility for visual effects.

### 30 — LOADING EXPERIENCE

Do not show a boring "Loading..." screen. Make loading part of the APOLO world:
a page being drawn, a pencil preparing, a notebook opening, products gradually
appearing. The loading experience should establish the brand before the site is
ready.

### 31 — ERROR HANDLING

If an asset fails, do not allow the entire experience to collapse. Create elegant
fallbacks. If a product image is unavailable: use a fallback asset, preserve
composition, preserve interaction, log useful debugging information. No broken
layouts.

### 32 — RANDOM MICRO-VARIATION

You may introduce small controlled variations: slightly different pencil angle,
tiny product rotations, subtle paper movement, different object offsets. But
randomness must be deterministic or controlled. The experience should never feel
broken.

### 33 — MAKE THE WEBSITE FEEL ALIVE

The site should have subtle environmental motion: paper breathing, tiny lighting
changes, subtle object movement, soft shadows, atmospheric motion, slight desk
movement. The user should feel "this world is alive." But keep it restrained.

### 34 — CREATE A STRONG FINAL PAYOFF

The ending is extremely important. You decide what the best final scene should
be. Do not automatically use logo + button unless that is genuinely the best
solution.

The ending should feel earned. Potentially: the entire world reorganizes,
products settle, lines align, the notebook closes, the camera pulls away, the
visual noise disappears, the APOLO identity becomes clear, then the CTA appears.
The ending should create a feeling of completion.

### 35 — CTA

Create a CTA that feels like part of the physical world. Avoid "SHOP NOW" in a
generic button. Potentially use a notebook label, paper tab, stationery object,
drawn button, physical sticker, page marker. But choose the best approach
yourself.

### 36 — DO NOT MAKE IT TOO BUSY

This is extremely important. Maximum creativity does NOT mean maximum effects.

Use contrast. Some moments should be quiet, minimal, empty, slow — followed by
energetic, dense, colorful, interactive. This creates rhythm.

### 37 — MOTION DESIGN PRINCIPLES

Every animation should have: Purpose (why is it moving?), Origin (where did it
come from?), Destination (where is it going?), Weight (how heavy does it feel?),
Timing (how fast should it happen?), Relationship (what other objects react?),
Consequence (does the movement affect the environment?).

Avoid animation where every element moves independently. Objects should react to
each other.

### 38 — BUILD A MOTION LANGUAGE

Define a consistent motion system. Paper: soft / flexible. Pencil: fast /
precise. Product: physical / weighted. Typography: clean / controlled. Brand:
confident / energetic. Use this system consistently.

### 39 — AVOID GENERIC AI WEBSITE DESIGN

This is a major instruction. Do NOT produce something that looks like a generic
AI landing page, startup website, template website, excessive glassmorphism,
random gradients, generic 3D blobs, generic particle background, excessive neon,
dashboard UI, meaningless cards, or overused scroll animations.

The experience must feel specifically designed for APOLO STATIONERY.

### 40 — USE THE REAL BRAND AS THE SOURCE OF TRUTH

Use the actual APOLO assets and visual language whenever possible. Do not replace
real products with generic placeholders. Do not invent fake products. Do not
distort product photography unnecessarily. Do not create a fictional brand
identity unrelated to APOLO.

The goal is: make APOLO look better, not make a different company.

### 41 — CREATIVE FREEDOM

You have maximum creative freedom. If you believe the current hero should be
redesigned, redesign it. If the current product section is fundamentally wrong,
rebuild it. If a different interaction model would be dramatically better,
implement it. If a library will produce a substantially better experience, use
it. If the existing code architecture is limiting the creative result, refactor
it.

Do not ask for permission for every improvement. Make strong creative decisions.

### 42 — BUT DO NOT REBUILD FOR THE SAKE OF REBUILDING

Every major change should satisfy at least one of: better storytelling, better
brand expression, better product discovery, better interaction, better usability,
better visual hierarchy, better responsiveness, better performance, better
emotional impact.

If it doesn't improve one of those, don't do it.

### 43 — CREATE A DESIGN SYSTEM

Before final implementation, establish reusable systems for spacing, typography,
colors, shadows, product cards, product detail, buttons, navigation, scene
transitions, motion, camera, lighting, responsive breakpoints.

Do not create hundreds of one-off styles.

### 44 — CREATE REUSABLE INTERACTION COMPONENTS

Build reusable systems for product interaction, hover states, selection, scene
transitions, camera movement, scroll scenes, touch interactions, modal/detail
views, CTA interactions. The code should remain understandable.

### 45 — ARCHITECTURE

Keep the code maintainable. Separate content, product data, assets, animation,
interaction, layout, visual effects and utilities. Do not create one enormous
JavaScript file.

### 46 — DEBUG MODE

Create a development-only debug system. It may include current scene, scroll
progress, animation progress, FPS, active product, camera position, viewport,
performance mode. This should be disabled in production.

### 47 — TESTING

After implementation, test the entire experience.

Desktop: Chrome, Safari if available, Firefox if available.
Mobile: iOS-style viewport, Android-style viewport.

Test scrolling, clicking, hovering, touch, navigation, product selection,
transitions, sound, reduced motion, loading, asset failures, resize, orientation
changes.

### 48 — VISUAL QA

Do not trust the code. Actually look at the result. Capture or inspect important
states:

1. opening
2. pencil entrance
3. drawing
4. house
5. notebook transformation
6. ruled paper
7. products appearing
8. full product composition
9. product interaction
10. product detail
11. category experience
12. brand section
13. final CTA
14. mobile opening
15. mobile product interaction
16. mobile final state

Fix anything that looks wrong.

### 49 — ITERATE MULTIPLE TIMES

Do not stop after the first successful implementation. Use this cycle:

Pass 1 make it work · Pass 2 make it visually strong · Pass 3 make it
interactive · Pass 4 make it responsive · Pass 5 make it polished · Pass 6 remove
unnecessary effects · Pass 7 improve performance · Pass 8 final visual QA.

The final result should look like it has gone through multiple professional
design reviews.

### 50 — SELF-CRITIQUE BEFORE FINISHING

Before declaring the project complete, ask yourself:

If I saw this on Awwwards, would I remember it? Does it feel specifically like
APOLO? Are the products presented beautifully? Does interaction have purpose?
Does the user discover something through interaction? Does the story make sense
without explanation? Does the animation feel physical? Does the camera feel
intentional? Does mobile feel designed rather than adapted? Does anything feel
generic? Does anything feel like an unnecessary gimmick? Is there a clear
emotional payoff? Would a professional creative director approve this?

If the answer is no: keep working.

### 51 — IMPORTANT: YOU MUST MAKE CREATIVE DECISIONS

For the following areas, you choose the best solution rather than waiting for me:
cinematic direction, final logo behavior, cursor system, sound strategy,
navigation design, final CTA, transition architecture, technology stack,
lighting, camera behavior, product interaction model, mobile interaction model,
section structure.

I do NOT want you to ask me to choose between dozens of technical options. You
are the designer. Make the decision.

### 52 — DO NOT ADD USER DRAWING

The experience should be interactive, but I specifically do not want a drawing
canvas where the visitor has to draw. The original drawing sequence should remain
a cinematic storytelling device.

Interactivity should instead focus on products, environment, navigation,
exploration, physical interaction, camera, objects and discovery.

### 53 — NO EASTER EGGS

Do not add hidden Easter eggs. Focus entirely on quality, storytelling,
interaction, product discovery, usability, and brand experience.

### 54 — NO NEED FOR EXTERNAL RESEARCH

Do not spend a large amount of time researching external websites. You already
have enough creative freedom. Prioritize the actual APOLO project and its assets.
If you already know a technique that is appropriate, use it. Do not waste time
collecting references instead of improving the website.

### 55 — DELIVERABLES

At the end, provide:

**A. Implemented website** — the actual working experience.

**B. Design audit** — what was weak, what you changed, why you changed it, what
you intentionally preserved.

**C. Feature list** — document every major new feature.

**D. Architecture** — explain the major technical systems.

**E. Interaction map** — how users interact with products, scenes, navigation,
CTA, mobile.

**F. Responsive behavior** — desktop/tablet/mobile differences.

**G. Performance** — major optimizations, heavy assets, animation strategy,
fallback behavior.

**H. Accessibility** — reduced motion, keyboard, focus, semantic structure,
touch.

**I. Remaining weaknesses** — be honest. If something is still not perfect, say
so. Then prioritize what should be improved next.

### 56 — FINAL STANDARD

The goal is NOT "make a cool stationery website."

The goal is: create an interactive APOLO Stationery world that feels like a
physical notebook, desk, product catalogue, and cinematic film have been
transformed into one digital experience.

It should feel: playful, physical, cinematic, interactive, brand-specific,
product-focused, memorable, fast, responsive, intentional.

And most importantly: **IT SHOULD FEEL DESIGNED.**

Not assembled. Not templated. Not AI-generated. Not like a collection of
effects. It should feel like a professional creative team spent a serious amount
of time crafting every transition, interaction, object, composition, and detail.

### START NOW

1. inspect the project
2. run it
3. understand it
4. audit it
5. identify its strongest elements
6. identify its weakest elements
7. create your improvement strategy
8. implement the transformation
9. test it
10. visually QA it
11. iterate
12. optimize
13. document the final result

Do not stop at the first version that technically works. Keep improving until the
experience feels genuinely exceptional.
