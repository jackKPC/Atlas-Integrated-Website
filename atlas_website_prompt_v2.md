# Claude Code Prompt: Atlas Integrated Website — atlasintegrated.ai

---

## Project Overview

Build the complete marketing website for **Atlas** — an enterprise-grade AI-powered deal management platform built specifically for investment bankers. The site lives at **atlasintegrated.ai**. This is a premium B2B product competing in the lower-middle-market investment banking space. Every design and copy decision must reflect the sophistication, precision, and trust that investment bankers demand.

**Read and internalize the full UI/UX skill before writing a single line of code:**
`https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`

Apply every directive from that skill throughout this entire build.

---

## Brand Identity

**Brand name:** Atlas  
**Parent company:** Atlas Integrated  
**Domain:** atlasintegrated.ai  
**Tagline:** Built for investment bankers, by investment bankers.  
**Secondary slogan:** AI has arrived for investment banking. Don't get left behind.

**Brand colors:**
- Primary: `#1f3356` (deep navy)
- Background/secondary: off-white (`#f7f6f2` range)
- Accent: derive a precise, restrained gold or warm amber from the navy — something that reads as "elite financial services," not startup. Test multiple options and choose the one that feels most refined.
- All color tokens must be defined in OKLCH for modern browser precision, implemented as CSS custom properties with hex fallbacks.

**Typography direction:**
- Display font: something architectural and confident — consider typefaces used by elite financial institutions, strategy consultancies, or premium editorial publications. Serif or high-contrast geometric sans. Must convey authority without being stiff.
- Body font: clean, legible, modern — the kind used in Bloomberg terminals, FactSet, or CapIQ. Excellent at small sizes with good numeric rendering (font-variant-numeric: tabular-nums).
- Source from Fontshare first, then Google Fonts. Do not use system fonts as primary choices.

**Design tone:** Restrained. Institutional. Precise. Zero decoration for decoration's sake. Think Bloomberg Professional, Refinitiv Workspace, or a white-glove M&A advisory firm's brand identity. Not a startup. Not SaaS-y. The visual language should feel like it belongs in a Goldman Sachs pitch deck.

---

## Visual Identity: The Atlas Globe

The centerpiece of the brand is a **high-resolution, custom-crafted SVG globe** — the Atlas globe. This is not a generic wireframe sphere. Requirements:

- Built entirely in SVG — every meridian, parallel, and node is hand-crafted vector geometry. No rasterized elements.
- Renders at full fidelity at any viewport size — fully scalable.
- Depth and dimension achieved through carefully considered stroke weights, layered opacity gradients, and precise arc geometry — not drop shadows or blur filters.
- The globe uses the brand navy and off-white palette with fine, precise linework. Meridians and parallels rendered as exact arcs suggesting a cartographic instrument — the tool of a navigator, not a tech startup icon.
- Animates with a slow, deliberate rotation — continuous, smooth, perpetual spin on the vertical axis. The rotation should feel weighty and authoritative, like a physical globe, not a loading spinner.
- Capability nodes orbit the globe — each one is a precisely designed custom SVG icon that traces an elliptical orbital path at different inclinations and speeds. The orbital system evokes interconnected financial systems around a central intelligence platform.
- The globe and its orbital system is the visual anchor of the entire site.

---

## Icons and Visual Assets

**No emojis. No third-party icon libraries. No icon fonts.**

Every icon in this site must be a **custom-designed inline SVG** created specifically for Atlas. Each icon should:
- Be drawn at a 24x24 viewBox baseline, scalable to any size
- Use strokes as the primary design language — consistent 1.5pt stroke weight at base size
- Feel like they could belong in a premium financial data terminal — Bloomberg, FactSet, or CapIQ
- Be geometrically precise — use grids, consistent angles, and mathematical proportions
- Reflect the specific concept they represent with visual specificity, not generic substitutions

Design distinct custom SVG icons for each of the ten capabilities, plus all navigation icons, UI controls, form elements, and section markers throughout the site. Every icon is original to this project.

---

## Atlas Capabilities — The Orbital System

