/* ============================================================
   RestuWeb — main.js
   Nav, reveal, header state, FAQ micro-interaction, toast
   ============================================================ */

(() => {
  "use strict";

  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("nav");
  const menuToggle = document.getElementById("menuToggle");
  const toast = document.getElementById("toast");
  let toastTimer = null;

  /* ---------- Header scroll state ---------- */
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav on scroll ---------- */
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const highlight = () => {
    const offset = (header?.offsetHeight || 76) + 120;
    let current = sections[0];
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - offset) current = sec;
    });
    if (current) {
      navLinks.forEach((link) =>
        link.classList.toggle("is-active", link.getAttribute("href") === `#${current.id}`)
      );
    }
  };
  window.addEventListener("scroll", highlight, { passive: true });
  highlight();

  /* ---------- Mobile menu ---------- */
  const closeMenu = () => {
    nav?.classList.remove("is-open");
    header?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  };

  menuToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    header?.classList.toggle("is-open", Boolean(open));
    document.body.classList.toggle("menu-open", Boolean(open));
    menuToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  nav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (e) => {
    if (!nav?.classList.contains("is-open")) return;
    if (e.target.closest("#nav") || e.target.closest("#menuToggle")) return;
    closeMenu();
  });

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- FAQ: tutup item lain saat satu dibuka ---------- */
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Toast helper (bisa dipakai tombol lain nanti) ---------- */
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };

  /* Salin nomor WA saat klik kanan tombol order? — sederhana:
     beri feedback saat user menekan tombol email/CTA      */
  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    a.addEventListener("click", () => showToast("Membuka aplikasi email kamu…"));
  });

  /* ---------- Tahun footer ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
