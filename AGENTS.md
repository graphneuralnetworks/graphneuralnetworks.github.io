# AGENTS.md

Internal notes for any agent (Claude Code or otherwise) picking up work on this
repo in a fresh session. This file is for maintainers/agents only — it is
excluded from the built site via `_config.yml` (see bottom of this file), so
it should never be reachable on the live domain. Don't link to it from any
page.

## What this repo is

Static site for **graphneuralnetworks.com** — a plain HTML/CSS/JS GitHub
Pages site, no build step, no framework, no bundler.

Pages and nav (consistent across every page, in this order):

| Nav label | File | What it is |
|---|---|---|
| Home | `index.html` | Splash/cover page (the Minard hero image). Entry point — never rename this file. |
| Atlas | `atlas.html` | The actual substantive page: the interactive research-lineage graph. |
| About | `about.html` | Why the site exists + a thin "about the author" sidebar. See its own section below. |
| Blog | *(external)* | Links out to `https://graphneuralnetworks.substack.com/`, `target="_blank"`. Not a local page. |

**Nav order is Home, Atlas, About, Blog** — About was moved ahead of Blog
2026-09-29 at the user's request. Blog stays last since it's the one
external link, not a local page; if you reorder the nav again, grep for
`nav__links` across all three HTML files and update them together (no
shared partial, easy to update two and miss the third — this has bitten
before).

The nav's "Home" link and the logo (`nav__brand`) both link to `/`, not
`index.html` — changed 2026-09-29 at the user's request so clicking Home from
a subpage lands on `mydomain.com/` (the clean root URL) rather than
`mydomain.com/index.html`. This relies on GitHub Pages (and `python3 -m
http.server`, for local dev) serving `index.html` as the default document at
a directory root, which both do. Don't change these back to `index.html`,
and if you add new internal links to the homepage, use `/` too for
consistency — `atlas.html` and `about.html` stay as their own filenames
since those aren't the root.

Naming has changed more than once during development (the graph page was
briefly called "Overview," then "Home," before settling on **Atlas**, and
"Blog" was removed then reinstated as an external link) — if you see stale
references to `overview.html` or `home.html` anywhere (docs, comments, old
branches), they're leftover from that churn; the file is `atlas.html`.

Sister repo: `../gnn-admin` (same parent folder, separate git repo). That's
the content pipeline — it parses papers, reviews them, and writes synthesis
articles under `gnn-admin/papers/{year}-{name}/synthesis/synthesis-002.md`.
This site's `assets/data/papers.json` is a hand-maintained summary derived
from that pipeline; **this repo does not read from gnn-admin at runtime** —
it's a static copy you update by hand when gnn-admin's content changes.

## Git workflow — read this before touching anything

- **Never commit directly to `main`.** Branch protection is enabled
  (required PR, no direct pushes, no force-push, no deletion — set via the
  GitHub API, `enforce_admins: false` so the human owner can still bypass in
  an emergency, but agents should not).
- Work on a feature branch, commit there, push, open a PR into `main`.
- Merging to `main` triggers the live GitHub Pages build (legacy Jekyll
  build from `main` root) — so merging is a deliberate, visible action.
  Don't merge PRs yourself unless explicitly told to; open the PR and let
  the human merge.
- Reuse an existing open PR/branch for related follow-up work in the same
  session rather than opening a new PR per small change, unless the user
  asks for separate PRs.

## Local preview

