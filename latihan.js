// ------------------- PERSISTENSI DATA -------------------
const STORAGE_KEY = "crud_mahasiswa"; // Key localStorage

// Load data dari localStorage, jika kosong kembalikan array kosong
const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// Simpan array data ke localStorage
const saveData = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));


// ------------------- STATE -------------------
let data = loadData(); // Array data mahasiswa
let autoId = data.reduce((m, o) => Math.max(m, o.id), 0) + 1; // Auto-increment ID

// ------------------- ELEMENT HTML -------------------
const form = document.getElementById("form-mahasiswa");
const elId = document.getElementById("id");
const elNama = document.getElementById("nama");
const elNim = document.getElementById("nim");
const elKelas = document.getElementById("kelas");
const elProdi = document.getElementById("prodi");
const elAngkatan = document.getElementById("angkatan"); 
const elEmail = document.getElementById("email");       
const elIPK = document.getElementById("ipk");           
const elCatatan = document.getElementById("catatan");   
const elGambar = document.getElementById("gambar");     
const tbody = document.getElementById("tbody");
const btnReset = document.getElementById("btn-reset");
const btnSimpan = document.getElementById("btn-simpan"); // Ambil tombol simpan/update

// BARU: Elemen Checkbox Master
const selectAllCheckbox = document.getElementById("selectAll"); 

let currentPage = 1;
let rowsPerPage = Number(document.getElementById("rowsPerPage").value);
let filteredData = [...data]; // simpan data hasil filter/search/sort

// ------------------- FUNGSI RENDER -------------------
function render(list = filteredData) {
  if (!Array.isArray(list)) list = [];
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = list.slice(start, end);

  paginatedData.forEach((row) => {
    const imgPreview = row.gambar
      ? `<img src="${row.gambar}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover;">`
      : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="row-checkbox" value="${row.id}"></td> 
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.kelas}</td>
      <td>${row.prodi}</td>
      <td>${row.angkatan || "-"}</td>
      <td>${row.email || "-"}</td>
      <td>${row.ipk || "-"}</td>
      <td>${row.catatan || "-"}</td>
      <td>${imgPreview}</td>
      <td>
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const totalFiltered = list.length;
  const visibleCount = paginatedData.length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);
  document.getElementById("data-info").textContent =
    `${totalFiltered} data`;

  document.getElementById("pageInfo").textContent = `Halaman ${currentPage} / ${totalPages || 1}`;
  
  updateFilterOptions();
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
}

