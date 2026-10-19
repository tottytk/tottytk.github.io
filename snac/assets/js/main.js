// SnaC landing page interactions
(() => {
  document.documentElement.classList.remove("no-js");

  // Nav background
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Reveal on scroll
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

  // Story: sticky phone follows the active step
  const steps = [...document.querySelectorAll(".step")];
  const shots = [...document.querySelectorAll(".story__device .screen img")];
  const dots = [...document.querySelectorAll(".story__dots i")];
  const setStep = (index) => {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === index));
    shots.forEach((s, i) => s.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  };
  if (steps.length) {
    const stepper = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStep(steps.indexOf(entry.target));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    steps.forEach((s) => stepper.observe(s));
    setStep(0);
  }

  // Duo open / closed toggle
  const stage = document.querySelector(".duo__stage");
  const toggle = document.querySelector(".toggle");
  if (stage && toggle) {
    const buttons = [...toggle.querySelectorAll("button")];
    const pill = toggle.querySelector(".toggle__pill");
    const device = stage.querySelector(".duo-fold");
    let touched = false;
    const select = (btn) => {
      if (!btn) return;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      stage.dataset.mode = btn.dataset.mode;
      device?.setAttribute("aria-label", btn.dataset.mode === "open" ? device.dataset.labelOpen : device.dataset.labelClosed);
      pill.style.width = `${btn.offsetWidth}px`;
      pill.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
    };
    buttons.forEach((b) => b.addEventListener("click", () => {
      touched = true;
      select(b);
    }));
    const initial = buttons.find((b) => b.getAttribute("aria-pressed") === "true") || buttons[0];
    select(initial);
    window.addEventListener("resize", () => select(buttons.find((b) => b.getAttribute("aria-pressed") === "true")));

    // 初めて画面に入ったら一度だけ開いて見せる
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const auto = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setTimeout(() => {
              if (!touched) select(buttons[1]);
            }, 900);
            auto.disconnect();
          }
        },
        { threshold: 0.6 }
      );
      auto.observe(stage);
    }
  }
})();
