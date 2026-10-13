(() => {
  "use strict";
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#main-nav");
  const mobile = window.matchMedia("(max-width: 520px)");
  const setMenu = (open) => {
    menu.setAttribute("aria-expanded", String(open));
    nav.dataset.collapsed = String(mobile.matches && !open);
    menu.querySelector("span").textContent = open ? "−" : "+";
  };
  const syncMenu = () => {
    menu.hidden = !mobile.matches;
    setMenu(false);
  };
  menu.addEventListener("click", () =>
    setMenu(menu.getAttribute("aria-expanded") !== "true"),
  );
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a") && mobile.matches) {
      const target = document.querySelector(
        event.target.closest("a").getAttribute("href"),
      );
      setMenu(false);
      // Move keyboard focus out of the collapsed navigation into the destination.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.addEventListener(
        "blur",
        () => target.removeAttribute("tabindex"),
        { once: true },
      );
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      mobile.matches &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menu.focus();
    }
  });
  mobile.addEventListener("change", syncMenu);
  syncMenu();
  document.querySelector("#year").textContent = String(
    new Date().getFullYear(),
  );

  const config = window.PORTFOLIO_CONFIG || {};
  const email = typeof config.email === "string" ? config.email.trim() : "";
  if (
    /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(
      email,
    )
  ) {
    const link = document.createElement("a");
    link.className = "button contact-pending";
    link.href = `mailto:${encodeURIComponent(email)}?subject=Let%E2%80%99s%20talk%20about%20a%20project`;
    link.textContent = "Tell me about your project →";
    const note = document.createElement("p");
    note.className = "contact-note";
    note.textContent = email;
    document.querySelector("#contact-action").replaceChildren(link, note);
  }
  const socials = document.querySelector("#social-links");
  for (const [key, label] of [
    ["github", "GitHub"],
    ["linkedin", "LinkedIn"],
  ]) {
    try {
      const url = new URL(config[key]);
      if (url.protocol !== "https:" || url.username || url.password) continue;
      const link = document.createElement("a");
      link.href = url.href;
      link.textContent = `${label} →`;
      socials.append(link);
    } catch {
      /* Missing or invalid URLs intentionally produce no link. */
    }
  }
  socials.hidden = socials.children.length === 0;
})();