function renderViewTable(list = data) {
  if (!Array.isArray(list)) list = [];
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = list.slice(start, end);

  paginatedData.forEach((row, index) => {
    const imgPreview = row.gambar
      ? `<img src="${row.gambar}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover;">`
      : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.kelas}</td>
      <td>${row.prodi}</td>
      <td>${row.angkatan || "-"}</td>
      <td>${row.email || "-"}</td>
      <td>${row.ipk || "-"}</td>
      <td>${row.catatan || "-"}</td>
      <td>${imgPreview}</td>
    `;
    tbody.appendChild(tr);
  });

  // Update footer info
  const totalPages = Math.ceil(list.length / rowsPerPage);
  document.getElementById("data-info").textContent = `${list.length} data`;
  document.getElementById("pageInfo").textContent = `Halaman ${currentPage} / ${totalPages || 1}`;
}

//------------------- ATURAN TAMPILAN DATA -------------------
function nextPage() {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    render();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    render();
  }
}

document.getElementById("nextPageBtn")?.addEventListener("click", nextPage);
document.getElementById("prevPageBtn")?.addEventListener("click", prevPage);

// ------------------- RESET FILTER -------------------
document.getElementById("resetFilterBtn").addEventListener("click", () => {
  // Kosongkan nilai search
  document.getElementById("searchInput").value = "";

  // Kosongkan dropdown filter
  document.getElementById("filterAngkatan").value = "";
  document.getElementById("filterProdi").value = "";

  // 🔹 Reset sorting dropdown juga
  document.getElementById("sortBy").value = "";
  document.getElementById("sortOrder").value = "asc"; // default urutan naik

  // Reset variabel global
  currentPage = 1;

  // 🔹 Reset data hasil sort ke urutan asli
  filteredData = [...data];

  // Render ulang tabel
  syncAndRender();
});


//------------------- JUMLAH DATA PER HALAMAN -------------------
document.getElementById("rowsPerPage").addEventListener("change", (e) => {
  rowsPerPage = Number(e.target.value);
  currentPage = 1;
  syncAndRender();
});

// ------------------- FUNGSI VALIDASI (BARU) -------------------
function validateForm(nama, nim, kelas, prodi, angkatan, email, ipk) {
    if (!nama || !nim || !kelas || !prodi || !angkatan || !email || !ipk) {
        alert("Nama, NIM, Kelas, Program Studi, Angkatan, Email, dan IPK wajib diisi.");
        return false;
    }

    // Validasi Email harus ada @
    if (!email.includes('@')) {
        alert("Format Email tidak valid. Harus mengandung simbol '@'.");
        return false;
    }

    // Validasi IPK menggunakan titik (max 4.00)
    const ipkRegex = /^(?:[0-3]\.\d{2}|4\.00)$/;
    if (!ipkRegex.test(ipk)) {
        alert("Format IPK tidak valid. Gunakan format X.XX (misal 3.50), maksimal 4.00.");
        return false;
    }
    
    // Validasi Angkatan
    const angkatanNum = Number(angkatan);
    if (isNaN(angkatanNum) || angkatanNum < 2000 || angkatanNum > 2025) {
        alert("Angkatan harus berupa tahun antara 2000 hingga 2025.");
        return false;
    }
    
    return true;
}

// ------------------- FUNGSI VALIDASI DUPLIKASI (BARU) -------------------
function checkDuplication(idToExclude, nim, email) {
    // Cari data yang NIM atau Email-nya sama dengan input BARU,
    // TETAPI pastikan ID-nya BUKAN data yang sedang di-EDIT
    const duplicateNim = data.find(
        (m) => m.nim === nim && m.id !== idToExclude
    );
    const duplicateEmail = data.find(
        (m) => m.email === email && m.id !== idToExclude
    );

    if (duplicateNim) {
        alert(`Gagal! NIM '${nim}' sudah terdaftar pada data lain.`);
        return false;
    }
    if (duplicateEmail) {
        alert(`Gagal! Email '${email}' sudah terdaftar pada data lain.`);
        return false;
    }
    return true; // Tidak ada duplikasi ditemukan
}

// ------------------- FORM SUBMIT (CREATE / UPDATE) -------------------
form.addEventListener("submit", async (e) => { // UBAH ke async untuk menunggu FileReader
  e.preventDefault();

  const idVal = elId.value.trim();
  const nama = elNama.value.trim();
  const nim = elNim.value.trim();
  const kelas = elKelas.value.trim();
  const prodi = elProdi.value; // Ambil value dari select
  const angkatan = elAngkatan.value.trim(); // BARU
  const email = elEmail.value.trim();     // BARU
  const ipk = elIPK.value.trim();         // BARU
  const catatan = elCatatan.value.trim(); // BARU
  const file = elGambar.files[0];         // BARU

  if (!validateForm(nama, nim, kelas, prodi, angkatan, email, ipk)) return;

  const idNum = idVal ? Number(idVal) : 0; // 0 jika ini data baru
  if (!checkDuplication(idNum, nim, email)) {
      return; // Hentikan proses jika ada duplikasi
  }
  
  // --- Proses Upload Gambar (BARU) ---
  let gambarBase64 = idVal ? (data.find(x => x.id === Number(idVal))?.gambar || '') : '';

  if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert("Ukuran gambar maksimal 10MB!");
          return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
          alert("Format gambar harus JPG, JPEG, atau PNG!");
          return;
      }

      // Konversi gambar ke Base64 (untuk disimpan di localStorage)
      gambarBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
      });
  }
  // --- Akhir Proses Upload Gambar ---

  if (idVal) {
    // ---------------- UPDATE DATA ----------------
    const idNum = Number(idVal);
    const idx = data.findIndex(x => x.id === idNum);

    if (idx >= 0) {
      // Jika data lama belum punya gambar DAN user tidak upload baru
      if (!data[idx].gambar && !file) {
        alert("Harap unggah foto terlebih dahulu!");
        return;
      }

      // Update field
      data[idx].nama = nama;
      data[idx].nim = nim;
      data[idx].kelas = kelas;
      data[idx].prodi = prodi;
      data[idx].angkatan = angkatan;
      data[idx].email = email;
      data[idx].ipk = ipk;
      data[idx].catatan = catatan;
      data[idx].gambar = file ? gambarBase64 : data[idx].gambar;

      alert("Data berhasil diperbarui!");
    }
  } else {
    // ---------------- TAMBAH DATA BARU ----------------
    if (!file) {
      alert("Harap unggah foto terlebih dahulu!");
      return;
    }

    const newMahasiswa = {
      id: autoId++,
      nama,
      nim,
      kelas,
      prodi,
      angkatan,
      email,
      ipk,
      catatan,
      gambar: gambarBase64
    };

    data.push(newMahasiswa);
    alert("Data baru berhasil ditambahkan!");
  }

  saveData(data);
  syncAndRender();
  form.reset();
  elId.value = ""; 
  elProdi.value = ""; // Reset dropdown prodi
  elAngkatan.value = "2025"; // Set default angkatan
  elNama.focus();
  document.getElementById("gambar-preview").textContent = ''; // Reset preview
  
  // Reset tombol setelah simpan/update
  btnSimpan.textContent = "Simpan"; 
});

// ------------------- NONAKTIFKAN SUBMIT DENGAN ENTER -------------------
form.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault(); // Cegah aksi submit
    return false;
  }
});

// ------------------- RESET FORM -------------------
btnReset.addEventListener("click", () => {
  form.reset();
  elId.value = "";
  elProdi.value = ""; // Reset dropdown prodi
  elAngkatan.value = "2025"; // Set default angkatan
  elNama.focus();
  document.getElementById("gambar-preview").textContent = ''; // Reset preview
  btnSimpan.textContent = "Simpan"; // Reset teks tombol
});

// ------------------- HANDLER TOMBOL EDIT / HAPUS -------------------
tbody.addEventListener("click", (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    // EDIT DATA
    const item = data.find(x => x.id === Number(editId));
    if (item) {
      elId.value = item.id;
      elNama.value = item.nama;
      elNim.value = item.nim;
      elKelas.value = item.kelas;
      elProdi.value = item.prodi;
      elAngkatan.value = item.angkatan || '2025'; // DATA BARU
      elEmail.value = item.email || '';          // DATA BARU
      elIPK.value = item.ipk || '';              // DATA BARU
      elCatatan.value = item.catatan || '';      // DATA BARU
      // Tampilkan info gambar
      document.getElementById("gambar-preview").textContent = item.gambar
        ? "📸 Foto sudah ada — boleh dipertahankan atau diganti."
        : "⚠️ Belum ada foto — unggah foto untuk melanjutkan edit.";


      // Ubah teks tombol menjadi Update
      btnSimpan.textContent = "Perbarui"; 
      // Scroll halus ke posisi form, dikurangi tinggi header
      const yOffset = -100; // misal header kamu setinggi 100px
      const y = form.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  // 🔹 Helper untuk tampilkan alert jumlah data terhapus
  function showDeleteAlert(count) {
    alert(`Berhasil menghapus ${count} data!`);
  }


  if (delId) {
    // DELETE DATA
    const idNum = Number(delId);
    if (confirm("Yakin hapus data ini?")) {
      data = data.filter(x => x.id !== idNum);
      saveData(data);
      syncAndRender();
      showDeleteAlert(1);
    }
  }
});
    
// ------------------- FUNGSI COUNTER ANGKATAN (BARU) -------------------
const elAngkatanUp = document.getElementById("angkatan-up");
const elAngkatanDown = document.getElementById("angkatan-down");
const MIN_ANGKATAN = 2000;
const MAX_ANGKATAN = 2025;

function updateAngkatan(change) {
  let currentVal = Number(elAngkatan.value) || MAX_ANGKATAN;
  let newVal = currentVal + change;

  if (newVal < MIN_ANGKATAN) newVal = MIN_ANGKATAN;
  if (newVal > MAX_ANGKATAN) newVal = MAX_ANGKATAN;

  elAngkatan.value = newVal;
}

if (elAngkatanUp && elAngkatanDown) {
  elAngkatanUp.addEventListener("click", () => updateAngkatan(1));
  elAngkatanDown.addEventListener("click", () => updateAngkatan(-1));
}

// ------------------- SEARCH -------------------
// Ambil elemen input & tombol X
const input = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");

// Fungsi filter berdasarkan teks input
function searchData() {
  const filter = input.value.toLowerCase();
  filteredData = data.filter(row =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(filter)
  );
  currentPage = 1;

  const mode = localStorage.getItem("mode") || "view";
  if (mode === "edit") {
    render(filteredData);
  } else {
    renderViewTable(filteredData); // ✅ kirim hasil pencarian ke mode view
  }
}

// Fitur Search tekan Enter
input.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault(); // cegah reload halaman
    searchData();
  }
});

// klik tombol X untuk hapus teks dan tampilkan semua data
clearBtn.addEventListener("click", () => {
  input.value = "";
  const mode = localStorage.getItem("mode") || "view";

  if (mode === "edit") {
    render(data);
  } else {
    renderViewTable();
  }

  input.focus();
});

// FILTER BERDASARKAN KELAS & PRODI
document.getElementById("filterAngkatan").addEventListener("change", filterData);
document.getElementById("filterProdi").addEventListener("change", filterData);

function filterData() {
  const valAngkatan = document.getElementById("filterAngkatan").value.toLowerCase();
  const valProdi = document.getElementById("filterProdi").value.toLowerCase();

  filteredData = data.filter(row => {
    const cocokA = !valAngkatan || (row.angkatan || "").toLowerCase() === valAngkatan;
    const cocokP = !valProdi || (row.prodi || "").toLowerCase() === valProdi;
    return cocokA && cocokP;
  });

  currentPage = 1;
  render();
}

function updateFilterOptions() {
  // Ambil daftar angkatan & prodi unik dari data
  let angkatanSet = [...new Set(data.map(item => item.angkatan).filter(Boolean))].sort((a, b) => b - a);
  let prodiSet = [...new Set(data.map(item => item.prodi).filter(Boolean))].sort();

  // Simpan pilihan user sebelumnya
  const selectedAngkatan = filterAngkatan.value;
  const selectedProdi = filterProdi.value;

  // Render ulang filter Angkatan
  filterAngkatan.innerHTML = '<option value="">Semua Angkatan</option>';
  angkatanSet.forEach(th => {
    const option = document.createElement("option");
    option.value = th;
    option.textContent = th;
    filterAngkatan.appendChild(option);
  });

  // Render ulang filter Prodi
  filterProdi.innerHTML = '<option value="">Semua Prodi</option>';
  prodiSet.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    filterProdi.appendChild(option);
  });

  // Kembalikan pilihan sebelumnya kalau masih ada di opsi
  if (angkatanSet.includes(selectedAngkatan)) filterAngkatan.value = selectedAngkatan;
  if (prodiSet.includes(selectedProdi)) filterProdi.value = selectedProdi;
}

document.getElementById("clearAllBtn").addEventListener("click", () => {
  if (confirm("Yakin ingin menghapus semua data?")) {
    data = [];
    saveData(data);
    
    // Reset dropdown filter
    document.getElementById("filterAngkatan").innerHTML = '<option value="">Semua Angkatan</option>';
    document.getElementById("filterProdi").innerHTML = '<option value="">Semua Prodi</option>';

    syncAndRender();
    showDeleteAlert(deletedCount);
  }
});

// ------------------- IMPOR DATA (MODAL BARU) -------------------
const modal = document.getElementById("uploadModal");
const showBtn = document.getElementById("show-upload");
const closeBtn = document.querySelector(".close");
const uploadBtn = document.getElementById("btn-upload");
const cancelBtn = document.getElementById("btn-cancel-upload");
const fileInput = document.getElementById("csvFile");
const fileList = document.getElementById("fileList");

let selectedFiles = []; 

// Buka modal
showBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

// Tutup modal
cancelBtn.addEventListener("click", () => {
  fileInput.value = "";
  fileList.innerHTML = "";
  modal.style.display = "none";
  selectedFiles = []; // BARU: Reset state file
});

closeBtn.addEventListener("click", () => {
    fileInput.value = "";
    fileList.innerHTML = "";
    modal.style.display = "none";
    selectedFiles = []; // BARU: Reset state file
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    fileInput.value = "";
    fileList.innerHTML = "";
    modal.style.display = "none";
    selectedFiles = []; // BARU: Reset state file
  }
});

// Preview daftar file
// Preview daftar file
fileInput.addEventListener("change", () => {
    const newlySelected = Array.from(fileInput.files); 
    const newUniqueFiles = newlySelected.filter(newFile => 
        !selectedFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
    );
    
    selectedFiles = [...selectedFiles, ...newUniqueFiles];

    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    fileInput.files = dt.files; 
    
    fileList.innerHTML = "";
    if (selectedFiles.length === 0) {
        fileList.textContent = "Tidak ada file dipilih.";
        return;
    }
    
    selectedFiles.forEach((file, i) => {
        const div = document.createElement("div");
        div.innerHTML = `
          <div style="display:flex; justify-content: space-between; align-items: center; padding: 5px 0;">
            <span>${i + 1}. ${file.name}</span>
            <button type="button" data-remove="${i}" style="margin-left: 10px; background-color: #f44336; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Hapus</button>
          </div>
        `;
        fileList.appendChild(div);
    });

    fileInput.value = ""; 
});

// Hapus file tertentu
fileList.addEventListener("click", (e) => {
  if (e.target.dataset.remove !== undefined) {
    const idx = Number(e.target.dataset.remove);

    selectedFiles.splice(idx, 1); 

    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    fileInput.files = dt.files;

    renderFileList(); 
  }
});

function renderFileList() {
    fileList.innerHTML = "";
    if (selectedFiles.length === 0) {
        fileList.textContent = "Tidak ada file dipilih.";
        return;
    }
    selectedFiles.forEach((file, i) => {
        const div = document.createElement("div");
        div.innerHTML = `
          <div style="display:flex; justify-content: space-between; align-items: center; padding: 5px 0;">
            <span>${i + 1}. ${file.name}</span>
            <button type="button" data-remove="${i}" style="margin-left: 10px; background-color: #f44336; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Hapus</button>
          </div>
        `;
        fileList.appendChild(div);
    });
}

// --- IMPOR CSV ---
function importCSV(csvText) {
  const rows = csvText.trim().split("\n").map(r => r.split(","));
  const header = rows.shift();
  let count = 0;
  let skippedCount = 0;
  rows.forEach(cols => {
    if (cols.length < 7) return; 
    const [nama, nim, kelas, prodi, angkatan, email, ipkRaw, catatan] = cols.map(c => c.trim());
    const ipk = isNaN(parseFloat(ipkRaw)) ? "0.00" : parseFloat(ipkRaw).toFixed(2);

    // ⛔️ VALIDASI DUPLIKASI NIM/EMAIL ⛔️
    const isDuplicate = data.some(
      (m) => m.nim === nim || m.email === email
    );
    
    if (isDuplicate) {
        console.warn(`Data impor diabaikan karena duplikasi (NIM: ${nim} atau Email: ${email}).`);
        skippedCount++;
        return; 
    }
    // ------------------------------------

    const newMahasiswa = {
      id: autoId++,
      nama,
      nim,
      kelas,
      prodi,
      angkatan,
      email,
      ipk,
      catatan,
      gambar: "" 
    };
    data.push(newMahasiswa);
    count++;
  });
  saveData(data);
  // Kembalikan objek yang berisi jumlah data yang diimpor dan yang diabaikan
  return { imported: count, skipped: skippedCount }; 
}

// --- IMPOR EXCEL ---
function importExcel(rows) {
  let count = 0;
  let skippedCount = 0; 
  for (let i = 1; i < rows.length; i++) { 
    const row = rows[i];
    if (!row || row.length < 7) continue;
    const [nama, nim, kelas, prodi, angkatan, email, ipkRaw, catatan] = row.map(c => String(c || "").trim());
    const ipk = isNaN(parseFloat(ipkRaw)) ? "0.00" : parseFloat(ipkRaw).toFixed(2);

    // ⛔️ VALIDASI DUPLIKASI NIM/EMAIL ⛔️
    const isDuplicate = data.some(
      (m) => m.nim === nim || m.email === email
    );

    if (isDuplicate) {
        console.warn(`Data impor diabaikan karena duplikasi (NIM: ${nim} atau Email: ${email}).`);
        skippedCount++;
        continue; 
    }
    // ------------------------------------
    
    const newMahasiswa = {
      id: autoId++,
      nama,
      nim,
      kelas,
      prodi,
      angkatan,
      email,
      ipk,
      catatan,
      gambar: ""
    };
    data.push(newMahasiswa);
    count++;
  }
  saveData(data);
  return { imported: count, skipped: skippedCount }; 
}

// Tombol Unggah (bisa beberapa file sekaligus)
uploadBtn.addEventListener("click", async () => {
  const files = selectedFiles;
  if (files.length === 0) {
    alert("Pilih minimal satu file terlebih dahulu!");
    return;
  }

  // === Aktifkan indikator loading ===
  uploadBtn.disabled = true;
  uploadBtn.textContent = "⏳ Mengunggah...";
  cancelBtn.disabled = true;
  fileInput.disabled = true;

  const modalContent = document.querySelector(".modal-content");

  // Buat indikator loading (kalau belum ada)
  let loadingText = document.getElementById("loadingText");
  if (!loadingText) {
    loadingText = document.createElement("p");
    loadingText.id = "loadingText";
    loadingText.textContent = "Sedang memproses file, mohon tunggu...";
    loadingText.style.color = "#333";
    loadingText.style.fontSize = "14px";
    loadingText.style.textAlign = "center";
    loadingText.style.marginTop = "10px";
    modalContent.appendChild(loadingText);
  }

  let progressText = document.getElementById("progressText");
  if (!progressText) {
    progressText = document.createElement("p");
    progressText.id = "progressText";
    progressText.style.textAlign = "center";
    progressText.style.fontSize = "13px";
    progressText.style.marginTop = "5px";
    modalContent.appendChild(progressText);
  }

  let totalImported = 0;
  let totalSkipped = 0;

  // === Loop semua file ===
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressText.textContent = `📦 Memproses file ${i + 1} dari ${files.length}: ${file.name}`;

    const ext = file.name.toLowerCase();
    let result = { imported: 0, skipped: 0 };

    try {
      if (ext.endsWith(".csv")) {
        const text = await file.text();
        result = importCSV(text);
      } else if (ext.endsWith(".xls") || ext.endsWith(".xlsx")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1 });
        result = importExcel(rows);
      } else {
        console.warn(`File ${file.name} diabaikan (format tidak didukung).`);
      }
    } catch (err) {
      console.error("Gagal memproses file:", file.name, err);
    }

    totalImported += result.imported;
    totalSkipped += result.skipped;
  }

  // Tunggu sedikit biar animasi terlihat
  await new Promise(resolve => setTimeout(resolve, 500));

  let alertMessage = `✅ Berhasil mengimpor ${totalImported} data mahasiswa dari ${files.length} file!`;
  if (totalSkipped > 0) {
    alertMessage += `\n⚠️ ${totalSkipped} data diabaikan karena duplikasi NIM/Email.`;
  }
  alert(alertMessage);

  // === Bersihkan dan reset ===
  loadingText.remove();
  progressText.remove();
  uploadBtn.disabled = false;
  uploadBtn.textContent = "Unggah";
  cancelBtn.disabled = false;
  fileInput.disabled = false;
  modal.style.display = "none";
  fileInput.value = "";
  fileList.innerHTML = "";
  selectedFiles = [];

  syncAndRender(true);
});

// --------------------- FILTERING AND SORTING -----------------------
// Sort berdasarkan Nama atau NIM
function applySort() {
  const sortBy = document.getElementById("sortBy").value;
  const sortOrder = document.getElementById("sortOrder").value;

  if (!sortBy) {
    syncAndRender();
    return;
  }

  filteredData.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === "nim") {
      valA = String(valA);
      valB = String(valB);
    } else if (["angkatan", "ipk"].includes(sortBy)) {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  currentPage = 1;
  render(filteredData); 
  updateSummary();      
}

const filterAngkatan = document.getElementById("filterAngkatan");
const filterProdi = document.getElementById("filterProdi");

document.getElementById("sortBy").innerHTML = `
    <option value="">Urutkan</option>
    <option value="nama">Nama</option>
    <option value="nim">NIM</option>
    <option value="angkatan">Angkatan</option>
    <option value="ipk">IPK</option>
`;

// Event listener untuk dropdown Sort
document.getElementById("sortBy").addEventListener("change", applySort);
document.getElementById("sortOrder").addEventListener("change", applySort);


// === HELPER: Buat nama file sesuai filter aktif ===
function generateExportFilename(extension) {
  const searchVal = document.getElementById("searchInput")?.value.trim();
  const angkatanVal = document.getElementById("filterAngkatan")?.value.trim();
  const prodiVal = document.getElementById("filterProdi")?.value.trim();
  const sortBy = document.getElementById("sortBy")?.value;
  const sortOrder = document.getElementById("sortOrder")?.value;

  let parts = ["data_mahasiswa"];

  if (angkatanVal) parts.push(`angkatan-${angkatanVal}`);
  if (prodiVal) parts.push(`prodi-${prodiVal.replace(/\s+/g, "_")}`);
  if (searchVal) parts.push(`search-${searchVal.replace(/\s+/g, "_")}`);
  if (sortBy) parts.push(`sort-${sortBy}-${sortOrder}`);

  const date = new Date().toISOString().split("T")[0];
  parts.push(date);

  return parts.join("_") + "." + extension;
}

// ==================== EKSPOR DATA ====================

// --- EKSPOR JSON ---
document.getElementById("exportJSON").addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = generateExportFilename("json");
  a.click();
  URL.revokeObjectURL(url);
});

// --- EKSPOR CSV ---
document.getElementById("exportCSV").addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }
  const header = ["Nama", "NIM", "Kelas", "Program Studi", "Angkatan", "Email", "IPK", "Catatan"];
  const rows = data.map(m => [
    m.nama, m.nim, m.kelas, m.prodi, m.angkatan, m.email, m.ipk, m.catatan || ""
  ]);
  const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = generateExportFilename("csv");
  a.click();
  URL.revokeObjectURL(url);
});

// --- EKSPOR PDF ---
// --- EKSPOR PDF LANGSUNG TANPA PREVIEW ---
document.getElementById("exportPDF").addEventListener("click", downloadPDF);

function downloadPDF() {
  // Cek pustaka jsPDF sudah ada
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Gagal memuat pustaka jsPDF. Harap refresh halaman atau periksa koneksi internet.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4"); // Landscape mode agar tabel muat banyak kolom

  // Judul laporan
  doc.setFontSize(14);
  doc.text("Laporan Data Mahasiswa", 40, 40);

  // Informasi tambahan (waktu cetak)
  const now = new Date();
  const tanggal = now.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${tanggal}`, 40, 58);

  // Ambil data dari tabel
  const visibleRows = Array.from(document.querySelectorAll("#tbody tr")).filter(
    (tr) => tr.style.display !== "none"
  );

  if (visibleRows.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }

  // Susun isi tabel PDF dari baris yang tampil di halaman
  const exportedData = visibleRows.map((tr, index) => {
    const cells = tr.querySelectorAll("td");
    return [
      index + 1, // No
      cells[1].textContent, // Nama
      cells[2].textContent, // NIM
      cells[3].textContent, // Kelas
      cells[4].textContent, // Prodi
      cells[5].textContent, // Angkatan
      cells[6].textContent, // Email
      cells[7].textContent, // IPK
      cells[8].textContent, // Catatan
      cells[9].textContent.includes("img") ? "Terlampir" : "-", // Gambar
    ];
  });

  // Buat tabel PDF
  doc.autoTable({
    head: [["No", "Nama", "NIM", "Kelas", "Program Studi", "Angkatan", "Email", "IPK", "Catatan", "Gambar"]],
    body: exportedData,
    startY: 75,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 70 },
      2: { cellWidth: 50 },
      3: { cellWidth: 50 },
      4: { cellWidth: 70 },
      5: { cellWidth: 45 },
      6: { cellWidth: 90 },
      7: { cellWidth: 35 },
      8: { cellWidth: 70 },
      9: { cellWidth: 40 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.text(
        `Halaman ${pageCount}`,
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 20
      );
    },
  });

  // Nama file otomatis
  const filename = generateExportFilename("pdf");
  doc.save(filename);
}

