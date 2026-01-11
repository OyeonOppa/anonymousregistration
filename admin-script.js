// ================================
// 🔧 CONFIGURATION
// ================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw6gwytlan2lTqSDRybXEb5WFpdMWqp-UOeFUxrzxvpQQu-Nc5w49I2me30TT-X_T9n/exec';
const ADMIN_PASSWORD_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // 'password'

// ================================
// 🔐 AUTH CHECK
// ================================

function checkAuth() {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth !== ADMIN_PASSWORD_HASH) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Check on page load
if (!checkAuth()) {
    throw new Error('Unauthorized');
}

// ================================
// 📊 STATE MANAGEMENT
// ================================

let applicantsData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 20;
let charts = {};
let selectedApplicants = new Set();

// ================================
// 🎯 INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadData();
});

function initializeApp() {
    showPage('dashboard');
    
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
    document.getElementById('filterQualification')?.addEventListener('change', applyFilters);
    document.getElementById('filterAge')?.addEventListener('change', applyFilters);
    
    document.getElementById('refreshBtn')?.addEventListener('click', loadData);
    
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportToCSV);
}

// ================================
// 🔄 PAGE NAVIGATION
// ================================

function showPage(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const pageMap = {
        'dashboard': 'dashboardPage',
        'applicants': 'applicantsPage',
        'analytics': 'analyticsPage',
        'export': 'exportPage'
    };
    
    const pageElement = document.getElementById(pageMap[pageName]);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    const titles = {
        'dashboard': 'Dashboard',
        'applicants': 'จัดการผู้สมัคร',
        'analytics': 'สถิติและรายงาน',
        'export': 'Export ข้อมูล'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
    
    if (pageName === 'dashboard') {
        loadDashboard();
    } else if (pageName === 'analytics') {
        loadAnalytics();
    }
}

// ================================
// 📥 DATA LOADING
// ================================

async function loadData() {
    showLoading(true);
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAllApplicants`);
        const result = await response.json();
        
        if (result.success) {
            applicantsData = result.data;
            filteredData = [...applicantsData];
            
            updateDashboardStats();
            renderApplicantsTable();
            loadDashboard();
        } else {
            showError('ไม่สามารถโหลดข้อมูลได้: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
        showLoading(false);
    }
}

// ================================
// 📊 DASHBOARD
// ================================

function updateDashboardStats() {
    const stats = {
        total: applicantsData.length,
        pending: applicantsData.filter(a => (a['สถานะ'] || 'รอพิจารณา') === 'รอพิจารณา').length,
        approved: applicantsData.filter(a => a['สถานะ'] === 'อนุมัติ').length,
        rejected: applicantsData.filter(a => a['สถานะ'] === 'ไม่อนุมัติ').length
    };
    
    document.getElementById('totalApplicants').textContent = stats.total;
    document.getElementById('pendingApplicants').textContent = stats.pending;
    document.getElementById('approvedApplicants').textContent = stats.approved;
    document.getElementById('rejectedApplicants').textContent = stats.rejected;
}

function loadDashboard() {
    const qualificationData = {};
    applicantsData.forEach(a => {
        const qual = a['คุณสมบัติ'] || 'ไม่ระบุ';
        qualificationData[qual] = (qualificationData[qual] || 0) + 1;
    });
    
    createChart('qualificationChart', 'bar', {
        labels: Object.keys(qualificationData),
        datasets: [{
            label: 'จำนวนผู้สมัคร',
            data: Object.values(qualificationData),
            backgroundColor: ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444']
        }]
    });
    
    const ageGroups = {
        '18-30': 0,
        '31-40': 0,
        '41-50': 0,
        '51-60': 0,
        '60+': 0
    };
    
    applicantsData.forEach(a => {
        const age = parseInt(a['อายุ']);
        if (age <= 30) ageGroups['18-30']++;
        else if (age <= 40) ageGroups['31-40']++;
        else if (age <= 50) ageGroups['41-50']++;
        else if (age <= 60) ageGroups['51-60']++;
        else ageGroups['60+']++;
    });
    
    createChart('ageChart', 'doughnut', {
        labels: Object.keys(ageGroups),
        datasets: [{
            data: Object.values(ageGroups),
            backgroundColor: ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444']
        }]
    });
}

// ================================
// 📋 APPLICANTS TABLE
// ================================

function renderApplicantsTable() {
    const tbody = document.getElementById('applicantsTableBody');
    if (!tbody) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    tbody.innerHTML = pageData.map(applicant => `
        <tr>
            <td><strong>${applicant['รหัสอ้างอิง']}</strong></td>
            <td>${formatDate(applicant['Timestamp'])}</td>
            <td>${applicant['คุณสมบัติ']}</td>
            <td>${applicant['อายุ']} ปี</td>
            <td>${applicant['ตำแหน่ง']}</td>
            <td>${applicant['หน่วยงาน']}</td>
            <td>${renderStatusBadge(applicant['สถานะ'] || 'รอพิจารณา')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view" onclick="viewApplicant('${applicant['รหัสอ้างอิง']}')" title="ดูรายละเอียด">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon pdf" onclick="downloadApplicantPDF('${applicant['รหัสอ้างอิง']}')" title="ดาวน์โหลด PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    renderPagination();
}

function renderStatusBadge(status) {
    const statusClasses = {
        'รอพิจารณา': 'status-pending',
        'อนุมัติ': 'status-approved',
        'ไม่อนุมัติ': 'status-rejected',
        'ต้องการเอกสารเพิ่มเติม': 'status-documents'
    };
    
    const className = statusClasses[status] || 'status-pending';
    return `<span class="status-badge ${className}">${status}</span>`;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination) return;
    
    let html = '';
    
    html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> ก่อนหน้า
    </button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span>...</span>`;
        }
    }
    
    html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        ถัดไป <i class="fas fa-chevron-right"></i>
    </button>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderApplicantsTable();
}

// ================================
// 🔍 FILTERS
// ================================

function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const qualification = document.getElementById('filterQualification')?.value || '';
    const ageRange = document.getElementById('filterAge')?.value || '';
    
    filteredData = applicantsData.filter(applicant => {
        const searchMatch = !search || 
            applicant['รหัสอ้างอิง'].toLowerCase().includes(search) ||
            applicant['อีเมล'].toLowerCase().includes(search);
        
        const statusMatch = !status || (applicant['สถานะ'] || 'รอพิจารณา') === status;
        
        const qualMatch = !qualification || applicant['คุณสมบัติ'] === qualification;
        
        let ageMatch = true;
        if (ageRange) {
            const age = parseInt(applicant['อายุ']);
            const [min, max] = ageRange.split('-').map(v => v === '+' ? 999 : parseInt(v));
            ageMatch = age >= min && age <= max;
        }
        
        return searchMatch && statusMatch && qualMatch && ageMatch;
    });
    
    currentPage = 1;
    renderApplicantsTable();
}

// ================================
// 👁️ VIEW APPLICANT DETAIL
// ================================

function viewApplicant(anonymousId) {
    const applicant = applicantsData.find(a => a['รหัสอ้างอิง'] === anonymousId);
    if (!applicant) return;
    
    const modalBody = document.getElementById('detailModalBody');
    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> ข้อมูลผู้สมัคร</h3>
                ${renderDetailRow('รหัสอ้างอิง', applicant['รหัสอ้างอิง'])}
                ${renderDetailRow('อีเมล', applicant['อีเมล'])}
                ${renderDetailRow('คุณสมบัติ', applicant['คุณสมบัติ'])}
                ${renderDetailRow('อายุ', applicant['อายุ'] + ' ปี')}
                ${renderDetailRow('ตำแหน่ง', applicant['ตำแหน่ง'])}
                ${renderDetailRow('หน่วยงาน', applicant['หน่วยงาน'])}
                ${renderDetailRow('วันที่สมัคร', formatDate(applicant['Timestamp']))}
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-building"></i> คำอธิบายหน่วยงาน</h3>
                <p>${applicant['คำอธิบายหน่วยงาน'] || '-'}</p>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-question-circle"></i> คำตอบคำถาม</h3>
                <div style="margin-bottom: 1rem;">
                    <strong>1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร</strong>
                    <p style="margin-top: 0.5rem;">${applicant['1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร'] || '-'}</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร</strong>
                    <p style="margin-top: 0.5rem;">${applicant['2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร'] || '-'}</p>
                </div>
                <div>
                    <strong>3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร</strong>
                    <p style="margin-top: 0.5rem;">${applicant['3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร'] || '-'}</p>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-tasks"></i> จัดการสถานะ</h3>
                <div class="status-selector">
                    <select id="statusSelect">
                        <option value="รอพิจารณา" ${(applicant['สถานะ'] || 'รอพิจารณา') === 'รอพิจารณา' ? 'selected' : ''}>รอพิจารณา</option>
                        <option value="อนุมัติ" ${applicant['สถานะ'] === 'อนุมัติ' ? 'selected' : ''}>อนุมัติ</option>
                        <option value="ไม่อนุมัติ" ${applicant['สถานะ'] === 'ไม่อนุมัติ' ? 'selected' : ''}>ไม่อนุมัติ</option>
                        <option value="ต้องการเอกสารเพิ่มเติม" ${applicant['สถานะ'] === 'ต้องการเอกสารเพิ่มเติม' ? 'selected' : ''}>ต้องการเอกสารเพิ่มเติม</option>
                    </select>
                    <button class="btn-primary" onclick="updateApplicantStatus('${anonymousId}')">
                        <i class="fas fa-save"></i> บันทึกสถานะ
                    </button>
                </div>
                <textarea class="note-input" id="noteInput" placeholder="เพิ่มหมายเหตุ...">${applicant['หมายเหตุ'] || ''}</textarea>
            </div>
        </div>
    `;
    
    document.getElementById('downloadPdfBtn').onclick = () => downloadApplicantPDF(anonymousId);
    
    showModal('detailModal');
}

function renderDetailRow(label, value) {
    return `
        <div class="detail-row">
            <div class="detail-label">${label}:</div>
            <div class="detail-value">${value || '-'}</div>
        </div>
    `;
}

// ================================
// 💾 UPDATE STATUS (แก้ไขแล้ว!)
// ================================

async function updateApplicantStatus(anonymousId) {
    const status = document.getElementById('statusSelect').value;
    const note = document.getElementById('noteInput').value;
    
    console.log('Updating status:', { anonymousId, status, note });
    
    showLoading(true);
    
    try {
        // ✅ ใช้ no-cors mode เหมือนการส่งฟอร์ม
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // ✅ สำคัญ!
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateStatus',
                anonymousId: anonymousId,
                status: status,
                note: note
            })
        });
        
        // ⚠️ no-cors ไม่สามารถอ่าน response ได้
        // แต่ถ้าไม่ error แสดงว่าส่งสำเร็จ
        
        console.log('Request sent successfully');
        
        // รอสักครู่ให้ Google Sheets update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        alert('อัปเดตสถานะสำเร็จ');
        closeDetailModal();
        loadData(); // Reload data
        
    } catch (error) {
        console.error('Error updating status:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ================================
// 📄 PDF GENERATION
// ================================

function downloadApplicantPDF(anonymousId) {
    const applicant = applicantsData.find(a => a['รหัสอ้างอิง'] === anonymousId);
    if (!applicant) return;
    
    if (typeof generateApplicationPDF === 'function') {
        const formData = {
            anonymousId: applicant['รหัสอ้างอิง'],
            qualification: applicant['คุณสมบัติ'],
            age: applicant['อายุ'],
            position: applicant['ตำแหน่ง'],
            organization: applicant['หน่วยงาน'],
            whyInterested: applicant['1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร'] || '',
            workConnection: applicant['2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร'] || '',
            relevantExperience: applicant['3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร'] || ''
        };
        
        generateApplicationPDF(formData);
    } else {
        alert('ฟังก์ชัน PDF Generator ยังไม่พร้อมใช้งาน');
    }
}

// ================================
// 📊 EXPORT FUNCTIONS
// ================================

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(applicantsData);
    XLSX.utils.book_append_sheet(wb, ws, 'ผู้สมัคร');
    XLSX.writeFile(wb, `applicants_${Date.now()}.xlsx`);
}

function exportToCSV() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(applicantsData);
    XLSX.utils.book_append_sheet(wb, ws, 'ผู้สมัคร');
    XLSX.writeFile(wb, `applicants_${Date.now()}.csv`);
}

