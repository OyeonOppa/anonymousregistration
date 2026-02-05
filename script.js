// ================================
// ⚙️ CONFIGURATION
// ================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoj41oX-TXfVBFckhQJMrr0dwJe9pS6E0FklWF2BNny4HDkWEcPANOstHBD6PLglvc/exec';

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
    $('#qualification').select2({
        width: '100%',
        placeholder: '-- เลือกคุณสมบัติ --',
        allowClear: true,
        language: {
            noResults: function() {
                return "ไม่พบข้อมูล";
            }
        }
    });
    
    $('#qualification').on('select2:select', function (e) {
        formData.qualification = e.params.data.id;
        console.log('✅ Select2 selected:', formData.qualification);
    });
    
    $('#qualification').on('select2:clear', function (e) {
        formData.qualification = '';
        console.log('🧹 Select2 cleared');
    });
    
    goToStep1();
});

// ================================
// 📄 STEP NAVIGATION FUNCTIONS
// ================================

function goToStep1() {
    currentStep = 1;
    saveCurrentStepData();
    
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('successScreen').style.display = 'none';
    
    updateProgressIndicators();
    restoreFormData();
}

async function goToStep2() {
    console.log('🚀 goToStep2 called');
    
    // Validate step 1
    if (!validateStep1()) {
        console.log('❌ Validation failed');
        return;
    }
    
    saveCurrentStepData();
    
    // Show loading
    showLoadingAlert('กำลังตรวจสอบข้อมูล...');
    
    try {
        console.log('⏳ Calling checkDuplicate...');
        const isDuplicate = await checkDuplicate(formData.idCard, formData.email);
        
        console.log('📊 Final isDuplicate result:', isDuplicate, typeof isDuplicate);
        
        // ✅ เช็คแบบเข้มงวด
        if (isDuplicate === true) {
            console.log('🛑 BLOCKED: Duplicate found! Staying on Step 1');
            // Modal แสดงอยู่แล้ว
            return false; // หยุดเลย
        }
        
        // ถึงจุดนี้แปลว่าไม่ซ้ำแน่นอน
        console.log('✅ Proceeding to Step 2');
        
        Swal.close();
        
        anonymousId = generateAnonymousId();
        console.log('🎫 Generated anonymousId:', anonymousId);
        
        currentStep = 2;
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        document.getElementById('step3').style.display = 'none';
        
        updateProgressIndicators();
        restoreFormData();
        
        setTimeout(() => {
            updateOrgDescCounter();
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('💥 Error in goToStep2:', error);
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง',
            confirmButtonColor: '#dc2626'
        });
        return false;
    }
}

function goToStep3() {
    if (!validateStep2()) return;
    
    saveCurrentStepData();
    
    currentStep = 3;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    
    updateProgressIndicators();
    restoreFormData();
    
    setTimeout(() => {
        updateQuestionCounter('whyInterested', 750);
        updateQuestionCounter('workConnection', 1000);
        updateQuestionCounter('relevantExperience', 1000);
    }, 100);
}

function submitForm() {
    if (!validateStep3()) return;
    
    saveCurrentStepData();
    
    Swal.fire({
        title: '⚠️ ยืนยันการส่งข้อมูล',
        text: 'เมื่อกดยืนยันแล้ว จะไม่สามารถแก้ไขข้อมูลได้',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน ส่งข้อมูล',
        cancelButtonText: 'ตรวจสอบอีกครั้ง',
        confirmButtonColor: '#047857',
        cancelButtonColor: '#64748b'
    }).then((result) => {
        if (result.isConfirmed) {
            sendDataToGoogleSheets();
        }
    });
}

// ================================
// 💾 SAVE & RESTORE DATA
// ================================

function saveCurrentStepData() {
    if (currentStep === 1) {
        formData.idCard = document.getElementById('idCard')?.value.trim() || '';
        formData.email = document.getElementById('email')?.value.trim() || '';
        
        console.log('📝 Step 1 saved:', {
            idCard: formData.idCard.substring(0, 3) + 'xxxxxxxx' + formData.idCard.substring(11),
            email: formData.email
        });
    } else if (currentStep === 2) {
        formData.qualification = $('#qualification').val() || '';
        formData.age = document.getElementById('age')?.value || '';
        formData.position = document.getElementById('position')?.value.trim() || '';
        formData.organization = document.getElementById('organization')?.value.trim() || '';
        formData.organizationDescription = document.getElementById('organizationDescription')?.value.trim() || '';
        
        console.log('📝 Step 2 saved:', {
            qualification: formData.qualification,
            age: formData.age,
            position: formData.position,
            organization: formData.organization
        });
    } else if (currentStep === 3) {
        formData.whyInterested = document.getElementById('whyInterested')?.value.trim() || '';
        formData.workConnection = document.getElementById('workConnection')?.value.trim() || '';
        formData.relevantExperience = document.getElementById('relevantExperience')?.value.trim() || '';
        
        console.log('📝 Step 3 saved');
    }
}

