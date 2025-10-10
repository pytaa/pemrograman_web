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


// ------------------- FUNGSI RENDER -------------------
function render() {
  if (!Array.isArray(data)) data = [];
  tbody.innerHTML = ""; // Kosongkan tabel sebelum render ulang
  data.forEach((row, idx) => {
    const imgPreview = row.gambar ? `<img src="${row.gambar}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">` : '-';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="row-checkbox" value="${row.id}"></td> 
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.kelas}</td>
      <td>${row.prodi}</td>
      <td>${row.angkatan || '-'}</td>  
      <td>${row.email || '-'}</td>    
      <td>${row.ipk || '-'}</td>
      <td>${row.catatan || '-'}</td>
      <td>${imgPreview}</td>         
      <td>
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateFilterOptions();
  
  // Reset state checkbox master setelah render
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
}

// ------------------- FUNGSI VALIDASI -------------------
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


// ------------------- FORM SUBMIT (HANYA KLIK BUTTON) -------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitter = e.submitter;
  if (!submitter || submitter.id !== "btn-simpan") return;

  const idVal = elId.value.trim();
  const nama = elNama.value.trim();
  const nim = elNim.value.trim();
  const kelas = elKelas.value.trim();
  const prodi = elProdi.value;
  const angkatan = elAngkatan.value.trim();
  const email = elEmail.value.trim();
  const ipk = elIPK.value.trim();
  const catatan = elCatatan.value.trim();
  const file = elGambar.files[0];

  // --- 1. Validasi Data Dasar ---
  if (!validateForm(nama, nim, kelas, prodi, angkatan, email, ipk)) return;

  // --- 2. Cegah Duplikasi NIM & Email ---
  const idNum = idVal ? Number(idVal) : null;
  const duplicateNIM = data.find(x => x.nim === nim && x.id !== idNum);
  const duplicateEmail = data.find(x => x.email === email && x.id !== idNum);

  if (duplicateNIM && duplicateEmail) {
    alert(`Data dibatalkan!\nNIM ${nim} dan Email ${email} sudah terdaftar.`);
    return;
  } else if (duplicateNIM) {
    alert(`Data dibatalkan!\nNIM ${nim} sudah terdaftar.`);
    return;
  } else if (duplicateEmail) {
    alert(`Data dibatalkan!\nEmail ${email} sudah terdaftar.`);
    return;
  }

  // --- 3. Validasi Foto (Wajib Saat CREATE) ---
  if (!idVal && !file) {
    alert("Foto wajib diupload saat menambahkan data baru!");
    return;
  }

  // --- 4. Proses Upload Gambar ---
  let gambarBase64 = idVal ? (data.find(x => x.id === Number(idVal))?.gambar || '') : '';
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 10MB!");
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert("Format gambar harus JPG, JPEG, atau PNG!");
      return;
    }

    gambarBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  // --- 5. SIMPAN ATAU UPDATE ---
  if (idVal) {
    // UPDATE
    const idx = data.findIndex(x => x.id === Number(idVal));
    if (idx >= 0) {
      data[idx] = {
        ...data[idx],
        nama, nim, kelas, prodi, angkatan, email, ipk, catatan, gambar: gambarBase64
      };
      alert("✅ Data berhasil diperbarui!");
    }
  } else {
    // CREATE
    data.push({
      id: autoId++,
      nama, nim, kelas, prodi, angkatan, email, ipk, catatan, gambar: gambarBase64
    });
    alert("Data baru berhasil disimpan!");
  }

  // --- 6. Simpan ke localStorage & Reset Form ---
  saveData(data);
  render();
  form.reset();
  elId.value = "";
  elProdi.value = "";
  elAngkatan.value = "2025";
  elNama.focus();
  document.getElementById("gambar-preview").textContent = '';
  btnSimpan.textContent = "Simpan"; // Balik ke mode default
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
      elAngkatan.value = item.angkatan || '2025'; 
      elEmail.value = item.email || '';          
      elIPK.value = item.ipk || '';              
      elCatatan.value = item.catatan || '';      
      // Tampilkan info gambar
      document.getElementById("gambar-preview").textContent = item.gambar ? "Foto sudah terlampir (Ganti file untuk upload baru)" : "Belum ada foto terlampir.";
      elNama.focus();

      // Ubah teks tombol menjadi Update
      btnSimpan.textContent = "Perbarui"; 
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

let filteredData = [...data]; // awalnya berisi semua data
const dataPerHalaman = 5;
let halamanAktif = 1;

function updateTable() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  const start = (halamanAktif - 1) * dataPerHalaman;
  const end = start + dataPerHalaman;
  const dataTampil = filteredData.slice(start, end);

  dataTampil.forEach((mhs) => {
    const imgPreview = mhs.gambar ? 
      `<img src="${mhs.gambar}" alt="Foto" style="width:50px;height:50px;object-fit:cover;border-radius:50%;">` 
      : '-';
    const row = `
      <tr>
        <td><input type="checkbox" class="row-checkbox" value="${mhs.id}"></td>
        <td>${mhs.nama}</td>
        <td>${mhs.nim}</td>
        <td>${mhs.kelas}</td>
        <td>${mhs.prodi}</td>
        <td>${mhs.angkatan}</td>
        <td>${mhs.email}</td>
        <td>${mhs.ipk}</td>
        <td>${mhs.catatan || '-'}</td>
        <td>${imgPreview}</td>
        <td>
          <button type="button" data-edit="${mhs.id}">Edit</button>
          <button type="button" data-del="${mhs.id}">Hapus</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });

  document.getElementById("data-info").textContent =
    `Menampilkan ${dataTampil.length} dari ${filteredData.length} data`;
}


// === FILTER, SEARCH, & DELETE ===
document.getElementById("filter-prodi").addEventListener("change", filterData);
document.getElementById("filter-angkatan").addEventListener("change", filterData);
document.getElementById("search").addEventListener("input", filterData);
document.getElementById("hapus-semua").addEventListener("click", () => {
  if (confirm("Yakin ingin menghapus semua data?")) {
    dataMahasiswa.length = 0;
    filterData();
    alert("Semua data berhasil dihapus!");
  }
});

document.getElementById("hapus-semua").addEventListener("click", () => {
  if (confirm("Yakin ingin menghapus semua data?")) {
    data.length = 0;
    saveData(data);
    filterData();
    alert("Semua data berhasil dihapus!");
  }
});


function filterData() {
  const prodi = document.getElementById("filter-prodi").value.toLowerCase();
  const angkatan = document.getElementById("filter-angkatan").value.toLowerCase();
  const cari = document.getElementById("search").value.toLowerCase();

  filteredData = data.filter(mhs => {
    const cocokProdi = !prodi || mhs.prodi.toLowerCase() === prodi;
    const cocokAngkatan = !angkatan || mhs.angkatan.toLowerCase() === angkatan;
    const cocokCari =
      mhs.nama.toLowerCase().includes(cari) ||
      mhs.nim.toLowerCase().includes(cari) ||
      mhs.email.toLowerCase().includes(cari);
    return cocokProdi && cocokAngkatan && cocokCari;
  });

  halamanAktif = 1;
  updateTable();
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
    alert("Silakan login terlebih dahulu!");
    window.location.href = "login.html";
} else {
    // ------------------- INIT -------------------
    // render() hanya dipanggil di sini.
    render();
    saveData(data);
    filteredData = [...data];
    updateTable(); 
}