No build step — just serve the directory and open it:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/` (or `/atlas.html`, `/about.html` — the
homepage is `/`, not `/index.html`; see the nav table above) in a real
browser tab. Give the user this URL to open in *their own* browser rather
than showing it only in an agent's embedded browser pane — they've asked for
this before.

Gotcha encountered during development: an embedded/automated browser
profile can aggressively disk-cache a `<script src>` across navigations
even after the file changes on disk. If edited JS doesn't seem to take
effect during QA, serve on a fresh port or open a brand new tab rather than
trusting a reload.

## Design system / color template

All colors are CSS custom properties in `assets/css/style.css`, sampled
directly from the hero image (`assets/images/hero.jpg`, a 19th-century
Minard chart) — this is the site's palette template, meant to be reused
for anything new, not just the current pages:

```css
--paper:        #ddceb4;  /* background — kept consistent across every page */
--ink:          #1a1410;  /* text + graph edges/connections ("black") */
--ink-soft:     rgba(26,20,16,0.68);
--line:         rgba(26,20,16,0.18); /* hairline borders/dividers */
--accent:       #a35a3c;  /* the strong/"published" color — from the map's marching band */
--accent-soft:  rgba(163,90,60,0.14);
--accent-light: #c9a58a;  /* lighter tint of accent — fill for "synthesized" nodes */
--accent-line:  rgba(163,90,60,0.55); /* translucent accent border — "drafted" nodes */
--muted:        #746c5e;  /* grey — "radar" nodes (default look) + minor UI chrome */
```

`--accent-line` at 0.55 (bumped up from an earlier 0.4) plus `--accent-faint`
(a new, very light 0.08 accent tint) together are what make `drafted` nodes
readable as lightly-colored rather than just outlined — see the status-tier
breakdown below. A corner dot was tried on `drafted` nodes at one point
(`.graph-node--drafted::after`, a hollow accent-ringed circle) specifically
to distinguish them from plain `--muted` grey `radar` nodes, but was removed
again the same day at the user's request — don't reintroduce it. The
`--accent-faint` background fill is the current (and preferred) way to make
that distinction instead.

Rule of thumb if you're asked to re-derive or extend this palette from a
new image: background = average of the lightest pixels, ink = darkest
pixel, accent = most saturated warm pixel. Keep `--paper` identical across
every page — that consistency was explicitly requested.

Typography: system sans stack (`-apple-system, "Helvetica Neue"...`), light
weight (300) for every page's main display title, including
`.graph-intro__title` (Atlas) and `.about__title` (About) — both are
`font-weight: 300` with no color override (inherits `var(--ink)`, plain
black). This was **not** always the case: at one point `.graph-intro__title`
was bold + `--accent` colored as a deliberately "loud" element, and
`.about__title` was briefly changed to match it. The user tried that look
and explicitly asked to revert both back to thin/black (2026-09-29) — "I
think I am a bigger fan of the old style... thin capital black letters."
Don't reintroduce bold/accent titles on either page without being asked
again; thin + black is the current, intended, and requested state for both.
Nav labels and small UI text are uppercase with wide letter-spacing
(`0.1–0.18em`).

## Hero cover treatment

`index.html`'s `.hero` overlay is a **light wash, not a dark scrim** —
`linear-gradient(rgba(221,206,180,0.73), rgba(221,206,180,0.81))` (i.e.
`--paper` at high opacity) over `assets/images/hero-vignette.jpg`, with dark
ink text (`.hero__content` etc. use `var(--ink)` / `var(--ink-soft)`, not
cream). This deliberately copies the treatment on
[datasciencephilosophy.com](https://www.datasciencephilosophy.com/) (a
personal reference site of the same author) — a background faded down toward
near-white so ordinary dark text sits on top with no special contrast tricks
needed. An earlier version of this hero used a dark scrim + cream text +
text-shadow for legibility; that's gone now. If you're asked to adjust the
fade, move the two alpha values in that gradient — don't reintroduce a dark
gradient or switch the text color back to light without being told to.

The alpha values started at `0.82`/`0.9` (very washed out, barely any image
visible), then went to `0.6`/`0.68` on request for "a little less faded" —
that overshot: the map's marching-band linework got strong enough to fight
with the title text's legibility where they cross. Settled on `0.73`/`0.81`
as the middle ground (2026-09-29). If asked to fade it further in either
direction, nudge from here rather than the original extremes, and re-check
legibility specifically where "GRAPH NEURAL NETWORKS" crosses the thick
tan/grey bands, not just against the plain paper background.

`hero-vignette.jpg` (used instead of plain `hero.jpg` as the hero background)
is a derived asset, not a fresh source photo: it's `hero.jpg` run through a
small numpy/PIL script that (a) blends a `--paper`-colored radial wash in
more strongly toward the edges/corners than the center, and (b) gives the
center a slight, separate contrast/saturation boost — so the core chart in
the middle of the frame reads a little more prominently than the
background, "only by a little" per the request that produced it. It is
**not** a strong vignette — the effect is meant to be barely noticeable, just
enough to draw the eye inward. If regenerating it, work from `hero.jpg` (the
only source in-repo; the original high-res `.avif` was never checked in —
see "Hero image assets" below) and keep the effect subtle: a light radial
lerp toward `--paper` outward, a mild contrast/saturation bump inward, no
hard vignette ring or darkened corners.

`index.html` also carries a small copyright line in `.hero__footer`
(`.hero__copyright` span, under the subscribe link): "© Copyright 2026,
Akshay Sehgal" — matching that same reference site's own copyright line
(which reads "© Copyright 2017, Akshay Sehgal"), year updated. It's
index.html-only, not a site-wide footer.

## Logo

The nav brand is **icon-only** — no "GNN" wordmark (explicitly removed;
don't add text back next to the logo without being asked). It's an
`<img>` in the `<a class="nav__brand">` on every page (duplicated per-file
since there's no templating — if you change it, update `index.html`,
`atlas.html`, and `about.html` together):

```html
<a class="nav__brand" href="index.html">
    <img class="nav__logo" src="assets/images/cube.png" alt="">
