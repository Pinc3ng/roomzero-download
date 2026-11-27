// ROOMZERO site. Lenis for scrolling, GSAP (ScrollTrigger, SplitText) for the few scroll moments,
// Motion for the springs on the download arrows. Everything reads fine with scripts off.
(() => {
  const REPO = "Pinc3ng/roomzero-download";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // Visitor's platform: marked in the hero links and the download list.
  const ua = navigator.userAgent;
  const mine = /android/i.test(ua) ? "android"
    : (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) ? "ios"
    : /windows/i.test(ua) ? "windows" : "";
  if (mine) {
    document.querySelectorAll('[data-platform="' + mine + '"]').forEach((el) => el.classList.add("mine"));
    const row = document.querySelector('.file[data-platform="' + mine + '"]');
    row.parentNode.prepend(row);
    const q = document.querySelector('.quick a[data-platform="' + mine + '"]').parentNode;
    q.parentNode.prepend(q);
  }

  // Floor directory: the ten maps in their in-game order.
  const MAPS = ["Night Shift", "Cold Storage", "Paper Trail", "Meltdown", "Blackout", "Sewer Line", "Radio Tower",
    "Hospital Wing", "Mine Shaft", "Archive Vault"];
  const floors = document.getElementById("floors");
  MAPS.forEach((name, i) => {
    const li = document.createElement("li");
    li.className = "floor";
    li.dataset.img = "assets/maps/map_" + i + ".jpg";
    const code = document.createElement("span");
    code.className = "code";
    code.textContent = "Map " + String(i + 1).padStart(2, "0");
    const n = document.createElement("span");
    n.className = "floor-name";
    n.textContent = name;
    const img = document.createElement("img");
    img.className = "floor-thumb";
    img.src = li.dataset.img;
    img.alt = name;
    img.loading = "lazy";
    li.append(code, n, img);
    floors.append(li);
  });

  // Sizes and version from the public release.
  fetch("https://api.github.com/repos/" + REPO + "/releases/latest")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((rel) => {
      for (const a of rel.assets || []) {
        const mb = Math.round(a.size / 1048576) + " MB";
        document.querySelectorAll('[data-size="' + a.name + '"]').forEach((el) => {
          el.textContent = el.tagName === "EM" ? el.textContent.split(" ")[0] + " · " + mb : mb;
        });
      }
      const newest = (rel.assets || []).reduce((t, a) => (a.updated_at > t ? a.updated_at : t), rel.published_at || "");
      const date = new Date(newest).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      document.getElementById("ver").textContent = (rel.name || "").replace(/^ROOMZERO\s*/i, "Versi ") + " · " + date;
    })
    .catch(() => {});

  const copy = document.getElementById("copy");
  copy.addEventListener("click", () => {
    navigator.clipboard.writeText("https://pinc3ng.github.io/roomzero-download/")
      .then(() => { copy.textContent = "Tersalin"; setTimeout(() => (copy.textContent = "Salin tautan"), 1600); })
      .catch(() => { copy.textContent = "pinc3ng.github.io/roomzero-download"; });
  });

  // Residents: the sticky portrait follows whichever entry is in the middle of the screen.
  const stage = [...document.querySelectorAll(".res-stage img")];
  const entries = [...document.querySelectorAll(".res")];
  const show = (i) => {
    stage.forEach((im, k) => im.classList.toggle("on", k === i));
    entries.forEach((e, k) => e.classList.toggle("on", k === i));
  };
  show(0);

  if (!window.gsap || reduce) {
    const io = new IntersectionObserver((xs) => xs.forEach((x) => x.isIntersecting && show(+x.target.dataset.i)),
      { rootMargin: "-45% 0px -45% 0px" });
    entries.forEach((e) => io.observe(e));
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const lenis = new Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll("[data-scroll]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("href");
      lenis.scrollTo(id === "#top" ? 0 : id, { offset: -10, duration: 1.6 });
    }));

  // One orchestrated opening: the window comes into focus, the name settles from wide to tight.
  const title = new SplitText("#title", { type: "chars" });
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .fromTo(".hero-media img", { scale: 1.12, filter: "blur(10px) brightness(.5)" }, { scale: 1, filter: "blur(0px) brightness(1)", duration: 2.6 }, 0)
    .from(title.chars, { opacity: 0, x: (i) => (i - 3.5) * 28, duration: 1.8, stagger: 0.035 }, 0.25)
    .from("[data-in]", { opacity: 0, y: 14, duration: 1.2, stagger: 0.12 }, 0.9);
  gsap.to(".hero-media img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Field note: the words light up as they pass through the reading line.
  const words = new SplitText("#brief", { type: "words", wordsClass: "w" }).words;
  gsap.to(words, { opacity: 1, stagger: 0.08, ease: "none",
    scrollTrigger: { trigger: "#brief", start: "top 75%", end: "bottom 45%", scrub: true } });

  // Section heads and rows rise once, quietly.
  gsap.utils.toArray(".head").forEach((h) =>
    gsap.from(h.children, { y: 24, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: h, start: "top 85%" } }));
  gsap.from(".floor", { y: 18, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: "#floors", start: "top 80%" } });
  gsap.from(".file", { y: 18, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: "#files", start: "top 85%" } });

  entries.forEach((e) => ScrollTrigger.create({ trigger: e, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && show(+e.dataset.i) }));

  // Floor directory: a still of the map trails the pointer.
  if (fine) {
    const peek = document.getElementById("peek");
    const pimg = peek.querySelector("img");
    const px = gsap.quickTo(peek, "x", { duration: 0.6, ease: "power3" });
    const py = gsap.quickTo(peek, "y", { duration: 0.6, ease: "power3" });
    gsap.set(peek, { xPercent: -50, yPercent: -50, scale: 0.92 });
    // Which row is under the pointer is checked on every move AND every scroll: scrolling moves the rows
    // under a still pointer without firing pointerleave, which left the still stuck on screen.
    let cx = -1, cy = -1, current = null;
    const showRow = (f) => {
      if (f === current) return;
      current = f;
      if (f) {
        pimg.src = f.dataset.img;
        gsap.to(peek, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      } else {
        gsap.to(peek, { opacity: 0, scale: 0.92, duration: 0.25, overwrite: "auto" });
      }
    };
    const check = () => {
      const el = cx < 0 ? null : document.elementFromPoint(cx, cy);
      showRow(el ? el.closest(".floor") : null);
    };
    addEventListener("pointermove", (e) => { cx = e.clientX; cy = e.clientY; px(cx + 200); py(cy); check(); }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { cx = -1; showRow(null); });
    lenis.on("scroll", check);
  }

  // Motion: the download arrow drops a little on hover, like a lift arriving.
  if (window.Motion) {
    const { animate, hover, press } = Motion;
    hover(".file a", (el) => {
      const arrow = el.querySelector(".f-arrow");
      animate(arrow, { y: [0, 6, 0] }, { duration: 0.6, ease: "easeInOut" });
    });
    press(".file a, .quick a", (el) => { animate(el, { scale: 0.98 }, { type: "spring", stiffness: 500, damping: 30 });
      return () => animate(el, { scale: 1 }, { type: "spring", stiffness: 500, damping: 30 }); });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
