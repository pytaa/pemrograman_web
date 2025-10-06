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
    const tbody = document.getElementById("tbody");
    const btnReset = document.getElementById("btn-reset");

    // ------------------- FUNGSI RENDER -------------------
    function render() {
      if (!Array.isArray(data)) data = [];
      tbody.innerHTML = ""; // Kosongkan tabel sebelum render ulang
      data.forEach((row, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${row.nama}</td>
          <td>${row.nim}</td>
          <td>${row.kelas}</td>
          <td>${row.prodi}</td>
          <td>
            <button type="button" data-edit="${row.id}">Edit</button>
            <button type="button" data-del="${row.id}">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      updateFilterOptions();
    }

    // ------------------- FORM SUBMIT (CREATE / UPDATE) -------------------
    form.addEventListener("submit", (e) => {
      e.preventDefault(); // Mencegah reload halaman

      const idVal = elId.value.trim();
      const nama = elNama.value.trim();
      const nim = elNim.value.trim();
      const kelas = elKelas.value.trim();
      const prodi = elProdi.value.trim();

      if (!nama || !nim) return alert("Nama, NIM, Kelas, dan Program Studi wajib diisi.");

      if (idVal) {
        // UPDATE DATA
        const idNum = Number(idVal);
        const idx = data.findIndex(x => x.id === idNum);
        if (idx >= 0) {
          data[idx].nama = nama;
          data[idx].nim = nim;
          data[idx].kelas = kelas;
          data[idx].prodi = prodi;
        }
      } else {
        // CREATE DATA BARU
        data.push({ id: autoId++, nama, nim, kelas, prodi });
      }

      saveData(data); // Simpan data
      render();       // Render ulang tabel
      form.reset();   // Reset form
      elId.value = ""; 
      elNama.focus(); // Fokus ke input nama
    });

    // ------------------- RESET FORM -------------------
    btnReset.addEventListener("click", () => {
      form.reset();
      elId.value = "";
      elNama.focus();
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

// ------------------- UPLOAD CSV -------------------
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
document.getElementById("btn-upload").addEventListener("click", () => {
  const fileInput = document.getElementById("csvFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Pilih file CSV terlebih dahulu!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    importCSV(text);
    modal.style.display = "none"; // Tutup modal setelah upload
  };
  reader.readAsText(file);
});

// Parsing CSV → push ke array data → simpan localStorage → render
function importCSV(text) {
  const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);

  rows.forEach((row, index) => {
    if (index === 0) return; // skip header (baris pertama)

    const cols = row.split(",");

    if (cols.length < 4) return; // validasi minimal 4 kolom

    const [nama, nim, kelas, prodi] = cols;

    // Cek duplikat NIM biar tidak dobel
    if (data.some(m => m.nim === nim.trim())) return;

    // Masukkan ke array dengan autoId
    data.push({
      id: autoId++,
      nama: nama.trim(),
      nim: nim.trim(),
      kelas: kelas.trim(),
      prodi: prodi.trim()
    });
  });

  saveData(data); // Simpan ke localStorage
  render();       // Render ulang tabel
}

// --------------------- FILTERING AND SORTING -----------------------
// Sort berdasarkan Nama atau NIM
function applySort() {
  const sortBy = document.getElementById("sortBy").value;
  const sortOrder = document.getElementById("sortOrder").value;

  if (!sortBy) {
    render();
    filterData(); // setelah render, baru filter
    return;
  }

  data.sort((a, b) => {
    let valA = a[sortBy].toString().trim().toLowerCase();
    let valB = b[sortBy].toString().trim().toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  render();
  filterData(); // setelah render, baru filter
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

// Event listener untuk dropdown Sort
document.getElementById("sortBy").addEventListener("change", applySort);
document.getElementById("sortOrder").addEventListener("change", applySort);

const exportBtn = document.getElementById("exportBtn");
const exportOptions = document.getElementById("exportOptions");

// ----------------------- EKSPOR DATA -------------------------
// === FUNCTION: Download PDF ===
document.getElementById("exportBtn").addEventListener("click", downloadPDF);

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");

  // 🔽 Ambil nilai search & filter
  const searchVal = document.getElementById("searchInput").value.trim();
  const kelasVal = document.getElementById("filterKelas").value;
  const prodiVal = document.getElementById("filterProdi").value;

  // 🔽 Buat teks judul + subjudul sesuai filter
  let title = "Daftar Mahasiswa";
  let subtitle = "";

  if (kelasVal) subtitle += `Kelas: ${kelasVal} `;
  if (prodiVal) subtitle += `Prodi: ${prodiVal} `;
  if (searchVal) subtitle += `Pencarian: "${searchVal}"`;

  // 🔽 Tampilkan di PDF
  doc.setFontSize(16);
  doc.text(title, 40, 40);

  if (subtitle.trim() !== "") {
    doc.setFontSize(12);
    doc.text(subtitle.trim(), 40, 60);
  }

  let startY = subtitle.trim() !== "" ? 80 : 60; // tabel mulai lebih bawah kalau ada subtitle

  let rows = [];
  document.querySelectorAll("#tbody tr").forEach(tr => {
    let row = [];
    tr.querySelectorAll("td").forEach(td => row.push(td.innerText));
    rows.push(row);
  });

  doc.autoTable({
    head: [['No', 'Nama', 'NIM', 'Kelas', 'Program Studi']],
    body: rows.map(r => r.slice(0, 5)),
    startY: startY,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 128, 0],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      1: { halign: 'left' },
      4: { halign: 'left' }
    },
    styles: {
      fontSize: 10,
      cellPadding: 6
    },
    didDrawPage: () => {
      doc.setFontSize(10);
      doc.text(
        `Halaman ${doc.internal.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 20
      );
    }
  });

  // 🔽 Buat nama file dinamis
  let filename = "data mahasiswa";
  if (kelasVal) filename += `_kelas ${kelasVal}`;
  if (prodiVal) filename += `_prodi ${prodiVal}`;
  if (searchVal) filename += `_search-${searchVal.replace(/\s+/g, "_")}`;
  filename += ".pdf";

  doc.save(filename);
}

// ------------------- INIT -------------------
render(); // Render tabel saat halaman pertama kali dibuka