// ------------------- LOGIKA CHECKBOX BARU -------------------
// BARU: Fungsi helper untuk menambahkan/menghapus kelas
function toggleRowContrast(checkbox) {
    // Dapatkan elemen <tr> terdekat (induk dari <td> yang berisi checkbox)
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('selected-row');
    } else {
        row.classList.remove('selected-row');
    }
}

// Logic Select All
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function() {
        // Hanya cek checkbox dari baris yang terlihat (tidak di-filter/search)
        const visibleCheckboxes = document.querySelectorAll("#tbody tr[style='display:'] .row-checkbox, #tbody tr:not([style='display:none']) .row-checkbox");
        
        visibleCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            toggleRowContrast(checkbox); // Panggil helper untuk efek kontras
        });
    });
}

// Logic Checkbox Individu
tbody.addEventListener("change", (e) => {
    if (e.target.classList.contains("row-checkbox")) {
        const checkbox = e.target;
        
        // 1. Terapkan/hapus kontras pada baris yang diklik
        toggleRowContrast(checkbox);

        // 2. Perbarui status checkbox master
        const visibleCheckboxes = document.querySelectorAll("#tbody tr[style='display:'] .row-checkbox, #tbody tr:not([style='display:none']) .row-checkbox");
        const allChecked = Array.from(visibleCheckboxes).every(cb => cb.checked);
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = allChecked;
        }
    }
});
// ------------------- AKHIR LOGIKA CHECKBOX BARU -------------------

