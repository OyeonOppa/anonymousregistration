// ================================
// 🔧 CONFIGURATION
// ================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoj41oX-TXfVBFckhQJMrr0dwJe9pS6E0FklWF2BNny4HDkWEcPANOstHBD6PLglvc/exec';
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
// 📋 RENDER APPLICANTS TABLE (UPDATED)
// ================================
// แทนที่ function renderApplicantsTable() เดิมด้วยอันนี้

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
            <td>${applicant['เบอร์โทรศัพท์'] || '-'}</td>
            <td>
                <div class="status-badges-container">
                    <div class="status-badge-mini">
                        <span class="committee-label">เจ้าหน้าที่</span>
                        <span class="${getStatusBadgeClass(applicant['สถานะ (เจ้าหน้าที่)'])}">${getStatusIcon(applicant['สถานะ (เจ้าหน้าที่)'])}</span>
                    </div>
                    <div class="status-badge-mini">
                        <span class="committee-label">ดร.ชลัท</span>
                        <span class="${getStatusBadgeClass(applicant['สถานะ (ดร.ชลัท)'])}">${getStatusIcon(applicant['สถานะ (ดร.ชลัท)'])}</span>
                    </div>
                    <div class="status-badge-mini">
                        <span class="committee-label">ดร.อภิญญา</span>
                        <span class="${getStatusBadgeClass(applicant['สถานะ (ดร.อภิญญา)'])}">${getStatusIcon(applicant['สถานะ (ดร.อภิญญา)'])}</span>
                    </div>
                </div>
            </td>
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
// 👁️ VIEW APPLICANT DETAIL (UPDATED)
// ================================
// แทนที่ function viewApplicant() เดิมด้วยอันนี้

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
                ${renderDetailRow('เบอร์โทรศัพท์', applicant['เบอร์โทรศัพท์'] || '-')}
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
                <h3><i class="fas fa-users"></i> สถานะการพิจารณาโดยกรรมการ</h3>
                
                <div class="committee-status">
                    <strong>👤 เจ้าหน้าที่:</strong>
                    <span class="${getStatusClass(applicant['สถานะ (เจ้าหน้าที่)'])}">${applicant['สถานะ (เจ้าหน้าที่)'] || 'รอพิจารณา'}</span>
                </div>
                
                <div class="committee-status">
                    <strong>👤 ดร.ชลัท:</strong>
                    <span class="${getStatusClass(applicant['สถานะ (ดร.ชลัท)'])}">${applicant['สถานะ (ดร.ชลัท)'] || 'รอพิจารณา'}</span>
                </div>
                
                <div class="committee-status">
                    <strong>👤 ดร.อภิญญา:</strong>
                    <span class="${getStatusClass(applicant['สถานะ (ดร.อภิญญา)'])}">${applicant['สถานะ (ดร.อภิญญา)'] || 'รอพิจารณา'}</span>
                </div>
                
                <div style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                    <strong>📝 หมายเหตุ:</strong>
                    <p style="margin-top: 0.5rem; white-space: pre-wrap;">${applicant['หมายเหตุ'] || '-'}</p>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-edit"></i> บันทึกการพิจารณา</h3>
                
                <div style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; margin-bottom: 0.5rem; display: block;">คุณคือใคร?</label>
                    <select id="committeeMemberSelect" class="form-control">
                        <option value="">-- เลือกชื่อของคุณ --</option>
                        <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
                        <option value="ดร.ชลัท">ดร.ชลัท</option>
                        <option value="ดร.อภิญญา">ดร.อภิญญา</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; margin-bottom: 0.5rem; display: block;">สถานะการพิจารณาของคุณ:</label>
                    <select id="statusSelect" class="form-control">
                        <option value="รอพิจารณา">รอพิจารณา</option>
                        <option value="อนุมัติ">อนุมัติ</option>
                        <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; margin-bottom: 0.5rem; display: block;">หมายเหตุเพิ่มเติม:</label>
                    <textarea id="noteInput" class="form-control" rows="3" placeholder="เพิ่มหมายเหตุ (ถ้ามี)"></textarea>
                </div>
                
                <button class="btn-primary" onclick="updateApplicantStatus('${anonymousId}')">
                    <i class="fas fa-save"></i> บันทึกการพิจารณา
                </button>
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
// 🔄 UPDATE STATUS - DEBUG VERSION
// ================================
// แทนที่ function updateApplicantStatus() เดิมด้วยอันนี้