function restoreFormData() {
    if (currentStep === 1) {
        if (document.getElementById('idCard')) {
            document.getElementById('idCard').value = formData.idCard;
        }
        if (document.getElementById('email')) {
            document.getElementById('email').value = formData.email;
        }
    } else if (currentStep === 2) {
        if ($('#qualification').length) {
            $('#qualification').val(formData.qualification).trigger('change');
        }
        if (document.getElementById('age')) {
            document.getElementById('age').value = formData.age;
        }
        if (document.getElementById('position')) {
            document.getElementById('position').value = formData.position;
        }
        if (document.getElementById('organization')) {
            document.getElementById('organization').value = formData.organization;
        }
        if (document.getElementById('organizationDescription')) {
            document.getElementById('organizationDescription').value = formData.organizationDescription;
        }
    } else if (currentStep === 3) {
        if (document.getElementById('whyInterested')) {
            document.getElementById('whyInterested').value = formData.whyInterested;
        }
        if (document.getElementById('workConnection')) {
            document.getElementById('workConnection').value = formData.workConnection;
        }
        if (document.getElementById('relevantExperience')) {
            document.getElementById('relevantExperience').value = formData.relevantExperience;
        }
    }
}

// ================================
// 📊 CHARACTER COUNTER
// ================================

function updateOrgDescCounter() {
    const textarea = document.getElementById('organizationDescription');
    const counter = document.getElementById('wordCount');
    
    if (!textarea || !counter) return;
    
    const text = textarea.value.trim();
    const charCount = text.replace(/\s/g, '').length;
    
    counter.textContent = charCount;
    
    const counterSpan = counter.parentElement;
    if (charCount > 250) {
        counterSpan.style.color = '#dc2626';
        counterSpan.style.fontWeight = '700';
    } else if (charCount > 0) {
        counterSpan.style.color = '#047857';
        counterSpan.style.fontWeight = '600';
    } else {
        counterSpan.style.color = '#64748b';
        counterSpan.style.fontWeight = '500';
    }
    
    const warning = document.getElementById('wordCountWarning');
    if (warning) {
        warning.style.display = charCount > 250 ? 'block' : 'none';
    }
}

function updateQuestionCounter(fieldId, maxChars) {
    const textarea = document.getElementById(fieldId);
    if (!textarea) return;
    
    const text = textarea.value.trim();
    const charCount = text.replace(/\s/g, '').length;
    
    let counterId;
    if (fieldId === 'whyInterested') counterId = 'counter1';
    else if (fieldId === 'workConnection') counterId = 'counter2';
    else if (fieldId === 'relevantExperience') counterId = 'counter3';
    
    const counter = document.getElementById(counterId);
    if (!counter) return;
    
    counter.textContent = `(${charCount}/${maxChars} ตัวอักษร)`;
    
    if (charCount > maxChars) {
        counter.style.color = '#dc2626';
        counter.style.fontWeight = '700';
    } else if (charCount > 0) {
        counter.style.color = '#047857';
        counter.style.fontWeight = '600';
    } else {
        counter.style.color = '#64748b';
        counter.style.fontWeight = '500';
    }
}

// ================================
// ✅ VALIDATION
// ================================

