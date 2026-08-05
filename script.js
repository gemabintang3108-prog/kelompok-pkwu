// ============================================================
// PENTAVA — script.js
// 1) Lightbox: galeri dokumentasi (Sub 2) + modal "Lihat Manfaat" (Sub 1)
// 2) Ulasan: rating bintang + komentar (localStorage — tanpa Firebase)
// ============================================================

(function () {
  /* ===================== LIGHTBOX ===================== */
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    const bodyLightbox = lightbox.querySelector(".lightbox__body");
    const tombolTutup = lightbox.querySelector(".lightbox__close");
    let fokusSebelumnya = null;

    function bukaLightbox(konten, modeFoto) {
      bodyLightbox.innerHTML = "";
      bodyLightbox.classList.toggle("lightbox__body--foto", !!modeFoto);
      bodyLightbox.appendChild(konten);
      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden"; // kunci scroll halaman
      fokusSebelumnya = document.activeElement;
      tombolTutup.focus();
    }

    function tutupLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      bodyLightbox.innerHTML = "";
      document.body.style.overflow = "";
      if (fokusSebelumnya && typeof fokusSebelumnya.focus === "function") {
        fokusSebelumnya.focus();
      }
    }

    tombolTutup.addEventListener("click", tutupLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target.classList.contains("lightbox__backdrop")) tutupLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) tutupLightbox();
    });

    // --- Sub 2: klik foto dokumentasi = perbesar ---
    document.querySelectorAll(".galeri-item").forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (!img) return;
        const fotoBesar = document.createElement("img");
        fotoBesar.src = img.src;
        fotoBesar.alt = img.alt || "Foto dokumentasi";
        fotoBesar.className = "lightbox__img";
        bukaLightbox(fotoBesar, true);
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    });

    // --- Sub 1: tombol "Lihat Manfaat" membuka isi dari <template> ---
    document.querySelectorAll("[data-manfaat]").forEach((tombol) => {
      tombol.addEventListener("click", () => {
        const tpl = document.getElementById(tombol.dataset.manfaat);
        if (!tpl) return;
        bukaLightbox(tpl.content.cloneNode(true), false);
      });
    });
  }

  /* ===================== ULASAN (localStorage) ===================== */
  const form = document.getElementById("review-form");
  if (!form) return;

  const inputNama = document.getElementById("nama");
  const inputKomentar = document.getElementById("komentar");
  const daftarBintang = document.getElementById("star-rating");
  const listUlasan = document.getElementById("review-list");

  const KUNCI_ULASAN = "pentava_ulasan_v1";

  let ratingTerpilih = 0;

  // --- bangun 5 tombol bintang ---
  const svgBintang = () =>
    `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.4 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"/></svg>`;

  for (let i = 1; i <= 5; i++) {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.dataset.nilai = String(i);
    tombol.setAttribute("aria-label", `Beri rating ${i} bintang`);
    tombol.innerHTML = svgBintang();
    tombol.addEventListener("click", () => pilihRating(i));
    tombol.addEventListener("mouseenter", () => tampilkanPratinjau(i));
    daftarBintang.appendChild(tombol);
  }
  daftarBintang.addEventListener("mouseleave", () => tampilkanPratinjau(ratingTerpilih));

  function tampilkanPratinjau(nilai) {
    [...daftarBintang.children].forEach((btn, idx) => {
      btn.classList.toggle("aktif", idx < nilai);
    });
  }

  function pilihRating(nilai) {
    ratingTerpilih = nilai;
    tampilkanPratinjau(nilai);
  }

  // --- baca / tulis localStorage ---
  function bacaUlasan() {
    try {
      const data = JSON.parse(localStorage.getItem(KUNCI_ULASAN));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function simpanUlasan(daftar) {
    localStorage.setItem(KUNCI_ULASAN, JSON.stringify(daftar));
  }

  function formatTanggal(ts) {
    if (!ts) return "-";
    const tgl = new Date(ts);
    if (isNaN(tgl.getTime())) return "-";
    return tgl.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function buatKartuBintang(rating) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += `<svg class="${i <= rating ? "" : "kosong"}" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.4 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"/></svg>`;
    }
    return html;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    // innerHTML sudah meng-escape & < > ; tambahkan tanda kutip supaya
    // aman dipakai di dalam atribut (title, alt, download, dsb)
    return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function renderUlasanList(daftar) {
    listUlasan.innerHTML = "";

    if (daftar.length === 0) {
      listUlasan.innerHTML = `<p class="review-list__kosong">Belum ada ulasan. Jadilah yang pertama mencoba &amp; memberi tanggapan!</p>`;
      return;
    }

    daftar.forEach((ulasan) => {
      const kartu = document.createElement("article");
      kartu.className = "review-card glass";
      kartu.innerHTML = `
        <div class="review-card__top">
          <span class="review-card__nama">${escapeHTML(ulasan.nama)}</span>
          <span class="review-card__tanggal">${formatTanggal(ulasan.tanggal)}</span>
        </div>
        <div class="review-card__bintang">${buatKartuBintang(ulasan.rating)}</div>
        <p class="review-card__teks">${escapeHTML(ulasan.komentar)}</p>
      `;
      listUlasan.appendChild(kartu);
    });
  }

  function muatUlasan() {
    let daftar = bacaUlasan();

    // Kalau kosong, isi dengan beberapa contoh supaya bagian ini tidak kosong
    if (daftar.length === 0) {
      daftar = [
        {
          id: "contoh-1",
          nama: "Ibu Siti Rahma",
          komentar: "Lulurnya wangi rempah alami banget, kulit terasa lebih halus setelah beberapa kali pakai. Recommended!",
          rating: 5,
          tanggal: Date.now() - 6 * 86400000,
        },
        {
          id: "contoh-2",
          nama: "Bapak Budi Santoso",
          komentar: "Jamu beras kencurnya enak dan bikin badan nggak gampang lemes. Cocok diminum pagi hari.",
          rating: 4,
          tanggal: Date.now() - 2 * 86400000,
        },
      ];
      try {
        simpanUlasan(daftar);
      } catch (e) {
        // penyimpanan tidak tersedia — contoh ulasan tetap tampil saja
      }
    }

    daftar.sort((a, b) => (b.tanggal || 0) - (a.tanggal || 0));
    renderUlasanList(daftar);
  }

  // --- Submit ulasan baru ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nama = inputNama.value.trim();
    const komentar = inputKomentar.value.trim();

    if (!nama || !komentar) {
      alert("Mohon isi nama dan komentar ya.");
      return;
    }
    if (ratingTerpilih === 0) {
      alert("Yuk kasih rating bintangnya dulu (1–5).");
      return;
    }

    const btnSubmit = form.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Mengirim...";

    try {
      const daftar = bacaUlasan();
      daftar.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        nama,
        komentar,
        rating: ratingTerpilih,
        tanggal: Date.now(),
      });
      simpanUlasan(daftar);

      form.reset();
      ratingTerpilih = 0;
      tampilkanPratinjau(0);
      muatUlasan();
    } catch (error) {
      console.error("Gagal menyimpan ulasan:", error);
      alert("Gagal menyimpan ulasan. Penyimpanan browser penuh atau tidak tersedia.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = originalText;
    }
  });

  // refresh otomatis kalau ada tab lain yang menambah ulasan
  window.addEventListener("storage", (e) => {
    if (e.key === KUNCI_ULASAN) muatUlasan();
  });

  // Tampilkan ulasan saat halaman dibuka
  muatUlasan();
})();