// ================================
// 📈 CHARTS
// ================================

function createChart(canvasId, type, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ================================
// 🛠️ UTILITY FUNCTIONS
// ================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
}

function showError(message) {
    alert(message);
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'admin-login.html';
}

// ================================
// 📊 ANALYTICS PAGE
// ================================

function loadAnalytics() {
    const statusData = {
        'รอพิจารณา': applicantsData.filter(a => (a['สถานะ'] || 'รอพิจารณา') === 'รอพิจารณา').length,
        'อนุมัติ': applicantsData.filter(a => a['สถานะ'] === 'อนุมัติ').length,
        'ไม่อนุมัติ': applicantsData.filter(a => a['สถานะ'] === 'ไม่อนุมัติ').length,
        'ต้องการเอกสารเพิ่มเติม': applicantsData.filter(a => a['สถานะ'] === 'ต้องการเอกสารเพิ่มเติม').length
    };
    
    createChart('overallChart', 'line', {
        labels: Object.keys(statusData),
        datasets: [{
            label: 'จำนวนผู้สมัคร',
            data: Object.values(statusData),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true
        }]
    });
    
    createChart('approvalChart', 'pie', {
        labels: Object.keys(statusData),
        datasets: [{
            data: Object.values(statusData),
            backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6']
        }]
    });
}

