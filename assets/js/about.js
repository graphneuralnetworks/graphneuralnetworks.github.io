(function () {
    "use strict";

    function init() {
        const images = document.querySelectorAll(".about__figure img");
        if (!images.length) return;

        let overlay = null;

        function close() {
            if (!overlay) return;
            overlay.remove();
            overlay = null;
            document.removeEventListener("keydown", onKeydown);
        }

        function onKeydown(evt) {
            if (evt.key === "Escape") close();
        }

        function open(img) {
            overlay = document.createElement("div");
            overlay.className = "lightbox";
            overlay.setAttribute("role", "dialog");
            overlay.setAttribute("aria-modal", "true");

            const big = document.createElement("img");
            big.src = img.currentSrc || img.src;
            big.alt = img.alt;
            big.className = "lightbox__image";

            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "lightbox__close";
            closeBtn.setAttribute("aria-label", "Close");
            closeBtn.textContent = "×";

            overlay.appendChild(big);
            overlay.appendChild(closeBtn);
            document.body.appendChild(overlay);

            overlay.addEventListener("click", (evt) => {
                if (evt.target === overlay || evt.target === closeBtn) close();
            });
            document.addEventListener("keydown", onKeydown);
        }

        images.forEach((img) => {
            img.setAttribute("tabindex", "0");
            img.setAttribute("role", "button");
            img.setAttribute("aria-label", "Expand image");
            img.addEventListener("click", () => open(img));
            img.addEventListener("keydown", (evt) => {
                if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    open(img);
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