These are the features that orbit the globe in the hero and populate the Features section. For each, create a custom icon and write precise, benefit-led copy.

1. **AI Deal Tracking** — Intelligent pipeline management that learns deal patterns, flags at-risk transactions, and surfaces next actions without manual logging.

2. **Campaign Design & Management** — Full-cycle origination campaign builder with targeting logic, send sequencing, and performance analytics across every active mandate.

3. **Outreach** — Multi-channel engagement execution with AI-assisted personalization at scale across email, phone, and LinkedIn.

4. **Contact Sourcing** — Proprietary contact discovery and enrichment engine pulling from verified data sources with automatic deduplication and relationship mapping.

5. **Buyers List Generation** — A four-phase buyer identification process: mandate intake and universe scoping, comprehensive Pitchbook search across financial and strategic acquirers, proprietary AI-driven web research, and ranking based on fit against your engagement history and deal parameters. The output is a living document, refined as the process advances.

6. **AI Inbox & Meeting Monitoring** — This is the centerpiece capability and should be treated as such in copy and visual weight. The core value proposition: Atlas dramatically reduces the headcount required to operate a deal. By monitoring email threads and calendar activity in real time, Atlas extracts deal signals, surfaces follow-up obligations, drafts correspondence, and logs activity automatically — without a banker touching the CRM. A deal that previously required three people managing the administrative overhead can run leaner. Position this as the capability that changes the staffing economics of running a mandate, not just a productivity feature.

7. **Native Pitchbook Integration** — Direct data bridge to Pitchbook for company profiles, financial comparables, and market intelligence with zero manual re-entry into the deal record.

8. **Valuation Workshop** — Integrated modeling environment with real-time scenario analysis and output-ready formatting for client deliverables.

9. **Virtual Data Room** — Secure, permissioned document management with granular access logging, watermarking, and buyer-side activity tracking surfaced directly in the deal record.

10. **Reporting** — On-demand report generation from live deal data. Copy should be intentionally vague about specific report types — position this as flexible, deal-stage-appropriate output rather than naming specific formats. Do not enumerate specific report names.

---

## Site Architecture

### Page 1: Landing / Home

**Section 1: Intro Sequence (Full-Screen, Above the Fold)**

The page loads with a cinematic intro sequence:
- The Atlas globe renders at center screen, already slowly rotating, at approximately 60% of viewport width
- A brief 600ms pause while the globe settles and orbital nodes begin tracing their paths
- The globe then slides smoothly to the right half of the viewport via a custom cubic-bezier easing curve — decelerate into final position over approximately 1.2 seconds
- Simultaneously, headline copy fades and translates in from the left:
  - Large display heading: **"Atlas"**
  - Subhead: **"Built for investment bankers, by investment bankers."**
  - Single CTA button: **"Book a Demo"**
- As the globe settles, orbital nodes appear sequentially — each traces into its elliptical path with a subtle draw animation, one after another
- Each orbital node label (capability name) appears on hover — rendered in the brand font, just text appearing cleanly at the node's position, no tooltip box

This intro sequence should feel like the opening of a Bloomberg terminal session or a high-end financial platform authentication screen — not a product hunt launch animation.

**Section 2: The Platform Statement**

A single, wide section establishing the category and the problem:
- Left column: two or three sentences of precise, unfluffed copy establishing the problem — investment banking deal workflows are fragmented across spreadsheets, inboxes, and CRMs that were never designed for this work
- Right column: a structured display or diagram contrasting the old fragmented workflow with the Atlas unified platform — a precise custom SVG diagram, not a stock illustration
- No icons in colored circles. No bullet lists. Copy and structure carry the weight.

**Section 3: AI Inbox & Meeting Monitoring — Feature Spotlight**

