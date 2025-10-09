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

// ------------------- FUNGSI RENDER -------------------
function render() {
  if (!Array.isArray(data)) data = [];
  tbody.innerHTML = ""; // Kosongkan tabel sebelum render ulang
  data.forEach((row, idx) => {
    const imgPreview = row.gambar ? `<img src="${row.gambar}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">` : '-';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.kelas}</td>
      <td>${row.prodi}</td>
      <td>${row.angkatan || '-'}</td>  
      <td>${row.email || '-'}</td>    
      <td>${row.ipk || '-'}</td>      
      <td>${imgPreview}</td>         
      <td>
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateFilterOptions();
}

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
    // UPDATE DATA
    const idNum = Number(idVal);
    const idx = data.findIndex(x => x.id === idNum);
    if (idx >= 0) {
      data[idx].nama = nama;
      data[idx].nim = nim;
      data[idx].kelas = kelas;
      data[idx].prodi = prodi;
      data[idx].angkatan = angkatan;  // UPDATE BARU
      data[idx].email = email;        // UPDATE BARU
      data[idx].ipk = ipk;            // UPDATE BARU
      data[idx].catatan = catatan;    // UPDATE BARU
      data[idx].gambar = gambarBase64;// UPDATE BARU
    }
  } else {
    // CREATE DATA BARU
    data.push({ 
        id: autoId++, 
        nama, nim, kelas, prodi, 
        angkatan, email, ipk, catatan, gambar: gambarBase64 
    });
  }

  saveData(data);
  render();
  form.reset();
  elId.value = ""; 
  elProdi.value = ""; // Reset dropdown prodi
  elAngkatan.value = "2025"; // Set default angkatan
  elNama.focus();
  document.getElementById("gambar-preview").textContent = ''; // Reset preview
});

