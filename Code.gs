// ================================
// 📊 GOOGLE APPS SCRIPT - FINAL VERSION
// ================================

// ✅ ใช้ sheet แรกเสมอ - ไม่ต้องกังวลชื่อ
function getMainSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets()[0];
}

// ================================
// 📥 GET Request Handler
// ================================
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'getAllApplicants') {
      return getAllApplicants();
    } else if (action === 'checkDuplicate') {
      return checkDuplicate(e.parameter.idCard, e.parameter.email);
    } else {
      return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createResponse(false, error.toString());
  }
}

// ================================
// 📤 POST Request Handler
// ================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    Logger.log('========================================');
    Logger.log('📥 POST DATA RECEIVED');
    Logger.log('========================================');
    Logger.log('anonymousId: ' + data.anonymousId);
    Logger.log('action: ' + data.action);
    Logger.log('========================================');
    
    // ตรวจสอบ action
    if (data.action === 'updateStatus') {
      return updateStatus(data);
    }
    
    // ถ้าไม่มี action แสดงว่าเป็นการส่งฟอร์ม
    return submitApplication(data);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(false, error.toString());
  }
}

// ================================
// 🗺️ GET COLUMN MAPPING
// ================================
function getColumnMapping(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const mapping = {};
  
  headers.forEach((header, index) => {
    mapping[header] = index;
  });
  
  return mapping;
}

// ================================
// 📥 SUBMIT APPLICATION
// ================================
function submitApplication(data) {
  try {
    const sheet = getMainSheet();
    
    // อ่าน headers จาก sheet
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // สร้าง row data ตาม headers ที่มีอยู่
    const rowData = headers.map((header, index) => {
      let value = '';
      
      switch(header) {
        case 'Timestamp':
          value = new Date();
          break;
        case 'รหัสอ้างอิง':
          value = data.anonymousId || '';
          break;
        case 'เลขบัตรประชาชน (Hashed)':
          value = hashData(data.idCard || '');
          break;
        case 'อีเมล':
          value = data.email || '';
          break;
        case 'คุณสมบัติ':
          value = data.qualification || '';
          break;
        case 'อายุ':
          value = data.age || '';
          break;
        case 'ตำแหน่ง':
          value = data.position || '';
          break;
        case 'หน่วยงาน':
          value = data.organization || '';
          break;
        case 'คำอธิบายหน่วยงาน':
          value = data.organizationDescription || '';
          break;
        case '1. ทำไมถึงอยากเรียนหลักสูตร 4ส และคาดหวังอะไรต่อหลักสูตร':
          value = data.whyInterested || '';
          break;
        case '2. ลักษณะงาน/งานที่ทำ มีความเชื่อมโยงกับหลักสูตรอย่างไร':
          value = data.workConnection || '';
          break;
        case '3. ท่านจะนำองค์ความรู้จากหลักสูตรไปประยุกต์ใช้อย่างไร':
          value = data.relevantExperience || '';
          break;
        case 'สถานะ':
          value = 'รอพิจารณา';
          break;
        case 'หมายเหตุ':
          value = '';
          break;
        default:
          value = '';
      }
      
      return value;
    });
    
    sheet.appendRow(rowData);
    
    // ส่งอีเมลยืนยัน
    sendConfirmationEmail(data.email, data.anonymousId);
    
    return createResponse(true, 'Application submitted successfully');
    
  } catch (error) {
    Logger.log('Error in submitApplication: ' + error.toString());
    return createResponse(false, error.toString());
  }
}

// ================================
// 🔄 UPDATE STATUS
// ================================
function updateStatus(data) {
  try {
    Logger.log('========================================');
    Logger.log('🔄 UPDATE STATUS');
    Logger.log('========================================');
    Logger.log('Updating status for: ' + data.anonymousId);
    Logger.log('New status: ' + data.status);
    Logger.log('Note: ' + data.note);
    
    const sheet = getMainSheet();
    
    // อ่าน column mapping
    const colMap = getColumnMapping(sheet);
    
    Logger.log('----------------------------------------');
    Logger.log('📊 COLUMN MAPPINGS:');
    Logger.log('  รหัสอ้างอิง: index ' + colMap['รหัสอ้างอิง']);
    Logger.log('  สถานะ: index ' + colMap['สถานะ']);
    Logger.log('  หมายเหตุ: index ' + colMap['หมายเหตุ']);
    Logger.log('----------------------------------------');
    
    // หา column index
    const idColIndex = colMap['รหัสอ้างอิง'];
    const statusColIndex = colMap['สถานะ'];
    const noteColIndex = colMap['หมายเหตุ'];
    
    if (idColIndex === undefined) {
      return createResponse(false, 'Column "รหัสอ้างอิง" not found');
    }
    
    if (statusColIndex === undefined) {
      return createResponse(false, 'Column "สถานะ" not found');
    }
    
    // อ่านข้อมูลทั้งหมด
    const dataRange = sheet.getDataRange().getValues();
    
    // หาแถวที่ตรงกับ anonymousId
    for (let i = 1; i < dataRange.length; i++) {
      const currentId = dataRange[i][idColIndex];
      
      if (currentId === data.anonymousId) {
        const rowNum = i + 1;
        
        Logger.log('✅ MATCH FOUND at row ' + rowNum);
        Logger.log('  Updating cell ' + String.fromCharCode(65 + statusColIndex) + rowNum);
        
        // อัพเดตสถานะ (statusColIndex + 1 เพราะ getRange ใช้ 1-based index)
        sheet.getRange(rowNum, statusColIndex + 1).setValue(data.status);
        Logger.log('✅ Status updated to: ' + data.status);
        
        // อัพเดตหมายเหตุ
        if (noteColIndex !== undefined && data.note) {
          sheet.getRange(rowNum, noteColIndex + 1).setValue(data.note);
          Logger.log('✅ Note updated');
        }
        
        Logger.log('========================================');
        return createResponse(true, 'Status updated successfully');
      }
    }
    
    Logger.log('❌ Anonymous ID not found: ' + data.anonymousId);
    return createResponse(false, 'Applicant not found');
    
  } catch (error) {
    Logger.log('Error in updateStatus: ' + error.toString());
    return createResponse(false, 'Error: ' + error.toString());
  }
}

