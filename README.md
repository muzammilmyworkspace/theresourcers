# The Sourcers — website

Cinematic marketing site: preloader, page transitions, custom cursor, smooth scroll,
3D globe, crane → truck scroll story, real-time WebGL ocean with a GPU ship wake,
plane fly-over wipe and a particle footer.

## Run
```
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the build locally
```

## Pages
| File | Namespace | What's on it |
|---|---|---|
| `index.html` | home | Hero globe, intro + stats, services scroll story, ocean, testimonials, partners, insights, FAQ |
| `about.html` | about | Story, stats, values, timeline slider, careers |
| `services.html` | services | Six service blocks, industries list |
| `contact.html` | contact | Contact details + enquiry form |

Shared chrome (loader, transition overlay, cursor, header, CTA, footer) lives in `partials/`
and is stitched into every page at build time by the small plugin in `vite.config.js`
(`<!--include:name-->`).

## Where to change things
- Colours, fonts, spacing: `src/styles/tokens.css`
- Copy: the HTML files and `partials/`
- Section animations: `src/sections/*.js` (home), `src/pages/*.js` (inner pages)
- Code-generated art (port scene, ship, plane, clouds, logos, covers): `src/core/*Art*.js`, `src/core/art*.js`

## Notes
- **Contact form has no backend yet.** `src/pages/inner.js → initContact` shows the success
  state after validation; connect it to your form service / API there.
- Preloader: the full intro plays on the first visit in a tab; later visits in the same tab
  play the short ring intro (`sessionStorage`).
- The WebGL ocean only runs on screens wider than 767px; phones get a lightweight CSS/SVG version.
- Partner names, testimonials, articles, address and stats are placeholders — replace with real ones.

## Build steps
1. ✅ Setup, design system, preloader, cursor, smooth scroll, header + menu, reveal system
2. ✅ Hero 3D globe, intro, stats
3. ✅ Crane → truck → road scroll story + speedometer
4. ✅ WebGL ocean, ship wake, cloud wall
5. ✅ Testimonials plane wipe, partners, insights, FAQ, CTA, particle footer
6. ✅ Page transitions (Barba), About / Services / Contact pages, mobile polish
