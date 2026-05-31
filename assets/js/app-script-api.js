// ========== GOOGLE APPS SCRIPT - BPM FPIK UBT ==========
// FULL VERSION: Penilaian Dosen + Anggota BPM + Kegiatan + Aspirasi + Berkas + Mahasiswa + Statistik + Visitor
// Version: 7.0.0 - FIXED

// ========== KONFIGURASI UTAMA ==========
const SPREADSHEET_ID = '1z4M_Gwnn_017BaTGxeNzj84gSBbTbwigY7_o2mAP43M';
const SHEET_NAME_PENILAIAN = 'penilaian';
const EMAIL_NOTIF = 'bpmfpikubt9@gmail.com';

// ========== HANDLE GET ==========
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;
    
    // Fitur Penilaian Dosen
    if (action === 'getData') {
      const data = getAllDataFromSpreadsheet();
      return response(true, "Data berhasil diambil", data);
    }
    if (action === 'getStats') {
      const stats = getStatistics();
      return response(true, "Statistik berhasil diambil", stats);
    }
    
    // Fitur CRUD
    if (action === 'getAnggota') return respond(getAnggota());
    if (action === 'getKegiatan') return respond(getKegiatan());
    if (action === 'getAspirasi') return respond(getAspirasi());
    if (action === 'getBerkas') return respond(getBerkas());
    
    // Fitur Mahasiswa
    if (action === 'getMahasiswaCount') return respond(getMahasiswaCount());
    
    // Fitur Statistik & Visitor
    if (action === 'getDashboardStats') return respond(getDashboardStats());
    if (action === 'getVisitorStats') return respond(getVisitorStats());
    if (action === 'getDailyVisits') return respond(getDailyVisits());
    if (action === 'getVisitorLog') return respond(getVisitorLog());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      status: "active",
      version: "7.0.0",
      message: "API BPM FPIK UBT siap digunakan",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return response(false, error.toString());
  }
}

// ========== HANDLE POST ==========
function doPost(e) {
  try {
    let params = {};
    let action = null;
    
    if (e.postData && e.postData.contents) {
      try {
        const jsonData = JSON.parse(e.postData.contents);
        if (jsonData.dosen) {
          return handlePenilaianDosen(jsonData);
        }
        params = jsonData;
        action = params.action;
      } catch(parseError) {
        params = e.parameter;
        action = params ? params.action : null;
      }
    } else {
      params = e.parameter;
      action = params ? params.action : null;
    }
    
    if (params.dosen && params.matakuliah && !action) {
      return handlePenilaianDosen(params);
    }
    
    // Fitur Anggota
    if (action === 'tambahAnggota') return respond(tambahAnggota(params));
    if (action === 'updateAnggota') return respond(updateAnggota(params));
    if (action === 'hapusAnggota') return respond(hapusAnggota(params));
    if (action === 'uploadFotoAnggota') return respond(uploadFotoAnggota(params));
    
    // Fitur Kegiatan
    if (action === 'tambahKegiatan') return respond(tambahKegiatan(params));
    if (action === 'updateKegiatan') return respond(updateKegiatan(params));
    if (action === 'hapusKegiatan') return respond(hapusKegiatan(params));
    if (action === 'uploadFotoKegiatan') return respond(uploadFotoKegiatan(params));
    if (action === 'hapusFotoKegiatan') return respond(hapusFotoKegiatan(params));
    
    // Fitur Aspirasi Admin
    if (action === 'updateStatusAspirasi') return respond(updateStatusAspirasi(params));
    
    // ========== FITUR ASPIRASI DARI WEBSITE (DITAMBAHKAN) ==========
    if (action === 'kirimAspirasi') return respond(kirimAspirasi(params));
    
    // Fitur Berkas
    if (action === 'uploadBerkas') return respond(uploadBerkas(params));
    if (action === 'hapusBerkas') return respond(hapusBerkas(params));
    
    // Fitur Mahasiswa
    if (action === 'mahasiswaRegister') return respond(mahasiswaRegister(params));
    if (action === 'mahasiswaLogin') return respond(mahasiswaLogin(params));
    if (action === 'mahasiswaLogout') return respond(mahasiswaLogout(params));
    if (action === 'uploadFotoMahasiswa') return respond(uploadFotoMahasiswa(params));
    if (action === 'verifyMahasiswaToken') return respond(verifyMahasiswaToken(params));
    if (action === 'getFotoMahasiswa') return respond(getFotoMahasiswa(params));
    
    // Fitur Visitor
    if (action === 'recordVisitor') return respond(recordVisitor(params));
    
    return response(false, "Aksi tidak dikenal: " + action);
    
  } catch(error) {
    return response(false, error.toString());
  }
}

