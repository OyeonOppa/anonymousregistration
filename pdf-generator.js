// ================================
// 📄 PDF GENERATOR V3 - Image Overlay
// ================================
// Version: 3.0 - ใช้ template image + text overlay
// วิธีนี้จะได้ PDF ที่เหมือน template 100%

async function generateApplicationPDF(formData) {
    try {
        const { jsPDF } = window.jspdf;
        
        // 1. สร้าง PDF A4
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = 210;  // A4 width
        const pageHeight = 297; // A4 height
        
        // 2. โหลดและวางภาพ template
        const templateUrl = 'template-form.png'; // ⚠️ ต้องอัพโหลดไฟล์นี้ขึ้น server
        
        await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function() {
                // วางภาพเต็มหน้า A4
                pdf.addImage(img, 'PNG', 0, 0, pageWidth, pageHeight);
                resolve();
            };
            img.onerror = reject;
            img.src = templateUrl;
        });
        
        // 3. ตั้งค่า font และสี
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        
        // ===================================
        // 4. เติมข้อมูลตามตำแหน่งจริง
        // ===================================
        
        // กล่องสีฟ้า (คุณสมบัติ, อายุ, ตำแหน่ง, หน่วยงาน)
        // Y position: ~85mm from top
        
        // คุณสมบัติ
        pdf.text(formData.qualification || '', 80, 85);
        
        // อายุ (อยู่ขวาของคุณสมบัติ)
        pdf.text((formData.age || '') + ' ปี', 145, 85);
        
        // ตำแหน่ง (บรรทัดที่ 2)
        pdf.text(formData.position || '', 30, 95);
        
        // หน่วยงาน (บรรทัดที่ 3)
        pdf.text(formData.organization || '', 30, 105);
        
        // ===================================
        // คำถาม 1: Y=130mm
        // ===================================
        pdf.setFontSize(10);
        let yPos = 137;
        const lineHeight = 5;
        const maxWidth = 160; // ความกว้างของพื้นที่เขียน
        
        const q1Lines = pdf.splitTextToSize(formData.whyInterested || '', maxWidth);
        q1Lines.forEach(line => {
            if (yPos < 185) { // จำกัดไม่ให้เกินพื้นที่
                pdf.text(line, 25, yPos);
                yPos += lineHeight;
            }
        });
        
        // ===================================
        // คำถาม 2: Y=190mm
        // ===================================
        yPos = 197;
        const q2Lines = pdf.splitTextToSize(formData.workConnection || '', maxWidth);
        q2Lines.forEach(line => {
            if (yPos < 245) {
                pdf.text(line, 25, yPos);
                yPos += lineHeight;
            }
        });
        
        // ===================================
        // คำถาม 3: Y=250mm
        // ===================================
        yPos = 257;
        const q3Lines = pdf.splitTextToSize(formData.relevantExperience || '', maxWidth);
        q3Lines.forEach(line => {
            if (yPos < 295) {
                pdf.text(line, 25, yPos);
                yPos += lineHeight;
            }
        });
        
        // ===================================
        // รหัสอ้างอิง (footer)
        // ===================================
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`รหัสอ้างอิง: ${formData.anonymousId}`, pageWidth / 2, 290, { 
            align: 'center' 
        });
        
        // 5. ดาวน์โหลด PDF
        const fileName = `แบบฟอร์มสมัคร_${formData.anonymousId}.pdf`;
        pdf.save(fileName);
        
        console.log('✅ PDF Generated:', fileName);
        
    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        
        // Fallback: สร้าง PDF แบบไม่มีรูป
        generateFallbackPDF(formData);
    }
}

// ===================================
// FALLBACK: สร้าง PDF โดยไม่ใช้รูป
// ===================================
function generateFallbackPDF(formData) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('แบบฟอร์มแจ้งความประสงค์สมัครเข้าศึกษาอบรม', 105, 20, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.text('หลักสูตร 4ส รุ่นที่ 16', 105, 30, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    let y = 50;
    pdf.text(`คุณสมบัติ: ${formData.qualification}`, 20, y);
    y += 10;
    pdf.text(`อายุ: ${formData.age} ปี`, 20, y);
    y += 10;
    pdf.text(`ตำแหน่ง: ${formData.position}`, 20, y);
    y += 10;
    pdf.text(`หน่วยงาน: ${formData.organization}`, 20, y);
    y += 20;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร', 20, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    const q1 = pdf.splitTextToSize(formData.whyInterested || '', 170);
    pdf.text(q1, 20, y);
    y += q1.length * 5 + 10;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร', 20, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    const q2 = pdf.splitTextToSize(formData.workConnection || '', 170);
    pdf.text(q2, 20, y);
    y += q2.length * 5 + 10;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร', 20, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    const q3 = pdf.splitTextToSize(formData.relevantExperience || '', 170);
    pdf.text(q3, 20, y);
    
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`รหัสอ้างอิง: ${formData.anonymousId}`, 105, 285, { align: 'center' });
    
    pdf.save(`แบบฟอร์มสมัคร_${formData.anonymousId}.pdf`);
}

// Export
window.generateApplicationPDF = generateApplicationPDF;
