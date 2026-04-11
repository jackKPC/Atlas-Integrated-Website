# Ludington House — 2026 Modern Site

A modern single-page website for the Ludington House historic estate, built with vanilla HTML, CSS, and JavaScript.

## Structure

```
Ludington House/
├── index.html          # Main single-page site
├── css/
│   └── style.css       # All styling + animations
├── js/
│   └── main.js         # Reveal animations, nav, parallax
├── assets/
│   ├── logo.svg        # Monogram placeholder logo
│   └── images/         # Drop real photos here
└── README.md
```

## Features

- Sticky glass-morphism navigation
- Cinematic hero with animated gradient orbs + parallax on mouse
- IntersectionObserver scroll-reveal fade-ins (with staggered delays)
- Bento-grid gallery
- Dark contact section with working form UX
- Fully responsive, reduced-motion safe
- No build tools — open `index.html` in a browser

## To Replace With Real Content

The site was built without access to `luddingtonhousect.com` (blocked by egress).
Swap in real content here:

1. **Logo** — replace `assets/logo.svg`
2. **Images** — drop photos into `assets/images/` and replace the CSS gradient classes (`.card__media--1`, `.bento__img--1`, etc.) with `background-image: url(...)`
3. **Copy** — hero, about, services, testimonials, and contact info are placeholder
4. **Contact details** — update email/phone/address in `index.html` footer + contact section
