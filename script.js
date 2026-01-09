// ================================
// ⚙️ CONFIGURATION
// ================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw6gwytlan2lTqSDRybXEb5WFpdMWqp-UOeFUxrzxvpQQu-Nc5w49I2me30TT-X_T9n/exec';

// ================================
// 📝 STATE MANAGEMENT
// ================================

let currentStep = 1;
let anonymousId = '';
let formData = {
    idCard: '',
    email: '',
    qualification: '',
    age: '',
    position: '',
    organization: '',
    organizationDescription: '',
    whyInterested: '',
    workConnection: '',
    relevantExperience: ''
};

// ================================
// 🎯 INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', function() {
    renderStep(1);
});

// ================================
// 🎨 RENDER FUNCTIONS
// ================================

function renderStep(step) {
    currentStep = step;
    updateProgressBar();
    
    const formContent = document.getElementById('formContent');
    
    switch(step) {
        case 1:
            formContent.innerHTML = getStep1HTML();
            break;
        case 2:
            formContent.innerHTML = getStep2HTML();
            break;
        case 3:
            formContent.innerHTML = getStep3HTML();
            break;
    }
    
    // Restore form values
    restoreFormValues();
}

function getStep1HTML() {
    return `
        <div class="step-container">
            <div class="step-header">
                <h2>ข้อมูลเพื่อยืนยันตัวตน</h2>
                <p class="text-muted">
                    ข้อมูลนี้จะถูกเข้ารหัสและใช้สำหรับยืนยันเท่านั้น ไม่แสดงต่อคณะกรรมการ
                </p>
            </div>

            <div class="mb-4">
                <label class="form-label required">เลขบัตรประชาชน (13 หลัก)</label>
                <input
                    type="text"
                    class="form-control form-control-lg"
                    id="idCard"
                    placeholder="x-xxxx-xxxxx-xx-x"
                    maxlength="13"
                    value="${formData.idCard}"
                />
                <div class="invalid-feedback" id="idCardError"></div>
                <small class="form-text text-muted">
                    ใช้สำหรับอ้างอิงและยืนยันตัวตนเท่านั้น จะถูกเข้ารหัสก่อนบันทึก
                </small>
            </div>

            <div class="mb-4">
                <label class="form-label required">อีเมล</label>
                <input
                    type="email"
                    class="form-control form-control-lg"
                    id="email"
                    placeholder="example@email.com"
                    value="${formData.email}"
                />
                <div class="invalid-feedback" id="emailError"></div>
                <small class="form-text text-muted">
                    ใช้สำหรับส่งอีเมลยืนยันและติดต่อกลับ
                </small>
            </div>

            <div class="alert alert-info">
                <strong>หมายเหตุ:</strong> ข้อมูลส่วนบุคคลของท่านจะถูกเก็บเป็นความลับ 
                คณะกรรมการจะพิจารณาจากคุณสมบัติและคำตอบเท่านั้น
            </div>

            <div class="button-group mt-4">
                <button class="btn btn-primary btn-lg" onclick="handleNext()">
                    ถัดไป →
                </button>
            </div>
        </div>
    `;
}

function getStep2HTML() {
    const qualifications = [
        'ข้าราชการ',
        'พนักงานรัฐวิสาหกิจ',
        'พนักงานเอกชน',
        'อาจารย์/นักวิชาการ',
        'อื่นๆ'
    ];
    
    return `
        <div class="step-container">
            <div class="step-header">
                <div class="anonymous-id-badge mb-3">
                    รหัสอ้างอิง: <strong>${anonymousId}</strong>
                </div>
                <h2>คุณสมบัติและข้อมูลการทำงาน</h2>
                <p class="text-muted">
                    กรุณากรอกข้อมูลเพื่อให้คณะกรรมการพิจารณาคุณสมบัติ
                </p>
            </div>

            <div class="mb-4">
                <label class="form-label required">คุณสมบัติ</label>
                <select class="form-select form-control-lg" id="qualification">
                    <option value="">-- เลือกคุณสมบัติ --</option>
                    ${qualifications.map(q => 
                        `<option value="${q}" ${formData.qualification === q ? 'selected' : ''}>${q}</option>`
                    ).join('')}
                </select>
                <div class="invalid-feedback" id="qualificationError"></div>
            </div>

            <div class="mb-4">
                <label class="form-label required">อายุ</label>
                <input
                    type="number"
                    class="form-control form-control-lg"
                    id="age"
                    placeholder="เช่น 30"
                    min="18"
                    max="99"
                    value="${formData.age || ''}"
                />
                <div class="invalid-feedback" id="ageError"></div>
            </div>

            <div class="mb-4">
                <label class="form-label required">ตำแหน่ง</label>
                <input
                    type="text"
                    class="form-control form-control-lg"
                    id="position"
                    placeholder="เช่น นักวิเคราะห์นโยบายและแผน"
                    value="${formData.position}"
                />
                <div class="invalid-feedback" id="positionError"></div>
            </div>

            <div class="mb-4">
                <label class="form-label required">หน่วยงาน</label>
                <input
                    type="text"
                    class="form-control form-control-lg"
                    id="organization"
                    placeholder="เช่น กรมส่งเสริมการปกครองท้องถิ่น"
                    value="${formData.organization}"
                />
                <div class="invalid-feedback" id="organizationError"></div>
            </div>

            <div class="mb-4">
                <label class="form-label required">
                    คำอธิบายหน่วยงาน
                    <span class="word-counter ms-2" id="wordCounter">(0/100 คำ)</span>
                </label>
                <textarea
                    class="form-control"
                    id="organizationDescription"
                    rows="4"
                    placeholder="อธิบายถึงภาระหน้าที่และบทบาทของหน่วยงานโดยย่อ"
                    oninput="updateWordCount()"
                >${formData.organizationDescription}</textarea>
                <div class="invalid-feedback" id="organizationDescriptionError"></div>
            </div>

            <div class="button-group mt-4">
                <button class="btn btn-outline-secondary btn-lg" onclick="handlePrevious()">
                    ← ย้อนกลับ
                </button>
                <button class="btn btn-primary btn-lg" onclick="handleNext()">
                    ถัดไป →
                </button>
            </div>
        </div>
    `;
}

