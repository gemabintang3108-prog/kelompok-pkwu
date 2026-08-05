// ============================================================
// PENTAVA — tugas.js
// Sistem upload & tampilan tugas per anggota
// Penyimpanan: localStorage browser (tanpa Firebase / tanpa server)
// Password: Bintang31
// Catatan: maksimal 2MB per file karena keterbatasan localStorage.
// ============================================================

(function () {
  const KATA_SANDI = "Bintang31";
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const tugasSection = document.getElementById("tugas-section");
  if (!tugasSection) return;

  // Ambil nama anggota dari halaman
  const namaAnggota = tugasSection.dataset.anggota;
  if (!namaAnggota) {
    console.error("data-anggota tidak ditemukan di #tugas-section");
    return;
  }

  const KUNCI_TUGAS = "pentava_tugas_" + namaAnggota;

  // Elemen DOM
  const loginBox = document.getElementById("tugas-login");
  const uploadBox = document.getElementById("tugas-upload");
  const tugasList = document.getElementById("tugas-list");
  const loginBtn = document.getElementById("tugas-login-btn");
  const loginInput = document.getElementById("tugas-password");
  const fileInput = document.getElementById("tugas-file");
  const uploadBtn = document.getElementById("tugas-upload-btn");
  const uploadNama = document.getElementById("tugas-nama-file");
  const uploadProgress = document.getElementById("tugas-progress");
  const uploadProgressBar = document.getElementById("tugas-progress-bar");
  const loginError = document.getElementById("tugas-login-error");

  if (!loginBox || !uploadBox || !tugasList) return;

  let isUnlocked = false;
  let successTimeout = null;

  // --- Login / Password Gate ---
  loginBtn.addEventListener("click", () => {
    const input = loginInput.value.trim();
    if (input === KATA_SANDI) {
      isUnlocked = true;
      loginBox.style.display = "none";
      uploadBox.style.display = "block";
      loginError.style.display = "none";
    } else {
      loginError.textContent = "Password salah! Coba lagi.";
      loginError.style.display = "block";
      loginInput.value = "";
      loginInput.focus();
    }
  });

  loginInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  // --- File Input Handler ---
  fileInput.addEventListener("change", () => {
    // Batalkan reset sukses yang belum jalan (kalau user ganti file)
    if (successTimeout) {
      clearTimeout(successTimeout);
      successTimeout = null;
    }

    const file = fileInput.files[0];
    if (!file) return;

    // Validasi ukuran (batas localStorage)
    if (file.size > MAX_FILE_SIZE) {
      alert("Ukuran file maksimal 2MB (batas penyimpanan browser)!");
      fileInput.value = "";
      return;
    }

    // Tampilkan nama file & reset label tombol
    uploadNama.textContent = file.name;
    uploadNama.style.display = "block";
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload Tugas";
  });

  // --- Drag & Drop ---
  const dropZone = document.getElementById("tugas-dropzone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("tugas-dropzone--active");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("tugas-dropzone--active");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("tugas-dropzone--active");
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });
  }

  // --- Baca / tulis localStorage ---
  function bacaTugas() {
    try {
      const data = JSON.parse(localStorage.getItem(KUNCI_TUGAS));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function simpanTugas(daftar) {
    try {
      localStorage.setItem(KUNCI_TUGAS, JSON.stringify(daftar));
    } catch (e) {
      throw new Error(
        "Penyimpanan browser penuh. Hapus beberapa file lama atau gunakan file yang lebih kecil."
      );
    }
  }

  // --- Upload File (disimpan sebagai data URL di localStorage) ---
  uploadBtn.addEventListener("click", () => {
    if (!isUnlocked) return;

    const file = fileInput.files[0];
    if (!file) {
      alert("Pilih file dulu ya!");
      return;
    }

    // Disable tombol & tampilkan progress
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Menyimpan...";
    uploadProgress.style.display = "block";
    uploadProgressBar.style.width = "0%";
    uploadProgressBar.textContent = "0%";

    // Progress simulasi (FileReader sangat cepat, biar ada feedback visual)
    let progres = 8;
    const timerProgres = setInterval(() => {
      progres = Math.min(progres + 14, 85);
      uploadProgressBar.style.width = progres + "%";
      uploadProgressBar.textContent = progres + "%";
    }, 130);

    const pembaca = new FileReader();
    pembaca.onload = () => {
      clearInterval(timerProgres);
      try {
        const daftar = bacaTugas();
        daftar.unshift({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          anggota: namaAnggota,
          namaFile: file.name,
          url: pembaca.result, // data URL
          tipe: file.type.startsWith("image/") ? "image" : "file",
          ukuran: file.size,
          tanggal: Date.now(),
        });
        simpanTugas(daftar);

        uploadProgressBar.style.width = "100%";
        uploadProgressBar.textContent = "100%";
        fileInput.value = "";
        uploadNama.style.display = "none";
        uploadBtn.textContent = "Upload Berhasil ✓";
        renderTugasList(daftar);
        successTimeout = setTimeout(resetUploadUI, 2000);
      } catch (err) {
        console.error("Upload gagal:", err);
        alert("Upload gagal: " + err.message);
        resetUploadUI();
      }
    };
    pembaca.onerror = () => {
      clearInterval(timerProgres);
      alert("Gagal membaca file. Coba pilih file lain.");
      resetUploadUI();
    };
    pembaca.readAsDataURL(file);
  });

  function resetUploadUI() {
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Upload Tugas";
    uploadProgress.style.display = "none";
    uploadProgressBar.style.width = "0%";
    uploadProgressBar.textContent = "";
  }

  // --- Render Tugas List ---
  function renderTugasList(daftar) {
    tugasList.innerHTML = "";

    if (daftar.length === 0) {
      tugasList.innerHTML = `<p class="tugas-list__kosong">Belum ada tugas yang diunggah.</p>`;
      return;
    }

    daftar.forEach((tugas) => {
      const kartu = document.createElement("div");
      kartu.className = "tugas-card";

      const tanggalStr = formatTanggal(tugas.tanggal);
      const ukuranStr = tugas.ukuran ? formatUkuran(tugas.ukuran) : "";

      const tombolHapus =
        `<button type="button" class="tugas-card__hapus" data-hapus="${tugas.id}" title="Hapus file" aria-label="Hapus file">` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>` +
        `</button>`;

      if (tugas.tipe === "image") {
        kartu.innerHTML = `
          ${tombolHapus}
          <div class="tugas-card__preview">
            <a href="${tugas.url}" target="_blank" rel="noopener">
              <img src="${tugas.url}" alt="${escapeHTML(tugas.namaFile)}" loading="lazy">
            </a>
          </div>
          <div class="tugas-card__info">
            <span class="tugas-card__nama" title="${escapeHTML(tugas.namaFile)}">${escapeHTML(tugas.namaFile)}</span>
            <span class="tugas-card__meta">${tanggalStr}${ukuranStr ? " · " + ukuranStr : ""}</span>
          </div>
          <a href="${tugas.url}" download="${escapeHTML(tugas.namaFile)}" class="tugas-card__download" title="Download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        `;
      } else {
        // File (PDF, DOC, dsb)
        const iconFile = getFileIcon(tugas.namaFile);
        kartu.innerHTML = `
          ${tombolHapus}
          <div class="tugas-card__preview tugas-card__preview--file">
            <a href="${tugas.url}" target="_blank" rel="noopener">
              <span class="tugas-card__icon">${iconFile}</span>
              <span class="tugas-card__ext">${escapeHTML(getExtension(tugas.namaFile))}</span>
            </a>
          </div>
          <div class="tugas-card__info">
            <span class="tugas-card__nama" title="${escapeHTML(tugas.namaFile)}">${escapeHTML(tugas.namaFile)}</span>
            <span class="tugas-card__meta">${tanggalStr}${ukuranStr ? " · " + ukuranStr : ""}</span>
          </div>
          <a href="${tugas.url}" download="${escapeHTML(tugas.namaFile)}" class="tugas-card__download" title="Download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        `;
      }

      // Hapus file (biar penyimpanan browser nggak penuh permanen)
      kartu.querySelector("[data-hapus]").addEventListener("click", () => {
        if (!confirm("Hapus file ini dari daftar?")) return;
        const sisa = bacaTugas().filter((t) => t.id !== tugas.id);
        try {
          simpanTugas(sisa);
          renderTugasList(sisa);
        } catch (err) {
          alert("Gagal menghapus: " + err.message);
        }
      });

      tugasList.appendChild(kartu);
    });
  }

  function formatTanggal(ts) {
    if (!ts) return "-";
    const tgl = new Date(ts);
    if (isNaN(tgl.getTime())) return "-";
    return tgl.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatUkuran(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function getExtension(filename) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
  }

  function getFileIcon(filename) {
    const ext = getExtension(filename).toLowerCase();
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📽️";
    if (["zip", "rar", "7z"].includes(ext)) return "📦";
    return "📎";
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    // innerHTML sudah meng-escape & < > ; tambahkan tanda kutip supaya
    // aman dipakai di dalam atribut (title, alt, download, dsb)
    return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // --- Muat daftar tugas ---
  function muatTugas() {
    const daftar = bacaTugas().sort((a, b) => (b.tanggal || 0) - (a.tanggal || 0));
    renderTugasList(daftar);
  }

  // refresh otomatis kalau ada tab lain yang upload
  window.addEventListener("storage", (e) => {
    if (e.key === KUNCI_TUGAS) muatTugas();
  });

  muatTugas();
})();
