// ROOMZERO download site: Lenis smooth scroll, GSAP (ScrollTrigger, SplitText) for scroll and intro motion,
// Motion for hover / press springs on the buttons and cards.
(() => {
  const REPO = "Pinc3ng/roomzero-download";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // ---------- Visitor's platform: its card goes first and the hero button names it ----------
  const ua = navigator.userAgent;
  const mine = /android/i.test(ua) ? "android"
    : (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) ? "ios"
    : /windows/i.test(ua) ? "windows" : "";
  const labels = { windows: "Windows", android: "Android", ios: "iOS" };
  if (mine) {
    const card = document.getElementById("card-" + mine);
    card.classList.add("mine");
    card.parentNode.prepend(card);
    const cta = document.getElementById("heroCta");
    cta.textContent = "Download untuk " + labels[mine];
    cta.href = card.querySelector("[data-dl]").href;
    cta.removeAttribute("data-scroll");
  }

  // ---------- Maps ----------
  const MAPS = ["Night Shift", "Cold Storage", "Paper Trail", "Meltdown", "Blackout", "Sewer Line", "Radio Tower",
    "Hospital Wing", "Mine Shaft", "Archive Vault"];
  const grid = document.getElementById("mapGrid");
  MAPS.forEach((name, i) => {
    const f = document.createElement("figure");
    f.className = "map";
    f.innerHTML = '<img src="assets/maps/map_' + i + '.jpg" alt="" loading="lazy"><figcaption><i>' +
      String(i + 1).padStart(2, "0") + "</i></figcaption>";
    f.querySelector("figcaption").append(name);
    f.querySelector("img").alt = name;
    grid.append(f);
  });

  // ---------- Live file sizes, version and date (public GitHub API) ----------
  fetch("https://api.github.com/repos/" + REPO + "/releases/latest")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((rel) => {
      for (const a of rel.assets || []) {
        const el = document.querySelector('[data-file="' + a.name + '"]');
        if (el) el.textContent = a.name + " · " + Math.round(a.size / 1048576) + " MB";
      }
      const newest = (rel.assets || []).reduce((t, a) => (a.updated_at > t ? a.updated_at : t), rel.published_at || "");
      const date = new Date(newest).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const meta = document.getElementById("meta");
      meta.textContent = "";
      const b = document.createElement("b");
      b.textContent = (rel.name || rel.tag_name).replace(/^ROOMZERO\s*/i, "Versi ");
      meta.append(b, " · diperbarui " + date + " · Windows · Android · iOS");
    })
    .catch(() => {});

  // ---------- Copy link ----------
  const copy = document.getElementById("copyLink");
  copy.addEventListener("click", () => {
    navigator.clipboard.writeText("https://pinc3ng.github.io/roomzero-download/").then(() => {
      copy.textContent = "Link disalin";
      setTimeout(() => (copy.textContent = "Salin link"), 1800);
    });
  });

  // ---------- Nav background once past the hero top ----------
  const nav = document.getElementById("nav");
  const setNav = () => nav.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", setNav, { passive: true });
  setNav();

  if (!window.gsap || reduce) {
    // No motion: plain anchors, everything visible.
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ---------- Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync ----------
  const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll("[data-scroll]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || !id.startsWith("#")) return;
      e.preventDefault();
      lenis.scrollTo(id === "#top" ? 0 : id, { offset: -70 });
    }));

  // ---------- Hero intro: the title flickers on like a failing light, then the rest rises ----------
  const title = new SplitText("#heroTitle", { type: "chars", charsClass: "char" });
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .from(".hero-img", { scale: 1.18, duration: 2.4, ease: "power2.out" }, 0)
    .from(title.chars, { yPercent: 110, opacity: 0, duration: 1, stagger: 0.06 }, 0.2)
    .to(title.chars, { opacity: 0.25, duration: 0.05, repeat: 3, yoyo: true, stagger: { each: 0.04, from: "random" } }, 1.1)
    .from(".hero [data-reveal]", { y: 26, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.7)
    .from(".nav", { y: -30, opacity: 0, duration: 0.8 }, 0.9);

  // Torch beam: follows the pointer on desktop, sweeps slowly on touch screens.
  const hero = document.querySelector(".hero");
  const beam = { x: 62, y: 38 };
  const draw = () => { hero.style.setProperty("--x", beam.x + "%"); hero.style.setProperty("--y", beam.y + "%"); };
  if (fine) {
    const toX = gsap.quickTo(beam, "x", { duration: 0.6, ease: "power3", onUpdate: draw });
    const toY = gsap.quickTo(beam, "y", { duration: 0.6, ease: "power3", onUpdate: draw });
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      toX(((e.clientX - r.left) / r.width) * 100);
      toY(((e.clientY - r.top) / r.height) * 100);
    });
  } else {
    gsap.to(beam, { x: 30, y: 45, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1, onUpdate: draw });
  }
  // Rare flicker of the beam.
  gsap.timeline({ repeat: -1, repeatDelay: 5 })
    .to(hero, { "--r": "80px", duration: 0.06, yoyo: true, repeat: 3 })
    .to(hero, { "--r": "300px", duration: 0.2 });

  // Parallax: the corridor drifts and the copy lifts away while scrolling out of the hero.
  gsap.to(".hero-img", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-content", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

  // ---------- Section titles and small copy reveal on scroll ----------
  document.querySelectorAll("[data-split]").forEach((el) => {
    const s = new SplitText(el, { type: "chars", charsClass: "char" });
    gsap.from(s.chars, { yPercent: 100, opacity: 0, duration: 0.8, ease: "power4.out", stagger: 0.03,
      scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  gsap.utils.toArray("main [data-reveal]").forEach((el) =>
    gsap.from(el, { y: 24, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));

  gsap.from(".card", { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: "#cards", start: "top 80%" } });
  gsap.from(".map", { y: 40, opacity: 0, scale: 0.96, duration: 0.7, ease: "power3.out", stagger: { each: 0.06, grid: "auto", from: "start" },
    scrollTrigger: { trigger: "#mapGrid", start: "top 80%" } });
  gsap.from("#qrCard", { rotate: -6, y: 60, opacity: 0, duration: 1, ease: "back.out(1.6)",
    scrollTrigger: { trigger: "#qrCard", start: "top 85%" } });

  // ---------- Creatures: pinned horizontal walk on wide screens; swipe on phones ----------
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const track = document.getElementById("creatureTrack");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".creatures-pin", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    gsap.utils.toArray(".creature img").forEach((img) =>
      gsap.fromTo(img, { scale: 1.2 }, { scale: 1.02, ease: "none",
        scrollTrigger: { trigger: ".creatures-pin", start: "top top", end: () => "+=" + dist(), scrub: true } }));
  });
  mm.add("(max-width: 900px)", () => {
    gsap.from(".creature", { x: 80, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: "#creatureTrack", start: "top 85%" } });
  });

  // ---------- Motion: springy hover / press on buttons, cards and the QR ----------
  if (window.Motion) {
    const { animate, hover, press } = Motion;
    const spring = { type: "spring", stiffness: 420, damping: 24 };
    hover(".btn, .nav-cta", (el) => { animate(el, { scale: 1.04 }, spring); return () => animate(el, { scale: 1 }, spring); });
    press(".btn, .nav-cta", (el) => { animate(el, { scale: 0.95 }, spring); return () => animate(el, { scale: 1 }, spring); });
    hover(".card", (el) => { animate(el, { y: -8 }, spring); return () => animate(el, { y: 0 }, spring); });
    hover(".qr-card", (el) => { animate(el, { rotate: 2, scale: 1.03 }, spring); return () => animate(el, { rotate: 0, scale: 1 }, spring); });
  }
  // Red glow that follows the pointer inside a card.
  document.querySelectorAll(".card").forEach((c) =>
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    }));

  addEventListener("load", () => ScrollTrigger.refresh());
})();