function validateStep1() {
    let isValid = true;
    
    const idCard = document.getElementById('idCard').value.trim();
    const email = document.getElementById('email').value.trim();
    
    console.log('🔍 Validating Step 1:', { 
        idCard: idCard.substring(0, 3) + 'xxxxxxxx' + idCard.substring(11), 
        email 
    });
    
    document.getElementById('idCard').classList.remove('is-invalid');
    document.getElementById('email').classList.remove('is-invalid');
    
    if (!idCard || idCard.length !== 13 || !/^\d{13}$/.test(idCard)) {
        document.getElementById('idCard').classList.add('is-invalid');
        const feedback = document.querySelector('#idCard').parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง';
        }
        isValid = false;
        console.log('❌ ID Card validation failed');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        const feedback = document.querySelector('#email').parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = 'กรุณากรอกอีเมลให้ถูกต้อง';
        }
        isValid = false;
        console.log('❌ Email validation failed');
    }
    
    console.log(isValid ? '✅ Step 1 validation PASSED' : '❌ Step 1 validation FAILED');
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    console.log('🔍 Validating Step 2...');
    
    const qualification = $('#qualification').val();
    const qualificationSelect = document.getElementById('qualification');
    
    if (!qualification || qualification === '') {
        const select2Container = $(qualificationSelect).next('.select2-container');
        if (select2Container.length) {
            select2Container.addClass('is-invalid');
            select2Container.css('border', '2px solid #dc2626');
        }
        
        const feedback = qualificationSelect.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.textContent = 'กรุณาเลือกคุณสมบัติ';
        }
        isValid = false;
        console.log('❌ Qualification validation failed');
    } else {
        const select2Container = $(qualificationSelect).next('.select2-container');
        if (select2Container.length) {
            select2Container.removeClass('is-invalid');
            select2Container.css('border', '');
        }
        const feedback = qualificationSelect.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
        console.log('✅ Qualification:', qualification);
    }
    
    const fields = ['age', 'position', 'organization', 'organizationDescription'];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.classList.remove('is-invalid');
        
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.textContent = 'กรุณากรอกข้อมูลนี้';
            }
            isValid = false;
            console.log(`❌ ${fieldId} validation failed`);
        }
    });
    
    const age = document.getElementById('age').value;
    if (age && (parseInt(age) < 18 || parseInt(age) > 99)) {
        document.getElementById('age').classList.add('is-invalid');
        const feedback = document.querySelector('#age').parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = 'กรุณากรอกอายุระหว่าง 18-99 ปี';
        }
        isValid = false;
        console.log('❌ Age range validation failed');
    }
    
    const orgDesc = document.getElementById('organizationDescription').value.trim();
    const charCount = orgDesc.replace(/\s/g, '').length;
    if (charCount > 250) {
        document.getElementById('organizationDescription').classList.add('is-invalid');
        const feedback = document.querySelector('#organizationDescription').parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = `เกินจำนวนตัวอักษรที่กำหนด (${charCount}/250 ตัวอักษร)`;
        }
        isValid = false;
        console.log('❌ Org description length validation failed');
    }
    
    console.log(isValid ? '✅ Step 2 validation PASSED' : '❌ Step 2 validation FAILED');
    return isValid;
}

function validateStep3() {
    let isValid = true;
    
    console.log('🔍 Validating Step 3...');
    
    const questions = [
        { id: 'whyInterested', name: 'คำถามที่ 1', maxChars: 750 },
        { id: 'workConnection', name: 'คำถามที่ 2', maxChars: 1000 },
        { id: 'relevantExperience', name: 'คำถามที่ 3', maxChars: 1000 }
    ];
    
    questions.forEach(q => {
        const field = document.getElementById(q.id);
        field.classList.remove('is-invalid');
        
        const text = field.value.trim();
        
        if (!text) {
            field.classList.add('is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.textContent = 'กรุณากรอกข้อมูลนี้';
            }
            isValid = false;
            console.log(`❌ ${q.name} validation failed (empty)`);
        } else {
            const charCount = text.replace(/\s/g, '').length;
            if (charCount > q.maxChars) {
                field.classList.add('is-invalid');
                const feedback = field.parentElement.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.textContent = `เกินจำนวนตัวอักษรที่กำหนด (${charCount}/${q.maxChars} ตัวอักษร)`;
                }
                isValid = false;
                console.log(`❌ ${q.name} validation failed (too long)`);
            } else {
                console.log(`✅ ${q.name}: ${charCount}/${q.maxChars} chars`);
            }
        }
    });
    
    console.log(isValid ? '✅ Step 3 validation PASSED' : '❌ Step 3 validation FAILED');
    return isValid;
}

// ================================
// 🔍 CHECK DUPLICATE - แก้ใหม่ให้แน่ชัด
// ================================