// === TOMBOL PILIH SEMUA DAN HAPUS TERPILIH DI FOOTER ===
const selectAllBtn = document.getElementById("selectAllBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

if (selectAllBtn) {
  selectAllBtn.addEventListener("click", () => {
    const allCheckboxes = document.querySelectorAll(".row-checkbox");
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);

    allCheckboxes.forEach(cb => {
      cb.checked = !allChecked;
      toggleRowContrast(cb);
    });
    selectAllCheckbox.checked = !allChecked;
  });
}

if (deleteSelectedBtn) {
  deleteSelectedBtn.addEventListener("click", () => {
    const selectedIds = Array.from(document.querySelectorAll(".row-checkbox:checked"))
      .map(cb => Number(cb.value));

    if (selectedIds.length === 0) {
      alert("Tidak ada data yang dipilih!");
      return;
    }

    if (confirm(`Yakin hapus ${selectedIds.length} data terpilih?`)) {
      data = data.filter(item => !selectedIds.includes(item.id));
      saveData(data);

      syncAndRender();
      showDeleteAlert(selectedIds.length);
    }
  });
}

// ==================== FITUR CETAK ====================
document.getElementById("print").addEventListener("click", () => {
  const confirmPrint = confirm("Apakah Anda ingin mencetak data mahasiswa?");
  if (confirmPrint) {
    window.print();
  }
});