Before the full capabilities grid, give AI Inbox & Meeting Monitoring its own dedicated section with elevated visual weight. This is the capability that most directly speaks to the economics of running a deal. Structure:
- Section headline that speaks to the staffing overhead problem — something like "One platform. Fewer hands on the wheel." — but written with the precision and restraint of the brand voice
- Body copy that articulates the problem: deals require constant administrative coordination — tracking email threads, logging calls, remembering follow-ups, updating the CRM after every touch. At most firms, that overhead consumes hours per deal per week across multiple team members.
- Atlas solution copy: by monitoring email and calendar activity natively, Atlas handles the administrative layer automatically. The deal record stays current. Nothing falls through. And the team working the mandate can be smaller without the deal running slower.
- Place the secondary slogan here as a section-closing statement: **"AI has arrived for investment banking. Don't get left behind."** — render this in display type, restrained, not as a call-out box or badge. It should feel like a declaration, not marketing copy.
- Include a custom SVG diagram illustrating the monitoring and logging loop

**Section 4: Capabilities**

The ten capabilities in a deliberate, asymmetric composition:
- AI Deal Tracking rendered full-width as the featured item with expanded copy and a custom diagram
- The remaining nine in a responsive grid — custom SVG icons, capability name, and a single-sentence value statement per card
- On hover, each capability card lifts slightly and reveals one additional sentence of copy
- Grid has visual hierarchy — not every item carries equal visual weight

**Section 5: Built Different**

Three or four specific differentiation claims against the general CRM and deal management space. Specific, not generic:
- Purpose-built data model for IB deal structures: mandates, buyers, sellers, process stages, NDAs, IOIs, LOIs, and closing mechanics
- Native integrations that eliminate data re-entry across email, calendar, Pitchbook, and data room
- Workflow design by practitioners who have run hundreds of lower-middle-market mandates
- AI trained on deal-stage language, not generic business process terminology

**Section 6: Trust and Social Proof**

Placeholder-ready section for client logos, testimonials, or case study pull quotes. Proper layout structure — horizontal logo row or a large-format pull quote with firm name and role attribution. Style matches the site's restraint. Comments in the code indicate exactly where real content is inserted.

**Section 7: Book a Demo**

Full-width, navy-background section:
- Short, declarative headline
- Two-field form: Name, Work Email — with client-side validation (email format, required fields)
- Single primary CTA button: **"Book a Demo"** — solid navy-inverted, off-white text, no gradient
- Brief privacy statement below the form
- Success state: form transitions to a confirmation message without a page reload

**Section 8: Footer**

- The Atlas globe mark at small scale (same SVG, no animation)
- Navigation links mirroring the top nav
- Copyright, privacy policy, terms of service links
- atlasintegrated.ai
- Minimal. Nothing decorative.

---

### Page 2: Product — Capabilities Deep Dive

Detailed walkthrough organized into three workflow groupings:

**Origination:** Contact Sourcing, Buyers List Generation, Campaign Design & Management, Outreach  
**Execution:** AI Deal Tracking, AI Inbox & Meeting Monitoring, Pitchbook Integration  
**Delivery:** Valuation Workshop, Virtual Data Room, Reporting

For each capability within each group:
- Capability name as section heading
- 3-5 sentences of precise description — what it does, the problem it solves, the workflow it replaces
- A custom SVG illustration or schematic specific to that capability's function
- A concrete, specific use case example written in deal practitioner language

AI Inbox & Meeting Monitoring should receive proportionally more space on this page — a longer description, a more detailed diagram, and a more fully developed use case. It is the platform's most differentiated capability in terms of staffing economics.

For the Reporting capability: write the copy to convey the breadth and flexibility of output without naming specific report types. Focus on the value — client-ready output generated from live deal data, formatted for the audience, available on demand.

---

### Page 3: About

**Atlas story and team positioning.** Copy direction:
- Atlas was built by practitioners — people who have run lower-middle-market sell-side and buy-side mandates and encountered the gap between enterprise platforms designed for bulge brackets and the spreadsheet-and-Gmail reality that most boutique firms operate in
- Position the builder as operator first, technologist second — someone who lived the problem before building the solution
- Emphasize the domain expertise embedded in the product: the data model, the workflow design, the language the AI understands
- No mission statement boilerplate. No vision-mission-values framing. Specific, grounded language only.

