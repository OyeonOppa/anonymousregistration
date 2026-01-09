// ================================
// 📄 PDF GENERATOR FOR APPLICATION FORM
// ================================

function generateApplicationPDF(formData) {
    const { jsPDF } = window.jspdf;
    
    // สร้าง PDF ขนาด A4
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // วาดเนื้อหา
    drawFormContent(pdf, formData);
    
    // ดาวน์โหลด
    const fileName = `แบบฟอร์มสมัคร_${formData.anonymousId}.pdf`;
    pdf.save(fileName);
}

function drawFormContent(pdf, data) {
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const lineHeight = 7;
    
    let currentY = margin;
    
    // Set default font
    pdf.setFont('helvetica');
    
    // หัวข้อหลัก
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const title = 'แบบฟอร์มแจ้งความประสงค์สมัครเข้าศึกษาอบรม';
    pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += lineHeight;
    pdf.setFontSize(14);
    const subtitle = 'หลักสูตรประกาศนียบัตรชั้นสูงการเสริมสร้างสังคมสันติสุข รุ่นที่ 16';
    pdf.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += lineHeight * 2;
    
    // ข้อมูลผู้สมัคร
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const applicantInfo = `สมัครเข้าศึกษาตามคุณสมบัติ ${data.qualification}  อายุ ${data.age || '...'} ปี`;
    pdf.text(applicantInfo, margin, currentY);
    currentY += lineHeight;
    
    const position = `ตำแหน่ง ${data.position}`;
    pdf.text(position, margin, currentY);
    currentY += lineHeight;
    
    const organization = `หน่วยงาน ${data.organization}`;
    pdf.text(organization, margin, currentY);
    currentY += lineHeight * 1.5;
    
    // คำถามและคำตอบ
    pdf.setFont('helvetica', 'normal');
    
    // คำถาม 1
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร', margin, currentY);
    currentY += lineHeight;
    
    pdf.setFont('helvetica', 'normal');
    currentY = drawWrappedText(pdf, data.whyInterested || '', margin, currentY, pageWidth - (margin * 2), lineHeight);
    currentY += lineHeight;
    
    // คำถาม 2
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร', margin, currentY);
    currentY += lineHeight;
    
    pdf.setFont('helvetica', 'normal');
    currentY = drawWrappedText(pdf, data.workConnection || '', margin, currentY, pageWidth - (margin * 2), lineHeight);
    currentY += lineHeight;
    
    // คำถาม 3
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร', margin, currentY);
    currentY += lineHeight;
    
    pdf.setFont('helvetica', 'normal');
    currentY = drawWrappedText(pdf, data.relevantExperience || '', margin, currentY, pageWidth - (margin * 2), lineHeight);
    
    // เพิ่ม footer
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`รหัสอ้างอิง: ${data.anonymousId}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

function drawWrappedText(pdf, text, x, y, maxWidth, lineHeight) {
    const lines = pdf.splitTextToSize(text || '', maxWidth);
    lines.forEach(line => {
        pdf.text(line, x, y);
        y += lineHeight;
    });
    return y;
}

// Export function
window.generateApplicationPDF = generateApplicationPDF;