// ==================== FITUR SUMMARY (TOTAL DATA & RATA-RATA IPK) ====================

// Fungsi hitung total data dan rata-rata IPK
function updateSummary() {
  const totalEl = document.getElementById("totalData");
  const rataEl = document.getElementById("rataIPK");
  if (!totalEl || !rataEl) return; // berhenti kalau elemen belum ada

  const total = data.length;
  const ipkValues = data
    .map(item => parseFloat(item.ipk))
    .filter(ipk => !isNaN(ipk));

  const rata = ipkValues.length > 0
    ? (ipkValues.reduce((a, b) => a + b, 0) / ipkValues.length).toFixed(2)
    : "0.00";

  totalEl.textContent = `Total Data: ${total}`;
  rataEl.textContent = `Rata-rata IPK: ${rata}`;
}

// Pastikan selalu dipanggil setiap kali data berubah
function syncAndRender(resetPage = false) {
  filteredData = [...data];
  if (resetPage) currentPage = 1;
  render();
  updateSummary(); // <--- tambahkan ini agar summary ikut terupdate
}

// === LOGOUT BUTTON ===
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function() {
    if (confirm("Yakin ingin logout?")) {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "login.html";
    }
  });
}

// === CEK STATUS LOGIN & INIT ===
if (localStorage.getItem("isLoggedIn") === "true") {
  enableEditMode(); // Jika sudah login
} else {
  enableViewMode(); // Jika belum login
}
syncAndRender();