// ------------------- RESET FORM -------------------
btnReset.addEventListener("click", () => {
  form.reset();
  elId.value = "";
  elProdi.value = ""; // Reset dropdown prodi
  elAngkatan.value = "2025"; // Set default angkatan
  elNama.focus();
  document.getElementById("gambar-preview").textContent = ''; // Reset preview
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
      document.getElementById("gambar-preview").textContent = item.gambar ? "Foto sudah terlampir (Ganti file untuk upload baru)" : "Belum ada foto terlampir.";
      elNama.focus();
    }
  }

  if (delId) {
    // DELETE DATA
    const idNum = Number(delId);
    if (confirm("Yakin hapus data ini?")) {
      data = data.filter(x => x.id !== idNum);
      saveData(data);
      render();
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
  let filter = input.value.toLowerCase();
  let rows = document.querySelectorAll("#tbody tr");

  rows.forEach(row => {
    let text = row.textContent.toLowerCase();
    if (text.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
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
document.getElementById("filterKelas").addEventListener("change", filterData);
document.getElementById("filterProdi").addEventListener("change", filterData);

function filterData() {
  let valKelas = document.getElementById("filterKelas").value.toLowerCase();
  let valProdi = document.getElementById("filterProdi").value.toLowerCase();
  let rows = document.querySelectorAll("#tbody tr");

  rows.forEach(row => {
    let kelas = row.cells[3].textContent.toLowerCase();
    let prodi = row.cells[4].textContent.toLowerCase();

    let cocokKelas = !valKelas || kelas === valKelas;
    let cocokProdi = !valProdi || prodi === valProdi;

    row.style.display = (cocokKelas && cocokProdi) ? "" : "none";
  });
}

function updateFilterOptions() {
  // Ambil semua kelas & prodi unik dari data
  let kelasSet = [...new Set(data.map(item => item.kelas).filter(Boolean))].sort();
  let prodiSet = [...new Set(data.map(item => item.prodi).filter(Boolean))].sort();

  // Simpan pilihan user sebelumnya
  const selectedKelas = filterKelas.value;
  const selectedProdi = filterProdi.value;

  // Render ulang kelas
  filterKelas.innerHTML = '<option value="">Semua Kelas</option>';
  kelasSet.forEach(kls => {
    const option = document.createElement("option");
    option.value = kls;
    option.textContent = kls;
    filterKelas.appendChild(option);
  });

  // Render ulang prodi
  filterProdi.innerHTML = '<option value="">Semua Prodi</option>';
  prodiSet.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    filterProdi.appendChild(option);
  });

  // Kembalikan pilihan sebelumnya kalau masih ada di opsi
  if (kelasSet.includes(selectedKelas)) filterKelas.value = selectedKelas;
  if (prodiSet.includes(selectedProdi)) filterProdi.value = selectedProdi;
}

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
  render();
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
  render();
}

// --------------------- FILTERING AND SORTING -----------------------
// Sort berdasarkan Nama atau NIM


function applySort() {
  const sortBy = document.getElementById("sortBy").value;
  const sortOrder = document.getElementById("sortOrder").value;

  if (!sortBy) {
    render();
    filterData();
    return;
  }

  data.sort((a, b) => {
    let valA, valB;
    // Sort numerik untuk NIM, Angkatan, IPK
    if (['nim', 'angkatan', 'ipk'].includes(sortBy)) {
        valA = Number(a[sortBy] || 0); 
        valB = Number(b[sortBy] || 0);
    } else {
        valA = String(a[sortBy]).trim().toLowerCase();
        valB = String(b[sortBy]).trim().toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  render();
  filterData();
}

const filterKelas = document.getElementById("filterKelas");
const filterProdi = document.getElementById("filterProdi");

function updateFilterOptions() {
  // Ambil semua kelas & prodi unik dari data
  let kelasSet = [...new Set(data.map(item => item.kelas).filter(Boolean))].sort();
  let prodiSet = [...new Set(data.map(item => item.prodi).filter(Boolean))].sort();

  // Simpan pilihan user sebelumnya
  const selectedKelas = filterKelas.value;
  const selectedProdi = filterProdi.value;

  // Render ulang kelas
  filterKelas.innerHTML = '<option value="">Semua Kelas</option>';
  kelasSet.forEach(kls => {
    const option = document.createElement("option");
    option.value = kls;
    option.textContent = kls;
    filterKelas.appendChild(option);
  });

  // Render ulang prodi
  filterProdi.innerHTML = '<option value="">Semua Prodi</option>';
  prodiSet.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    filterProdi.appendChild(option);
  });

  // Kembalikan pilihan sebelumnya kalau masih ada di opsi
  if (kelasSet.includes(selectedKelas)) filterKelas.value = selectedKelas;
  if (prodiSet.includes(selectedProdi)) filterProdi.value = selectedProdi;
}

document.getElementById("sortBy").innerHTML = `
    <option value="">-- Urutkan --</option>
    <option value="nama">Nama</option>
    <option value="nim">NIM</option>
    <option value="angkatan">Angkatan</option>
    <option value="ipk">IPK</option>
`;

// Event listener untuk dropdown Sort
document.getElementById("sortBy").addEventListener("change", applySort);
document.getElementById("sortOrder").addEventListener("change", applySort);


const exportBtn = document.getElementById("exportBtn");
const exportOptions = document.getElementById("exportOptions");

// ----------------------- EKSPOR DATA -------------------------
// === FUNCTION: Download PDF ===
// ----------------------- EKSPOR DATA -------------------------
document.getElementById("exportBtn").addEventListener("click", showPreviewBeforeExport);

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4"); // UBAH ke Landscape (l) untuk banyak kolom

  // Ambil kondisi filter, sort, dan search
  const searchVal = document.getElementById("searchInput").value.trim();
  const kelasVal = document.getElementById("filterKelas").value;
  const prodiVal = document.getElementById("filterProdi").value;

  let title = "Daftar Mahasiswa";
  let subtitleParts = [];

  if (kelasVal) subtitleParts.push(`Kelas: ${kelasVal}`);
  if (prodiVal) subtitleParts.push(`Prodi: ${prodiVal}`);
  if (searchVal) subtitleParts.push(`Pencarian: "${searchVal}"`);

  const subtitle = subtitleParts.join(" | ");

  doc.setFontSize(14);
  doc.text(title, 40, 40);

  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 40, 58);
  }

  const startY = subtitle ? 75 : 55;

  // Ambil hanya baris yang tampil di tabel
  const visibleRows = Array.from(document.querySelectorAll("#tbody tr"))
    .filter(tr => tr.style.display !== "none");

  if (visibleRows.length === 0) {
    alert("Tidak ada data yang cocok untuk diekspor!");
    return;
  }

  // Ambil isi tabel dari data mentah yang sudah difilter/sort
  // Mapping dari data array (data) ke format yang dibutuhkan autoTable
  const exportedData = visibleRows.map(tr => {
      // Dapatkan ID dari baris yang terlihat (untuk mencari di array data)
      const dataIndex = Number(tr.cells[0].innerText) - 1; // Anggap indeks di kolom No adalah indeks asli
      const row = data.find(item => item.id === Number(tr.querySelector('button[data-edit], button[data-del]').getAttribute('data-edit') || tr.querySelector('button[data-edit], button[data-del]').getAttribute('data-del')));

      return [
        tr.cells[0]?.innerText || "", // No
        row.nama,
        row.nim,
        row.kelas,
        row.prodi,
        row.angkatan, // BARU
        row.email,    // BARU
        row.ipk       // BARU
        // Catatan tidak dimasukkan ke PDF untuk menghemat ruang
      ];
  });

  // Tambahkan ke PDF
  doc.autoTable({
    head: [['No', 'Nama', 'NIM', 'Kelas', 'Program Studi', 'Angkatan', 'Email', 'IPK']], // HEADER BARU
    body: exportedData,
    startY: startY,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 100, 0],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 8, cellPadding: 5 },
    columnStyles: {
      1: { halign: 'left', cellWidth: 80 },
      2: { cellWidth: 60 },
      3: { cellWidth: 60 },
      4: { halign: 'left', cellWidth: 80 },
      5: { cellWidth: 50 },
      6: { halign: 'left', cellWidth: 100 }, // Email
      7: { cellWidth: 40 } // IPK
    },
    didDrawPage: (data) => {
      doc.setFontSize(9);
      doc.text(
        `Halaman ${doc.internal.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 20
      );
    }
  });

  // Nama file sesuai filter aktif
  let filename = "data_mahasiswa";
  if (kelasVal) filename += `_kelas-${kelasVal}`;
  if (prodiVal) filename += `_prodi-${prodiVal}`;
  if (searchVal) filename += `_search-${searchVal.replace(/\s+/g, "_")}`;
  filename += ".pdf";

  doc.save(filename);
}

// ------------------- PREVIEW SEBELUM EKSPOR PDF -------------------
const previewModal = document.getElementById("previewModal");
const closePreview = document.querySelector(".close-preview");
const confirmExportBtn = document.getElementById("confirmExportBtn");
const previewTableBody = document.querySelector("#previewTable tbody");
const previewInfo = document.getElementById("previewInfo");

closePreview.addEventListener("click", () => previewModal.style.display = "none");
window.addEventListener("click", (e) => {
  if (e.target === previewModal) previewModal.style.display = "none";
});

function showPreviewBeforeExport() {
  previewTableBody.innerHTML = "";

  // ... (Ambil nilai filter/search sama) ...
  const searchVal = document.getElementById("searchInput").value.trim();
  const kelasVal = document.getElementById("filterKelas").value;
  const prodiVal = document.getElementById("filterProdi").value;

  const visibleRows = Array.from(document.querySelectorAll("#tbody tr"))
    .filter(tr => tr.style.display !== "none");

  if (visibleRows.length === 0) {
    alert("Tidak ada data yang cocok untuk diekspor!");
    return;
  }
  
  // Update header preview table
  document.querySelector("#previewTable thead tr").innerHTML = `
      <th>No</th>
      <th>Nama</th>
      <th>NIM</th>
      <th>Kelas</th>
      <th>Program Studi</th>
      <th>Angkatan</th> <th>Email</th> <th>IPK</th> `;

  visibleRows.forEach((tr, i) => {
    // Kloning baris, lalu hapus kolom Aksi dan Gambar (kolom terakhir dan kedua dari terakhir)
    const row = tr.cloneNode(true);
    row.querySelector("td:last-child").remove(); // Hapus kolom Aksi
    row.querySelector("td:last-child").remove(); // Hapus kolom Gambar (kini kolom terakhir)

    row.querySelector("td:first-child").textContent = i + 1; // Nomor ulang
    previewTableBody.appendChild(row);
  });

  // Info tambahan di preview
  let infoText = [];
  if (kelasVal) infoText.push(`Kelas: ${kelasVal}`);
  if (prodiVal) infoText.push(`Prodi: ${prodiVal}`);
  if (searchVal) infoText.push(`Pencarian: "${searchVal}"`);
  previewInfo.textContent = infoText.join(" | ") || "Menampilkan semua data.";

  previewModal.style.display = "block";
}

confirmExportBtn.addEventListener("click", () => {
  previewModal.style.display = "none";
  downloadPDF();
});

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
    alert("Silakan login terlebih dahulu!");
    window.location.href = "login.html";
} else {
    // ------------------- INIT -------------------
    // render() hanya dipanggil di sini.
    render(); 
}
