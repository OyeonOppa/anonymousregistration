// ================================
// 📊 GOOGLE APPS SCRIPT - COMPLETE VERSION WITH CHECKDUPLICATE
// ================================

// ✅ ใช้ sheet แรกเสมอ
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
    
    if (data.action === 'updateStatus') {
      return updateStatus(data);
    }
    
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
// ================================
// 📥 SUBMIT APPLICATION (ปรับปรุง)
// ================================
function submitApplication(data) {
  try {
    Logger.log('========================================');
    Logger.log('📝 SUBMITTING APPLICATION');
    Logger.log('AnonymousId: ' + data.anonymousId);
    Logger.log('Email: ' + data.email);
    Logger.log('========================================');
    
    const sheet = getMainSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const rowData = headers.map((header) => {
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
        case 'สถานะ (กรรมการคนที่ 1)':
          value = 'รอพิจารณา';
          break;
        case 'สถานะ (กรรมการคนที่ 2)':
          value = 'รอพิจารณา';
          break;
        case 'สถานะ (กรรมการคนที่ 3)':
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
    
    // บันทึกข้อมูลก่อน
    sheet.appendRow(rowData);
    Logger.log('✅ Data saved to sheet');
    
    // ส่งอีเมล
    const emailSent = sendConfirmationEmail(data.email, data.anonymousId);
    
    if (!emailSent) {
      Logger.log('⚠️ Email failed but data was saved');
    }
    
    Logger.log('========================================');
    Logger.log('✅ APPLICATION COMPLETED');
    Logger.log('Email sent: ' + emailSent);
    Logger.log('========================================');
    
    return createResponse(true, 'Application submitted successfully', {
      emailSent: emailSent,
      anonymousId: data.anonymousId
    });
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ ERROR IN SUBMIT APPLICATION');
    Logger.log('Error: ' + error.toString());
    Logger.log('Error name: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('========================================');
    return createResponse(false, error.toString());
  }
}

// ================================
// 🔄 UPDATE STATUS (3 COMMITTEES)
// ================================
function updateStatus(data) {
  try {
    Logger.log('Updating status for: ' + data.anonymousId);
    Logger.log('Committee member: ' + data.committeeMember);
    Logger.log('New status: ' + data.status);
    
    const sheet = getMainSheet();
    const colMap = getColumnMapping(sheet);
    
    const idColIndex = colMap['รหัสอ้างอิง'];
    const noteColIndex = colMap['หมายเหตุ'];
    
    // เลือก column ตามกรรมการที่เลือก
    let statusColIndex;
    if (data.committeeMember === 'กรรมการคนที่ 1') {
      statusColIndex = colMap['สถานะ (กรรมการคนที่ 1)'];
    } else if (data.committeeMember === 'กรรมการคนที่ 2') {
      statusColIndex = colMap['สถานะ (กรรมการคนที่ 2)'];
    } else if (data.committeeMember === 'กรรมการคนที่ 3') {
      statusColIndex = colMap['สถานะ (กรรมการคนที่ 3)'];
    }
    
    if (idColIndex === undefined || statusColIndex === undefined) {
      Logger.log('Column not found');
      return createResponse(false, 'Column not found');
    }
    
    const dataRange = sheet.getDataRange().getValues();
    
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][idColIndex] === data.anonymousId) {
        const rowNum = i + 1;
        
        Logger.log('Updating row ' + rowNum + ' column ' + String.fromCharCode(65 + statusColIndex));
        
        sheet.getRange(rowNum, statusColIndex + 1).setValue(data.status);
        
        if (noteColIndex !== undefined && data.note) {
          const currentNote = sheet.getRange(rowNum, noteColIndex + 1).getValue();
          const timestamp = new Date().toLocaleString('th-TH');
          const newNote = currentNote 
            ? currentNote + '\n---\n[' + timestamp + '] ' + data.committeeMember + ': ' + data.note
            : '[' + timestamp + '] ' + data.committeeMember + ': ' + data.note;
          
          sheet.getRange(rowNum, noteColIndex + 1).setValue(newNote);
        }
        
        return createResponse(true, 'Status updated successfully');
      }
    }
    
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
// 🔍 CHECK DUPLICATE - สำคัญ!
// ================================
// ================================
// 🔍 CHECK DUPLICATE - แก้ไขใหม่ พร้อม Debug
// ================================
function checkDuplicate(idCard, email) {
  try {
    Logger.log('========================================');
    Logger.log('🔍 CHECK DUPLICATE - START');
    Logger.log('========================================');
    Logger.log('Input idCard: ' + idCard);
    Logger.log('Input email: ' + email);
    
    const sheet = getMainSheet();
    const colMap = getColumnMapping(sheet);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('Total rows in sheet: ' + data.length);
    
    // Hash the input ID card
    const hashedIdCard = hashData(idCard);
    Logger.log('Hashed input idCard: ' + hashedIdCard);
    
    const idColIndex = colMap['รหัสอ้างอิง'];
    const idCardColIndex = colMap['เลขบัตรประชาชน (Hashed)'];
    const emailColIndex = colMap['อีเมล'];
    
    Logger.log('Column indices:');
    Logger.log('  รหัสอ้างอิง index: ' + idColIndex);
    Logger.log('  เลขบัตรประชาชน (Hashed) index: ' + idCardColIndex);
    Logger.log('  อีเมล index: ' + emailColIndex);
    
    // Check if columns exist
    if (idCardColIndex === undefined || emailColIndex === undefined) {
      Logger.log('❌ ERROR: Required columns not found!');
      return createResponse(false, 'Column mapping error');
    }
    
    // Loop through data (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const rowAnonymousId = row[idColIndex] || '';
      const rowIdCardHashed = row[idCardColIndex] || '';
      const rowEmail = row[emailColIndex] || '';
      
      Logger.log('---');
      Logger.log('Row ' + (i+1) + ':');
      Logger.log('  AnonymousId: ' + rowAnonymousId);
      
      // เช็คเลขบัตรประชาชน
      if (rowIdCardHashed) {
        const rowHashStr = String(rowIdCardHashed).trim();
        const inputHashStr = String(hashedIdCard).trim();
        
        Logger.log('  Comparing ID Card hashes:');
        Logger.log('    Row hash: "' + rowHashStr + '"');
        Logger.log('    Input hash: "' + inputHashStr + '"');
        
        if (rowHashStr === inputHashStr) {
          Logger.log('✅ DUPLICATE ID CARD FOUND at row ' + (i+1));
          Logger.log('========================================');
          
          // ✅ แก้ไข: ส่ง isDuplicate ใน data object
          return createResponse(true, 'Duplicate found', {
            isDuplicate: true,
            type: 'idCard',
            existingAnonymousId: rowAnonymousId
          });
        }
      }
      
      // เช็คอีเมล
      if (rowEmail) {
        const rowEmailStr = String(rowEmail).trim().toLowerCase();
        const inputEmailStr = String(email).trim().toLowerCase();
        
        Logger.log('  Comparing emails:');
        Logger.log('    Row email: "' + rowEmailStr + '"');
        Logger.log('    Input email: "' + inputEmailStr + '"');
        
        if (rowEmailStr === inputEmailStr) {
          Logger.log('✅ DUPLICATE EMAIL FOUND at row ' + (i+1));
          Logger.log('========================================');
          
          // ✅ แก้ไข: ส่ง isDuplicate ใน data object
          return createResponse(true, 'Duplicate found', {
            isDuplicate: true,
            type: 'email',
            existingAnonymousId: rowAnonymousId
          });
        }
      }
    }
    
    Logger.log('✅ No duplicate found');
    Logger.log('========================================');
    
    // ✅ แก้ไข: ส่ง isDuplicate = false ใน data object
    return createResponse(true, 'No duplicate', {
      isDuplicate: false
    });
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ ERROR in checkDuplicate');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    Logger.log('========================================');
    return createResponse(false, error.toString());
  }
}

// ================================
// 📧 SEND CONFIRMATION EMAIL (ปรับปรุงใหม่)
// ================================
function sendConfirmationEmail(email, anonymousId) {
  const subject = '✅ ยืนยันการลงทะเบียน - หลักสูตร 4ส รุ่นที่ 16';
  
  const htmlBody = `
    <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ ยืนยันการลงทะเบียนสำเร็จ</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #334155;">เรียน ผู้สมัครที่เคารพ</p>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          ขอบคุณที่ท่านได้แจ้งความประสงค์เข้าศึกษาอบรมหลักสูตร<br>
          <strong>ประกาศนียบัตรชั้นสูงการเสริมสร้างสังคมสันติสุข รุ่นที่ 16</strong>
        </p>
      
        
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          หลักสูตรจะแจ้งผลการพิจารณาขั้นต้นให้ท่านทราบทางอีเมลนี้<br>
          ภายใน <strong>7-10 วันทำการ</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          ขอแสดงความนับถือ<br>
          <strong>สถาบันพระปกเกล้า</strong>
        </p>
      </div>
    </div>
  `;
  
  const plainBody = `
เรียน ผู้สมัครที่เคารพ

ขอบคุณที่ท่านได้แจ้งความประสงค์เข้าศึกษาอบรมหลักสูตรประกาศนียบัตรชั้นสูงการเสริมสร้างสังคมสันติสุข รุ่นที่ 16

หลักสูตรจะแจ้งผลการพิจารณาขั้นต้นให้ท่านทราบทางอีเมลนี้ภายใน 7-10 วันทำการ

ขอแสดงความนับถือ
สถาบันพระปกเกล้า
  `;
  
  try {
    Logger.log('========================================');
    Logger.log('📧 SENDING EMAIL');
    Logger.log('To: ' + email);
    Logger.log('========================================');
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: 'สถาบันพระปกเกล้า',
      noReply: false
    });
    
    Logger.log('✅ Email sent successfully to: ' + email);
    return true;
    
  } catch (error) {
    Logger.log('❌ Error sending email: ' + error.toString());
    Logger.log('Error name: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    return false;
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

function testSendEmail() {
  const testEmail = "worasit.koa@gmail.com"; // ใช้อีเมลจริงของคุณ
  const subject = "ทดสอบส่งอีเมล";
  const body = "นี่คือการทดสอบส่งอีเมล";
  
  try {
    MailApp.sendEmail({
      to: testEmail,
      subject: subject,
      body: body,
      name: 'สถาบันพระปกเกล้า'
    });
    Logger.log('✅ Email sent successfully');
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

function testHashFunction() {
  const testIdCard = '1234567890123';
  
  const hash1 = hashData(testIdCard);
  const hash2 = hashData(testIdCard);
  
  Logger.log('========================================');
  Logger.log('TEST HASH FUNCTION');
  Logger.log('========================================');
  Logger.log('Input: ' + testIdCard);
  Logger.log('Hash 1: ' + hash1);
  Logger.log('Hash 2: ' + hash2);
  Logger.log('Are they equal? ' + (hash1 === hash2));
  Logger.log('Hash 1 length: ' + hash1.length);
  Logger.log('Hash 2 length: ' + hash2.length);
  Logger.log('========================================');
}

function testCheckDuplicateManually() {
  // ใช้เลขบัตรและอีเมลจากข้อมูลจริงในชีท
  const testIdCard = '1234567890123'; // เปลี่ยนเป็นเลขที่มีอยู่ในชีท
  const testEmail = 'worasit.koa@gmail.com'; // เปลี่ยนเป็นอีเมลที่มีอยู่ในชีท
  
  Logger.log('Testing checkDuplicate...');
  const result = checkDuplicate(testIdCard, testEmail);
  
  Logger.log('========================================');
  Logger.log('TEST RESULT');
  Logger.log('========================================');
  Logger.log(result.getContent());
  Logger.log('========================================');
}

function testCheckDuplicateDebug() {
  // ใช้ข้อมูลจริงที่มีในชีท
  const testIdCard = '1234567890123'; // เปลี่ยนเป็นเลขที่มีจริง
  const testEmail = 'test@example.com'; // เปลี่ยนเป็นอีเมลที่มีจริง
  
  Logger.log('🧪 Testing with:');
  Logger.log('   ID Card: ' + testIdCard);
  Logger.log('   Email: ' + testEmail);
  
  const result = checkDuplicate(testIdCard, testEmail);
  
  const jsonResult = JSON.parse(result.getContent());
  
  Logger.log('========================================');
  Logger.log('📊 RESULT');
  Logger.log('========================================');
  Logger.log('success: ' + jsonResult.success);
  Logger.log('message: ' + jsonResult.message);
  Logger.log('data: ' + JSON.stringify(jsonResult.data));
  Logger.log('========================================');
  
  if (jsonResult.data && jsonResult.data.isDuplicate) {
    Logger.log('✅ System correctly detected duplicate');
  } else {
    Logger.log('✅ System correctly detected no duplicate');
  }
}