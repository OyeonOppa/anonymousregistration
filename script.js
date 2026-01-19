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
    goToStep1();
});

// ================================
// 📄 STEP NAVIGATION FUNCTIONS
// ================================

function goToStep1() {
    currentStep = 1;
    saveCurrentStepData();
    
    // Hide all steps
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('successScreen').style.display = 'none';
    
    updateProgressIndicators();
    restoreFormData();
}

function goToStep2() {
    // Validate step 1
    if (!validateStep1()) return;
    
    saveCurrentStepData();
    
    // Show loading
    showLoadingAlert('กำลังตรวจสอบข้อมูล...');
    
    // Check duplicate
    checkDuplicate(formData.idCard, formData.email).then(isDuplicate => {
        // ถ้าไม่ซ้ำ ปิด loading alert
        if (!isDuplicate) {
            Swal.close();
        }
        
        if (isDuplicate) {
            console.log('Duplicate detected, staying on step 1');
            return; // Stay on step 1
        }
        
        console.log('No duplicate, proceeding to step 2');
        
        // Generate anonymous ID (เก็บไว้หลังบ้านเท่านั้น)
        anonymousId = generateAnonymousId();
        console.log('Generated anonymousId:', anonymousId);
        
        // Go to step 2
        currentStep = 2;
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        document.getElementById('step3').style.display = 'none';
        
        updateProgressIndicators();
        restoreFormData();
        
        // Initialize word counter for Step 2
        setTimeout(() => {
            updateOrgDescCounter();
        }, 100);
    }).catch(error => {
        console.error('Error in goToStep2:', error);
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง',
            confirmButtonColor: '#dc2626'
        });
    });
}

function goToStep3() {
    // Validate step 2
    if (!validateStep2()) return;
    
    saveCurrentStepData();
    
    currentStep = 3;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    
    updateProgressIndicators();
    restoreFormData();
    
    // Initialize counters for Step 3
    setTimeout(() => {
        updateQuestionCounter('whyInterested', 750);
        updateQuestionCounter('workConnection', 1000);
        updateQuestionCounter('relevantExperience', 1000);
    }, 100);
}