function getStep3HTML() {
    return `
        <div class="step-container">
            <div class="step-header">
                <h2>แรงจูงใจและความคาดหวัง</h2>
                <p class="text-muted">
                    ส่วนนี้เป็นส่วนสำคัญที่จะช่วยคณะกรรมการเข้าใจความตั้งใจและศักยภาพของท่าน
                    <br><strong class="text-primary">กรุณาตอบคำถาม 3 ข้อ (รวมไม่เกิน 300-450 คำ)</strong>
                </p>
            </div>

            <div class="mb-4">
                <label class="form-label required">
                    1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร
                </label>
                <textarea
                    class="form-control"
                    id="whyInterested"
                    rows="6"
                    placeholder="อธิบายเหตุผลและแรงจูงใจที่ต้องการเข้าร่วมหลักสูตร (ไม่เกิน 150 คำ)"
                >${formData.whyInterested}</textarea>
                <div class="invalid-feedback" id="whyInterestedError"></div>
            </div>

            <div class="mb-4">
                <label class="form-label required">
                    2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร
                </label>
                <textarea
                    class="form-control"
                    id="workConnection"
                    rows="6"
                    placeholder="อธิบายความสัมพันธ์ระหว่างงานปัจจุบันกับเนื้อหาหลักสูตร (ไม่เกิน 150 คำ)"
                >${formData.workConnection}</textarea>
                <div class="invalid-feedback" id="workConnectionError"></div>
            </div>

            <div class="mb-4">
                <label class="form-label required">
                    3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร
                </label>
                <textarea
                    class="form-control"
                    id="relevantExperience"
                    rows="6"
                    placeholder="อธิบายแผนการนำความรู้ไปใช้ในการทำงานหรือพัฒนาองค์กร (ไม่เกิน 150 คำ)"
                >${formData.relevantExperience}</textarea>
                <div class="invalid-feedback" id="relevantExperienceError"></div>
            </div>

            <div class="alert alert-warning">
                <strong>⚠️ โปรดตรวจสอบข้อมูลอีกครั้ง</strong><br />
                เมื่อกดส่งข้อมูลแล้ว จะไม่สามารถแก้ไขได้
            </div>

            <div class="button-group mt-4">
                <button class="btn btn-outline-secondary btn-lg" onclick="handlePrevious()">
                    ← ย้อนกลับ
                </button>
                <button class="btn btn-success btn-lg" id="submitBtn" onclick="handleSubmit()">
                    ส่งข้อมูล ✓
                </button>
            </div>
        </div>
    `;
}

function showSuccessScreen() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'none';
    
    const formContent = document.getElementById('formContent');
    formContent.innerHTML = `
        <div class="success-container">
            <div class="success-icon">✓</div>
            <h2>ส่งข้อมูลสำเร็จ!</h2>
            <div class="anonymous-id-box">
                <p class="mb-2">รหัสอ้างอิงของท่าน:</p>
                <h3 class="text-primary">${anonymousId}</h3>
                <small class="text-muted">
                    กรุณาเก็บรหัสนี้ไว้สำหรับการติดตามผลการคัดเลือก
                </small>
            </div>
            <p class="mt-4">
                เราได้ส่งอีเมลยืนยันไปที่ <strong>${formData.email}</strong> แล้ว
                <br />
                <small class="text-muted">(กรุณาตรวจสอบใน Inbox และ Junk/Spam)</small>
            </p>
            <div class="d-flex gap-2 justify-content-center mt-4">
                <a href="check-status.html?id=${anonymousId}" class="btn btn-outline-primary">
                    ตรวจสอบสถานะ
                </a>
                <button class="btn btn-primary" onclick="location.reload()">
                    กรอกข้อมูลใหม่
                </button>
            </div>
        </div>
    `;
}

