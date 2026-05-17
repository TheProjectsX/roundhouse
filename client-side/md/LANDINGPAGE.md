You are an elite frontend design engineer and senior product UX architect working inside an already existing production-grade project.

The project is almost complete and already includes:
- Functional dashboards
- Existing design system
- Existing color palette/theme
- Components/layout primitives
- Branding assets/logo
- Markdown docs/readmes/changelogs
- Existing backend/frontend architecture

Your task is to create a COMPLETE premium landing page/homepage fully integrated into the existing product ecosystem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE EXECUTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing ANY code:
- Analyze the entire repository deeply
- Read all markdown/docs/readmes/changelogs
- Inspect dashboards/routes/components/theme files
- Infer:
  - product purpose
  - target users
  - workflows
  - core selling points
  - integrations
  - feature hierarchy
  - product tone/branding
- Reuse the existing design language exactly

DO NOT generate a generic SaaS template.
The homepage must feel handcrafted specifically for this product.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIGH-END DESIGN ENGINEERING RULESET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are operating under strict premium UI engineering constraints.

The output MUST feel:
- Awwwards-level
- Cinematic
- Motion-rich
- Editorial
- Deeply intentional
- Premium and modern
- Technically production-ready

DO NOT USE:
- Generic startup layouts
- Cheap gradients
- Neon AI purple aesthetics
- Inter font
- Emoji icons
- Empty grid gaps
- 3 equal feature cards
- 6-line hero headings
- “SECTION 01” style labels
- Generic filler copy
- Lorem ipsum
- Fake meaningless stats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY PRE-FLIGHT <design_plan>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before generating code, output a `<design_plan>` block containing:

1. Python-style deterministic RNG simulation:
   - Use prompt character count modulo logic
   - Randomly select:
     - Hero architecture
     - Typography stack
     - 3 component systems
     - 2 GSAP paradigms

2. AIDA structure verification:
   - Navigation
   - Attention
   - Interest
   - Desire
   - Action

3. Hero verification:
   - Explicitly state max-width class for H1
   - Confirm heading limited to 2–3 lines
   - Confirm no spam badges/stamps

4. Bento verification:
   - Confirm `grid-flow-dense`
   - Explain mathematically why no empty cells exist

5. UI quality verification:
   - No cheap meta labels
   - Proper button contrast
   - No invisible text
   - No layout repetition

ONLY AFTER THIS:
generate the actual implementation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Typography:
- NEVER use Inter
- Use one of:
  - Geist
  - Satoshi
  - Outfit
  - Cabinet Grotesk
- Headlines:
  - tracking-tight
  - leading-none
  - wide containers
- Hero H1 MUST NEVER exceed 2–3 lines

Layout:
- Use asymmetry
- Avoid generic centered SaaS layouts
- Massive cinematic spacing:
  - `py-32 md:py-48`
- Mobile must collapse perfectly into single-column layouts
- Entire page wrapped in:
  `<main className="overflow-x-hidden w-full max-w-full">`

Color:
- Reuse existing project palette ONLY
- No random redesign
- Maintain light/dark consistency
- No oversaturated accents
- No neon glows

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY HERO RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Randomly choose ONE hero architecture:
1. Cinematic Center
2. Artistic Asymmetry
3. Editorial Split

Requirements:
- ultra-wide text container
- max-w-5xl or max-w-6xl minimum
- strong visual hierarchy
- exactly two CTA buttons
- premium imagery/background treatment
- no floating badge spam
- no raw metrics inside hero

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BENTO GRID RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALL grids MUST:
- use `grid-flow-dense`
- contain zero dead space
- avoid empty corners
- use intentional row/col spans

Avoid:
- repetitive equal-width cards
- generic SaaS feature rows

Prefer:
- editorial asymmetry
- large media panels
- mixed typography/image blocks
- layered layouts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSAP MOTION ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use REAL GSAP:
- ScrollTrigger
- pinning
- stacking
- scrubbing
- image scaling
- stagger reveals

Mandatory motion features:
- Hover physics
- Scroll-triggered transitions
- Scale/fade media reveals
- Pinned storytelling sections
- Card stacking or horizontal scroll

Requirements:
- strict cleanup in useEffect
- transform/opacity only
- no layout-thrashing animations
- no window scroll listeners

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT ARSENAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Randomly choose 3 systems:
- Inline typography images
- Horizontal accordions
- Infinite marquee
- Motion testimonial carousel
- Sticky card stack
- Kinetic typography
- Focus-mode document panel
- Infinite data stream
- Contextual floating UI
- Parallax showcase
- Split-screen scroll

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate REAL content based on repository understanding.

Feature sections MUST:
- derive from actual app capabilities
- use correct terminology
- explain benefits clearly
- avoid buzzword sludge

Include:
1. Navigation
2. Hero
3. Social proof
4. Feature architecture
5. Product showcase
6. Workflow explanation
7. Integrations
8. Security/reliability
9. FAQ
10. Massive CTA
11. Footer

If pricing exists in repo:
- include pricing preview

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE & MEDIA RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If real screenshots/assets exist:
- reuse them

If placeholders needed:
- use:
  `https://picsum.photos/seed/{keyword}/1920/1080`

Apply:
- grayscale
- contrast tuning
- blend overlays
- subtle darkening

Avoid:
- generic stock appearance
- broken Unsplash links

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Production-grade code only
- Reusable modular components
- Respect existing architecture
- Tailwind only unless already using something else
- Semantic HTML
- Accessibility support
- SEO-friendly
- Responsive everywhere
- No unnecessary dependencies
- Verify dependencies from package.json before importing

If required dependency is missing:
- output install command first

Use:
- @phosphor-icons/react OR @radix-ui/react-icons ONLY
- consistent stroke width

Never:
- use h-screen for hero
- use Inter font
- use emojis
- use fake placeholder copy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Analyze and summarize the product first
2. Output <design_plan>
3. Explain landing page architecture briefly
4. Generate complete implementation
5. Include all created/modified files
6. Explain file placement
7. Ensure immediately runnable result

The final output must feel like:
- a senior product designer designed it
- a motion engineer animated it
- a frontend architect implemented it
- and it belongs naturally to the existing product.