Section structure:
1. The origin: the problem as lived experience, told specifically. "Atlas was born at an investment bank"
2. The build: why building it from scratch was the only viable answer. Our competitors are built wide, customizable to many use cases on decades old architecture. They have modern features, but they're tacked on to archaic harnesses. They had proved slow, difficult to learn, bloated, and archaic. Building our own was the only option. 
3. The philosophy: AI in Atlas is invisible infrastructure — it surfaces the right information at the right moment without requiring bankers to change how they work

---

### Page 4: Pricing

A single, intentionally sparse page:
- Headline that frames the conversation without publishing a price grid
- Copy: "Atlas pricing is structured to fit your firm — whether you are a two-person boutique or a 30-professional regional bank. We scope engagements based on team size, deal volume, and integration requirements."
- Single CTA: Book a Demo
- Brief description of what onboarding looks like: timeline, what is required from the firm, what Atlas provides.
We port atlas to your Microsoft infastructure, Streamlining data compliance and AI token billing. We partner exclusively with Azure's OpenAI model deployments so that you own your data. It never goes to any third party. Ever.

---

## Navigation

Sticky, fixed-position top navigation:
- Left: Atlas SVG logotype — a true custom SVG wordmark or logomark, not a styled heading. Should evoke cartography, navigation, and precision.
- Center: Product, About, Pricing
- Right: "Book a Demo" — primary CTA button, navy fill, off-white text
- Scroll behavior: on scroll past the hero section, the nav gains a subtle off-white background with a 1px bottom border in low-opacity navy — not a drop shadow, just clean separation
- Mobile: collapses to a hamburger toggle. Opens a full-screen overlay in deep navy with off-white navigation links at display size. Close button top right.

---

## Animation and Motion

All motion follows the UI/UX skill's motion principles. Atlas-specific direction:

- **Globe rotation:** perpetual, smooth, 35-second full rotation cycle. Easing: linear — no ease-in/out on a continuous rotation. Implemented via CSS animation on a transform group, not JavaScript requestAnimationFrame.
- **Orbital paths:** elliptical animations using offsetPath or rotate/translate combinations. Each node has a distinct orbital period (15s through 45s), a distinct inclination angle, and a distinct orbital radius. Nodes occupy different planes — not all equatorial. The system looks three-dimensional.
- **Intro sequence:** globe slides to right using cubic-bezier(0.16, 1, 0.3, 1) — fast initial movement, clean deceleration into final position. Duration: 1.2s. Text elements follow at 300ms stagger.
- **Orbital node draw-in:** nodes appear sequentially after the intro completes, fading in and beginning their orbits. 150ms stagger between nodes.
- **Scroll reveals:** opacity 0 to 1, translateY from 16px to 0. Duration: 400ms. Sibling stagger: 80ms. Triggered at 15% element visibility via IntersectionObserver.
- **Card hover:** translateY(-2px) + shadow increase. Duration: 180ms. cubic-bezier(0.16, 1, 0.3, 1).
- **No bounce. No spring. No elastic.** This is financial infrastructure.
- **prefers-reduced-motion:** globe remains static at its final position, orbital nodes render in place without animation, scroll reveals are instant, all transitions disabled.

---

## Copy and Marketing Strategy

Atlas must be positioned precisely in the lower-middle-market IB software landscape. Every page of copy should reflect this strategic frame.

**Target audience:** Managing directors, VPs, and senior associates at boutique and regional investment banks focused on lower-middle-market M&A, growth equity, and debt advisory. Firms with 3 to 50 professionals. Deal sizes typically $10M to $500M in enterprise value.

**Competitive positioning:**
- Above Atlas: DealCloud, Navatar, Salesforce Financial Services Cloud — enterprise price tags, 6-month implementation timelines, built for bulge bracket complexity. Overkill for a 10-person shop.
- Adjacent to Atlas: generic CRMs retrofitted for banking — Salesforce, HubSpot, Affinity. Wrong data model. Manual everything. No deal-stage intelligence.
- Below Atlas: spreadsheets, Airtable, Notion. Functional at low volume, not scalable past 5 active mandates.
- **Atlas:** purpose-built for this segment. The sophistication of enterprise deal management. The speed and simplicity of modern software. A price point and implementation timeline that works for a boutique.