// ========== FUNGSI RESPONSE ==========
function response(success, message, data = null) {
  const result = { success: success, message: message, timestamp: new Date().toISOString() };
  if (data !== null) result.data = data;
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ==================== PENILAIAN DOSEN ====================
function handlePenilaianDosen(data) {
  if (!data.dosen || !data.matakuliah) {
    return response(false, "Data dosen atau mata kuliah kosong");
  }
  const result = saveToSpreadsheet(data);
  if (result.success) {
    sendEmailNotification(data);
    return response(true, "Data berhasil disimpan");
  } else {
    return response(false, result.error);
  }
}

function saveToSpreadsheet(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME_PENILAIAN);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_PENILAIAN);
      const headers = [
        "Tanggal", "Nama", "NIM", "Prodi", "Semester", "Email",
        "Dosen", "Matakuliah", "R1", "R2", "R3", "R4", "R5",
        "Rata2", "Predikat", "Kelebihan", "Kekurangan"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }
    
    const r1 = Math.min(Math.max(parseInt(data.rating1) || parseInt(data.r1) || 0, 0), 5);
    const r2 = Math.min(Math.max(parseInt(data.rating2) || parseInt(data.r2) || 0, 0), 5);
    const r3 = Math.min(Math.max(parseInt(data.rating3) || parseInt(data.r3) || 0, 0), 5);
    const r4 = Math.min(Math.max(parseInt(data.rating4) || parseInt(data.r4) || 0, 0), 5);
    const r5 = Math.min(Math.max(parseInt(data.rating5) || parseInt(data.r5) || 0, 0), 5);
    
    const totalRating = r1 + r2 + r3 + r4 + r5;
    const rataRata = (totalRating / 5).toFixed(1);
    
    let predikat = "";
    const nilai = parseFloat(rataRata);
    if (nilai >= 4.5) predikat = "Sangat Baik (A)";
    else if (nilai >= 3.5) predikat = "Baik (B)";
    else if (nilai >= 2.5) predikat = "Cukup (C)";
    else if (nilai >= 1.5) predikat = "Kurang (D)";
    else predikat = "Sangat Kurang (E)";
    
    const newRow = [
      data.tanggal || new Date().toLocaleString('id-ID'),
      "Anonim",
      data.nim || "-",
      data.prodi || "-",
      data.semester || "-",
      data.emailResponden || "-",
      data.dosen || "-",
      data.matakuliah || "-",
      r1, r2, r3, r4, r5,
      rataRata,
      predikat,
      data.kelebihan || "-",
      data.kekurangan || "-"
    ];
    
    sheet.appendRow(newRow);
    return { success: true };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function getAllDataFromSpreadsheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_PENILAIAN);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        let value = data[i][j];
        if (headers[j] === "Tanggal" && value instanceof Date) {
          value = Utilities.formatDate(value, "Asia/Makassar", "dd/MM/yyyy HH:mm:ss");
        }
        row[headers[j]] = value;
      }
      rows.push(row);
    }
    return rows;
  } catch(error) {
    return [];
  }
}