// ✅ แก้ไข: เช็คที่ result.data.isDuplicate
async function checkDuplicate(idCard, email) {
    console.log('🔍 START checkDuplicate');
    console.log('   idCard:', idCard.substring(0, 3) + 'xxx' + idCard.substring(11));
    console.log('   email:', email);
    
    try {
        const url = `${GOOGLE_SCRIPT_URL}?action=checkDuplicate&idCard=${encodeURIComponent(idCard)}&email=${encodeURIComponent(email)}`;
        
        console.log('📡 Fetching:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('📥 Raw result:', JSON.stringify(result, null, 2));
        
        // ✅ แก้ไข: เช็คที่ result.data.isDuplicate
        const isDup = !!(result && result.success && result.data && result.data.isDuplicate === true);
        
        console.log('🔎 Parsed isDuplicate:', isDup);
        
        if (isDup) {
            console.log('⚠️ DUPLICATE DETECTED!');
            console.log('   Type:', result.data.type);
            console.log('   ID:', result.data.existingAnonymousId);
            
            // ปิด loading
            Swal.close();
            
            // แสดง modal
            showDuplicateModal(result.data.type, result.data.existingAnonymousId);
            
            console.log('🛑 Returning TRUE (blocked)');
            return true; // ซ้ำ = บล็อก
        }
        
        console.log('✅ No duplicate, returning FALSE');
        return false; // ไม่ซ้ำ = ผ่าน
        
    } catch (error) {
        console.error('💥 checkDuplicate error:', error);
        
        Swal.close();
        
        const proceed = await Swal.fire({
            title: 'ไม่สามารถตรวจสอบข้อมูลซ้ำได้',
            text: 'คุณต้องการดำเนินการต่อหรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ดำเนินการต่อ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#047857',
            cancelButtonColor: '#64748b'
        });
        
        console.log('❓ User chose:', proceed.isConfirmed ? 'proceed' : 'cancel');
        
        // ถ้ายกเลิก = return true (บล็อก)
        return !proceed.isConfirmed;
    }
}

// ================================
// 📤 SEND TO GOOGLE SHEETS
// ================================

async function sendDataToGoogleSheets() {
    showLoadingAlert('กำลังส่งข้อมูล...');
    
    try {
        const dataToSend = {
            ...formData,
            anonymousId: anonymousId,
            timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending data...');
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(dataToSend)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        Swal.close();
        
        if (result.success) {
            showSuccessScreen();
        } else {
            throw new Error(result.message || 'เกิดข้อผิดพลาด');
        }
        
    } catch (error) {
        console.error('💥 Error sending data:', error);
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            html: `
                <p>ไม่สามารถส่งข้อมูลได้</p>
                <div style="text-align: left; background: #fee; padding: 10px; border-radius: 5px; font-size: 0.85rem; margin-top: 10px;">
                    <strong>รายละเอียด:</strong><br>
                    ${error.message}
                </div>
            `,
            confirmButtonColor: '#dc2626'
        });
    }
}

// ================================
// ✨ SUCCESS SCREEN
// ================================

function showSuccessScreen() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.display = 'none';
    
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('successScreen').style.display = 'block';
    
    const finalEmailEl = document.getElementById('finalEmail');
    if (finalEmailEl) {
        finalEmailEl.textContent = formData.email;
    }
    
    console.log('✅ Success screen displayed');
}

// ================================
// 🎨 UI HELPERS
// ================================

function updateProgressIndicators() {
    const steps = [1, 2, 3];
    
    steps.forEach(step => {
        const indicator = document.getElementById(`step${step}Indicator`);
        
        if (step < currentStep) {
            indicator.classList.remove('active');
            indicator.classList.add('completed');
        } else if (step === currentStep) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    });
    
    const progressFill = document.getElementById('progressFill');
    const percentage = (currentStep / 3) * 100;
    progressFill.style.width = percentage + '%';
}

function generateAnonymousId() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ANO-${year}-${random}`;
}

// ================================
// 🍬 SWEETALERT2 HELPERS
// ================================

function showLoadingAlert(message) {
    Swal.fire({
        title: message,
        html: '<div class="spinner-border" style="width: 3rem; height: 3rem; border: 0.25em solid #047857; border-right-color: transparent; border-radius: 50%; animation: spinner-border 0.75s linear infinite;"></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
}

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
                    <strong style="font-size: 1.25rem; color: #dc2626;">หมายเลขอ้างอิง:</strong><br>
                    <strong style="font-size: 1.5rem; color: #dc2626; letter-spacing: 2px;">${existingAnonymousId || '-'}</strong>
                </div>
                <p style="font-size: 0.9rem; color: #64748b;">หากต้องการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่</p>
            </div>
        `,
        confirmButtonText: 'เข้าใจแล้ว',
        confirmButtonColor: '#047857',
        allowOutsideClick: false
    });
}

// ================================
// 🎯 EXPOSE FUNCTIONS TO HTML
// ================================

window.goToStep1 = goToStep1;
window.goToStep2 = goToStep2;
window.goToStep3 = goToStep3;
window.submitForm = submitForm;
window.updateOrgDescCounter = updateOrgDescCounter;
window.updateQuestionCounter = updateQuestionCounter;