</a>
```

Currently `assets/images/cube.png` — a solid-black isometric interlocking-
cubes mark (512×512, transparent background), sized via
`.nav__logo { width: 34px; height: 34px; object-fit: contain; }`. Several
other candidate logo images live in `assets/images/` too (`molecule.png`,
`molecul.png`, `enzyme.png`, `formula.png`, `skin-cell.png`,
`cannabidiol.png`, `benzene-ring-svgrepo-com.svg`) — these were supplied or
generated as options; only `cube.png` is wired in. If asked to swap the
logo to one of these, it's the same `<img src>` change in three files plus
possibly `.nav__logo`'s aspect ratio (they may not be square).

This went through several rounds of hand-coded inline-SVG marks before
landing on a raster image, each replaced on direct user feedback:

1. A Nightingale-coxcomb mark (6-wedge pinwheel, SVG) — user tried it,
   then rejected it outright ("dont like the logo").
2. Two small connected hexagons (SVG, molecule motif) — user said it
   "doesn't look like a molecule" and asked for it "much bigger and
   horizontally longer."
3. Three fused hexagon rings with skeletal-formula double bonds (SVG, wide
   `viewBox="0 0 44 18"`, rendered at 80×33px) — a real molecule reading,
   but ultimately dropped when the user pivoted to a supplied PNG instead.
4. **Current**: `cube.png`, a raster image the user picked directly,
   replacing the whole inline-SVG approach. Note it does *not* adapt to
   `currentColor` or the accent palette the way the SVG marks did — it's a
   fixed black image on every page. That's an accepted tradeoff of using a
   raster asset; don't try to recolor it via CSS filters unless asked.

**Favicon:** `assets/images/cube-paper.png` — the same cube mark, but
flattened onto a solid `--paper`-colored background instead of a transparent
one (generated by alpha-compositing `cube.png` over `#ddceb4`, not a
hand-edited asset). Transparent PNGs can render oddly as browser-tab
favicons depending on the browser chrome's own background, so this variant
exists specifically for that use case. There's also a root-level
`favicon.ico` (multi-size — 16/32/48/64px — generated from the same
`cube-paper.png` via Pillow's `.ico` save, not hand-built) as a fallback for
browsers/crawlers that request `/favicon.ico` directly regardless of
`<link>` tags. Both are wired into all three pages' `<head>`:

```html
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="assets/images/cube-paper.png">
```

Neither is used anywhere else on the site. If the underlying `cube.png` mark
or the `--paper` color ever changes, regenerate both to match rather than
letting them drift out of sync with the nav logo.

If the logo changes again, the SVG-based fallback concepts (coxcomb
family, Königsberg-bridges graph, K5 pentagram, wireframe cube graph,
message-passing hub glyph, K3 triangle, the 3-ring molecule chain) are
still reasonable directions — see prior commits for their exact markup.

## The graph (`atlas.html`)

Rendering: `dagre` (layout only — computes a top-down layered DAG position
for each node) + hand-written vanilla JS/SVG/HTML (`assets/js/overview-graph.js`).
No D3 data-binding is used beyond `d3.zoom`/`d3.line` as small utilities;
nodes are plain `<button>` elements positioned absolutely, edges are SVG
`<path>`s drawn with `d3.curveBumpY`. This was a deliberate choice over
dagre-d3/Cytoscape/etc. so the visual style could be fully custom.

Data lives in `assets/data/papers.json` — flat, hand-authored, NOT
generated by a script. Schema:

```json
{
  "nodes": [
    { "id": "gcn", "name": "GCN", "year": 2016, "concept": "Spectral → spatial", "status": "radar" },
    {
      "id": "deepwalk", "name": "DeepWalk", "year": 2014, "concept": "Random walks",
      "status": "synthesized",
      "authors": "Perozzi, Al-Rfou, Skiena",
      "venue": "KDD 2014",
      "note": "2-3 sentence paraphrase, NOT a verbatim copy of the synthesis doc.",
      "arxiv": "https://arxiv.org/abs/1403.6652"
    }
  ],
  "edges": [["parent_id", "child_id"], ...]
}
```

Three status values, three distinct visual tiers — **this three-way split
is deliberate and was explicitly requested after a two-tier version was
tried and rejected ("go back to the grey... what I want is 3 things")**:

- `status: "synthesized"` → **published**. Node renders filled with
  `--accent-light`, accent border + corner dot. Clicking it opens a full
  card (authors, venue, note, arXiv link). Only papers the user has
  explicitly decided to publish get this.
- `status: "drafted"` → **has a folder in `gnn-admin/papers/`** (i.e. work
  has actually started there — parsed, reviewed, maybe fully synthesized)
  but isn't published on the site yet. Renders with a translucent
  `--accent-line` border and a super-light `--accent-faint` fill, no dot —
  a corner dot was tried here and removed again the same day at the user's
  request, so the fill alone is what distinguishes it from `radar`. Clicking
  it shows year + concept plus a "Coming soon" line (`.paper-card__status`).
- `status: "radar"` → **no folder in `gnn-admin/papers/` at all** — a pure
  roadmap entry, nothing started. Renders with the plain `--muted` grey
  border (the original/default look), no fill, no dot. Clicking it shows
  only year + concept — no "Coming soon," no extra line of any kind.

**The rule for which tier a paper gets is mechanical, not editorial:**
check `ls ../gnn-admin/papers/` — if `{year}-{name}/` exists, it's at
least `"drafted"` (or `"synthesized"` if the user has separately decided
to publish it); if it doesn't exist, it's `"radar"`, full stop, even if you
happen to know things about that paper. Don't promote a node to `"drafted"`
based on the mermaid graph's green styling or the Paper Status table's
"✅ Synthesized" column alone — check the actual folder.

**Current state (2026-09-29):**
- `synthesized` (3): `deepwalk`, `node2vec`, `graphsage`.
- `drafted` (9): `gcn`, `mpnn`, `gat`, `gin`, `pna`, `dgn`, `gatv2`,
  `graphormer`, `gps` — every other folder currently in
  `gnn-admin/papers/`, each with full authors/venue/note/arxiv already
  filled in (written from their synthesis-002.md) so they're one status
  flip away from publishing.
- `radar` (15): everything else — no folder in gnn-admin yet, so no
  authors/venue/note/arxiv fields at all.

**To publish a drafted paper:** flip its `status` to `"synthesized"` —
its fields are already correct, don't rewrite them.

**To promote a radar paper to drafted:** this happens automatically the
next time you sync with gnn-admin and find it now has a folder there —
see below. Don't hand-promote a radar node without checking the folder
actually exists.

**Keeping this file in sync with gnn-admin:** periodically (or when asked
to "update the graph"), do two checks against `../gnn-admin`:
1. Diff `../gnn-admin/README.md`'s Paper Coverage mermaid graph (nodes +
   edges) against this file's node/edge list, and add anything new as
   `"radar"`. gnn-admin's README is the source of truth for *what papers
   exist and how they connect*.