async function updateApplicantStatus(anonymousId) {
    const committeeMember = document.getElementById('committeeMemberSelect').value;
    const status = document.getElementById('statusSelect').value;
    const note = document.getElementById('noteInput').value;
    
    console.log('========================================');
    console.log('🔄 UPDATE STATUS - DEBUG');
    console.log('========================================');
    console.log('anonymousId:', anonymousId);
    console.log('committeeMember:', committeeMember);
    console.log('status:', status);
    console.log('note:', note);
    console.log('========================================');
    
    // Validate
    if (!committeeMember) {
        alert('❌ กรุณาเลือกชื่อของคุณก่อน');
        return;
    }
    
    showLoading(true);
    
    try {
        const payload = {
            action: 'updateStatus',
            anonymousId: anonymousId,
            committeeMember: committeeMember,
            status: status,
            note: note
        };
        
        console.log('Sending payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('✅ Request sent successfully');
        console.log('Waiting 3 seconds for Google Sheets to update...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Reloading data...');
        
        alert('✅ บันทึกการพิจารณาสำเร็จ\n\nกรุณารอสักครู่แล้วเช็ค Google Sheets ว่าอัพเดตหรือยัง');
        closeDetailModal();
        loadData();
        
    } catch (error) {
        console.error('❌ Error updating status:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ================================
// 🎨 HELPER: GET STATUS CLASS
// ================================

function getStatusClass(status) {
    if (!status || status === 'รอพิจารณา') return 'status-pending';
    if (status === 'อนุมัติ') return 'status-approved';
    if (status === 'ไม่อนุมัติ') return 'status-rejected';
    return 'status-pending';
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
// 📈 CHARTS - รองรับ custom options
// ================================

function createChart(canvasId, type, data, customOptions = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                        family: "'Noto Sans Thai', sans-serif"
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14,
                    family: "'Noto Sans Thai', sans-serif"
                },
                bodyFont: {
                    size: 13,
                    family: "'Noto Sans Thai', sans-serif"
                },
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed || context.parsed.y || 0;
                        
                        // คำนวณเปอร์เซ็นต์
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        label += ` (${percentage}%)`;
                        
                        return label;
                    }
                }
            }
        }
    };
    
    // Merge custom options with default options
    const options = mergeOptions(defaultOptions, customOptions);
    
    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}

// Helper function to merge options
function mergeOptions(obj1, obj2) {
    const result = { ...obj1 };
    
    for (let key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key]) && obj2[key] !== null) {
                result[key] = mergeOptions(result[key] || {}, obj2[key]);
            } else {
                result[key] = obj2[key];
            }
        }
    }
    
    return result;
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

// ================================
// 📊 ANALYTICS PAGE - ปรับปรุงใหม่
// ================================

// ================================
// 📊 ANALYTICS PAGE - แก้ไขแล้ว
// ================================