function submitForm() {
    // Validate step 3
    if (!validateStep3()) return;
    
    saveCurrentStepData();
    
    // Confirm submission
    Swal.fire({
        title: '⚠️ ยืนยันการส่งข้อมูล',
        text: 'เมื่อกดยืนยันแล้ว จะไม่สามารถแก้ไขข้อมูลได้',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน ส่งข้อมูล',
        cancelButtonText: 'ตรวจสอบอีกครั้ง',
        confirmButtonColor: '#059669',
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

function restoreFormData() {
    if (currentStep === 1) {
        if (document.getElementById('idCard')) {
            document.getElementById('idCard').value = formData.idCard;
        }
        if (document.getElementById('email')) {
            document.getElementById('email').value = formData.email;
        }
    } else if (currentStep === 2) {
        if (document.getElementById('qualification')) {
            document.getElementById('qualification').value = formData.qualification;
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
// 📊 CHARACTER COUNTER (NEW!)
// ================================

function updateOrgDescCounter() {
    const textarea = document.getElementById('organizationDescription');
    const counter = document.getElementById('wordCount');
    
    if (!textarea || !counter) return;
    
    const text = textarea.value.trim();
    // นับตัวอักษร ไม่รวมเว้นวรรค
    const charCount = text.replace(/\s/g, '').length;
    
    counter.textContent = charCount;
    
    // Update counter color
    const counterSpan = counter.parentElement;
    if (charCount > 250) {
        counterSpan.style.color = '#dc2626';
        counterSpan.style.fontWeight = '700';
    } else if (charCount > 0) {
        counterSpan.style.color = '#059669';
        counterSpan.style.fontWeight = '600';
    } else {
        counterSpan.style.color = '#64748b';
        counterSpan.style.fontWeight = '500';
    }
    
    // Show/hide warning
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
    
    // Find counter element based on fieldId
    let counterId;
    if (fieldId === 'whyInterested') counterId = 'counter1';
    else if (fieldId === 'workConnection') counterId = 'counter2';
    else if (fieldId === 'relevantExperience') counterId = 'counter3';
    
    const counter = document.getElementById(counterId);
    if (!counter) return;
    
    counter.textContent = `(${charCount}/${maxChars} ตัวอักษร)`;
    
    // Update color
    if (charCount > maxChars) {
        counter.style.color = '#dc2626';
        counter.style.fontWeight = '700';
    } else if (charCount > 0) {
        counter.style.color = '#059669';
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
    
    const idCard = document.getElementById('idCard').value;
    const email = document.getElementById('email').value;
    
    // Reset errors
    document.getElementById('idCard').classList.remove('is-invalid');
    document.getElementById('email').classList.remove('is-invalid');
    
    // Validate ID Card
    if (!idCard || idCard.length !== 13 || !/^\d{13}$/.test(idCard)) {
        document.getElementById('idCard').classList.add('is-invalid');
        document.querySelector('#idCard + .invalid-feedback').textContent = 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง';
        isValid = false;
    }
    
    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        document.querySelector('#email + .invalid-feedback').textContent = 'กรุณากรอกอีเมลให้ถูกต้อง';
        isValid = false;
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    const fields = [
        'qualification',
        'age',
        'position',
        'organization',
        'organizationDescription'
    ];
    
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
        }
    });
    
    // Validate age range
    const age = document.getElementById('age').value;
    if (age && (parseInt(age) < 18 || parseInt(age) > 99)) {
        document.getElementById('age').classList.add('is-invalid');
        const feedback = document.querySelector('#age + .invalid-feedback');
        if (feedback) {
            feedback.textContent = 'กรุณากรอกอายุระหว่าง 18-99 ปี';
        }
        isValid = false;
    }
    
    // Validate organization description character count
    const orgDesc = document.getElementById('organizationDescription').value.trim();
    const charCount = orgDesc.replace(/\s/g, '').length;
    if (charCount > 250) {
        document.getElementById('organizationDescription').classList.add('is-invalid');
        const feedback = document.querySelector('#organizationDescription + .invalid-feedback');
        if (feedback) {
            feedback.textContent = `เกินจำนวนตัวอักษรที่กำหนด (${charCount}/250 ตัวอักษร)`;
        }
        isValid = false;
    }
    
    return isValid;
}

function validateStep3() {
    let isValid = true;
    
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
        } else {
            // Check character count
            const charCount = text.replace(/\s/g, '').length;
            if (charCount > q.maxChars) {
                field.classList.add('is-invalid');
                const feedback = field.parentElement.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.textContent = `เกินจำนวนตัวอักษรที่กำหนด (${charCount}/${q.maxChars} ตัวอักษร)`;
                }
                isValid = false;
            }
        }
    });
    
    return isValid;
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
        
        console.log('Check duplicate result:', result);
        
        if (result.success && result.isDuplicate) {
            // ปิด loading alert ก่อน
            Swal.close();
            
            // รอสักครู่แล้วแสดง duplicate modal
            setTimeout(() => {
                showDuplicateModal(result.type, result.existingAnonymousId);
            }, 300);
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Error checking duplicate:', error);
        
        // ปิด loading alert
        Swal.close();
        
        const proceed = await Swal.fire({
            title: 'ไม่สามารถตรวจสอบข้อมูลซ้ำได้',
            text: 'สาเหตุอาจเป็นเครือข่ายอินเทอร์เน็ตไม่เสถียร\n\nคุณต้องการดำเนินการต่อหรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ดำเนินการต่อ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#1e3a8a',
            cancelButtonColor: '#64748b'
        });
        
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
        
        console.log('Sending data:', dataToSend); // ✅ Debug
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(dataToSend)
        });
        
        console.log('Response status:', response.status); // ✅ Debug
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Response data:', result); // ✅ Debug
        
        Swal.close();
        
        if (result.success) {
            showSuccessScreen();
        } else {
            throw new Error(result.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        }
        
    } catch (error) {
        console.error('Error details:', error); // ✅ Debug
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
            confirmButtonColor: '#dc2626',
            footer: '<small>หากปัญหายังคงเกิดขึ้น กรุณาติดต่อเจ้าหน้าที่</small>'
        });
    }
}

// ================================
// ✨ SUCCESS SCREEN
// ================================

function showSuccessScreen() {
    // ซ่อน progress bar และ steps
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.display = 'none';
    
    const step1 = document.getElementById('step1');
    if (step1) step1.style.display = 'none';
    
    const step2 = document.getElementById('step2');
    if (step2) step2.style.display = 'none';
    
    const step3 = document.getElementById('step3');
    if (step3) step3.style.display = 'none';
    
    // แสดง success screen
    const successScreen = document.getElementById('successScreen');
    if (successScreen) successScreen.style.display = 'block';
    
    // ✅ ตรวจสอบก่อนเข้าถึง element
    const finalAnonymousIdEl = document.getElementById('finalAnonymousId');
    if (finalAnonymousIdEl) {
        finalAnonymousIdEl.textContent = anonymousId;
    }
    
    const finalEmailEl = document.getElementById('finalEmail');
    if (finalEmailEl) {
        finalEmailEl.textContent = formData.email;
    }
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
    
    // Update progress bar
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
        html: '<div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>',
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
                </div>
            </div>
        `,
        confirmButtonText: 'เข้าใจแล้ว',
        confirmButtonColor: '#1e3a8a'
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