function getStatistics() {
  try {
    const allData = getAllDataFromSpreadsheet();
    let totalRating = 0;
    let validCount = 0;
    const perDosen = {};
    
    for (const item of allData) {
      let rating = parseFloat(item.Rata2) || 0;
      if (rating >= 1 && rating <= 5) {
        totalRating += rating;
        validCount++;
        const dosen = item.Dosen || "Unknown";
        if (!perDosen[dosen]) perDosen[dosen] = { total: 0, count: 0 };
        perDosen[dosen].total += rating;
        perDosen[dosen].count += 1;
      }
    }
    
    let rataRata = "0";
    if (validCount > 0) rataRata = (totalRating / validCount).toFixed(1);
    
    const dosenRating = [];
    for (const [nama, nilai] of Object.entries(perDosen)) {
      dosenRating.push({
        nama: nama,
        rataRata: (nilai.total / nilai.count).toFixed(1),
        jumlah: nilai.count
      });
    }
    dosenRating.sort((a, b) => parseFloat(b.rataRata) - parseFloat(a.rataRata));
    
    return {
      totalPenilaian: validCount,
      rataRataKeseluruhan: rataRata,
      totalDosen: Object.keys(perDosen).length,
      dosenTerbaik: dosenRating.slice(0, 5),
      lastUpdate: new Date().toISOString()
    };
  } catch(error) {
    return { totalPenilaian: 0, rataRataKeseluruhan: "0", totalDosen: 0 };
  }
}

function sendEmailNotification(data) {
  try {
    const subject = `Penilaian Baru: ${data.dosen} - ${data.matakuliah}`;
    const message = `Penilaian baru masuk.\n\nDosen: ${data.dosen}\nMata Kuliah: ${data.matakuliah}\n\nLihat data lengkap di:\nhttps://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`;
    MailApp.sendEmail(EMAIL_NOTIF, subject, message);
  } catch(error) {}
}

// ==================== ANGGOTA BPM ====================
function getAnggota() {
  const sheet = getSheet('anggota');
  if (!sheet) return { success: true, data: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const anggota = [];
  for (let i = 1; i < data.length; i++) {
    anggota.push({
      id: data[i][0],
      nama: data[i][1] || '',
      jabatan: data[i][2] || '',
      deskripsi: data[i][3] || '',
      fotoUrl: data[i][4] || '',
      email: data[i][5] || '',
      instagram: data[i][6] || '',
      whatsapp: data[i][7] || '',
      anggotaTim: data[i][8] || '',
      rowIndex: i
    });
  }
  return { success: true, data: anggota };
}

function tambahAnggota(e) {
  const sheet = ensureSheet('anggota', ['ID', 'Nama', 'Jabatan', 'Deskripsi', 'FotoUrl', 'Email', 'Instagram', 'WhatsApp', 'AnggotaTim']);
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    e.nama || '',
    e.jabatan || '',
    e.deskripsi || '',
    '',
    e.email || '',
    e.instagram || '',
    e.whatsapp || '',
    ''
  ]);
  return { success: true };
}

function updateAnggota(e) {
  const sheet = getSheet('anggota');
  if (!sheet) return { success: false };
  
  const row = parseInt(e.rowIndex) + 1;
  sheet.getRange(row, 2).setValue(e.nama || '');
  sheet.getRange(row, 3).setValue(e.jabatan || '');
  sheet.getRange(row, 4).setValue(e.deskripsi || '');
  sheet.getRange(row, 6).setValue(e.email || '');
  sheet.getRange(row, 7).setValue(e.instagram || '');
  sheet.getRange(row, 8).setValue(e.whatsapp || '');
  sheet.getRange(row, 9).setValue(e.anggotaTim || '');
  
  return { success: true };
}

function hapusAnggota(e) {
  const sheet = getSheet('anggota');
  if (!sheet) return { success: false };
  
  const row = parseInt(e.rowIndex) + 1;
  sheet.deleteRow(row);
  return { success: true };
}

