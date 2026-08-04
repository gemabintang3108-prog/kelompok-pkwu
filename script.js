// ============================================================
// PENTAVA — script.js
// Sistem ulasan (rating bintang + komentar) dengan Firebase Firestore
// ============================================================

(function () {
  const form = document.getElementById("review-form");
  const inputNama = document.getElementById("nama");
  const inputKomentar = document.getElementById("komentar");
  const daftarBintang = document.getElementById("star-rating");
  const listUlasan = document.getElementById("review-list");

  if (!form) return; // halaman ini tidak punya bagian ulasan (mis. anggota1.html)

  const db = window.db;
  if (!db) {
    console.error("Firebase Firestore belum terinisialisasi.");
    return;
  }

  const ULASAN_REF = db.collection("ulasan");

  let ratingTerpilih = 0;
  let unsubscribeUlasan = null;

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

  function formatTanggal(ts) {
    if (!ts) return "-";
    const tgl = ts.toDate ? ts.toDate() : new Date(ts);
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
    return div.innerHTML;
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

  // --- Real-time listener untuk ulasan ---
  function mulaiDengarUlasan() {
    if (unsubscribeUlasan) unsubscribeUlasan();

    unsubscribeUlasan = ULASAN_REF.orderBy("tanggal", "desc").onSnapshot(
      (snapshot) => {
        const daftar = [];
        snapshot.forEach((doc) => {
          daftar.push({ id: doc.id, ...doc.data() });
        });
        renderUlasanList(daftar);
      },
      (error) => {
        console.error("Gagal memuat ulasan:", error);
        listUlasan.innerHTML = `<p class="review-list__kosong">Gagal memuat ulasan. Coba refresh halaman.</p>`;
      }
    );
  }

  // --- Submit ulasan baru ---
  form.addEventListener("submit", async function (e) {
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

    // Disable tombol submit sementara
    const btnSubmit = form.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Mengirim...";

    try {
      await ULASAN_REF.add({
        nama,
        komentar,
        rating: ratingTerpilih,
        tanggal: firebase.firestore.FieldValue.serverTimestamp(),
      });

      form.reset();
      ratingTerpilih = 0;
      tampilkanPratinjau(0);
    } catch (error) {
      console.error("Gagal mengirim ulasan:", error);
      alert("Gagal mengirim ulasan. Coba lagi ya.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = originalText;
    }
  });

  // Mulai dengar perubahan ulasan secara real-time
  mulaiDengarUlasan();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (unsubscribeUlasan) unsubscribeUlasan();
  });
})();