// ==================== MODE LIHAT vs EDIT ====================
function enableViewMode() {
  console.log("📖 Mode Lihat aktif");

  const editOnlyElements = [
    "#show-upload",
    "#selectAllBtn",
    "#deleteSelectedBtn",
    "#clearAllBtn",
    "#form-mahasiswa",
  ];

  editOnlyElements.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = "none";
  });

  // 🔹 Cek status login
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);

        if (isLoggedIn) {
      newBtn.textContent = "Logout";
      newBtn.style.background = "#ff4b4b";
      newBtn.style.color = "white";
      newBtn.onclick = () => {
        if (confirm("Yakin ingin logout?")) {
          localStorage.removeItem("isLoggedIn");
          localStorage.setItem("mode", "view");
          enableViewMode();
          modeSwitch.checked = false;
          modeLabel.textContent = "Mode Lihat 📖";
          alert("✅ Anda telah logout. Sekarang dalam Mode Lihat.");
        }
      };
    } else {
      newBtn.textContent = "Login";
      newBtn.style.background = "white";
      newBtn.style.color = "#021068";
      newBtn.onclick = () => {
        window.location.href = "login.html";
      };
    }
  }

  const tableHeader = document.querySelector("thead tr th:first-child");
  if (tableHeader) tableHeader.textContent = "No";

  const aksiHeader = document.querySelector("thead tr th:last-child");
  if (aksiHeader && aksiHeader.textContent.trim().toLowerCase() === "aksi") {
    aksiHeader.style.display = "none";
  }

  const aksiCells = document.querySelectorAll("#tbody td:last-child");
  aksiCells.forEach(td => td.style.display = "none");

  renderViewTable();
}

