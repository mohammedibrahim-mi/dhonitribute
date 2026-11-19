# The Captain. The Calm. The Legacy.

A fan-made, interactive tribute to MS Dhoni — built from `ms_dhoni_tribute_website_build_spec.md`.
**Built by Miv Apps.**

> Independent fan tribute. Not created, approved or endorsed by MS Dhoni, the BCCI, CSK, the ICC or any sponsor.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm start          # serve ./out locally
```

Deploy: push to GitHub and import into Vercel (zero config), or upload the `out/` folder to any static host (Netlify, Cloudflare Pages, Firebase Hosting).

## Stack

Next.js 15 (App Router, static export) · TypeScript · GSAP + ScrollTrigger (pins, scrubbed timelines) · Lenis smooth scroll · plain CSS (`src/app/globals.css`) · Inter Tight / Inter / Bebas Neue (Fontsource) · Canvas API for the card.

Motion is modelled on santalarch.com: giant wordmark hero, sliding display type, stripe wipe light→dark, pinned slides over zooming background photos with word-by-word text brightening and an `01 | 03` counter, a pinned 3D word wall, sideways-drifting giant numbers, a pinned one-by-one trophy cabinet, parallax photo columns, and a footer that loops back to the wordmark. `prefers-reduced-motion` turns all of it off and shows a static page.

## Sections

| Section | Component | Notes |
|---|---|---|
| Hero `#home` | `HeroIntro.tsx` | Giant DHONI wordmark, "Captain / Cool / Legend" slide-in, stripe wipe to dark |
| The Calm `#calm` | `CalmSlides.tsx` | Pinned: Calm / Trust / Finish over aesthetic photos (zoom + crossfade) |
| — | `WordWall.tsx` | Pinned 3D wall of words, camera tilts and flies through |
| Titles `#titles` | `Titles.tsx` | 2007 · 2011 · 2013 · 5× IPL, giant numbers drifting sideways |
| Trophy Cabinet `#trophies` | `TrophyCabinet.tsx` | Pinned, one trophy photo per scroll step (42), hook + counter + progress rail |
| — | `FansParallax.tsx` | Aesthetic photos in three parallax columns |
| Lessons `#lessons` | `Lessons.tsx` | 11 one-line lessons that brighten as they cross the screen |
| — | `Closing.tsx` | "The innings may change. The lessons stay." word-by-word |
| Your Card `#tribute-card` | `TributeCardBuilder.tsx` | 1080 × 1350 PNG, made in the browser |
| `#built-by` | `BuiltBy.tsx` | Creator photo + Built by Miv Apps |
| `#about` | `Footer.tsx` | Disclaimer, sources, image credits, giant wordmark |

Trophy order is set in `src/data/trophies.ts`. Each image in `gallery.ts` has `kind`: `trophy` (cabinet), `aesthetic` (backgrounds/parallax only) or `other`.

Content lives in `src/data/` (timeline, achievements, qualities, leadershipLessons, gallery, sources, site) so copy and images can change without touching layouts.

## ⚠️ Before you publish (spec §18, §20)

1. **Retirement headline** — `src/data/site.ts → retirementAnnouncement` is `null`. As of 18 Nov 2026 no official announcement was found (only reports that he is "unlikely" to play IPL 2027). When Dhoni/CSK/BCCI confirm, fill in date, summary and source URL — the hero switches to *"The game moves on. The legacy stays."* with the citation.
2. **Image rights** — every image in `src/data/gallery.ts` has `cleared: false`.
   - All Getty images were removed; the site uses only the owner's own collection and fan artwork.
   - Fan artwork / watermarked edits (`trust-the-process`, `helmet-bowed`, `helmet-salute`, `manga-legend`, `captain-cool-night`) → get the creator's permission and credit.
   - All others → record `sourceUrl` + `licence`.
   - The family photo with his daughter was deliberately left out.
   - The card photo (`champions-trophy-blazer`) has a team logo in its top corners; it's cropped via `cardImageInsetTop`. Swap in a clean licensed photo if you can.
3. **Facts** — items marked `status: "needs-check"` in `timeline.ts` / `achievements.ts` are well-documented but should be confirmed against ICC / BCCI / IPL / CSK records. The 2020 international retirement is already verified.
4. When 1–3 are done, set `showFactStatus: false` in `site.ts` (hides the "to verify" badges and the rights banner), and set `site.url` to the live domain (fixes the canonical/OG base URL).
5. Lighthouse + real-device check (mobile Safari, Android Chrome), keyboard pass, reduced-motion pass.

## Accessibility & motion

Semantic landmarks, one H1, skip link, visible focus rings, labelled icon buttons, keyboard-operable timeline/accordion/lightbox, focus trap + restore in the lightbox. `prefers-reduced-motion` disables parallax, tilt, particles and confetti; content is never hidden if JS or animation is off. Pointer tilt/parallax only on fine-pointer devices; particles off on low-power devices.
