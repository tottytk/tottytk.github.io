(() => {
  "use strict";
  const scene = document.querySelector("[data-scene]");
  if (!scene) return;
  const room = scene.querySelector(".scene-room");
  const shelf = room.querySelector(".scene-shelf");
  const piano = room.querySelector(".scene-piano");
  const cards = [...scene.querySelectorAll(".scene-beat")];
  const controls = scene.querySelector(".scene-controls");
  const manual = scene.querySelector("[data-scene-manual]");
  const next = scene.querySelector("[data-scene-next]");
  const reset = scene.querySelector("[data-scene-reset]");
  const indicator = scene.querySelector("[data-scene-indicator]");
  const announcement = scene.querySelector("[data-scene-status]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = value => Math.max(0, Math.min(1, value));
  const smoothstep = t => t * t * (3 - 2 * t);
  // Catnap game: SpacePuzzle.swift uses max(.15, cells * .1) seconds;
  // MainPresentation.swift advances linearly. The final swipe first arrives
  // at the edge, then MainGame.swift / PianoExitMask advances 3.2 cells in .8s.
  const tilePixels = 174;
  const nativeSlide = (start, cells) => ({ start, duration: Math.max(150, cells * 100) });
  const end = span => span.start + span.duration;
  const linear = (time, span) => clamp((time - span.start) / span.duration);
  const shelfUp = nativeSlide(320, 3);
  const pianoRight = nativeSlide(2730, 3);
  const pianoDown = nativeSlide(3320, 1);
  const pianoToDoor = nativeSlide(5500, 1);
  const pianoThroughDoor = { start: end(pianoToDoor), duration: 800 };
  const stops = [0, end(shelfUp), end(pianoDown), end(pianoThroughDoor)];
  // Fixed editorial reading beats, not stretched animation durations.
  const cardTwo = 2550;
  const cardThree = 5300;
  const cycleDuration = 8500;
  const viewport = window.visualViewport;
  const canObserve = typeof IntersectionObserver === "function";
  let frame = null, previousFrame = null, step = 0;
  let elapsed = 0, fullyIntersecting = false, activeCard = -1;

  function paint(time) {
    // Offsets measured against the approved native reference frame.
    const shelfY = -460 * linear(time, shelfUp);
    const pianoX = 521 * linear(time, pianoRight);
    const pianoY = tilePixels * linear(time, pianoDown);
    const exitX = tilePixels * (linear(time, pianoToDoor) + 3.2 * linear(time, pianoThroughDoor));
    shelf.style.transform = `translateY(${shelfY / 356 * 100}%)`;
    piano.style.transform = `translate(${(pianoX + exitX) / 363 * 100}%,${pianoY / 182 * 100}%)`;
    piano.style.opacity = String(1 - smoothstep(clamp((exitX - 518) / 178)));
    room.dataset.progress = (time / cycleDuration).toFixed(5);
    room.dataset.complete = String(time >= end(pianoThroughDoor));
    const active = time < cardTwo ? 0 : time < cardThree ? 1 : 2;
    if (activeCard !== active) {
      cards.forEach((card, i) => { card.hidden = i !== active; });
      activeCard = active;
    }
  }
  function wholeBoardInView() {
    // The observer includes clipping through scroll containers. Check live
    // geometry too, before a frame can advance or on a pinch/viewport change.
    if (!fullyIntersecting) return false;
    const board = room.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const right = Math.min(width, left + (viewport?.width ?? width));
    const bottom = Math.min(height, top + (viewport?.height ?? height));
    return board.width > 0 && board.height > 0 &&
      board.left >= Math.max(0, left) && board.top >= Math.max(0, top) &&
      board.right <= right && board.bottom <= bottom;
  }
  function running() {
    return document.visibilityState === "visible" && !reduced.matches && wholeBoardInView();
  }
  function tick(now) {
    frame = null;
    if (!running()) { previousFrame = null; return; }
    // Exclude time spent outside the viewport, in another tab, or with motion reduced.
    if (previousFrame !== null) {
      elapsed = (elapsed + Math.min(now - previousFrame, 100)) % cycleDuration;
      paint(elapsed);
    }
    previousFrame = now;
    frame = requestAnimationFrame(tick);
  }
  function syncPlayback() {
    if (running()) {
      if (frame === null) frame = requestAnimationFrame(tick);
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previousFrame = null;
    }
  }
  function manually(announce = false) {
    paint(stops[step]);
    indicator.textContent = `${step} / 3`;
    next.disabled = step === 3;
    reset.disabled = step === 0;
    if (announce) {
      announcement.textContent = scene.dataset[`phase${step}`] || cards[0].querySelector("h3").textContent;
    }
  }
  next.addEventListener("click", () => { step = Math.min(3, step + 1); manually(true); });
  reset.addEventListener("click", () => { step = 0; manually(true); next.focus(); });
  function mode() {
    const manualMode = reduced.matches || !canObserve;
    controls.hidden = !manualMode;
    manual.hidden = !manualMode;
    if (manualMode) { step = 0; manually(); }
    else paint(elapsed);
    syncPlayback();
  }
  if (canObserve) {
    new IntersectionObserver(([entry]) => {
      fullyIntersecting = entry.isIntersecting && entry.intersectionRatio === 1;
      syncPlayback();
    }, { threshold: 1 }).observe(room);
    addEventListener("scroll", syncPlayback, { capture: true, passive: true });
    addEventListener("resize", syncPlayback, { passive: true });
    viewport?.addEventListener("scroll", syncPlayback, { passive: true });
    viewport?.addEventListener("resize", syncPlayback, { passive: true });
  }
  document.addEventListener("visibilitychange", syncPlayback);
  if (reduced.addEventListener) reduced.addEventListener("change", mode);
  else reduced.addListener(mode);
  document.documentElement.classList.add("motion-enabled");
  mode();
})();