function enableEditMode() {
  console.log("Mode Edit aktif");

  const editOnlyElements = [
    "#show-upload",
    "#selectAllBtn",
    "#deleteSelectedBtn",
    "#clearAllBtn",
    "#form-mahasiswa",
  ];

  editOnlyElements.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = "";
  });

  // 🔹 Reset event lama dan pasang ulang event logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    newBtn.textContent = "Logout";
    newBtn.style.background = "#ff4b4b";
    newBtn.style.color = "white";
    newBtn.onclick = () => {
      if (confirm("Yakin ingin logout?")) {
        localStorage.removeItem("isLoggedIn");
        localStorage.setItem("mode", "view");

        // 🌟 Langsung ubah tampilan ke mode lihat tanpa redirect
        enableViewMode();
        modeSwitch.checked = false;
        modeLabel.textContent = "Mode Lihat 📖";

        alert("✅ Anda telah logout. Sekarang dalam Mode Lihat.");
      }
    };
  }

// Tampilkan kembali kolom "Aksi" saat Mode Edit
const aksiHeader = document.querySelector("thead tr th:last-child");
if (aksiHeader && aksiHeader.textContent.trim().toLowerCase() === "aksi") {
  aksiHeader.style.display = "";
}

// Tampilkan kembali semua sel kolom aksi di body
const aksiCells = document.querySelectorAll("#tbody td:last-child");
aksiCells.forEach(td => td.style.display = "");

  render();
}