2. Diff `ls ../gnn-admin/papers/` against which node ids are currently
   `"drafted"`/`"synthesized"` here, and flip any `"radar"` node that now
   has a folder to `"drafted"` (filling in authors/venue/note/arxiv from
   its synthesis-002.md as you do). This JSON is the source of truth for
   *what's actually live on the site*, but the drafted/radar split itself
   must track gnn-admin's folder state, not drift from it.

Last synced 2026-09-29: added `ggnn` (GG-NN, 2016), `schnet` (SchNet,
2017), `lrgb` (LRGB, 2022), and `exphormer` (Exphormer, 2023) as new radar
nodes, plus the edges connecting them (`ggnn→mpnn`, `gcn→mpnn`,
`mpnn→gin`, `mpnn→schnet`, `mpnn→gps`, `dgn→gps`, `signnet→gps`,
`gps→lrgb`, `gps→exphormer`); promoted `mpnn` and `gps` to `"drafted"`
(with full data) since `gnn-admin/papers/2017-mpnn/` and
`gnn-admin/papers/2022-gps/` now exist.

To add a brand new paper from scratch:

1. Add a node object with a unique `id`, `name`, `year`, `concept`.
2. Add edges connecting it to its lineage (`["parent_id", "new_id"]`).
3. Set its `status` per the mechanical rule above: `"radar"` if there's no
   `gnn-admin/papers/{year}-{name}/` folder yet. If the folder exists, use
   `"drafted"` (or `"synthesized"` only if explicitly told to publish it)
   and add `authors`, `venue`, `note`, `arxiv`. Write `note` yourself as a
   tight 2–3 sentence paraphrase of the paper's core idea (see existing
   notes for voice/length) — read it from the corresponding
   `synthesis/synthesis-002.md` (its source line gives authors/venue/arxiv
   already). **Do not invent authors, venues, or notes for a paper with no
   folder at all** — that's `"radar"`, nothing more. This project treats
   fabricated citation data as a real correctness bug, not a stylistic
   nitpick.
