// ============================================
// VISITOR TRACKER - BPM FPIK UBT
// Untuk mencatat kunjungan ke website
// ============================================

const TRACKER_API_URL = 'https://bpm-proxy.bpmdatabase5.workers.dev/';

/**
 * Generate unique visitor ID
 */
function generateVisitorId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Format page path agar rapi
 */
function formatPagePath(path) {
    if (!path || path === '/' || path === '/index.html') return 'Beranda';
    if (path.includes('about')) return 'Tentang';
    if (path.includes('dashboard')) return 'Dashboard Mahasiswa';
    if (path.includes('qr-code')) return 'QR Code';
    if (path.includes('login')) return 'Login Mahasiswa';
    if (path.includes('register')) return 'Register Mahasiswa';
    if (path.includes('rate')) return 'Penilaian Dosen';
    if (path.includes('voice')) return 'Aspirasi';
    if (path.includes('docs')) return 'Berkas';
    if (path.includes('author')) return 'Pengembang';
    if (path.includes('history')) return 'Sejarah';
    if (path.includes('org')) return 'Administrasi';
    return path.split('/').pop() || 'Halaman';
}

/**
 * Record page visit
 */
async function recordPageVisit() {
    // Ambil atau buat visitor ID
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = generateVisitorId();
        localStorage.setItem('visitorId', visitorId);
    }
    
    // Cek apakah user adalah mahasiswa yang login
    const isMahasiswa = localStorage.getItem('mahasiswaToken') ? 'ya' : 'tidak';
    
    // Data kunjungan
    const page = window.location.pathname;
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || '-';
    
    try {
        await fetch(TRACKER_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'recordVisitor',
                visitorId: visitorId,
                page: formatPagePath(page),
                userAgent: userAgent,
                isMahasiswa: isMahasiswa,
                referrer: referrer
            })
        });
        
        console.log('[Visitor] Page recorded:', formatPagePath(page));
    } catch(e) {
        console.error('[Visitor] Error:', e);
    }
}

// Jalankan tracker saat halaman dimuat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', recordPageVisit);
} else {
    recordPageVisit();
}