// ================================
// 🔄 HELPER FUNCTIONS
// ================================

function updateProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const percentage = (currentStep / 3) * 100;
    progressFill.style.width = percentage + '%';
    
    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const stepIndicator = document.getElementById(`step${i}Indicator`);
        stepIndicator.classList.remove('active', 'completed');
        
        if (i < currentStep) {
            stepIndicator.classList.add('completed');
            stepIndicator.querySelector('.step-number').textContent = '✓';
        } else if (i === currentStep) {
            stepIndicator.classList.add('active');
            stepIndicator.querySelector('.step-number').textContent = i;
        } else {
            stepIndicator.querySelector('.step-number').textContent = i;
        }
    }
}

function saveFormValues() {
    if (currentStep === 1) {
        formData.idCard = document.getElementById('idCard')?.value || '';
        formData.email = document.getElementById('email')?.value || '';
    } else if (currentStep === 2) {
        formData.qualification = document.getElementById('qualification')?.value || '';
        formData.age = document.getElementById('age')?.value || '';
        formData.position = document.getElementById('position')?.value || '';
        formData.organization = document.getElementById('organization')?.value || '';
        formData.organizationDescription = document.getElementById('organizationDescription')?.value || '';
    } else if (currentStep === 3) {
        formData.whyInterested = document.getElementById('whyInterested')?.value || '';
        formData.workConnection = document.getElementById('workConnection')?.value || '';
        formData.relevantExperience = document.getElementById('relevantExperience')?.value || '';
    }
}

function restoreFormValues() {
    if (currentStep === 2) {
        setTimeout(updateWordCount, 0);
    }
}

function updateWordCount() {
    const textarea = document.getElementById('organizationDescription');
    const counter = document.getElementById('wordCounter');
    
    if (textarea && counter) {
        const text = textarea.value.trim();
        const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;
        counter.textContent = `(${wordCount}/100 คำ)`;
        
        if (wordCount > 100) {
            counter.classList.add('text-danger');
        } else {
            counter.classList.remove('text-danger');
        }
    }
}

function generateAnonymousId() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ANO-${year}-${random}`;
}

// ================================
// 🔍 VALIDATION
// ================================

function validateStep1() {
    let isValid = true;
    
    const idCard = document.getElementById('idCard').value;
    const email = document.getElementById('email').value;
    
    document.getElementById('idCard').classList.remove('is-invalid');
    document.getElementById('email').classList.remove('is-invalid');
    document.getElementById('idCardError').textContent = '';
    document.getElementById('emailError').textContent = '';
    
    if (!idCard || idCard.length !== 13 || !/^\d{13}$/.test(idCard)) {
        document.getElementById('idCard').classList.add('is-invalid');
        document.getElementById('idCardError').textContent = 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง';
        isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        document.getElementById('emailError').textContent = 'กรุณากรอกอีเมลให้ถูกต้อง';
        isValid = false;
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    const fields = ['qualification', 'age', 'position', 'organization', 'organizationDescription'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        const errorElement = document.getElementById(field + 'Error');
        
        element.classList.remove('is-invalid');
        errorElement.textContent = '';
        
        if (!element.value.trim()) {
            element.classList.add('is-invalid');
            errorElement.textContent = 'กรุณากรอกข้อมูลนี้';
            isValid = false;
        }
    });
    
    const age = document.getElementById('age').value;
    if (age && (parseInt(age) < 18 || parseInt(age) > 99)) {
        document.getElementById('age').classList.add('is-invalid');
        document.getElementById('ageError').textContent = 'กรุณากรอกอายุระหว่าง 18-99 ปี';
        isValid = false;
    }
    
    const orgDesc = document.getElementById('organizationDescription').value.trim();
    const wordCount = orgDesc.length === 0 ? 0 : orgDesc.split(/\s+/).length;
    if (wordCount > 100) {
        document.getElementById('organizationDescription').classList.add('is-invalid');
        document.getElementById('organizationDescriptionError').textContent = 'เกินจำนวนคำที่กำหนด';
        isValid = false;
    }
    
    return isValid;
}

function validateStep3() {
    let isValid = true;
    
    const fields = ['whyInterested', 'workConnection', 'relevantExperience'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        const errorElement = document.getElementById(field + 'Error');
        
        element.classList.remove('is-invalid');
        errorElement.textContent = '';
        
        if (!element.value.trim()) {
            element.classList.add('is-invalid');
            errorElement.textContent = 'กรุณากรอกข้อมูลนี้';
            isValid = false;
        }
    });
    
    return isValid;
}

// ================================
// 🔄 NAVIGATION
// ================================

async function handleNext() {
    saveFormValues();
    
    if (currentStep === 1) {
        if (!validateStep1()) return;
        
        showLoadingAlert('กำลังตรวจสอบข้อมูล...');
        
        try {
            const isDuplicate = await checkDuplicate(formData.idCard, formData.email);
            
            Swal.close();
            
            if (isDuplicate) {
                renderStep(1);
                return;
            }
            
            anonymousId = generateAnonymousId();
            
        } catch (error) {
            console.error('Error in handleNext:', error);
            Swal.close();
            showErrorAlert('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล กรุณาลองใหม่อีกครั้ง');
            renderStep(1);
            return;
        }
        
    } else if (currentStep === 2) {
        if (!validateStep2()) return;
    }
    
    renderStep(currentStep + 1);
}

function handlePrevious() {
    saveFormValues();
    renderStep(currentStep - 1);
}

// ================================
// 🔍 CHECK DUPLICATE
// ================================

async function checkDuplicate(idCard, email) {
    try {
        const url = `${GOOGLE_SCRIPT_URL}?action=checkDuplicate&idCard=${idCard}&email=${encodeURIComponent(email)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        const result = await response.json();
        
        if (result.success && result.isDuplicate) {
            setTimeout(() => {
                showDuplicateModal(result.type, result.existingAnonymousId);
            }, 100);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Error checking duplicate:', error);
        
        const proceed = await showConfirmAlert(
            'ไม่สามารถตรวจสอบข้อมูลซ้ำได้',
            'สาเหตุอาจเป็นเครือข่ายอินเทอร์เน็ตไม่เสถียร หรือระบบกำลังอัพเดท\n\nคุณต้องการดำเนินการต่อหรือไม่?'
        );
        
        return !proceed;
    }
}

