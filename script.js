// ============================================================
// PENTAVA — script.js
// Sistem ulasan (rating bintang + komentar) dengan localStorage
// ============================================================

(function () {
  const KUNCI_PENYIMPANAN = "pentava_ulasan";

  const form = document.getElementById("review-form");
  const inputNama = document.getElementById("nama");
  const inputKomentar = document.getElementById("komentar");
  const daftarBintang = document.getElementById("star-rating");
  const listUlasan = document.getElementById("review-list");

  if (!form) return; // halaman ini tidak punya bagian ulasan (mis. anggota1.html)

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

  // --- ambil & simpan data ---
  function ambilUlasan() {
    try {
      const data = JSON.parse(localStorage.getItem(KUNCI_PENYIMPANAN));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function simpanUlasan(daftar) {
    localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(daftar));
  }

  function formatTanggal(iso) {
    const tgl = new Date(iso);
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

  function renderUlasan() {
    const daftar = ambilUlasan();
    listUlasan.innerHTML = "";

    if (daftar.length === 0) {
      listUlasan.innerHTML = `<p class="review-list__kosong">Belum ada ulasan. Jadilah yang pertama mencoba &amp; memberi tanggapan!</p>`;
      return;
    }

    daftar
      .slice()
      .reverse()
      .forEach((ulasan) => {
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

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

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

    const daftar = ambilUlasan();
    daftar.push({
      nama,
      komentar,
      rating: ratingTerpilih,
      tanggal: new Date().toISOString(),
    });
    simpanUlasan(daftar);

    form.reset();
    ratingTerpilih = 0;
    tampilkanPratinjau(0);
    renderUlasan();
  });

  renderUlasan();
})();
