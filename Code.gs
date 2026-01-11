// ================================
// 📊 GOOGLE APPS SCRIPT - BACKEND API
// ================================
// ไฟล์นี้ให้คัดลอกไปวางใน Google Apps Script
// ที่ Extensions > Apps Script ใน Google Sheets

const SHEET_ID = '1tSubGzrBXEUBR4Dd_LbYvuXXxUasxgwCZ61Wf3bTSW8';
const SHEET_NAME = 'แบบฟอร์มแจ้งความประสงค์';

// ================================
// 🔐 CORS Headers
// ================================
function setCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

// ================================
// 📥 GET Request Handler
// ================================
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'getAllApplicants') {
      return getAllApplicants();
    } else if (action === 'getApplicant') {
      return getApplicant(e.parameter.id);
    } else if (action === 'getStats') {
      return getStats();
    } else if (action === 'checkDuplicate') {
      return checkDuplicate(e.parameter.idCard, e.parameter.email);
    } else {
      return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ================================
// 📤 POST Request Handler
// ================================
function doPost(e) {
  const action = e.parameter.action;
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (action === 'updateStatus') {
      return updateStatus(data);
    } else if (action === 'addNote') {
      return addNote(data);
    } else if (action === 'submitApplication') {
      return submitApplication(data);
    } else {
      return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// ================================
// 📋 GET ALL APPLICANTS
// ================================
function getAllApplicants() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const applicants = [];
  
  // Start from row 2 (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const applicant = {};
    
    headers.forEach((header, index) => {
      applicant[header] = row[index];
    });
    
    applicant.rowIndex = i + 1; // Store row number for updates
    applicants.push(applicant);
  }
  
  return createResponse(true, 'Success', applicants);
}

// ================================
// 👤 GET SINGLE APPLICANT
// ================================
function getApplicant(anonymousId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find applicant by anonymous ID
  const idColumnIndex = headers.indexOf('รหัสอ้างอิง');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColumnIndex] === anonymousId) {
      const applicant = {};
      headers.forEach((header, index) => {
        applicant[header] = data[i][index];
      });
      applicant.rowIndex = i + 1;
      return createResponse(true, 'Success', applicant);
    }
  }
  
  return createResponse(false, 'Applicant not found');
}

// ================================
// 📊 GET STATISTICS
// ================================
function getStats() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const statusIndex = headers.indexOf('สถานะ');
  const qualificationIndex = headers.indexOf('คุณสมบัติ');
  const ageIndex = headers.indexOf('อายุ');
  
  const stats = {
    total: data.length - 1, // Exclude header
    pending: 0,
    approved: 0,
    rejected: 0,
    needsDocuments: 0,
    byQualification: {},
    byAgeGroup: {
      '18-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '60+': 0
    },
    recentApplications: []
  };
  
  // Process each row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Count by status
    const status = row[statusIndex] || 'รอพิจารณา';
    if (status === 'รอพิจารณา') stats.pending++;
    else if (status === 'อนุมัติ') stats.approved++;
    else if (status === 'ไม่อนุมัติ') stats.rejected++;
    else if (status === 'ต้องการเอกสารเพิ่มเติม') stats.needsDocuments++;
    
    // Count by qualification
    const qualification = row[qualificationIndex];
    if (qualification) {
      stats.byQualification[qualification] = (stats.byQualification[qualification] || 0) + 1;
    }
    
    // Count by age group
    const age = parseInt(row[ageIndex]);
    if (!isNaN(age)) {
      if (age <= 30) stats.byAgeGroup['18-30']++;
      else if (age <= 40) stats.byAgeGroup['31-40']++;
      else if (age <= 50) stats.byAgeGroup['41-50']++;
      else if (age <= 60) stats.byAgeGroup['51-60']++;
      else stats.byAgeGroup['60+']++;
    }
  }
  
  return createResponse(true, 'Success', stats);
}

