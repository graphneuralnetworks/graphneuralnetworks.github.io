(function () {
    "use strict";

    const DATA_URL = "assets/data/papers.json";
    const NODE_HEIGHT = 46;

    function nodeWidth(name) {
        return Math.min(190, Math.max(100, 24 + name.length * 8));
    }

    function buildLayout(data) {
        const g = new dagre.graphlib.Graph();
        g.setGraph({ rankdir: "TB", nodesep: 18, ranksep: 72, marginx: 30, marginy: 30 });
        g.setDefaultEdgeLabel(() => ({}));

        data.nodes.forEach((n) => {
            g.setNode(n.id, { width: nodeWidth(n.name), height: NODE_HEIGHT });
        });
        data.edges.forEach(([a, b]) => g.setEdge(a, b));

        dagre.layout(g);
        mirrorHorizontal(g);
        return g;
    }

    // dagre's left/right ordering within a rank isn't something you can pin
    // directly (it's a median-heuristic crossing-minimization pass) — so to
    // put a specific branch on a specific side, it's easier to just mirror
    // the whole finished layout and pick whichever orientation puts it where
    // we want. Flips node x and edge waypoint x around the graph's width.
    function mirrorHorizontal(g) {
        const width = g.graph().width;
        g.nodes().forEach((id) => {
            const n = g.node(id);
            n.x = width - n.x;
        });
        g.edges().forEach((e) => {
            g.edge(e).points.forEach((p) => { p.x = width - p.x; });
        });
    }

    function renderEdges(svg, g) {
        const line = d3.line().x((d) => d.x).y((d) => d.y).curve(d3.curveBumpY);
        g.edges().forEach((e) => {
            const points = g.edge(e).points;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("class", "graph-edge");
            path.setAttribute("d", line(points));
            svg.appendChild(path);
        });
    }

    function renderNodes(container, g, data, onSelect) {
        const byId = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
        const elements = {};

        g.nodes().forEach((id) => {
            const layout = g.node(id);
            const paper = byId[id];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "graph-node graph-node--" + paper.status;
            btn.style.left = (layout.x - layout.width / 2) + "px";
            btn.style.top = (layout.y - layout.height / 2) + "px";
            btn.style.width = layout.width + "px";
            btn.style.height = layout.height + "px";
            btn.setAttribute("aria-label", paper.name + ", " + paper.year);

            const name = document.createElement("span");
            name.className = "graph-node__name";
            name.textContent = paper.name;

            const year = document.createElement("span");
            year.className = "graph-node__year";
            year.textContent = paper.year;

            btn.appendChild(name);
            btn.appendChild(year);
            btn.addEventListener("click", (evt) => {
                evt.stopPropagation();
                onSelect(paper, layout, btn);
            });

            container.appendChild(btn);
            elements[id] = btn;
        });

        return elements;
    }

    function buildCard(paper) {
        const card = document.createElement("div");
        card.className = "paper-card";

        const close = document.createElement("button");
        close.className = "paper-card__close";
        close.setAttribute("aria-label", "Close");
        close.textContent = "×";
        card.appendChild(close);

        const title = document.createElement("p");
        title.className = "paper-card__title";
        title.textContent = paper.name;
        card.appendChild(title);

        if (paper.status === "synthesized") {
            const meta = document.createElement("p");
            meta.className = "paper-card__meta";
            meta.textContent = paper.authors + " · " + paper.venue;
            card.appendChild(meta);

            const note = document.createElement("p");
            note.className = "paper-card__note";
            note.textContent = paper.note;
            card.appendChild(note);

            const link = document.createElement("a");
            link.className = "paper-card__link";
            link.href = paper.arxiv;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "Read the paper ↗";
            card.appendChild(link);
        } else {
            const meta = document.createElement("p");
            meta.className = "paper-card__meta";
            meta.textContent = paper.year + " · " + paper.concept;
            card.appendChild(meta);

            if (paper.status === "drafted") {
                const status = document.createElement("p");
                status.className = "paper-card__status";
                status.textContent = "Coming soon";
                card.appendChild(status);
            }
        }

        return { card, close };
    }

    async function init() {
        const shell = document.querySelector(".graph-shell");
        if (!shell) return;

        const canvas = shell.querySelector(".graph-canvas");
        const svg = canvas.querySelector("svg");
        const nodesLayer = canvas.querySelector(".graph-nodes");

        const data = await fetch(DATA_URL).then((r) => r.json());
        const g = buildLayout(data);
        const graphInfo = g.graph();
        const width = graphInfo.width;
        const height = graphInfo.height;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);

        renderEdges(svg, g);

        let activeCard = null;
        let activeBtn = null;

        function closeCard() {
            if (activeCard) {
                activeCard.remove();
                activeCard = null;
            }
            if (activeBtn) {
                activeBtn.classList.remove("graph-node--active");
                activeBtn = null;
            }
        }

        function openCard(paper, layout, btn) {
            const reopening = activeBtn === btn;
            closeCard();
            if (reopening) return;

            const { card, close } = buildCard(paper);
            close.addEventListener("click", (evt) => {
                evt.stopPropagation();
                closeCard();
            });

            const cardWidth = 280;
            let left = layout.x - cardWidth / 2;
            left = Math.max(8, Math.min(left, width - cardWidth - 8));
            let top = layout.y + layout.height / 2 + 14;

            card.style.left = left + "px";
            card.style.top = top + "px";

            canvas.appendChild(card);
            btn.classList.add("graph-node--active");
            activeCard = card;
            activeBtn = btn;
        }

        renderNodes(nodesLayer, g, data, openCard);

        shell.addEventListener("click", closeCard);

        // pan + zoom
        const zoom = d3.zoom().scaleExtent([0.4, 2]).on("zoom", (event) => {
            closeCard();
            canvas.style.transform =
                "translate(" + event.transform.x + "px," + event.transform.y + "px) scale(" + event.transform.k + ")";
        });

        const shellSel = d3.select(shell);
        shellSel.call(zoom);

        function fitTransform() {
            const rect = shell.getBoundingClientRect();
            let scale = Math.min(1, (rect.width - 40) / width, (rect.height - 40) / height);
            if (!isFinite(scale) || scale <= 0) scale = 0.6;
            scale = Math.max(0.15, scale);
            const tx = Math.max(8, (rect.width - width * scale) / 2);
            const ty = Math.max(20, (rect.height - height * scale) / 2);
            return d3.zoomIdentity.translate(tx, ty).scale(scale);
        }

        let userMoved = false;
        zoom.on("start.track", () => { userMoved = true; });

        requestAnimationFrame(() => {
            shellSel.call(zoom.transform, fitTransform());
        });

        let resizeTimer = null;
        window.addEventListener("resize", () => {
            if (userMoved) return;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                shellSel.call(zoom.transform, fitTransform());
            }, 120);
        });

        const resetBtn = document.querySelector("[data-graph-reset]");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                userMoved = false;
                shellSel.transition().duration(400).call(zoom.transform, fitTransform());
            });
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
