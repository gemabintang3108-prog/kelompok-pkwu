// ============================================================
// PENTAVA — tugas.js
// Sistem upload & tampilan tugas per anggota (Firebase Storage + Firestore)
// Password: Bintang31
// ============================================================

(function () {
  const KATA_SANDI = "Bintang31";
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const tugasSection = document.getElementById("tugas-section");
  if (!tugasSection) return;

  const db = window.db;
  const st = window.storage;
  if (!db || !st) {
    console.error("Firebase belum terinisialisasi.");
    return;
  }

  // Ambil nama anggota dari halaman
  const namaAnggota = tugasSection.dataset.anggota;
  if (!namaAnggota) {
    console.error("data-anggota tidak ditemukan di #tugas-section");
    return;
  }

  const TUGAS_REF = db.collection("tugas");
  const STORAGE_REF = st.ref().child("tugas/" + namaAnggota);

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
  let unsubscribeTugas = null;

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
    const file = fileInput.files[0];
    if (!file) return;

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      alert("Ukuran file maksimal 10MB!");
      fileInput.value = "";
      return;
    }

    // Tampilkan nama file
    uploadNama.textContent = file.name;
    uploadNama.style.display = "block";
    uploadBtn.disabled = false;
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

  // --- Upload File ---
  uploadBtn.addEventListener("click", async () => {
    if (!isUnlocked) return;

    const file = fileInput.files[0];
    if (!file) {
      alert("Pilih file dulu ya!");
      return;
    }

    // Disable tombol
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Mengupload...";
    uploadProgress.style.display = "block";

    try {
      // Generate nama file unik
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${timestamp}_${safeName}`;
      const fileRef = STORAGE_REF.child(fileName);

      // Upload dengan progress
      const uploadTask = fileRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          uploadProgressBar.style.width = progress + "%";
          uploadProgressBar.textContent = Math.round(progress) + "%";
        },
        (error) => {
          console.error("Upload gagal:", error);
          alert("Upload gagal: " + error.message);
          resetUploadUI();
        },
        async () => {
          // Upload selesai — dapat URL
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

          // Simpan metadata ke Firestore
          await TUGAS_REF.add({
            anggota: namaAnggota,
            namaFile: file.name,
            url: downloadURL,
            storagePath: fileRef.fullPath,
            tipe: file.type.startsWith("image/") ? "image" : "file",
            ukuran: file.size,
            tanggal: firebase.firestore.FieldValue.serverTimestamp(),
          });

          // Reset form
          fileInput.value = "";
          uploadNama.style.display = "none";
          resetUploadUI();
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat upload.");
      resetUploadUI();
    }
  });

  function resetUploadUI() {
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Upload Tugas";
    uploadProgress.style.display = "none";
    uploadProgressBar.style.width = "0%";
    uploadProgressBar.textContent = "";
  }

  // --- Render Tugas List (real-time) ---
  function renderTugasList(daftar) {
    tugasList.innerHTML = "";

    if (daftar.length === 0) {
      tugasList.innerHTML = `<p class="tugas-list__kosong">Belum ada tugas yang diunggah.</p>`;
      return;
    }

    daftar.forEach((tugas) => {
      const kartu = document.createElement("div");
      kartu.className = "tugas-card";

      const tanggalStr = tugas.tanggal
        ? (tugas.tanggal.toDate ? tugas.tanggal.toDate() : new Date(tugas.tanggal))
            .toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        : "-";

      const ukuranStr = tugas.ukuran ? formatUkuran(tugas.ukuran) : "";

      if (tugas.tipe === "image") {
        kartu.innerHTML = `
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
          <div class="tugas-card__preview tugas-card__preview--file">
            <a href="${tugas.url}" target="_blank" rel="noopener">
              <span class="tugas-card__icon">${iconFile}</span>
              <span class="tugas-card__ext">${getExtension(tugas.namaFile)}</span>
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

      tugasList.appendChild(kartu);
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
    return div.innerHTML;
  }

  // --- Real-time listener ---
  function mulaiDengarTugas() {
    unsubscribeTugas = TUGAS_REF.where("anggota", "==", namaAnggota)
      .onSnapshot(
        (snapshot) => {
          const daftar = [];
          snapshot.forEach((doc) => {
            daftar.push({ id: doc.id, ...doc.data() });
          });
          // Sort client-side by tanggal descending
          daftar.sort((a, b) => {
            const ta = a.tanggal?.toMillis?.() || 0;
            const tb = b.tanggal?.toMillis?.() || 0;
            return tb - ta;
          });
          renderTugasList(daftar);
        },
        (error) => {
          console.error("Gagal memuat tugas:", error);
          tugasList.innerHTML = `<p class="tugas-list__kosong">Gagal memuat tugas. Coba refresh halaman.</p>`;
        }
      );
  }

  mulaiDengarTugas();

  window.addEventListener("beforeunload", () => {
    if (unsubscribeTugas) unsubscribeTugas();
  });
})();