// ================================
// 📤 SUBMIT
// ================================

async function handleSubmit() {
    saveFormValues();
    
    if (!validateStep3()) return;
    
    const confirmed = await Swal.fire({
        title: '⚠️ ยืนยันการส่งข้อมูล',
        text: 'เมื่อกดยืนยันแล้ว จะไม่สามารถแก้ไขข้อมูลได้',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน ส่งข้อมูล',
        cancelButtonText: 'ตรวจสอบอีกครั้ง',
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b'
    });
    
    if (!confirmed.isConfirmed) return;
    
    showLoadingAlert('กำลังส่งข้อมูล...');
    
    try {
        const dataToSend = {
            ...formData,
            anonymousId: anonymousId,
            timestamp: new Date().toISOString()
        };
        
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        Swal.close();
        
        showSuccessScreen();
        
    } catch (error) {
        console.error('Error:', error);
        Swal.close();
        showErrorAlert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
}

// ================================
// 🍬 SWEETALERT2 FUNCTIONS
// ================================

function showDuplicateModal(type, existingAnonymousId) {
    const title = type === 'idCard' 
        ? 'เลขบัตรประชาชนนี้เคยลงทะเบียนแล้ว' 
        : 'อีเมลนี้เคยลงทะเบียนแล้ว';
    
    Swal.fire({
        icon: 'warning',
        title: title,
        html: `
            <div style="text-align: left;">
                <p>ท่านได้ลงทะเบียนเข้าหลักสูตรนี้ไปแล้ว</p>
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
                            border: 2px solid #dc2626; 
                            border-radius: 12px; 
                            padding: 1.25rem; 
                            text-align: center; 
                            margin: 1.5rem 0;">
                    <small style="color: #64748b;">รหัสอ้างอิงเดิมของท่าน:</small><br>
                    <strong style="font-size: 1.75rem; color: #dc2626; letter-spacing: 2px;">
                        ${existingAnonymousId}
                    </strong>
                </div>
            </div>
        `,
        confirmButtonText: 'เข้าใจแล้ว',
        confirmButtonColor: '#1e3a8a'
    });
}

function showLoadingAlert(message = 'กำลังดำเนินการ...') {
    Swal.fire({
        title: message,
        html: '<div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
}

function showErrorAlert(message) {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message,
        confirmButtonText: 'ลองอีกครั้ง',
        confirmButtonColor: '#dc2626'
    });
}

async function showConfirmAlert(title, message) {
    const result = await Swal.fire({
        title: title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ดำเนินการต่อ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1e3a8a',
        cancelButtonColor: '#64748b'
    });
    return result.isConfirmed;
}