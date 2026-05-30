// ============================================
// BPM FPIK UBT - GLOBAL FUNCTIONS (PROFIL)
// Version: 1.0.1
// ============================================

// Catatan: File ini mengasumsikan variabel API_URL, CLOUD_NAME, UPLOAD_PRESET 
// sudah dideklarasikan di masing-masing halaman HTML.

// ============= UTILITY =============
function showToast(msg, type = 'success') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1e293b;
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 0.8rem;
            z-index: 9999;
            opacity: 0;
            transition: 0.3s;
        `;
        document.body.appendChild(toast);
    }
    
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b' };
    toast.style.background = colors[type] || colors.success;
    toast.textContent = msg;
    
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============= FOTO PROFIL =============
async function loadFotoProfil() {
    // Gunakan API_URL dari window (sudah dideklarasikan di halaman)
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : window.API_URL;
    const nim = localStorage.getItem('mahasiswaNim');
    const token = localStorage.getItem('mahasiswaToken');
    
    if (!nim && !token) return;
    
    try {
        let url = apiUrl + '?action=getFotoMahasiswa';
        if (nim) url += '&nim=' + nim;
        else if (token) url += '&token=' + token;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.fotoUrl) {
            localStorage.setItem('mahasiswaFotoUrl', result.fotoUrl);
            
            document.querySelectorAll('.profile-avatar, .sidebar-profile-icon').forEach(el => {
                if (el && !el.querySelector('img')) {
                    const overlay = el.querySelector('.avatar-overlay') ? '<div class="avatar-overlay">Ganti</div>' : '';
                    el.innerHTML = `<img src="${result.fotoUrl}" style="width:100%;height:100%;object-fit:cover;">${overlay}`;
                    el.style.background = 'none';
                }
            });
        }
    } catch (error) {
        console.error('Error loading foto:', error);
    }
}

async function uploadFotoProfil() {
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : window.API_URL;
    const cloudName = typeof CLOUD_NAME !== 'undefined' ? CLOUD_NAME : window.CLOUD_NAME;
    const uploadPreset = typeof UPLOAD_PRESET !== 'undefined' ? UPLOAD_PRESET : window.UPLOAD_PRESET;
    
    const nim = localStorage.getItem('mahasiswaNim');
    if (!nim) {
        showToast('NIM tidak ditemukan', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            showToast('Ukuran foto maksimal 2MB', 'error');
            return;
        }
        
        showToast('Mengupload foto...', 'success');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            
            const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });
            
            const cloudinaryResult = await cloudinaryResponse.json();
            
            if (!cloudinaryResult.secure_url) {
                showToast('Upload ke Cloudinary gagal', 'error');
                return;
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'uploadFotoMahasiswa',
                    nim: nim,
                    fotoUrl: cloudinaryResult.secure_url
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('mahasiswaFotoUrl', cloudinaryResult.secure_url);
                
                document.querySelectorAll('.profile-avatar, .sidebar-profile-icon').forEach(el => {
                    const overlay = el.querySelector('.avatar-overlay') ? '<div class="avatar-overlay">Ganti</div>' : '';
                    el.innerHTML = `<img src="${cloudinaryResult.secure_url}" style="width:100%;height:100%;object-fit:cover;">${overlay}`;
                    el.style.background = 'none';
                });
                
                showToast('Foto profil berhasil diupdate!', 'success');
            } else {
                showToast(result.message || 'Gagal update foto', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Gagal upload foto', 'error');
        }
    };
    input.click();
}

// ============= UPDATE PROFIL DI SIDEBAR =============
function updateSidebarProfile() {
    const nama = localStorage.getItem('mahasiswaNama') || 'Mahasiswa FPIK';
    const nim = localStorage.getItem('mahasiswaNim') || '-';
    
    const sidebarName = document.querySelector('.sidebar-profile-info h4');
    const sidebarNim = document.querySelector('.sidebar-profile-info p');
    
    if (sidebarName) sidebarName.innerHTML = nama;
    if (sidebarNim) sidebarNim.innerHTML = `<i class="fas fa-id-card"></i> ${nim}`;
}

// ============= THEME =============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (themeIcon) themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    if (themeText) themeText.textContent = isDark ? 'Mode Gelap' : 'Mode Terang';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeText) themeText.textContent = 'Mode Gelap';
    }
}

// ============= SIDEBAR DRAWER =============
function initSidebarDrawer() {
    const moreBtn = document.getElementById('moreBtn');
    const sidebar = document.getElementById('sidebarDrawer');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('sidebarClose');
    
    if (!moreBtn || !sidebar || !overlay) return;
    
    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    moreBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}

// ============= LOGOUT =============
async function mahasiswaLogout() {
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : window.API_URL;
    const token = localStorage.getItem('mahasiswaToken');
    
    if (token) {
        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'mahasiswaLogout', token: token })
            });
        } catch(e) {}
    }
    
    localStorage.clear();
    window.location.href = '../auth/login.html';
}

// ============= INIT =============
async function initGlobal() {
    loadTheme();
    initSidebarDrawer();
    updateSidebarProfile();
    await loadFotoProfil();
}

// Export ke global (hanya fungsi yang belum ada)
if (typeof window.uploadFotoProfil === 'undefined') window.uploadFotoProfil = uploadFotoProfil;
if (typeof window.toggleTheme === 'undefined') window.toggleTheme = toggleTheme;
if (typeof window.mahasiswaLogout === 'undefined') window.mahasiswaLogout = mahasiswaLogout;
if (typeof window.initGlobal === 'undefined') window.initGlobal = initGlobal;

// Jalankan saat halaman siap (hanya jika initGlobal belum dipanggil)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobal);
} else {
    // Hindari double init
    if (!window._globalInitialized) {
        window._globalInitialized = true;
        initGlobal();
    }
}