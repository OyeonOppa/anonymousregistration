// ================================
// 📄 PDF GENERATOR V6 - Thai Text Fix
// ================================
// แก้ไขการวางตำแหน่งและตัดบรรทัดภาษาไทยให้ถูกต้อง

async function generateApplicationPDF(formData) {
    try {
        console.log('=== PDF Generator Debug ===');
        console.log('Full formData:', formData);
        console.log('whyInterested:', formData.whyInterested, 'Type:', typeof formData.whyInterested);
        console.log('workConnection:', formData.workConnection, 'Type:', typeof formData.workConnection);
        console.log('relevantExperience:', formData.relevantExperience, 'Type:', typeof formData.relevantExperience);
        
        // 1. สร้าง Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // ตั้งขนาด A4 (595 x 842 points = 1654 x 2339 px at 200 DPI)
        canvas.width = 1654;
        canvas.height = 2339;
        
        // 2. โหลดและวาดภาพ template
        const templateUrl = 'template-form.png';
        const img = await loadImage(templateUrl);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 3. ตั้งค่า font ภาษาไทย
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'top';
        
        // ===================================
        // 4. วาดข้อความ - ส่วนบน
        // ===================================
        
        // คุณสมบัติ
        ctx.font = '28px "Noto Sans Thai", "Sarabun", sans-serif';
        ctx.fillText(formData.qualification || '', 560, 185);
        
        // อายุ
        ctx.fillText((formData.age || '') , 1140, 185);
        
        // ตำแหน่ง
        ctx.font = '28px "Noto Sans Thai", "Sarabun", sans-serif';
        ctx.fillText(formData.position || '', 350, 235);
        
        // หน่วยงาน
        ctx.fillText(formData.organization || '', 350, 285);
        
        // ===================================
        // 5. คำถาม 3 ข้อ (ตัดบรรทัดภาษาไทย)
        // ===================================
        ctx.font = '28px "Noto Sans Thai", "Sarabun", sans-serif';
        const lineHeight = 56; // ระยะห่างระหว่างบรรทัด
        const maxWidth = 1500; // เพิ่มความกว้างให้พอดีกรอบ
        const leftMargin = 70; // ระยะห่างจากซ้าย
        
        // คำถาม 1: y เริ่มต้น 920
        let yPos = 490;
        const maxY1 = 1100; // ความสูงสุดของกรอบคำถาม 1
        const q1Lines = wrapTextThai(ctx, formData.whyInterested || '', maxWidth);
        q1Lines.forEach(line => {
            if (yPos < maxY1) {
                ctx.fillText(line, leftMargin, yPos);
                yPos += lineHeight;
            }
        });
        
        // คำถาม 2: y เริ่มต้น 1270
        yPos = 1010;
        const maxY2 = 1800; // ความสูงสุดของกรอบคำถาม 2
        const q2Lines = wrapTextThai(ctx, formData.workConnection || '', maxWidth);
        q2Lines.forEach(line => {
            if (yPos < maxY2) {
                ctx.fillText(line, leftMargin, yPos);
                yPos += lineHeight;
            }
        });
        
        // คำถาม 3: y เริ่มต้น 1620
        yPos = 1710;
        const maxY3 = 2500; // ความสูงสุดของกรอบคำถาม 3
        const q3Lines = wrapTextThai(ctx, formData.relevantExperience || '', maxWidth);
        q3Lines.forEach(line => {
            if (yPos < maxY3) {
                ctx.fillText(line, leftMargin, yPos);
                yPos += lineHeight;
            }
        });
        
        // รหัสอ้างอิง (footer)
        ctx.font = '24px "Noto Sans Thai", "Sarabun", sans-serif';
        ctx.fillStyle = '#808080';
        ctx.textAlign = 'center';
        ctx.fillText(`รหัสอ้างอิง: ${formData.anonymousId}`, canvas.width / 2, 2280);
        
        // 6. แปลง Canvas เป็น Image
        const imageData = canvas.toDataURL('image/png');
        
        // 7. สร้าง PDF จาก Image
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        pdf.addImage(imageData, 'PNG', 0, 0, 210, 297);
        
        // 8. ดาวน์โหลด
        const fileName = `แบบฟอร์มสมัคร_${formData.anonymousId}.pdf`;
        pdf.save(fileName);
        
        console.log('✅ PDF Generated:', fileName);
        
    } catch (error) {
        console.error('❌ PDF Error:', error);
        alert('ไม่สามารถสร้าง PDF ได้: ' + error.message);
    }
}

// ===================================
// HELPERS
// ===================================

// โหลดรูปภาพ
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// ตัดข้อความภาษาไทย (ตัดทีละตัวอักษร ไม่ใช่ทีละคำ)
function wrapTextThai(ctx, text, maxWidth) {
    const lines = [];
    
    // เช็คว่า text เป็น string หรือไม่
    if (!text || typeof text !== 'string') {
        return lines; // return empty array
    }
    
    let currentLine = '';
    
    // แยกเป็นตัวอักษร
    const chars = text.split('');
    
    chars.forEach(char => {
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines;
}

// Export
window.generateApplicationPDF = generateApplicationPDF;