/* ============================================================
   RestuWeb — main.js
   Nav, reveal, header state, FAQ micro-interaction, toast,
   lightbox galeri, form order (Cloudflare Worker / fallback WA)
   ============================================================ */

(() => {
  "use strict";

  /* ============================================================
     KONFIGURASI ORDER REALTIME
     Isi dengan URL Cloudflare Worker kamu setelah deploy, mis.:
     https://webspace-order.<subdomain>.workers.dev
     Kosongkan ("") untuk fallback: order dikirim via WhatsApp.
     Panduan lengkap: bisnis-web/CLOUDFLARE-SETUP.md
     ============================================================ */
  const ORDER_ENDPOINT = "";

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

  /* ---------- Lightbox galeri poster ---------- */
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCaption = document.getElementById("lbCaption");
  const galleryItems = Array.from(document.querySelectorAll(".gallery-card"));
  let lbIndex = 0;

  if (lightbox && galleryItems.length) {
    const openLb = (i) => {
      lbIndex = (i + galleryItems.length) % galleryItems.length;
      const img = galleryItems[lbIndex].querySelector("img");
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = galleryItems[lbIndex].dataset.caption || "";
      lightbox.hidden = false;
      setTimeout(() => lightbox.classList.add("is-open"), 20);
      document.body.classList.add("menu-open");
    };
    const closeLb = () => {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      setTimeout(() => { lightbox.hidden = true; }, 250);
    };
    const stepLb = (dir) => openLb(lbIndex + dir);

    galleryItems.forEach((item, i) => {
      item.querySelector(".gallery-thumb")?.addEventListener("click", () => openLb(i));
    });
    lightbox.querySelector(".lb-close").addEventListener("click", closeLb);
    lightbox.querySelector(".lb-prev").addEventListener("click", () => stepLb(-1));
    lightbox.querySelector(".lb-next").addEventListener("click", () => stepLb(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLb();
    });
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") stepLb(-1);
      if (e.key === "ArrowRight") stepLb(1);
    });
  }

  /* ---------- Form order ---------- */
  const orderModal = document.getElementById("orderModal");
  const orderForm = document.getElementById("orderForm");
  const orderBody = document.getElementById("orderBody");
  const orderSuccess = document.getElementById("orderSuccess");
  const orderSubmit = document.getElementById("orderSubmit");

  if (orderModal && orderForm) {
    const openOrder = (paket) => {
      orderSuccess.hidden = true;
      orderBody.hidden = false;
      if (paket) {
        const sel = orderForm.querySelector('select[name="paket"]');
        if (sel) {
          const match = [...sel.options].find((o) => o.value.startsWith(paket));
          sel.value = match ? match.value : "";
        }
      }
      orderModal.hidden = false;
      setTimeout(() => orderModal.classList.add("is-open"), 20);
      document.body.classList.add("menu-open");
      orderForm.querySelector('input[name="nama"]')?.focus();
    };
    const closeOrder = () => {
      orderModal.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      setTimeout(() => { orderModal.hidden = true; }, 250);
    };

    document.querySelectorAll("[data-order-open]").forEach((btn) => {
      btn.addEventListener("click", () => openOrder(btn.dataset.paket || ""));
    });
    orderModal.querySelector(".order-close").addEventListener("click", closeOrder);
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) closeOrder();
    });
    document.getElementById("orderAgain")?.addEventListener("click", () => {
      orderForm.reset();
      openOrder("");
    });
    document.addEventListener("keydown", (e) => {
      if (orderModal.hidden) return;
      if (e.key === "Escape") closeOrder();
    });

    const buildWaText = (d) =>
      [
        "Halo WebSpace, saya mau order website:",
        `• Nama: ${d.nama}`,
        `• Paket: ${d.paket}`,
        `• Domain: ${d.domainMode}${d.domain ? ` (${d.domain})` : ""}`,
        "• Bayar via: Transfer BNI",
        d.catatan ? `• Catatan: ${d.catatan}` : "",
        `• No. WA: ${d.wa}`,
      ].filter(Boolean).join("\n");

    const payConfirmWa = document.getElementById("payConfirmWa");

    /* Setelah order dikirim → langsung layar selesai + info transfer BNI */
    const tampilkanSelesai = (d) => {
      payConfirmWa.href =
        "https://wa.me/6285778179537?text=" + encodeURIComponent(buildWaText(d) + "\n\nSaya sudah transfer ke BNI 2019167002, bukti transfernya saya kirim di sini 🙏");
      orderBody.hidden = true;
      orderSuccess.hidden = false;
    };

    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(orderForm).entries());
      if (!data.nama?.trim() || !data.wa?.trim() || !data.paket) {
        showToast("Lengkapi dulu nama, no. WhatsApp, dan paketnya ya.");
        return;
      }
      data.wa = data.wa.replace(/[^0-9+]/g, "");

      orderSubmit.disabled = true;
      orderSubmit.textContent = "Mengirim…";

      let terkirim = false;
      if (ORDER_ENDPOINT) {
        try {
          const res = await fetch(ORDER_ENDPOINT.replace(/\/$/, "") + "/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          terkirim = res.ok;
        } catch { terkirim = false; }
      }

      orderSubmit.disabled = false;
      orderSubmit.textContent = "Kirim Order";

      if (terkirim) {
        tampilkanSelesai(data);
        showToast("Order berhasil dikirim ✓");
      } else {
        // Fallback: teruskan order via WhatsApp (dipakai juga saat endpoint belum dipasang)
        window.open(
          "https://wa.me/6285778179537?text=" + encodeURIComponent(buildWaText(data)),
          "_blank",
          "noopener"
        );
        tampilkanSelesai(data);
        showToast("Order dibuka via WhatsApp ✓");
      }
    });

    /* ---------- Salin nomor rekening ---------- */
    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const teks = btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(teks);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = teks;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        const lama = btn.textContent;
        btn.textContent = "Tersalin ✓";
        setTimeout(() => { btn.textContent = lama; }, 1800);
      });
    });
  }
})();
