// ================================
// 📄 PDF GENERATOR - แบบฟอร์มแจ้งความประสงค์
// ================================

function generateApplicationPDF(formData) {
    const { jsPDF } = window.jspdf;
    
    // สร้าง PDF ขนาด A4
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // ใช้ฟอนต์ Sarabun (รองรับไทย)
    pdf.setFont('helvetica');
    
    drawFormContent(pdf, formData);
    
    // ดาวน์โหลด
    const fileName = `แบบฟอร์มสมัคร_${formData.anonymousId}.pdf`;
    pdf.save(fileName);
}

function drawFormContent(pdf, data) {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 25;
    const lineHeight = 7;
    let y = margin;
    
    // ========================
    // HEADER - หัวข้อหลัก
    // ========================
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    
    const title1 = 'แบบฟอร์มแจ้งความประสงค์สมัครเข้าศึกษาอบรม';
    pdf.text(title1, pageWidth / 2, y, { align: 'center' });
    y += lineHeight;
    
    const title2 = 'หลักสูตรประกาศนียบัตรชั้นสูงการเสริมสร้างสังคมสันติสุข รุ่นที่ 16';
    pdf.text(title2, pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;
    
    // ========================
    // คำแนะนำ (bullet points)
    // ========================
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const instructions = [
        '➢ ผู้แจ้งความประสงค์สมัครเข้าศึกษาอบรมกรอกข้อมูลไม่เกิน 1 หน้ากระดาษเอ 4 (300 - 450 คำ)',
        '➢ ตอบคำถาม 3 ข้อ',
        '➢ หากท่านผ่านการพิจารณาขั้นแรก หลักสูตรฯ จะส่งลิงก์ใบสมัครให้กับท่านทางอีเมลเพื่อเข้าสู่ระบบ',
        '     การสมัครต่อไป'
    ];
    
    instructions.forEach(text => {
        const lines = pdf.splitTextToSize(text, pageWidth - (margin * 2));
        lines.forEach(line => {
            pdf.text(line, margin, y);
            y += lineHeight - 1;
        });
    });
    
    y += lineHeight;
    
    // ========================
    // BOX - ข้อมูลผู้สมัคร
    // ========================
    const boxX = margin;
    const boxY = y;
    const boxWidth = pageWidth - (margin * 2);
    const boxHeight = 22;
    
    // วาดกรอบสีฟ้าอ่อน
    pdf.setFillColor(200, 230, 240);
    pdf.rect(boxX, boxY, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(100, 150, 200);
    pdf.rect(boxX, boxY, boxWidth, boxHeight, 'S');
    
    // เติมข้อมูลในกรอบ
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    
    y = boxY + 7;
    const infoLine1 = `สมัครเข้าศึกษาตามคุณสมบัติ ...................${data.qualification}................... อายุ ...........${data.age}...........ปี (ไม่ระบุชื่อผู้สมัคร)`;
    pdf.text(infoLine1, margin + 3, y);
    
    y += lineHeight;
    const infoLine2 = `ตำแหน่ง........${data.position}........`;
    const positionLines = pdf.splitTextToSize(infoLine2, boxWidth - 6);
    positionLines.forEach(line => {
        pdf.text(line, margin + 3, y);
        y += lineHeight - 1;
    });
    
    const infoLine3 = `หน่วยงาน........${data.organization}........`;
    const orgLines = pdf.splitTextToSize(infoLine3, boxWidth - 6);
    orgLines.forEach(line => {
        pdf.text(line, margin + 3, y);
        y += lineHeight - 1;
    });
    
    y = boxY + boxHeight + lineHeight;
    
    // ========================
    // คำถามและคำตอบ
    // ========================
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    // คำถาม 1
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, y, boxWidth, 7, 'F');
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(margin, y, boxWidth, 7, 'S');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร', margin + 2, y + 5);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const answer1Lines = pdf.splitTextToSize(data.whyInterested || '', boxWidth - 4);
    const answer1Height = answer1Lines.length * 5;
    
    pdf.rect(margin, y, boxWidth, answer1Height + 2, 'S');
    let answerY = y + 5;
    answer1Lines.forEach(line => {
        pdf.text(line, margin + 2, answerY);
        answerY += 5;
    });
    y += answer1Height + 4;
    
    // คำถาม 2
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, y, boxWidth, 7, 'F');
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(margin, y, boxWidth, 7, 'S');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร', margin + 2, y + 5);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    const answer2Lines = pdf.splitTextToSize(data.workConnection || '', boxWidth - 4);
    const answer2Height = answer2Lines.length * 5;
    
    pdf.rect(margin, y, boxWidth, answer2Height + 2, 'S');
    answerY = y + 5;
    answer2Lines.forEach(line => {
        pdf.text(line, margin + 2, answerY);
        answerY += 5;
    });
    y += answer2Height + 4;
    
    // คำถาม 3
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, y, boxWidth, 7, 'F');
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(margin, y, boxWidth, 7, 'S');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร', margin + 2, y + 5);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    const answer3Lines = pdf.splitTextToSize(data.relevantExperience || '', boxWidth - 4);
    const answer3Height = answer3Lines.length * 5;
    
    pdf.rect(margin, y, boxWidth, answer3Height + 2, 'S');
    answerY = y + 5;
    answer3Lines.forEach(line => {
        pdf.text(line, margin + 2, answerY);
        answerY += 5;
    });
    
    // ========================
    // FOOTER
    // ========================
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`รหัสอ้างอิง: ${data.anonymousId} | สร้างโดยระบบอัตโนมัติ`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`วันที่สร้าง: ${new Date().toLocaleDateString('th-TH')}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
}

// Export function
window.generateApplicationPDF = generateApplicationPDF;