4. No rebuild step — the JSON is fetched client-side on page load.

**Don't prune edges to "simplify" the lineage without being asked.** This was
tried once (2026-09-29) — cutting cross-lineage/redundant-looking edges like
`deepwalk→gcn` and trimming `gps`'s inbound edges from 7 down to 4 — and
separately reverted the same day: the user explicitly asked to go back to the
fuller, more-connected edge list. The full 38-edge set (every edge a node's
own synthesis doc or the gnn-admin mermaid graph actually draws) is the
intended state. Don't re-attempt this kind of pruning on your own judgment
call; if asked again, treat it as a fresh request, not a resurrection of the
prior attempt.

A **deterministic per-node jitter** to break up the perfectly-aligned grid
look of wide ranks (GAT/GIN/PNA/SchNet, etc.) was also tried and reverted the
same day — the user said it "looks horrible." Don't reintroduce jitter,
random-looking offsets, or anything that nudges nodes off dagre's own
computed positions; the graph should read as dagre laid it out.

Layout tuning knobs live in `overview-graph.js`: `nodeWidth()` (sizing per
label length), `buildLayout()`'s `nodesep`/`ranksep` (spacing — `26`/`64`,
dagre's defaults-ish; not specially tuned), and the `fitTransform()` function
(initial pan/zoom fit — centers on both axes, recomputes on window resize
unless the user has manually panned/zoomed).

