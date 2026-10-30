/* ============================================================
   WEBSPACE — main.js
   Vanilla JS: navigasi, reveal, modal order (BNI), toast
   ============================================================ */
(() => {
  "use strict";

  const WA_NUMBER = "6285778179537";
  /* Supabase — isi dari project kamu (Settings → API). Kosong = fallback ke WhatsApp. */
  const SUPABASE_URL = "https://pinqqracuytbrigmhmkl.supabase.co";      // mis. "https://abcdxyz.supabase.co"
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbnFxcmFjdXl0YnJpZ21obWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNTY1MDgsImV4cCI6MjEwODkzMjUwOH0.CsE2C4elxcgePr5qVVdAYcKhg9XMdBoUqNdNbGLDj-g"; // kunci "anon public" — aman untuk frontend

  /* ---------- Header scroll state ---------- */
  const siteHead = document.getElementById("siteHead");
  const onScroll = () => {
    siteHead.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Navigasi mobile ---------- */
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");

  const closeNav = () => {
    navToggle.classList.remove("is-open");
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Buka menu");
    document.body.classList.remove("menu-open");
  };

  navToggle.addEventListener("click", () => {
    const open = !siteNav.classList.contains("is-open");
    navToggle.classList.toggle("is-open", open);
    siteNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    document.body.classList.toggle("menu-open", open);
  });
  siteNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Toast ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-show");
      setTimeout(() => { toast.hidden = true; }, 300);
    }, 2600);
  };

  /* ---------- Form order ---------- */
  const orderModal = document.getElementById("orderModal");
  const orderForm = document.getElementById("orderForm");
  const orderBody = document.getElementById("orderBody");
  const orderPay = document.getElementById("orderPay");
  const orderSuccess = document.getElementById("orderSuccess");
  const orderSubmit = document.getElementById("orderSubmit");
  const orderCloseBtn = document.getElementById("orderClose");
  const payConfirmWa = document.getElementById("payConfirmWa");
  const payAmount = document.getElementById("payAmount");
  const domainInput = document.getElementById("domainInput");

  if (orderModal && orderForm) {
    const openOrder = (paket) => {
      closeNav();
      orderPay.hidden = true;
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
      requestAnimationFrame(() => orderModal.classList.add("is-open"));
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
    orderCloseBtn.addEventListener("click", closeOrder);
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) closeOrder();
    });
    document.addEventListener("keydown", (e) => {
      if (orderModal.hidden) return;
      if (e.key === "Escape") closeOrder();
    });

    /* Domain sendiri → tampilkan input domain */
    orderForm.querySelectorAll('input[name="domainMode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        domainInput.hidden = radio.value !== "Domain sendiri" || !radio.checked;
        if (!domainInput.hidden) domainInput.focus();
      });
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

    /* DP 50% dari harga paket (Custom => null, disepakati via WA) */
    const HARGA_PAKET = { "Landing Page": 99000, "Portofolio": 149000, "Business Profile": 199000 };
    const hitungDP = (paket) => {
      for (const nama in HARGA_PAKET) {
        if (paket.startsWith(nama)) return HARGA_PAKET[nama] / 2;
      }
      return null;
    };
    const fmtRp = (n) => "Rp" + n.toLocaleString("id-ID");

    /* Setelah order masuk database → tampil pembayaran DP 50% */
    const tampilkanPembayaran = (d) => {
      const dp = hitungDP(d.paket || "");
      payAmount.textContent = dp ? fmtRp(dp) : "DP 50%";
      payConfirmWa.href =
        "https://wa.me/" + WA_NUMBER + "?text=" +
        encodeURIComponent(buildWaText(d) + "\n\nSaya sudah transfer DP 50% ke BNI 2019167002, bukti transfernya saya kirim di sini 🙏");
      orderBody.hidden = true;
      orderPay.hidden = false;
    };

    /* Konfirmasi transfer → layar order selesai (pengerjaan dimulai) */
    payConfirmWa.addEventListener("click", () => {
      setTimeout(() => {
        orderPay.hidden = true;
        orderSuccess.hidden = false;
      }, 400);
    });

    /* Kembali mengubah pesanan */
    document.getElementById("payBack").addEventListener("click", () => {
      orderPay.hidden = true;
      orderBody.hidden = false;
    });

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
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const res = await fetch(SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: "Bearer " + SUPABASE_ANON_KEY,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              nama: data.nama,
              wa: data.wa,
              paket: data.paket,
              domain_mode: data.domainMode,
              domain: data.domain || null,
              catatan: data.catatan || null,
              status: "baru",
            }),
          });
          terkirim = res.ok;
        } catch { terkirim = false; }
      }

      orderSubmit.disabled = false;
      orderSubmit.textContent = "Kirim Order";

      if (terkirim) {
        tampilkanPembayaran(data);
        showToast("Order masuk database ✓");
      } else {
        // Endpoint belum dipasang → tetap lanjut ke pembayaran (tanpa buka WA)
        tampilkanPembayaran(data);
        showToast("Order diterima ✓");
      }
    });

    document.getElementById("orderAgain")?.addEventListener("click", () => {
      orderForm.reset();
      domainInput.hidden = true;
      orderPay.hidden = true;
      openOrder("");
    });
  }

  /* ---------- Salin nomor rekening ---------- */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const teks = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(teks);
        showToast("Nomor rekening disalin ✓");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = teks;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("Nomor rekening disalin ✓");
      }
    });
  });

  /* ============================================================
     DASHBOARD ADMIN — klik link "Admin" di footer / akses #admin
     Order masuk realtime (auto refresh); hanya admin yang login
     dengan akun Supabase yang bisa melihat & mengelola order.
     ============================================================ */
  const ADMIN_SESSION = "webspace_admin_session";
  const $ad = (id) => document.getElementById(id);
  const adminSimp = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  if ($ad("adminOverlay")) {
    const admSb = () => SUPABASE_URL.replace(/\/$/, "");
    let admSesi = null;
    try { admSesi = JSON.parse(localStorage.getItem(ADMIN_SESSION)) || null; } catch { admSesi = null; }
    let admTimer = null;
    let admLastId = "";
    let admCache = [];

    const admApikeyHeaders = () => ({
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + (admSesi ? admSesi.access_token : SUPABASE_ANON_KEY),
    });

    /* Refresh token kalau akses token kedaluwarsa */
    const admRefreshSesi = async () => {
      if (!admSesi || !admSesi.refresh_token) return false;
      try {
        const res = await fetch(admSb() + "/auth/v1/token?grant_type=refresh_token", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: admSesi.refresh_token }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        admSesi = { access_token: data.access_token, refresh_token: data.refresh_token };
        localStorage.setItem(ADMIN_SESSION, JSON.stringify(admSesi));
        return true;
      } catch { return false; }
    };

    const admApi = async (path, opts = {}) => {
      const res = await fetch(admSb() + path, { ...opts, headers: { ...admApikeyHeaders(), ...(opts.headers || {}) } });
      if (res.status === 401 || res.status === 403) {
        if (await admRefreshSesi()) {
          return fetch(admSb() + path, { ...opts, headers: { ...admApikeyHeaders(), ...(opts.headers || {}) } });
        }
        admLogout("Sesi habis — silakan masuk lagi.");
        throw new Error("unauthorized");
      }
      return res;
    };

    const admLogout = (msg) => {
      admStopAuto();
      admSesi = null;
      localStorage.removeItem(ADMIN_SESSION);
      $ad("adminDash").hidden = true;
      $ad("adminLogin").hidden = false;
      $ad("adminErr").textContent = msg || "";
    };

    const admLoad = async () => {
      if (!SUPABASE_URL || SUPABASE_ANON_KEY.length < 20) {
        $ad("adminList").innerHTML = '<div class="admin-empty">Supabase belum dikonfigurasi.<br />Isi SUPABASE_URL dan SUPABASE_ANON_KEY di assets/js/main.js.</div>';
        return;
      }
      try {
        const res = await admApi("/rest/v1/orders?select=*&order=created_at.desc");
        if (!res.ok) throw new Error("gagal");
        admCache = await res.json();
        admRender();
        $ad("adminSync").textContent = "Sinkron " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        if (admCache.length && admCache[0].id !== admLastId) {
          if (admLastId) showToast("\uD83D\uDD14 Order baru dari " + admCache[0].nama + "!");
          admLastId = admCache[0].id;
        }
      } catch (e) {
        if (e.message !== "unauthorized") {
          $ad("adminList").innerHTML = '<div class="admin-empty">Gagal memuat order.<br />Cek koneksi / tabel &quot;orders&quot; di Supabase.</div>';
        }
      }
    };

    const admRender = () => {
      const daftar = $ad("adminList");
      $ad("aTotal").textContent = admCache.length;
      $ad("aBaru").textContent = admCache.filter((o) => o.status === "baru").length;
      $ad("aProses").textContent = admCache.filter((o) => o.status === "diproses").length;
      $ad("aSelesai").textContent = admCache.filter((o) => o.status === "selesai").length;

      if (!admCache.length) {
        daftar.innerHTML = '<div class="admin-empty">Belum ada order masuk.<br />Order dari website akan muncul di sini otomatis.</div>';
        return;
      }
      const fmt = (ts) => new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
      daftar.innerHTML = admCache.map((o) => `
        <div class="adm-card ${o.status === "baru" ? "is-new" : ""}">
          <div class="adm-top">
            <b>${adminSimp(o.nama)}</b>
            <span class="adm-badge ${adminSimp(o.status)}">${adminSimp(o.status)}</span>
            <span class="adm-time">${fmt(o.created_at)}</span>
          </div>
          <div class="adm-grid">
            <span><k>Paket:</k> ${adminSimp(o.paket)}</span>
            <span><k>WA:</k> <a href="https://wa.me/${adminSimp(o.wa).replace(/^0/, "62").replace(/[^0-9]/g, "")}" target="_blank" rel="noopener">${adminSimp(o.wa)}</a></span>
            <span><k>Domain:</k> ${adminSimp(o.domain_mode || "—")}${o.domain ? " (" + adminSimp(o.domain) + ")" : ""}</span>
            <span><k>ID:</k> ${adminSimp(o.id)}</span>
          </div>
          ${o.catatan ? `<div class="adm-note">\uD83D\uDCDD ${adminSimp(o.catatan)}</div>` : ""}
          <div class="adm-actions">
            ${o.status !== "diproses" ? `<button type="button" class="adm-sm" data-act="diproses" data-id="${adminSimp(o.id)}">Tandai Diproses</button>` : ""}
            ${o.status !== "selesai" ? `<button type="button" class="adm-sm" data-act="selesai" data-id="${adminSimp(o.id)}">Tandai Selesai</button>` : ""}
            <button type="button" class="adm-sm danger" data-act="hapus" data-id="${adminSimp(o.id)}">Hapus</button>
          </div>
        </div>`).join("");
    };

    /* Aksi tombol pada kartu order (delegasi event) */
    $ad("adminList").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const { act, id } = btn.dataset;
      try {
        if (act === "hapus") {
          if (!confirm("Hapus order ini permanen?")) return;
          const res = await admApi("/rest/v1/orders?id=eq." + id, { method: "DELETE" });
          if (res.ok) { showToast("Order dihapus"); admLoad(); }
          else showToast("Gagal menghapus");
        } else {
          btn.disabled = true;
          const res = await admApi("/rest/v1/orders?id=eq." + id, {
            method: "PATCH",
            body: JSON.stringify({ status: act }),
          });
          btn.disabled = false;
          if (res.ok) { showToast("Status diubah \u2192 " + act); admLoad(); }
          else showToast("Gagal mengubah status");
        }
      } catch { /* unauthorized sudah ditangani di admApi */ }
    });

    const admStartAuto = () => { admStopAuto(); admTimer = setInterval(admLoad, 5000); };
    const admStopAuto = () => { clearInterval(admTimer); admTimer = null; };

    const admBuka = () => {
      const ov = $ad("adminOverlay");
      if (!ov.hidden) return;
      ov.hidden = false;
      requestAnimationFrame(() => ov.classList.add("is-open"));
      document.body.classList.add("admin-open");
      if (admSesi && admSesi.access_token) {
        $ad("adminLogin").hidden = true;
        $ad("adminDash").hidden = false;
        admStopAuto();
        admLoad().then(admStartAuto);
      } else {
        $ad("adminLogin").hidden = false;
        $ad("adminDash").hidden = true;
        $ad("adminEmail").focus();
      }
      try { history.replaceState(null, "", location.pathname + location.search); } catch { /* file:// jars */ }
    };

    const admTutup = () => {
      const ov = $ad("adminOverlay");
      admStopAuto();
      ov.classList.remove("is-open");
      document.body.classList.remove("admin-open");
      setTimeout(() => { ov.hidden = true; }, 260);
    };

    document.querySelectorAll(".foot-admin-link").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); admBuka(); }));
    window.addEventListener("hashchange", () => { if (location.hash === "#admin") admBuka(); });
    if (location.hash === "#admin") admBuka();

    document.querySelectorAll(".admin-x").forEach((b) => b.addEventListener("click", admTutup));

    $ad("adminLoginBtn").addEventListener("click", async () => {
      const email = $ad("adminEmail").value.trim();
      const pass = $ad("adminPass").value;
      const err = $ad("adminErr");
      err.textContent = "";
      if (!email || !pass) { err.textContent = "Isi email dan password dulu."; return; }
      if (!SUPABASE_URL || SUPABASE_ANON_KEY.length < 20) {
        err.textContent = "SUPABASE_URL / ANON_KEY belum diisi di assets/js/main.js.";
        return;
      }
      const btn = $ad("adminLoginBtn");
      btn.disabled = true;
      btn.textContent = "Memeriksa\u2026";
      try {
        const res = await fetch(admSb() + "/auth/v1/token?grant_type=password", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ email, password: pass }),
        });
        const data = await res.json();
        if (res.ok && data.access_token) {
          admSesi = { access_token: data.access_token, refresh_token: data.refresh_token };
          localStorage.setItem(ADMIN_SESSION, JSON.stringify(admSesi));
          $ad("adminLogin").hidden = true;
          $ad("adminDash").hidden = false;
          $ad("adminPass").value = "";
          admStopAuto();
          admLoad().then(admStartAuto);
        } else {
          err.textContent = data.msg || data.error_description || data.error || "Email / password salah.";
        }
      } catch {
        err.textContent = "Tidak bisa terhubung — cek SUPABASE_URL.";
      }
      btn.disabled = false;
      btn.textContent = "Masuk Dashboard";
    });
    $ad("adminPass").addEventListener("keydown", (e) => { if (e.key === "Enter") $ad("adminLoginBtn").click(); });
    $ad("adminEmail").addEventListener("keydown", (e) => { if (e.key === "Enter") $ad("adminLoginBtn").click(); });

    $ad("adminRefresh").addEventListener("click", admLoad);
    $ad("adminLogout").addEventListener("click", () => admLogout());
    $ad("adminAuto").addEventListener("click", () => {
      const on = $ad("adminAuto").classList.toggle("is-on");
      $ad("adminAuto").textContent = on ? "Auto \u2713" : "Auto \u2717";
      on ? admStartAuto() : admStopAuto();
    });
    $ad("adminCsv").addEventListener("click", () => {
      if (!admCache.length) { showToast("Belum ada data"); return; }
      const head = "id,waktu,nama,wa,paket,domain_mode,domain,catatan,status";
      const rows = admCache.map((o) =>
        [o.id, new Date(o.created_at).toISOString(), o.nama, o.wa, o.paket, o.domain_mode, o.domain, o.catatan, o.status]
          .map((v) => '"' + String(v || "").replace(/"/g, '""') + '"').join(",")
      );
      const blob = new Blob(["\ufeff" + head + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "order-webspace.csv";
      a.click();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$ad("adminOverlay").hidden) admTutup();
    });
  }

  /* ---------- Tahun footer ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