function uploadFotoAnggota(e) {
  try {
    const rowIndex = parseInt(e.rowIndex) + 1;
    const fotoUrl = e.fotoUrl || '';
    
    const sheet = getSheet('anggota');
    if (!sheet) {
      return { success: false, error: "Sheet 'anggota' tidak ditemukan" };
    }
    
    sheet.getRange(rowIndex, 5).setValue(fotoUrl);
    return { success: true, url: fotoUrl };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== KEGIATAN ====================
function getKegiatan() {
  const sheet = getSheet('kegiatan');
  if (!sheet) return { success: true, data: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const kegiatan = [];
  for (let i = 1; i < data.length; i++) {
    kegiatan.push({
      id: data[i][0],
      title: data[i][1] || '',
      deskripsi: data[i][2] || '',
      tujuan: data[i][3] || '',
      kontak: data[i][4] || '',
      images: data[i][5] || '[]',
      rowIndex: i
    });
  }
  return { success: true, data: kegiatan };
}

function tambahKegiatan(e) {
  const sheet = ensureSheet('kegiatan', ['ID', 'Title', 'Deskripsi', 'Tujuan', 'Kontak', 'Images']);
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    e.title || '',
    e.deskripsi || '',
    e.tujuan || '',
    e.kontak || '',
    '[]'
  ]);
  return { success: true };
}

function updateKegiatan(e) {
  const sheet = getSheet('kegiatan');
  if (!sheet) return { success: false };
  
  const row = parseInt(e.rowIndex) + 1;
  sheet.getRange(row, 2).setValue(e.title || '');
  sheet.getRange(row, 3).setValue(e.deskripsi || '');
  
  return { success: true };
}

function hapusKegiatan(e) {
  const sheet = getSheet('kegiatan');
  if (!sheet) return { success: false };
  
  const row = parseInt(e.rowIndex) + 1;
  sheet.deleteRow(row);
  return { success: true };
}

function uploadFotoKegiatan(e) {
  try {
    const rowIndex = parseInt(e.rowIndex) + 1;
    const fotoUrl = e.fotoUrl || '';
    
    const sheet = getSheet('kegiatan');
    if (!sheet) {
      return { success: false, error: "Sheet 'kegiatan' tidak ditemukan" };
    }
    
    let images = [];
    try {
      const currentValue = sheet.getRange(rowIndex, 6).getValue();
      images = currentValue ? JSON.parse(currentValue) : [];
    } catch(e) { images = []; }
    
    images.push(fotoUrl);
    sheet.getRange(rowIndex, 6).setValue(JSON.stringify(images));
    
    return { success: true };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function hapusFotoKegiatan(e) {
  try {
    const rowIndex = parseInt(e.rowIndex) + 1;
    const imgIndex = parseInt(e.imgIndex);
    
    const sheet = getSheet('kegiatan');
    let images = [];
    try {
      const currentValue = sheet.getRange(rowIndex, 6).getValue();
      images = currentValue ? JSON.parse(currentValue) : [];
    } catch(e) { images = []; }
    
    if (imgIndex >= 0 && imgIndex < images.length) {
      images.splice(imgIndex, 1);
      sheet.getRange(rowIndex, 6).setValue(JSON.stringify(images));
    }
    
    return { success: true };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== ASPIRASI ====================
function getAspirasi() {
  const sheet = getSheet('aspirasi');
  if (!sheet) return { success: true, data: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const aspirasi = [];
  for (let i = 1; i < data.length; i++) {
    aspirasi.push({
      timestamp: data[i][0] ? formatDate(data[i][0]) : '-',
      nama: data[i][1] || '-',
      nim: data[i][2] || '-',
      kategori: data[i][3] || '-',
      pesan: data[i][4] || '-',
      status: data[i][5] || 'Belum Dibaca',
      rowIndex: i
    });
  }
  aspirasi.reverse();
  return { success: true, data: aspirasi };
}

function updateStatusAspirasi(e) {
  try {
    const sheet = getSheet('aspirasi');
    if (!sheet) return { success: false };
    
    const row = parseInt(e.rowIndex) + 1;
    sheet.getRange(row, 6).setValue(e.status || 'Sudah Dibaca');
    
    return { success: true };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ========== FITUR ASPIRASI DARI WEBSITE (DITAMBAHKAN) ==========
function kirimAspirasi(e) {
  try {
    // Pastikan sheet aspirasi ada dengan struktur yang benar
    let sheet = getSheet('aspirasi');
    if (!sheet) {
      sheet = ensureSheet('aspirasi', ['Timestamp', 'Nama', 'NIM', 'Kategori', 'Pesan', 'Status']);
    } else {
      // Cek apakah kolom Status ada, jika tidak tambahkan
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (headers.length < 6 || headers[5] !== 'Status') {
        sheet.getRange(1, 6).setValue('Status');
      }
    }
    
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, "Asia/Makassar", "dd/MM/yyyy HH:mm:ss");
    
    sheet.appendRow([
      formattedDate,
      e.nama || '-',
      e.nim || '-',
      e.kategori || '-',
      e.pesan || '-',
      'Belum Dibaca'
    ]);
    
    return { success: true, message: 'Aspirasi berhasil dikirim' };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== BERKAS ====================
function getBerkas() {
  const sheet = getSheet('berkas');
  if (!sheet) return { success: true, data: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const berkas = [];
  for (let i = 1; i < data.length; i++) {
    berkas.push({
      id: data[i][0],
      judul: data[i][1] || '-',
      kategori: data[i][2] || 'Lainnya',
      deskripsi: data[i][3] || '',
      link: data[i][4] || '#',
      namaFile: data[i][5] || '',
      tanggal: data[i][6] ? formatDate(data[i][6]) : '-',
      fileId: data[i][7] || '',
      rowIndex: i
    });
  }
  berkas.reverse();
  return { success: true, data: berkas };
}

function uploadBerkas(e) {
  try {
    const base64 = e.base64Data;
    const namaFile = e.namaFile;
    const judul = e.judul;
    const kategori = e.kategori;
    const deskripsi = e.deskripsi;
    
    // Validasi input
    if (!judul || !namaFile || !base64) {
      return { success: false, error: "Data tidak lengkap" };
    }
    
    // Decode base64
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), getMimeType(namaFile), namaFile);
    
    // Upload ke Google Drive
    // GANTI DENGAN ID FOLDER ANDA
    const FOLDER_ID = '11PyZsyuJtPyGV_OIoyXRO1ZRWFk_VAML';
    let folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ID);
    } catch(e) {
      // Jika folder tidak ditemukan, buat folder baru
      folder = DriveApp.createFolder('BPM_Berkas');
    }
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Simpan ke sheet
    const sheet = ensureSheet('berkas', ['ID', 'Judul', 'Kategori', 'Deskripsi', 'Link', 'Nama File', 'Tanggal', 'File ID']);
    const id = Utilities.getUuid();
    
    sheet.appendRow([id, judul, kategori, deskripsi, file.getUrl(), namaFile, new Date(), file.getId()]);
    
    return { success: true, message: "Berkas berhasil diupload", url: file.getUrl() };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function hapusBerkas(e) {
  try {
    const fileId = e.fileId;
    const rowIndex = parseInt(e.rowIndex) + 1;
    
    if (fileId && fileId !== 'undefined') {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch(err) {
        console.log("File tidak ditemukan di Drive:", err);
      }
    }
    
    const sheet = getSheet('berkas');
    if (sheet) {
      sheet.deleteRow(rowIndex);
    }
    
    return { success: true };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== MAHASISWA ====================
function mahasiswaRegister(e) {
  const nim = e.nim || '';
  const nama = e.nama || '';
  const password = e.password || '';
  const prodi = e.prodi || '';
  const semester = e.semester || '';
  
  if (!nim || !nama || !password || !prodi || !semester) {
    return { success: false, message: 'Semua field harus diisi!' };
  }
  
  if (!/^\d{9,10}$/.test(nim)) {
    return { success: false, message: 'NIM harus 9-10 digit angka!' };
  }
  
  if (password.length < 6) {
    return { success: false, message: 'Password minimal 6 karakter!' };
  }
  
  let sheet = getSheet('mahasiswa');
  if (!sheet) {
    sheet = ensureSheet('mahasiswa', ['NIM', 'Nama', 'Password', 'Prodi', 'Semester', 'Status', 'Token', 'FotoUrl']);
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == nim) {
      return { success: false, message: 'NIM sudah terdaftar! Silakan login.' };
    }
  }
  
  sheet.appendRow([nim, nama, password, prodi, semester, 'aktif', '', '']);
  
  return { success: true, message: 'Registrasi berhasil! Silakan login.' };
}

function mahasiswaLogin(e) {
  const nim = e.nim || '';
  const password = e.password || '';
  
  const sheet = getSheet('mahasiswa');
  if (!sheet) {
    return { success: false, message: 'Database mahasiswa tidak ditemukan. Silakan registrasi terlebih dahulu.' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == nim && data[i][2] == password) {
      if (data[i][5] !== 'aktif') {
        return { success: false, message: 'Akun Anda tidak aktif. Hubungi admin BPM.' };
      }
      
      const token = Utilities.getUuid();
      const expiration = new Date().getTime() + (8 * 60 * 60 * 1000);
      
      sheet.getRange(i + 1, 7).setValue(token);
      
      const cache = CacheService.getScriptCache();
      cache.put(token, JSON.stringify({
        nim: data[i][0],
        nama: data[i][1],
        prodi: data[i][3],
        semester: data[i][4],
        role: 'mahasiswa',
        expiration: expiration
      }), 28800);
      
      return {
        success: true,
        token: token,
        nama: data[i][1],
        nim: data[i][0],
        prodi: data[i][3],
        semester: data[i][4],
        message: 'Login berhasil'
      };
    }
  }
  
  return { success: false, message: 'NIM atau password salah' };
}

function verifyMahasiswaToken(e) {
  const token = e.token || '';
  const cache = CacheService.getScriptCache();
  const sessionData = cache.get(token);
  
  if (!sessionData) {
    return { success: false, valid: false };
  }
  
  const data = JSON.parse(sessionData);
  const now = new Date().getTime();
  
  if (now > data.expiration) {
    cache.remove(token);
    return { success: false, valid: false, expired: true };
  }
  
  return {
    success: true,
    valid: true,
    nama: data.nama,
    nim: data.nim,
    prodi: data.prodi,
    semester: data.semester
  };
}

function mahasiswaLogout(e) {
  const token = e.token || '';
  const cache = CacheService.getScriptCache();
  cache.remove(token);
  
  const sheet = getSheet('mahasiswa');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][6] === token) {
        sheet.getRange(i + 1, 7).setValue('');
        break;
      }
    }
  }
  
  return { success: true, message: 'Logout berhasil' };
}

function uploadFotoMahasiswa(e) {
  try {
    const nim = e.nim || '';
    const fotoUrl = e.fotoUrl || '';
    
    if (!nim || !fotoUrl) {
      return { success: false, message: 'Data tidak lengkap' };
    }
    
    const sheet = getSheet('mahasiswa');
    if (!sheet) {
      return { success: false, message: 'Sheet mahasiswa tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == nim) {
        sheet.getRange(i + 1, 8).setValue(fotoUrl);
        return { success: true, message: 'Foto profil berhasil diupdate', fotoUrl: fotoUrl };
      }
    }
    
    return { success: false, message: 'Mahasiswa tidak ditemukan' };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function getFotoMahasiswa(e) {
  try {
    const nim = e.nim || '';
    const token = e.token || '';
    
    const sheet = getSheet('mahasiswa');
    if (!sheet) {
      return { success: false, fotoUrl: '' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if ((nim && data[i][0] == nim) || (token && data[i][6] === token)) {
        return { success: true, fotoUrl: data[i][7] || '' };
      }
    }
    
    return { success: true, fotoUrl: '' };
  } catch(error) {
    return { success: false, fotoUrl: '' };
  }
}

// ==================== STATISTIK DASHBOARD ====================
function getDashboardStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Count Mahasiswa
    let mahasiswaCount = 0;
    const mahasiswaSheet = ss.getSheetByName('mahasiswa');
    if (mahasiswaSheet) {
      const mahasiswaData = mahasiswaSheet.getDataRange().getValues();
      mahasiswaCount = Math.max(0, mahasiswaData.length - 1);
    }
    
    // Count Penilaian
    let penilaianCount = 0;
    const penilaianSheet = ss.getSheetByName('penilaian');
    if (penilaianSheet) {
      const penilaianData = penilaianSheet.getDataRange().getValues();
      penilaianCount = Math.max(0, penilaianData.length - 1);
    }
    
    // Count Aspirasi
    let aspirasiCount = 0;
    const aspirasiSheet = ss.getSheetByName('aspirasi');
    if (aspirasiSheet) {
      const aspirasiData = aspirasiSheet.getDataRange().getValues();
      aspirasiCount = Math.max(0, aspirasiData.length - 1);
    }
    
    // Count Kegiatan
    let kegiatanCount = 0;
    const kegiatanSheet = ss.getSheetByName('kegiatan');
    if (kegiatanSheet) {
      const kegiatanData = kegiatanSheet.getDataRange().getValues();
      kegiatanCount = Math.max(0, kegiatanData.length - 1);
    }
    
    // Count Anggota
    let anggotaCount = 0;
    const anggotaSheet = ss.getSheetByName('anggota');
    if (anggotaSheet) {
      const anggotaData = anggotaSheet.getDataRange().getValues();
      anggotaCount = Math.max(0, anggotaData.length - 1);
    }
    
    // Count Berkas
    let berkasCount = 0;
    const berkasSheet = ss.getSheetByName('berkas');
    if (berkasSheet) {
      const berkasData = berkasSheet.getDataRange().getValues();
      berkasCount = Math.max(0, berkasData.length - 1);
    }
    
    // Hitung rata-rata rating dosen
    let totalRating = 0;
    let ratingCount = 0;
    if (penilaianSheet) {
      const penilaianData = penilaianSheet.getDataRange().getValues();
      for (let i = 1; i < penilaianData.length; i++) {
        const rating = parseFloat(penilaianData[i][13]);
        if (rating >= 1 && rating <= 5) {
          totalRating += rating;
          ratingCount++;
        }
      }
    }
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0";
    
    // Hitung aspirasi berdasarkan status
    let aspirasiBelum = 0;
    let aspirasiDibaca = 0;
    let aspirasiTindak = 0;
    if (aspirasiSheet) {
      const aspirasiData = aspirasiSheet.getDataRange().getValues();
      for (let i = 1; i < aspirasiData.length; i++) {
        const status = aspirasiData[i][5] || 'Belum Dibaca';
        if (status === 'Belum Dibaca') aspirasiBelum++;
        else if (status === 'Sudah Dibaca') aspirasiDibaca++;
        else if (status === 'Dalam Tindak Lanjut') aspirasiTindak++;
      }
    }
    
    return {
      success: true,
      data: {
        mahasiswa: mahasiswaCount,
        penilaian: penilaianCount,
        aspirasi: aspirasiCount,
        kegiatan: kegiatanCount,
        anggota: anggotaCount,
        berkas: berkasCount,
        avgRating: avgRating,
        aspirasiStatus: {
          belum: aspirasiBelum,
          dibaca: aspirasiDibaca,
          tindakLanjut: aspirasiTindak
        },
        lastUpdate: new Date().toISOString()
      }
    };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function getMahasiswaCount() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('mahasiswa');
    
    if (!sheet) return { success: true, data: 0 };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: 0 };
    
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === 'aktif') count++;
    }
    
    return { success: true, data: count };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== VISITOR COUNTER ====================
function recordVisitor(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('visitor_log');
    
    if (!sheet) {
      sheet = ss.insertSheet('visitor_log');
      sheet.appendRow(['ID', 'VisitorID', 'IP', 'Page', 'UserAgent', 'VisitTime', 'IsMahasiswa', 'Referrer', 'Device']);
    }
    
    const id = Utilities.getUuid();
    const now = new Date();
    
    let device = 'Unknown';
    const ua = data.userAgent || '';
    if (ua.includes('Mobile')) device = 'Mobile';
    else if (ua.includes('Tablet')) device = 'Tablet';
    else if (ua.includes('Mac') || ua.includes('Windows') || ua.includes('Linux')) device = 'Desktop';
    
    sheet.appendRow([
      id,
      data.visitorId || '-',
      data.ip || '-',
      data.page || '-',
      (data.userAgent || '-').substring(0, 200),
      now,
      data.isMahasiswa || 'tidak',
      data.referrer || '-',
      device
    ]);
    
    return { success: true, id: id };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function getVisitorStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('visitor_log');
    
    if (!sheet) {
      return { 
        success: true, 
        data: { 
          totalVisitors: 0, 
          todayVisitors: 0, 
          weekVisitors: 0, 
          monthVisitors: 0, 
          pageViews: 0,
          lastUpdate: new Date().toISOString()
        } 
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { 
        success: true, 
        data: { 
          totalVisitors: 0, 
          todayVisitors: 0, 
          weekVisitors: 0, 
          monthVisitors: 0, 
          pageViews: 0,
          lastUpdate: new Date().toISOString()
        } 
      };
    }
    
    const uniqueVisitors = new Set();
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 1; i < data.length; i++) {
      const visitorId = data[i][1];
      const visitTime = data[i][5] instanceof Date ? data[i][5] : new Date(data[i][5]);
      
      if (visitorId && visitorId !== '-') uniqueVisitors.add(visitorId);
      
      if (visitTime >= today) todayCount++;
      if (visitTime >= weekAgo) weekCount++;
      if (visitTime >= monthAgo) monthCount++;
    }
    
    return { 
      success: true, 
      data: { 
        totalVisitors: uniqueVisitors.size,
        todayVisitors: todayCount,
        weekVisitors: weekCount,
        monthVisitors: monthCount,
        pageViews: data.length - 1,
        lastUpdate: new Date().toISOString()
      } 
    };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function getDailyVisits() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('visitor_log');
    
    if (!sheet) return { success: true, data: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    
    const dailyMap = new Map();
    
    for (let i = 1; i < data.length; i++) {
      const visitTime = data[i][5] instanceof Date ? data[i][5] : new Date(data[i][5]);
      const dateKey = visitTime.toISOString().split('T')[0];
      
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    }
    
    const result = [];
    for (const [date, count] of dailyMap) {
      result.push({ date: date, count: count });
    }
    
    result.sort((a, b) => a.date.localeCompare(b.date));
    return { success: true, data: result.slice(-7) };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

function getVisitorLog(limit = 30) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('visitor_log');
    
    if (!sheet) return { success: true, data: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    
    const logs = [];
    for (let i = data.length - 1; i >= 1 && logs.length < limit; i--) {
      logs.push({
        id: data[i][0],
        visitorId: data[i][1],
        page: data[i][3],
        userAgent: data[i][4],
        visitTime: data[i][5] instanceof Date ? data[i][5].toISOString() : data[i][5],
        isMahasiswa: data[i][6],
        device: data[i][8] || 'Unknown'
      });
    }
    
    return { success: true, data: logs };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== UTILITY ====================
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function ensureSheet(name, headers) {
  let sheet = getSheet(name);
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const mime = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };
  return mime[ext] || 'application/octet-stream';
}