function loadAnalytics() {
    // ========================================
    // 📊 กราฟสถานะโดยรวม (Pie Chart)
    // ========================================
    const statusData = {
        'รอพิจารณา': 0,
        'อนุมัติ': 0,
        'ไม่อนุมัติ': 0
    };
    
    // นับจำนวนแต่ละสถานะจากทั้ง 3 กรรมการ
    applicantsData.forEach(a => {
        const status1 = a['สถานะ (เจ้าหน้าที่)'] || 'รอพิจารณา';
        const status2 = a['สถานะ (ดร.ชลัท)'] || 'รอพิจารณา';
        const status3 = a['สถานะ (ดร.อภิญญา)'] || 'รอพิจารณา';
        
        // นับแต่ละสถานะ
        if (statusData[status1] !== undefined) statusData[status1]++;
        if (statusData[status2] !== undefined) statusData[status2]++;
        if (statusData[status3] !== undefined) statusData[status3]++;
    });
    
    createChart('overallChart', 'pie', {
        labels: Object.keys(statusData),
        datasets: [{
            data: Object.values(statusData),
            backgroundColor: [
                '#f59e0b',  // ส้ม - รอพิจารณา
                '#10b981',  // เขียว - อนุมัติ
                '#ef4444'   // แดง - ไม่อนุมัติ
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    }, {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 14
                    }
                }
            },
            title: {
                display: true,
                text: 'สถานะการพิจารณาโดยรวม (รวมทั้ง 3 กรรมการ)',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: 20
            }
        }
    });
    
    // ========================================
    // 📊 สัดส่วนการอนุมัติ (Doughnut Chart)
    // ========================================
    
    // นับจำนวนผู้สมัครที่ได้รับการอนุมัติจากทุกกรรมการ
    let fullyApproved = 0;      // อนุมัติจากทั้ง 3 คน
    let partiallyApproved = 0;  // อนุมัติบางคน
    let pending = 0;            // รอพิจารณาทั้งหมด
    let rejected = 0;           // ไม่อนุมัติทั้งหมด
    
    applicantsData.forEach(a => {
        const status1 = a['สถานะ (เจ้าหน้าที่)'] || 'รอพิจารณา';
        const status2 = a['สถานะ (ดร.ชลัท)'] || 'รอพิจารณา';
        const status3 = a['สถานะ (ดร.อภิญญา)'] || 'รอพิจารณา';
        
        const approvedCount = [status1, status2, status3].filter(s => s === 'อนุมัติ').length;
        const rejectedCount = [status1, status2, status3].filter(s => s === 'ไม่อนุมัติ').length;
        const pendingCount = [status1, status2, status3].filter(s => s === 'รอพิจารณา').length;
        
        if (approvedCount === 3) {
            fullyApproved++;
        } else if (approvedCount > 0) {
            partiallyApproved++;
        } else if (rejectedCount === 3) {
            rejected++;
        } else {
            pending++;
        }
    });
    
    createChart('approvalChart', 'doughnut', {
        labels: [
            'อนุมัติทั้ง 3 กรรมการ',
            'อนุมัติบางส่วน',
            'รอพิจารณา',
            'ไม่อนุมัติทั้งหมด'
        ],
        datasets: [{
            data: [fullyApproved, partiallyApproved, pending, rejected],
            backgroundColor: [
                '#10b981',  // เขียวเข้ม - อนุมัติทั้งหมด
                '#34d399',  // เขียวอ่อน - อนุมัติบางส่วน
                '#f59e0b',  // ส้ม - รอพิจารณา
                '#ef4444'   // แดง - ไม่อนุมัติ
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    }, {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 14
                    }
                }
            },
            title: {
                display: true,
                text: 'สัดส่วนการอนุมัติ',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: 20
            }
        }
    });
    
    // ========================================
    // 📊 อัพเดทตัวเลขสถิติ
    // ========================================
    
    const elements = {
        'fullyApprovedCount': fullyApproved,
        'partiallyApprovedCount': partiallyApproved,
        'pendingCount': pending,
        'rejectedCount': rejected
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ================================
// 🎨 HELPER: GET STATUS BADGE CLASS
// ================================

function getStatusBadgeClass(status) {
    if (!status || status === 'รอพิจารณา') return 'status-badge-mini-pending';
    if (status === 'อนุมัติ') return 'status-badge-mini-approved';
    if (status === 'ไม่อนุมัติ') return 'status-badge-mini-rejected';
    return 'status-badge-mini-pending';
}

// ================================
// 🎨 HELPER: GET STATUS ICON
// ================================

function getStatusIcon(status) {
    if (!status || status === 'รอพิจารณา') return '⏱';
    if (status === 'อนุมัติ') return '✓';
    if (status === 'ไม่อนุมัติ') return '✗';
    return '⏱';
}
