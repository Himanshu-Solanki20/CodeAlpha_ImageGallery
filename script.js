// Photo list. `wide` tiles take up a 2x2 cell in the grid.
const photos = [
  { id: 1015, title: "Fjord from the cliff",   cat: "landscape", by: "Alexey Topolyanskiy", wide: true },
  { id: 1074, title: "Lioness",                cat: "wildlife",  by: "Samuel Scrimshaw" },
  { id: 57,   title: "Brownstone street",      cat: "city",      by: "Nicholas Swanson" },
  { id: 431,  title: "Latte and receipts",     cat: "food",      by: "Carli Jean" },
  { id: 1016, title: "Red canyon at dusk",     cat: "landscape", by: "Philippe Wuyts" },
  { id: 433,  title: "Brown bear",             cat: "wildlife",  by: "Thomas Lefebvre", wide: true },
  { id: 1048, title: "Looking up",             cat: "city",      by: "Anthony Delanoix" },
  { id: 429,  title: "Raspberries",            cat: "food",      by: "Glen Carrie" },
  { id: 1039, title: "Waterfall gorge",        cat: "landscape", by: "Andrew Coelho" },
  { id: 1024, title: "Vulture in flight",      cat: "wildlife",  by: "Niko Virtanen" },
  { id: 274,  title: "Billboards at night",    cat: "city",      by: "Wojtek Witkowski", wide: true },
  { id: 425,  title: "Coffee beans",           cat: "food",      by: "Daniel Ruswick" },
  { id: 1018, title: "Green ridge road",       cat: "landscape", by: "Andrew Ridley" },
  { id: 1003, title: "Fawn in the woods",      cat: "wildlife",  by: "E+N Photographies" },
  { id: 164,  title: "Canal houses",           cat: "city",      by: "Linh Nguyen" },
  { id: 1080, title: "Strawberries",           cat: "food",      by: "veeterzy", wide: true },
  { id: 1043, title: "Granite valley",         cat: "landscape", by: "Christian Joudrey" },
  { id: 219,  title: "Leopard on the trail",   cat: "wildlife",  by: "Martyn Seddon" },
  { id: 1047, title: "Back alley",             cat: "city",      by: "sergee bee" },
  { id: 292,  title: "Chopping board",         cat: "food",      by: "Webvilla" },
  { id: 29,   title: "Above the snowline",     cat: "landscape", by: "Go Wild" },
  { id: 1084, title: "Walrus colony",          cat: "wildlife",  by: "Jay Ruzesky" },
  { id: 1067, title: "Skyline at sunrise",     cat: "city",      by: "Kevin Young" },
  { id: 225,  title: "Tea on the counter",     cat: "food",      by: "Vee O" },
];

const catNames = {
  landscape: "Landscapes",
  wildlife: "Wildlife",
  city: "City",
  food: "Food & Drink",
};

const SLIDE_MS = 4000;

const thumbSrc = (p) => `images/thumbs/${p.id}.jpg`;
const fullSrc = (p) => `images/full/${p.id}.jpg`;
const pad = (n) => String(n).padStart(2, "0");

const grid = document.getElementById("grid");
const filterBtns = document.querySelectorAll(".filter");

let activeFilter = "all";
let visible = photos.slice();   // what the lightbox steps through
let filterRun = 0;              // used to cancel an older filter animation

/* ---------------- grid ---------------- */

function buildGrid() {
  const frag = document.createDocumentFragment();

  photos.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "tile" + (p.wide ? " tile--wide" : "");
    li.dataset.cat = p.cat;
    li.dataset.id = p.id;
    li.style.setProperty("--delay", `${i * 45}ms`);

    li.innerHTML = `
      <button type="button" aria-label="Open ${p.title}">
        <img src="${thumbSrc(p)}" alt="${p.title}" loading="lazy" width="600" height="400">
        <span class="tile__label">
          <strong>${p.title}</strong>
          <span>${pad(i + 1)}A · ${catNames[p.cat].toUpperCase()}</span>
        </span>
      </button>`;

    const img = li.querySelector("img");
    if (img.complete) img.classList.add("is-loaded");
    else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });

    li.querySelector("button").addEventListener("click", () => {
      openLightbox(visible.indexOf(p), li);
    });

    frag.appendChild(li);
  });

  grid.appendChild(frag);

  // once the entrance animation is done we don't want it to replay
  // when a tile goes from display:none back to visible
  setTimeout(() => {
    grid.querySelectorAll(".tile").forEach((t) => (t.style.animation = "none"));
  }, photos.length * 45 + 1000);
}

function updateCounts() {
  filterBtns.forEach((btn) => {
    const f = btn.dataset.filter;
    const n = f === "all" ? photos.length : photos.filter((p) => p.cat === f).length;
    btn.querySelector(".count").textContent = n;
  });
}