// ==================== SWITCH MODE VIEW <-> EDIT ====================
const modeSwitch = document.getElementById("modeSwitch");
const modeLabel = document.getElementById("modeLabel");

if (modeSwitch && modeLabel) {
  modeSwitch.addEventListener("change", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (modeSwitch.checked) {
      // Jika user belum login, batalkan dan beri alert
      if (!isLoggedIn) {
        alert("❌ Anda harus login terlebih dahulu untuk masuk ke Mode Edit!");
        modeSwitch.checked = false; // kembalikan toggle ke posisi semula
        modeLabel.textContent = "Mode Lihat 📖";
        return;
      }

      // Jika sudah login, aktifkan mode edit
      enableEditMode();
      localStorage.setItem("mode", "edit");
      modeLabel.textContent = "Mode Edit";
    } else {
      // Kembali ke mode lihat
      enableViewMode();
      localStorage.setItem("mode", "view");
      modeLabel.textContent = "Mode Lihat";
    }
  });

  // Saat halaman dimuat, sesuaikan dengan mode tersimpan
  window.addEventListener("DOMContentLoaded", () => {
    const savedMode = localStorage.getItem("mode") || "view";
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (savedMode === "edit" && isLoggedIn) {
      modeSwitch.checked = true;
      enableEditMode();
      modeLabel.textContent = "Mode Edit";
    } else {
      modeSwitch.checked = false;
      enableViewMode();
      modeLabel.textContent = "Mode Lihat";
    }
  });
}
