// ================================
// 📄 PDF GENERATOR V5 - Canvas Method
// ================================
// ใช้ Canvas วาดรูป + ข้อความ → แปลงเป็น PDF
// วิธีนี้รองรับภาษาไทยได้ 100%

async function generateApplicationPDF(formData) {
    try {
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
        // 4. วาดข้อความ
        // ===================================
        
        // คุณสมบัติ (y=665px)
        ctx.font = '34px "Noto Sans Thai", "Sarabun", sans-serif';
        ctx.fillText(formData.qualification || '', 630, 665);
        
        // อายุ
        ctx.fillText((formData.age || '') + ' ปี', 1140, 665);
        
        // ตำแหน่ง (y=745px)
        ctx.font = '32px "Noto Sans Thai", "Sarabun", sans-serif';
        ctx.fillText(formData.position || '', 235, 745);
        
        // หน่วยงาน (y=822px)
        ctx.fillText(formData.organization || '', 235, 822);
        
        // ===================================
        // คำถาม (ใช้ wrapText เพื่อตัดบรรทัด)
        // ===================================
        ctx.font = '30px "Noto Sans Thai", "Sarabun", sans-serif';
        const lineHeight = 40;
        const maxWidth = 1260;
        
        // คำถาม 1 (y=1075px)
        let yPos = 1075;
        const q1Lines = wrapText(ctx, formData.whyInterested || '', maxWidth);
        q1Lines.forEach(line => {
            if (yPos < 1450) {
                ctx.fillText(line, 195, yPos);
                yPos += lineHeight;
            }
        });
        
        // คำถาม 2 (y=1550px)
        yPos = 1550;
        const q2Lines = wrapText(ctx, formData.workConnection || '', maxWidth);
        q2Lines.forEach(line => {
            if (yPos < 1925) {
                ctx.fillText(line, 195, yPos);
                yPos += lineHeight;
            }
        });
        
        // คำถาม 3 (y=2020px)
        yPos = 2020;
        const q3Lines = wrapText(ctx, formData.relevantExperience || '', maxWidth);
        q3Lines.forEach(line => {
            if (yPos < 2320) {
                ctx.fillText(line, 195, yPos);
                yPos += lineHeight;
            }
        });
        
        // รหัสอ้างอิง (footer)
        ctx.font = '24px "Noto Sans Thai", "Sarabun", sans-serif';
        ctx.fillStyle = '#808080';
        ctx.textAlign = 'center';
        ctx.fillText(`รหัสอ้างอิง: ${formData.anonymousId}`, canvas.width / 2, 2280);
        
        // 5. แปลง Canvas เป็น Image
        const imageData = canvas.toDataURL('image/png');
        
        // 6. สร้าง PDF จาก Image
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        pdf.addImage(imageData, 'PNG', 0, 0, 210, 297);
        
        // 7. ดาวน์โหลด
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

// ตัดข้อความให้พอดีกับความกว้าง
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
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
