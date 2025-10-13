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

  // Reset variabel global
  currentPage = 1;

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
  syncAndRender();
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
  searchData(); // tampilkan semua baris
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

// ------------------- IMPOR DATA -------------------
// Ambil elemen
const modal = document.getElementById("uploadModal");
const showBtn = document.getElementById("show-upload");
const closeBtn = document.querySelector(".close");

// Buka modal
showBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

// Tutup modal (klik X)
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Tutup modal (klik di luar kotak)
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Upload CSV
// Upload CSV atau Excel
// ------------------- IMPORT CSV / EXCEL -------------------
document.getElementById("btn-upload").addEventListener("click", () => {
  const fileInput = document.getElementById("csvFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Pilih file terlebih dahulu!");
    return;
  }

  const fileName = file.name.toLowerCase();

  // Jika CSV
  if (fileName.endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      importCSV(e.target.result);
      modal.style.display = "none";
    };
    reader.readAsText(file);
  }
  // Jika Excel (xls / xlsx)
  else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const dataExcel = new Uint8Array(e.target.result);
      const workbook = XLSX.read(dataExcel, { type: "array" });

      // Ambil sheet pertama
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      importExcel(jsonData);
      modal.style.display = "none";
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Format file tidak didukung! Gunakan CSV, XLS, atau XLSX.");
  }
});

function formatIpk(rawIpk) {
    // 1. Handle tipe data Number (dari input manual atau XLSX)
    if (typeof rawIpk === 'number') {
        return rawIpk.toFixed(2); // Menangani 3.9 -> "3.90" atau 4 -> "4.00"
    } 

    let ipkString = String(rawIpk || "").trim();
    // 2. Ganti koma dengan titik (Solusi CSV)
    ipkString = ipkString.replace(/,/g, '.');

    // 3. Handle angka bulat (e.g., "4" -> "4.00")
    if (/^\d$/.test(ipkString)) {
        return ipkString + '.00';
    }
    
    // 4. Handle satu desimal (e.g., "3.9" -> "3.90")
    if (/^\d\.\d$/.test(ipkString)) {
        return ipkString + '0';
    }
    
    // 5. Kembalikan format yang sudah benar (e.g., "4.00", "3.85")
    return ipkString;
}


// 🔹 Fungsi Import CSV
function importCSV(text) {
  const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);

  rows.forEach((row, index) => {
    if (index === 0) return; // skip header
    
    let cols = row.split(",");
    if (cols.length < 7) { // Coba deteksi semicolon jika koma gagal
        cols = row.split(";"); 
    }
    
    if (cols.length < 7) return; 

    // Pastikan ini destructuring 8 elemen data (Nama s.d. Foto)
    const [nama, nim, kelas, prodi, angkatan, email, rawIpk, catatan = ''] = cols.map(c => c.trim());

    // --- GUNAKAN FUNGSI PEMBATU IPK YANG BARU ---
    let ipk = formatIpk(rawIpk); 
    // ---------------------------------------------
    
    if (!validateForm(nama, nim, kelas, prodi, angkatan, email, ipk)) {
        console.warn(`Baris ${index + 1} dilewati karena data tidak valid: ${ipk}`);
        return;
    }
    if (data.some(m => m.nim === nim)) return;

    data.push({
      id: autoId++,
      nama, nim, kelas, prodi, angkatan, email, ipk, catatan, gambar: '' 
    });
  });

  saveData(data);
  syncAndRender();
}


// 🔹 Fungsi Import Excel
function importExcel(rows) {
  rows.forEach((row, index) => {
    if (index === 0) return; // skip header

    const [nama, nim, kelas, prodi, angkatan, email, rawIpk, catatan = ""] = row;
    
    // --- GUNAKAN FUNGSI PEMBATU ---
    let ipk = formatIpk(rawIpk);
    // ------------------------------

    // Validasi menggunakan nilai 'ipk' yang sudah diformat
    if (!validateForm(String(nama), String(nim), String(kelas), String(prodi), String(angkatan), String(email), ipk)) {
        console.warn(`Baris ${index + 1} dilewati karena data tidak valid.`);
        return;
    }
    if (data.some(m => m.nim === String(nim).trim())) return;

    data.push({
      id: autoId++,
      nama: String(nama).trim(),
      nim: String(nim).trim(),
      kelas: String(kelas || "").trim(),
      prodi: String(prodi || "").trim(),
      angkatan: String(angkatan || "2025").trim(), 
      email: String(email || "").trim(),         
      ipk: ipk,             
      catatan: String(catatan || "").trim(),     
      gambar: ''
    });
  });

  saveData(data);
  syncAndRender();
}

// --------------------- FILTERING AND SORTING -----------------------
// Sort berdasarkan Nama atau NIM

// DEFINISI FUNGSI applySort HARUS DI SINI AGAR BISA DIPANGGIL OLEH EVENT LISTENERS DI BAWAH
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

    // Untuk NIM jangan ubah ke Number biar 0 depan tidak hilang
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
  syncAndRender();
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
// HANYA RENDER JIKA isLggedIn === "true"
if (localStorage.getItem("isLoggedIn") !== "true") {
  alert("Silahkan login terlebih dahulu!");
  window.location.href = "login.html";
} else {
  syncAndRender();
}