**Voice and copy rules:**
- Never use: "streamline," "leverage," "synergy," "empower," "unlock the power of," "transform your business," "journey," "seamlessly," "all-in-one solution," "robust," or "cutting-edge."
- Write as if a senior banker is speaking to a peer. Precise. Direct. No hedging, no filler.
- Claims must be specific where possible. Only make claims that can be substantiated. Where specific numbers are not yet available, use "designed to" or "built for" qualifiers.
- Every sentence earns its place. If it can be removed without losing meaning, remove it.
- Do not enumerate specific report names or specific output types for the Reporting capability — keep that copy broad and benefit-led.

**Key messages to embed across the site:**
1. Atlas understands deal language — mandates, process stages, buyers, NDAs, IOIs, LOIs, closings, and fees — because it was designed by people who speak it natively.
2. The AI in Atlas is invisible infrastructure. It surfaces the right information at the right moment. It does not interrupt, explain itself, or require configuration.
3. Atlas reduces the administrative overhead of running a deal — the same mandate, fewer people managing the coordination layer.
4. Implementation is measured in days, not months. Your existing workflow is enhanced, not replaced.
5. Your data belongs to your firm. Atlas does not aggregate, resell, or cross-reference client data across accounts.

---

## Technical Requirements

- Static HTML, CSS, and JavaScript — no server-side dependencies, production-grade code structure
- All SVGs must be inline or loaded as optimized SVG files — no rasterized icons or graphics anywhere
- Full light and dark mode: dark mode maps the deep navy surfaces to a near-black warm dark background, inverts the off-white to a warm dark surface, and ensures the globe and orbital system look exceptional in both modes. Theme toggle in the navigation.
- Responsive at 375px, 768px, 1024px, and 1440px+. The globe scales cleanly at every breakpoint.
- Mobile behavior: on viewports below 768px, the orbital animation renders simplified or pauses. Capabilities are presented as a scrollable list below the globe. The globe remains the hero visual at full-width.
- The Book a Demo form validates on the client side — email format, required fields — and transitions to a success confirmation without a page reload on valid submission.
- Performance: total initial page weight under 1MB. All animations use transform and opacity only — hardware-accelerated, no layout thrashing.
- Semantic HTML throughout — main, nav, section, article, header, footer used correctly. One h1 per page. Heading hierarchy unbroken.
- Every interactive element has a keyboard-accessible state and a visible focus indicator.
- aria-label on all icon-only controls. Alt text on all non-decorative content images.

---

## Quality Gates

Before the build is complete, verify each of the following:

- Globe rotation runs smooth and continuous — no jitter, no dropped frames
- All ten orbital nodes have distinct, custom SVG icons visible and recognizable at small sizes
- Orbital paths occupy different planes and periods — the system looks three-dimensional, not flat
- Intro sequence timing feels deliberate and cinematic — not rushed, not sluggish
- Hero heading reads "Atlas" — not "Enter: Atlas" or any other variation
- Secondary slogan "AI has arrived for investment banking. Don't get left behind." appears in the AI Inbox & Meeting Monitoring spotlight section, rendered in display type, not as a badge or callout box
- All CTAs read "Book a Demo" — not "Request Access" or any other variation
- AI Inbox & Meeting Monitoring receives elevated visual weight and copy depth relative to other capabilities
- Reporting copy is intentionally broad — no specific report types named
- Buyers List Generation copy describes the four-phase process without overpromising on specific outputs
- Dark mode is genuinely beautiful, not merely functional
- Mobile at 375px: globe is the hero visual, all text is legible at 16px minimum, CTAs have 44px minimum tap targets
- None of the banned copy words appear anywhere on the site
- No generic AI aesthetic markers: no gradient buttons, no icons in colored circles, no centered-everything layout, no glowing background orbs
- Navigation sticky behavior is smooth with no layout shift on scroll
- Book a Demo form validates correctly and transitions to success state cleanly
- Every custom SVG icon is original to this project — no icon library substitutions