/*
  Filtering uses a FLIP animation:
  1. fade out tiles that are leaving
  2. record where the remaining tiles are (First)
  3. change the layout (hide/show)
  4. record the new positions (Last), Invert with a transform, then Play
*/
function applyFilter(filter) {
  if (filter === activeFilter) return;
  activeFilter = filter;
  const run = ++filterRun;

  filterBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.filter === filter));
  visible = photos.filter((p) => filter === "all" || p.cat === filter);

  const tiles = [...grid.children];
  const matches = (t) => filter === "all" || t.dataset.cat === filter;
  const leaving = tiles.filter((t) => !t.classList.contains("is-hidden") && !matches(t));

  leaving.forEach((t) => {
    t.classList.add("is-leaving");
    t.animate(
      [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.92)" }],
      { duration: 220, easing: "ease-in", fill: "forwards" }
    );
  });

  setTimeout(() => {
    if (run !== filterRun) return;

    const staying = tiles.filter((t) => !t.classList.contains("is-hidden") && matches(t));
    const first = new Map(staying.map((t) => [t, t.getBoundingClientRect()]));

    tiles.forEach((t) => {
      t.getAnimations().forEach((a) => a.cancel());
      t.classList.remove("is-leaving");
      t.classList.toggle("is-hidden", !matches(t));
    });

    tiles.forEach((t) => {
      if (t.classList.contains("is-hidden")) return;
      const last = t.getBoundingClientRect();
      const prev = first.get(t);

      if (prev) {
        const dx = prev.left - last.left;
        const dy = prev.top - last.top;
        const sx = prev.width / last.width;
        const sy = prev.height / last.height;
        if (dx || dy || sx !== 1 || sy !== 1) {
          t.animate(
            [
              { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
              { transformOrigin: "top left", transform: "none" },
            ],
            { duration: 500, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
        }
      } else {
        // tile is coming in fresh
        t.animate(
          [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "none" }],
          { duration: 420, delay: 120, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }
        );
      }
    });
  }, leaving.length ? 220 : 0);
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
});

/* ---------------- lightbox ---------------- */

const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbFrame = document.getElementById("lbFrame");
const lbTitle = document.getElementById("lbTitle");
const lbMeta = document.getElementById("lbMeta");
const lbStrip = document.getElementById("lbStrip");
const lbStage = document.getElementById("lbStage");
const lbProgress = document.getElementById("lbProgress");
const playBtn = document.getElementById("lbPlay");

let current = 0;
let isOpen = false;
let busy = false;           // true while a slide transition is running
let slideTimer = null;
let lastFocus = null;
let closeTimer = null;
let justDragged = false;

lb.style.setProperty("--slide-ms", SLIDE_MS + "ms");

// Shows the thumbnail straight away (it's already cached) and swaps
// in the full-size file when it finishes downloading.
function setImage(p) {
  lbImg.alt = p.title;
  const full = new Image();
  full.src = fullSrc(p);

  if (full.complete) {
    lbImg.src = full.src;
    return;
  }
  lbImg.src = thumbSrc(p);
  full.onload = () => {
    if (visible[current] === p) lbImg.src = full.src;
  };
}

function preloadAround(i) {
  [i - 1, i + 1].forEach((n) => {
    const p = visible[(n + visible.length) % visible.length];
    if (p) new Image().src = fullSrc(p);
  });
}

function updateInfo() {
  const p = visible[current];
  lbFrame.textContent = `${pad(current + 1)} / ${pad(visible.length)}`;
  lbTitle.textContent = p.title;
  lbMeta.textContent = `${catNames[p.cat]} — photo by ${p.by}`;

  lbStrip.querySelectorAll("button").forEach((b, i) => {
    b.classList.toggle("is-current", i === current);
  });
  const active = lbStrip.children[current];
  if (active) {
    const stripBox = lbStrip.getBoundingClientRect();
    const itemBox = active.getBoundingClientRect();
    lbStrip.scrollLeft += itemBox.left - stripBox.left - stripBox.width / 2 + itemBox.width / 2;
  }

  history.replaceState(null, "", `#photo-${p.id}`);
}