// ================================
// 🔄 UPDATE STATUS
// ================================
function updateStatus(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusIndex = headers.indexOf('สถานะ') + 1; // +1 for 1-based indexing
  const noteIndex = headers.indexOf('หมายเหตุ') + 1;
  const updatedIndex = headers.indexOf('วันที่อัปเดตสถานะ') + 1;
  
  // Find row by anonymous ID
  const idColumnIndex = headers.indexOf('รหัสอ้างอิง') + 1;
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][idColumnIndex - 1] === data.anonymousId) {
      const rowNum = i + 1;
      
      // Update status
      if (statusIndex > 0) {
        sheet.getRange(rowNum, statusIndex).setValue(data.status);
      }
      
      // Update note if provided
      if (data.note && noteIndex > 0) {
        sheet.getRange(rowNum, noteIndex).setValue(data.note);
      }
      
      // Update timestamp
      if (updatedIndex > 0) {
        sheet.getRange(rowNum, updatedIndex).setValue(new Date());
      }
      
      return createResponse(true, 'Status updated successfully');
    }
  }
  
  return createResponse(false, 'Applicant not found');
}

// ================================
// 📝 ADD NOTE
// ================================
function addNote(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const noteIndex = headers.indexOf('หมายเหตุ') + 1;
  const idColumnIndex = headers.indexOf('รหัสอ้างอิง') + 1;
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][idColumnIndex - 1] === data.anonymousId) {
      const rowNum = i + 1;
      
      if (noteIndex > 0) {
        const currentNote = sheet.getRange(rowNum, noteIndex).getValue();
        const newNote = currentNote 
          ? currentNote + '\n---\n' + new Date().toLocaleString('th-TH') + ': ' + data.note
          : new Date().toLocaleString('th-TH') + ': ' + data.note;
        
        sheet.getRange(rowNum, noteIndex).setValue(newNote);
      }
      
      return createResponse(true, 'Note added successfully');
    }
  }
  
  return createResponse(false, 'Applicant not found');
}

// ================================
// 📥 SUBMIT APPLICATION
// ================================
function submitApplication(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  // Prepare row data
  const rowData = [
    new Date(), // Timestamp
    data.anonymousId,
    hashData(data.idCard), // Hashed ID Card
    data.email,
    data.qualification,
    data.age,
    data.position,
    data.organization,
    data.organizationDescription,
    data.whyInterested,
    data.workConnection,
    data.relevantExperience,
    'รอพิจารณา', // Default status
    '', // Notes
    new Date() // Last updated
  ];
  
  // Append to sheet
  sheet.appendRow(rowData);
  
  // Send confirmation email
  sendConfirmationEmail(data.email, data.anonymousId);
  
  return createResponse(true, 'Application submitted successfully');
}

// ================================
// 🔍 CHECK DUPLICATE
// ================================
function checkDuplicate(idCard, email) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idCardIndex = headers.indexOf('เลขบัตรประชาชน (Hashed)');
  const emailIndex = headers.indexOf('อีเมล');
  const anonymousIdIndex = headers.indexOf('รหัสอ้างอิง');
  
  const hashedIdCard = hashData(idCard);
  
  // Check for duplicates
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (row[idCardIndex] === hashedIdCard) {
      return createResponse(true, 'Duplicate found', {
        isDuplicate: true,
        type: 'idCard',
        existingAnonymousId: row[anonymousIdIndex]
      });
    }
    
    if (row[emailIndex] === email) {
      return createResponse(true, 'Duplicate found', {
        isDuplicate: true,
        type: 'email',
        existingAnonymousId: row[anonymousIdIndex]
      });
    }
  }
  
  return createResponse(true, 'No duplicate', {
    isDuplicate: false
  });
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
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
  }
}

// ================================
// 🔐 HASH FUNCTION
// ================================
function hashData(data) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    data,
    Utilities.Charset.UTF_8
  );
  
  return rawHash.map(byte => {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
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