// ================================
// 📋 GET ALL APPLICANTS
// ================================
function getAllApplicants() {
  try {
    const sheet = getMainSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const applicants = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const applicant = {};
      
      headers.forEach((header, index) => {
        applicant[header] = row[index];
      });
      
      applicant.rowIndex = i + 1;
      applicants.push(applicant);
    }
    
    return createResponse(true, 'Success', applicants);
    
  } catch (error) {
    Logger.log('Error in getAllApplicants: ' + error.toString());
    return createResponse(false, error.toString());
  }
}

// ================================
// 🔍 CHECK DUPLICATE
// ================================
function checkDuplicate(idCard, email) {
  try {
    const sheet = getMainSheet();
    const colMap = getColumnMapping(sheet);
    const data = sheet.getDataRange().getValues();
    const hashedIdCard = hashData(idCard);
    const hashedEmail = hashData(email);
    
    const idColIndex = colMap['รหัสอ้างอิง'];
    const idCardColIndex = colMap['เลขบัตรประชาชน (Hashed)'];
    const emailColIndex = colMap['อีเมล'];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const rowAnonymousId = row[idColIndex];
      const rowIdCardHashed = idCardColIndex !== undefined ? row[idCardColIndex] : null;
      const rowEmail = emailColIndex !== undefined ? row[emailColIndex] : null;
      
      if (rowIdCardHashed && rowIdCardHashed === hashedIdCard) {
        return createResponse(true, 'Duplicate found', {
          isDuplicate: true,
          type: 'idCard',
          existingAnonymousId: rowAnonymousId
        });
      }
      
      if (rowEmail && rowEmail === email) {
        return createResponse(true, 'Duplicate found', {
          isDuplicate: true,
          type: 'email',
          existingAnonymousId: rowAnonymousId
        });
      }
    }
    
    return createResponse(true, 'No duplicate', {
      isDuplicate: false
    });
    
  } catch (error) {
    Logger.log('Error in checkDuplicate: ' + error.toString());
    return createResponse(false, error.toString());
  }
}

// ================================
// 📧 SEND CONFIRMATION EMAIL
// ================================
function sendConfirmationEmail(email, anonymousId) {
  const subject = 'ยืนยันการลงทะเบียน - หลักสูตร 4ส รุ่นที่ 16';
  const body = `
เรียน ผู้สมัครที่เคารพ

ขอขอบคุณที่ท่านได้แจ้งความประสงค์เข้าศึกษาอบรมหลักสูตรประกาศนียบัตรชั้นสูงการเสริมสร้างสังคมสันติสุข รุ่นที่ 16

รหัสอ้างอิงของท่าน: ${anonymousId}

กรุณาเก็บรหัสนี้ไว้สำหรับการติดตามสถานะการสมัคร

หลักสูตรจะแจ้งผลการพิจารณาขั้นต้นให้ท่านทราบทางอีเมลนี้ภายใน 7-10 วันทำการ

ขอแสดงความนับถือ
สถาบันพระปกเกล้า
  `;
  
  try {
    GmailApp.sendEmail(email, subject, body);
    Logger.log('Confirmation email sent to: ' + email);
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
  }
}

// ================================
// 🔐 HASH FUNCTION
// ================================
function hashData(data) {
  try {
    const rawHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      data,
      Utilities.Charset.UTF_8
    );
    
    return rawHash.map(byte => {
      const v = (byte < 0) ? 256 + byte : byte;
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  } catch (error) {
    Logger.log('Error hashing data: ' + error.toString());
    return '';
  }
}

// ================================
// 📤 CREATE RESPONSE
// ================================
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}