**One layout change that *did* stick:** `mirrorHorizontal()` flips the whole
finished dagre layout left-right (node x and edge waypoint x around the
graph's width) so the Spectral Networks / ChebNet chain lands on the right
and the DeepWalk / node2vec chain lands on the left — requested explicitly
and kept through the pruning/jitter revert ("just horizontally flip that").
dagre's own left/right ordering within a rank isn't directly steerable (it's
an internal crossing-minimization heuristic), so mirroring the finished
layout was the practical way to pin a specific branch to a specific side.
Don't remove this without being asked, and if the node/edge set changes
enough that the "wrong" branch ends up on the right again, re-check whether
mirroring is still wanted before touching it.

The intro card (top-left) is a `position: fixed` overlay, NOT a layout
sidebar — it floats over the graph and doesn't reserve space. It was
explicitly redesigned away from a sidebar/legend layout; don't reintroduce a
legend or a space-reserving sidebar without being asked.

Its copy ("The Evolution of Graph Neural Networks" + three paragraphs) is
substantially longer than the original one-liner it replaced (2026-09-29),
which made the card tall enough to cover most of the graph on a normal
viewport. Two things handle that:

- `.graph-intro` caps itself at `max-height: calc(100vh - 140px)` with
  `overflow-y: auto` — on a short viewport the card scrolls internally
  instead of growing to cover the whole page. Don't remove this if the copy
  gets longer again; adjust the `140px` reserve instead if it's not enough.
- **On mobile (`max-width: 600px`), the card is collapsed by default** and
  expands on tap. Markup: `.graph-intro__header` (the eyebrow + title, plus
  a `.graph-intro__toggle-icon` that's a CSS `+`/`−` glyph swapped via the
  `aria-expanded` attribute, not an image) wraps
  `.graph-intro__details` (the three body paragraphs + the hint line).
  `overview-graph.js`'s `initIntroToggle()` toggles an `is-open` class on
  `.graph-intro` and flips `aria-expanded` on click/Enter/Space. The
  `.graph-intro__details { display: none }` / `.is-open .graph-intro__details
  { display: block }` pair that actually does the hiding only exists inside
  the mobile media query — on desktop `.graph-intro__details` has no special
  rule (default `display: block`, always visible) and `.graph-intro__toggle-icon`
  is `display: none`, so the JS class is inert there. If you add more copy or
  change this content again, re-check both the desktop scroll behavior and
  the mobile collapsed/expanded states — they're handled by different
  mechanisms and it's easy to fix one and forget the other.

## Hero image assets (`assets/images/`)

| File | What it is |
|---|---|
| `hero.jpg` | Full source image (2400×2079). Original, un-vignetted. |
| `hero-vignette.jpg` | `hero.jpg` with a subtle center-weighted contrast/saturation boost and an outward radial wash toward `--paper` — this is what `index.html`'s `.hero` actually uses as its background now, not `hero.jpg` directly. See "Hero cover treatment" above for how it's generated. |
| `hero-top.jpg` | Just the *upper* graphic — Minard's 1869 Hannibal-crossing chart (the lesser-known companion piece bundled into the same source scan). Cropped tight to its own bounds, full width, natural aspect. |
| `hero-bottom.jpg` | Just the *lower* graphic — the famous 1869 Napoleon's-March chart (flowing bands + the temperature graph strip). This is "the chart" everyone means when they say "the Minard chart." Also cropped tight, full width, natural aspect. |
| `hero-3x2.jpg` | A 3:2 crop (2000×1333) biased toward the lower/Napoleon graphic, bottom-anchored so its temperature-chart strip is never cut off. |

**Important:** the original high-resolution source file (`02_map_post_minard_napolean.avif`,
3072×2662) is **not tracked in this repo** — it was supplied by the user
from their local Downloads folder. If you need to regenerate any crop at
higher fidelity, you'll need to ask the user for that source again, or
work from `hero.jpg` as the best in-repo fallback (lower res, already
JPEG-compressed).

The divider between the two panels sits at **46.47% of the source image's
height** (row 1237 of 2662 in the original) — found by scanning for the row
with the highest fraction of dark pixels across the width (a printed rule
line), not by eyeballing it. If a similar image ever needs the same
treatment, that's the technique: don't guess coordinates, measure them.

`index.html`'s `.hero` background uses `background-position: center bottom`
(always keep the lower/Napoleon chart's bottom edge in frame) plus a
`@media (min-aspect-ratio: 1/1)` override bumping `background-size` to
`112% auto` on landscape/desktop viewports only, for a slightly closer crop
with the sides trimmed. That aspect-ratio gate exists specifically so
portrait/mobile viewports keep plain `cover` — a fixed percentage size on a
tall narrow viewport would leave gaps instead of covering. **Do not remove
the media-query gate** even if asked to "just increase the zoom" — adjust
the `112%` number, don't replace the mechanism, unless you re-derive the
math for the mobile case too.

## About page (`about.html`)

No longer a stub — filled in 2026-09-29 with the actual motivation for the
site, written in first person as the author (Akshay), then revised the same
day per explicit style feedback (see below). Two-column layout, `.about`
(`display: grid; grid-template-columns: 1fr 220px;`, single column under
760px):

- `.about__content` — three sections, each an `<h2 class="about__heading">`
  (except the first, which reuses the page `<h1 class="about__title">`
  pattern other pages use):
  1. **"Thinking in graphs"** — a lede on graphs being an intuitive way to
     think (maps, family trees, subway lines), then a single `.about__figure`
     showing the **whole** `hero.jpg` (both Minard panels together, exactly
     as scanned, not the top/bottom crops used elsewhere on the site) with
     one `.about__figure-note` `<figcaption>` below it labeling both halves
     in a single line ("Top: Hannibal's crossing of the Alps, 218 BC.
     Bottom: Napoleon's Russian campaign, 1812. Both by Charles Minard,
     1869."). This went through two iterations at the user's request: first
     an earlier side-by-side `hero-top.jpg` / `hero-bottom.jpg` two-up
     layout, then a single whole-image version with a note *above* the image
     and a separate one below, before landing on this final one-image,
     one-caption-below form. If asked to touch this again, keep it to a
     single figcaption below the image, not a note above it. Then a
     paragraph connecting "one image holds a huge amount of information" to
     modern graphs (social graphs as influence, the web graph as what makes
     search/PageRank possible).
  2. **"Why I built this"** — the actual pitch, written as a personal note
     ("My goal with this site was to...", not a marketing-voice mission
     statement): GNNs have a reputation for being unapproachable despite
     graph-thinking being natural for data scientists/engineers/PMs alike.
  3. **"How to explore the Atlas"** — practical guidance: follow the Atlas
     like a family tree (an unfamiliar node's edges point at what it
     grew out of / led to), but also read the synthesis and the original
     paper once a node is filled in, since some papers (GraphSAGE, GAT
     named explicitly) are clear enough to be the best explanation
     available on their own. Ends with a **"A few prerequisites"**
     paragraph (added 2026-09-29): representation learning, embeddings,
     word2vec, the attention mechanism, and transformers, each linked
     inline to an external explainer the user supplied directly, plus one
     the user asked to be added on top: convolutional neural networks
     (linked to the poloclub CNN Explainer, matching the transformer one
     stylistically), since a chunk of the early Atlas (GCN, ChebNet) is
     literally convolution generalized to graphs. If asked to extend this
     list again, keep it "intuition only, no math needed" per the user's
     framing, and prefer the same kind of visual/interactive explainer
     over a textbook chapter or a paper.
- `.about__sidebar` — a **thin, deliberately minimal "About the author"**
  panel (`border-left`, ~220px column on desktop, stacks below content with
  a `border-top` on mobile instead). It's explicitly a placeholder: the user
  said they'll fill in a real bio later, so what's there now (name + one
  wry line + "Bio, photo, and links coming soon") is intentional filler, not
  a finished author bio. Don't try to flesh it out into a full bio yourself,
  wait for the user to supply real content (photo, links, longer bio) and
  swap it in then.

**Style rules for this page's prose, given explicitly by the user
(2026-09-29) — apply these if asked to extend or edit the text:**

- **No em dashes.** Use commas where the sentence allows it, or restructure
  with a colon/period/semicolon where a comma would be a splice. The first
  draft of this page used em dashes throughout and was explicitly rejected
  for it.
- Link out to **Wikipedia** for named concepts and historical references
  where it's natural (`graph theory`, `Charles Joseph Minard`, `Hannibal's
  crossing of the Alps`, `French invasion of Russia`, `PageRank`, `Spectral
  graph theory`, `Graph neural network` are the current examples), each
  `target="_blank" rel="noopener"`. Don't force a link where there's no good
  match, and don't link the same term twice.
- Write it as **the author's own note**, first person, framed around "my
  goal was to..." rather than generic third-person marketing copy.
- Match the site owner's own voice (informal, direct, short asides in
  parentheses) rather than a neutral/corporate tone.

**The Minard image is click-to-expand.** `assets/js/about.js`
(`initIntroToggle`'s sibling script, but its own file) attaches a click/Enter
handler to every `.about__figure img` that builds a fixed full-viewport
`.lightbox` overlay (dark scrim, the clicked image at up to full
viewport size, a `×` close button) and appends it to `<body>`; clicking the
scrim, clicking the close button, or pressing Escape removes it again. It's
plain DOM, no library. If more images get added to this page, they pick this
behavior up automatically since the script queries `.about__figure img`
generically rather than by id.

**CSS specificity gotcha already hit once:** `.about__content p` (a class +
type selector, specificity 0,1,1) will beat a bare `.page__eyebrow` (0,1,0)
if you're not careful, which silently re-sized the "About" eyebrow to 15px
instead of the 11px every other page's eyebrow uses, even though both use
the exact same `.page__eyebrow` class. Fixed by scoping the paragraph rule
to `.about__content p:not(.page__eyebrow)`. If you add more shared classes
inside `.about__content` that should NOT inherit the generic paragraph
styling, use the same `:not()` approach (or a more specific selector)
rather than fighting it with `!important`. When touching this page's CSS,
sanity-check the eyebrow's computed `font-size` against `atlas.html`'s (they
must match, the user has explicitly asked for this once already).

## Content model

Research articles get published directly as expandable nodes in the graph
(`atlas.html`) — there's no separate local blog page/section for them. The
nav's "Blog" item is an external link to the Substack
(`https://graphneuralnetworks.substack.com/`), and the footer link on
`index.html` ("Subscribe to the newsletter") goes to the Substack subscribe
page specifically. Both point at Substack but serve different purposes —
Blog is "read what's there," the subscribe link is "get emailed new posts" —
don't collapse them into one link.

Neither of those links (nor the nav's "Blog" item) carries a trailing "↗"
arrow glyph anymore — there used to be a `.nav__links a.is-external::after`
rule adding one, and a literal "→" in the subscribe link's text, but both
were removed at the user's request. Don't re-add either; `is-external` is
still present as a class on the Blog link, but no rule keys off it now.

`index.html`'s hero CTA button (below the subtitle) is labeled "Explore
GNNs", not "Atlas" — renamed at the user's request, but it still points only
at `atlas.html`, nowhere else.

## Misc conventions

- No JS framework, no npm, no build step, anywhere. Keep it that way unless
  explicitly asked to add tooling.
- External libraries (`d3@7`, `dagre@0.8.5`) are loaded from `cdn.jsdelivr.net`
  via plain `<script src>` tags — no local vendoring.
- Every page duplicates its own `<nav>` markup (brand + logo + links) since
  there's no shared-partial mechanism. When changing nav (links, logo,
  labels), grep for the markup across all three HTML files and update them
  together — it's easy to update two and miss the third.
- Keep commit messages and PR descriptions accurate about *why*, not just
  *what* — this file plus PR history is the only durable memory a future
  session has.

## This file's visibility

`AGENTS.md` is excluded from the Jekyll build via the repo's `_config.yml`
(`exclude: [AGENTS.md]`), so it will not be served at
`graphneuralnetworks.com/AGENTS.md` once GitHub Pages rebuilds from `main`.
It's still a normal tracked file in git history and on GitHub's repo browser
— "not visible externally" means "not served as part of the live site," not
"secret from GitHub." If this repo ever moves off Jekyll/legacy Pages
builds (e.g. to a Pages Action workflow), re-verify this exclusion still
applies, since a different build system may not honor `_config.yml`.