function buildStrip() {
  lbStrip.innerHTML = "";
  visible.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<button type="button" aria-label="Go to ${p.title}"><img src="${thumbSrc(p)}" alt=""></button>`;
    li.firstChild.addEventListener("click", () => goTo(i));
    lbStrip.appendChild(li);
  });
}

// Zooms the image out of (or back into) the tile that was clicked
function flipFrom(rect) {
  const end = lbImg.getBoundingClientRect();
  if (!end.width || !rect) return;
  const dx = rect.left + rect.width / 2 - (end.left + end.width / 2);
  const dy = rect.top + rect.height / 2 - (end.top + end.height / 2);
  const s = Math.max(rect.width / end.width, rect.height / end.height);

  lbImg.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }],
    { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}

function openLightbox(index, fromTile) {
  if (index < 0) return;
  clearTimeout(closeTimer);
  current = index;
  isOpen = true;
  lastFocus = document.activeElement;

  buildStrip();
  setImage(visible[current]);
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  updateInfo();
  preloadAround(current);

  requestAnimationFrame(() => {
    lb.classList.add("is-open");
    const rect = fromTile ? fromTile.getBoundingClientRect() : null;
    if (lbImg.complete) flipFrom(rect);
    else lbImg.addEventListener("load", () => flipFrom(rect), { once: true });
  });

  document.getElementById("lbClose").focus({ preventScroll: true });
}

function closeLightbox() {
  if (!isOpen) return;
  isOpen = false;
  stopSlideshow();

  const tile = grid.querySelector(`.tile[data-id="${visible[current].id}"]`);
  const r = tile && tile.getBoundingClientRect();
  const onScreen = r && r.bottom > 0 && r.top < innerHeight;

  if (onScreen) {
    const end = lbImg.getBoundingClientRect();
    const dx = r.left + r.width / 2 - (end.left + end.width / 2);
    const dy = r.top + r.height / 2 - (end.top + end.height / 2);
    const s = Math.max(r.width / end.width, r.height / end.height);
    lbImg.animate(
      [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
      { duration: 380, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
    );
  }

  lb.classList.remove("is-open");
  closeTimer = setTimeout(() => {
    lb.hidden = true;
    lbImg.getAnimations().forEach((a) => a.cancel());
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }, 360);
}

function goTo(index, dir) {
  if (busy || index === current) return;
  const n = visible.length;
  index = (index + n) % n;
  if (dir === undefined) dir = index > current ? 1 : -1;
  busy = true;

  const out = lbImg.animate(
    [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-dir * 50}px)` }],
    { duration: 180, easing: "ease-in", fill: "forwards" }
  );

  // timers instead of animation.finished so a stalled animation
  // (background tab etc.) can never leave the viewer stuck
  setTimeout(() => {
    current = index;
    setImage(visible[current]);
    updateInfo();
    preloadAround(current);
    out.cancel();
    lbImg.animate(
      [{ opacity: 0, transform: `translateX(${dir * 50}px)` }, { opacity: 1, transform: "none" }],
      { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    setTimeout(() => (busy = false), 320);

    if (slideTimer) restartSlideTimer();
  }, 180);
}

const next = () => goTo(current + 1, 1);
const prev = () => goTo(current - 1, -1);

/* slideshow */

function restartSlideTimer() {
  clearTimeout(slideTimer);
  // restart the CSS progress bar
  lbProgress.style.animation = "none";
  void lbProgress.offsetWidth;
  lbProgress.style.animation = "";
  slideTimer = setTimeout(next, SLIDE_MS);
}

function startSlideshow() {
  lb.classList.add("is-playing");
  playBtn.setAttribute("aria-label", "Pause slideshow");
  restartSlideTimer();
}

function stopSlideshow() {
  clearTimeout(slideTimer);
  slideTimer = null;
  lb.classList.remove("is-playing");
  playBtn.setAttribute("aria-label", "Start slideshow");
}

playBtn.addEventListener("click", () => (slideTimer ? stopSlideshow() : startSlideshow()));
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbNext").addEventListener("click", next);
document.getElementById("lbPrev").addEventListener("click", prev);

// clicking the dark area around the photo closes it
lbStage.addEventListener("click", (e) => {
  if (justDragged) return;
  if (e.target === lbStage || e.target.classList.contains("lightbox__figure")) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!isOpen) return;
  switch (e.key) {
    case "Escape": closeLightbox(); break;
    case "ArrowRight": next(); break;
    case "ArrowLeft": prev(); break;
    case "Home": goTo(0, -1); break;
    case "End": goTo(visible.length - 1, 1); break;
    case " ":
      e.preventDefault();
      slideTimer ? stopSlideshow() : startSlideshow();
      break;
    case "Tab": {
      // keep focus inside the viewer
      const focusables = [...lb.querySelectorAll("button")].filter((b) => b.offsetParent);
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  }
});

/* swipe — the photo follows your finger, then snaps */

let dragStartX = null;
let dragDX = 0;

lbStage.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" || busy) return;
  dragStartX = e.clientX;
  dragDX = 0;
});

lbStage.addEventListener("pointermove", (e) => {
  if (dragStartX === null) return;
  dragDX = e.clientX - dragStartX;
  lbImg.style.transform = `translateX(${dragDX}px)`;
  lbImg.style.opacity = 1 - Math.min(Math.abs(dragDX) / 400, 0.5);
});

function endDrag() {
  if (dragStartX === null) return;
  dragStartX = null;
  justDragged = Math.abs(dragDX) > 10;
  setTimeout(() => (justDragged = false), 50);
  lbImg.style.transform = "";
  lbImg.style.opacity = "";
  if (dragDX < -60) next();
  else if (dragDX > 60) prev();
}
lbStage.addEventListener("pointerup", endDrag);
lbStage.addEventListener("pointercancel", endDrag);

/* ---------------- start ---------------- */

buildGrid();
updateCounts();

// a link like index.html#photo-433 opens that photo directly
const fromHash = location.hash.match(/^#photo-(\d+)$/);
if (fromHash) {
  const i = visible.findIndex((p) => p.id === Number(fromHash[1]));
  if (i > -1) openLightbox(i, null);
}
