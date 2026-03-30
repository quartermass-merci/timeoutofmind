# Time Out Of Mind Recording Co. — Website

Single-page vanilla HTML/CSS/JS site for an analog recording studio in a 100-year-old barn in Essex County, Ontario. Deployed on Vercel via GitHub (quartermass-merci/timeoutofmind).

## Tech Stack
- Vanilla HTML/CSS/JS (no frameworks, no npm)
- Google Fonts: Special Elite + Courier Prime
- Leaflet.js (CDN) for interactive map
- WebGL2 fragment shader for smoke effect on music player
- Python http.server for local dev (port 8081 via .claude/launch.json)

## Git Notes
- Audio MP3s are tracked; WAVs are gitignored (too large)
- PROMO/VIDEOS/ is gitignored
- OneDrive sync can cause git index.lock race conditions — use Python subprocess to remove lock before git operations

## Design Context

### Users
Independent bands, touring musicians, labels/managers evaluating the space, and curious locals who attend barn shows or are part of the Essex County arts community. Job to be done: "Is this the real deal? Will my band have a great experience here?"

### Brand Personality
**Raw. Authentic. Defiant.** Anti-autotune, anti-phone, pro-vibe. Warm but has edge — independent record label energy, not corporate music-tech.

### Aesthetic Direction
- Found-object analog: typewriter text, parchment textures, barn-wood warmth
- Earthy palette: parchment, ink, barn, amber, night. No blues, no tech colors, no neon
- Reference: robmoir.com. Anti-references: Splice/Ableton, generic Squarespace band sites, overdesigned boutique studios
- Light mode only. The warmth of the parchment IS the brand.

### Design Principles
1. **The space sells itself** — Photography and real content do the heavy lifting. Design gets out of the way.
2. **Analog over digital** — Typewriter fonts, paper grain, desaturated photography, amber accents. Never slick, never glossy.
3. **Confidence through restraint** — Small section labels, generous whitespace, unhurried pacing.
4. **Personality in the details** — Let the quirky moments (coda quotes, tap-dancing facilities manager) land without visual noise.
5. **Photography breaks the grid** — Photos interrupt reading flow naturally, woven through content.
