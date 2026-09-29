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
| Blog | *(external)* | Links out to `https://graphneuralnetworks.substack.com/`, `target="_blank"`. Not a local page. |
| About | `about.html` | About the site and its author. Currently a stub. |

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

Then open `http://localhost:4173/index.html` (or `/atlas.html`, `/about.html`)
in a real browser tab. Give the user this URL to open in *their own*
browser rather than showing it only in an agent's embedded browser pane —
they've asked for this before.

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

`--accent-line` at 0.55 is also used for a small hollow-ring dot on `drafted`
nodes (`.graph-node--drafted::after` — 7px circle, `--paper`-colored fill,
`--accent`-colored border). This was bumped up from an earlier 0.4 and given
its own dot because a border-only treatment wasn't visually distinct enough
from the plain `--muted` grey `radar` border at a glance — the dot is a
deliberate second signal, not just decoration. Keep it visually distinct from
`.graph-node--synthesized::after`'s dot, which is solid-filled with
`--accent` and has no border — "hollow ring" reads as "in progress," "solid
fill" reads as "published." Don't make them look the same.

Rule of thumb if you're asked to re-derive or extend this palette from a
new image: background = average of the lightest pixels, ink = darkest
pixel, accent = most saturated warm pixel. Keep `--paper` identical across
every page — that consistency was explicitly requested.

Typography: system sans stack (`-apple-system, "Helvetica Neue"...`), light
weights (200–300) for most display text, **except** the graph page's own
title (`.graph-intro__title`), which is bold + `--accent` colored on
purpose — that's the one deliberately "loud" element on the page. Nav
labels and small UI text are uppercase with wide letter-spacing
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
  `--accent-line` border, no fill, plus a small hollow-ring corner dot
  (`--paper` fill, `--accent` border — distinct from the solid dot on
  published nodes). Clicking it shows year + concept plus a "Coming soon"
  line (`.paper-card__status`).
- `status: "radar"` → **no folder in `gnn-admin/papers/` at all** — a pure
  roadmap entry, nothing started. Renders with the plain `--muted` grey
  border (the original/default look), no dot. Clicking it shows only year
  + concept — no "Coming soon," no extra line of any kind.

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

**Edges are a lineage, not a citation graph.** Don't add an edge just because
gnn-admin's mermaid graph or a paper's related-work section mentions a
connection — the user explicitly pruned several "everything cites everything"
edges (2026-09-29) to keep the graph reading as succession/core-inspiration
only, and asked to keep it that way: "not everything needs to be connected to
everything." Concretely, edges were removed where a node was already
well-connected through a stronger primary lineage edge (e.g. `gcn→dgn` was
cut because `pna→dgn` — DGN's actual direct predecessor — already existed;
`deepwalk→gcn` was cut as an arbitrary cross-lineage bridge). `gps` in
particular had 7 incoming edges before pruning (every architecture idea it
borrows from) and was trimmed to 4 (`mpnn`, `graphormer`, `dgn`, `signnet`) —
resist the urge to wire a new node to every plausible ancestor; pick the one
or two edges that represent where the core idea actually came from. Also keep
the overall shape vertical (taller than wide) rather than sprawling
horizontally — that's a stated preference, and pruning fan-in/fan-out at
high-convergence nodes like `gps` is the main lever for it, alongside the
`nodesep`/`ranksep` layout knobs below.

Layout tuning knobs live in `overview-graph.js`: `nodeWidth()` (sizing per
label length), `buildLayout()`'s `nodesep`/`ranksep` (spacing — currently 18
and 72, biased tight-horizontal/loose-vertical on purpose to favor a taller
graph), and the `fitTransform()` function (initial pan/zoom fit — centers on
both axes, recomputes on window resize unless the user has manually panned/
zoomed).

The intro card (heading + short paragraph, top-left) is a `position: fixed`
overlay, NOT a layout sidebar — it floats over the graph and doesn't
reserve space. It was explicitly redesigned away from a sidebar/legend
layout; don't reintroduce a legend or a space-reserving sidebar without
being asked.

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

## Content model

Research articles get published directly as expandable nodes in the graph
(`atlas.html`) — there's no separate local blog page/section for them. The
nav's "Blog" item is an external link to the Substack
(`https://graphneuralnetworks.substack.com/`), and the footer link on
`index.html` ("Subscribe to the newsletter →") goes to the Substack
subscribe page specifically. Both point at Substack but serve different
purposes — Blog is "read what's there," the subscribe link is "get emailed
new posts" — don't collapse them into one link.

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
