// ========== CONFIG ==========
const SPREADSHEET_ID = "14r7hLL_WQp33kjs6V9RcroLjbNXSdOT35HXbpSF3i0c";
const SHEET_DATA = "Base Huay1";
const TELEGRAM_TOKEN = "";
const GROUP_ID = "";

// ຟັງຊັນດຶງຂໍ້ມູນຕຳລາຝັນຈາກ Google Sheet
function getTamraHuayData() {
  const sheetId = "14r7hLL_WQp33kjs6V9RcroLjbNXSdOT35HXbpSF3i0c";
  const sheetName = "ຕຳລາຝັນ";
  
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, message: "ບໍ່ພົບ Sheet ທີ່ຊື່ 'ຕຳລາຝັນ'" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const tamraList = rows.map(row => {
      return {
        id: row[0],
        name: row[1] ? row[1].toString().trim() : "",
        num1: row[2] !== "" ? String(row[2]).padStart(2, '0') : "",
        num2: row[3] !== "" ? String(row[3]).padStart(2, '0') : "",
        num3: row[4] !== "" ? String(row[4]).padStart(2, '0') : ""
      };
    }).filter(item => item.name !== "");
    
    return { success: true, data: tamraList };
  } catch (error) {
    Logger.log("Error fetching Tamra data: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ฟังก์ชันสำหรับตรวจเช็คการล็อกอินโดยดึงข้อมูลแบบ Real-time จาก Google Sheets
function checkLogin(username, inputPin) {
  const sheetId = "14r7hLL_WQp33kjs6V9RcroLjbNXSdOT35HXbpSF3i0c";
  const sheetName = "USER";
  
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, message: "⚠️ ไม่พบหน้าต่าง Sheet ที่ชื่อ 'USER' ในระบบ" };
    }
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowUser = data[i][0] ? data[i][0].toString().trim() : "";
      const rowName = data[i][1] ? data[i][1].toString().trim() : "";
      const rowPin  = data[i][2] ? data[i][2].toString().trim() : "";
      
      if (rowUser.toLowerCase() === username.toLowerCase()) {
        if (rowPin === inputPin.toString().trim()) {
          return {
            success: true,
            username: rowUser,
            name: rowName
          };
        } else {
          return { success: false, message: "❌ รหัส PIN ของคุณไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
        }
      }
    }
    
    return { success: false, message: "⚠️ ไม่พบบัญชีผู้ใช้งานนี้ในฐานข้อมูลระบบ" };
  } catch (error) {
    Logger.log("Login Error: " + error.toString());
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: " + error.toString() };
  }
}

// ฟังก์ชันดึงรายชื่อ Username ทั้งหมดไปทำเมนู Dropdown ตอนเริ่มเปิดหน้าเว็บ
function getAllUsernames() {
  const sheetId = "14r7hLL_WQp33kjs6V9RcroLjbNXSdOT35HXbpSF3i0c";
  const sheetName = "USER";
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return ["admin"];
    const data = sheet.getDataRange().getValues();
    const usernames = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        usernames.push({
          username: data[i][0].toString().trim(),
          name: data[i][1] ? data[i][1].toString().trim() : data[i][0].toString().trim()
        });
      }
    }
    return usernames;
  } catch (e) {
    return [{ username: "admin", name: "แอดมินหลัก" }];
  }
}

/**
 * ฟังก์ชันดึงสถิติและล็อกข้อความเวลาจากคอลัมน์ A ส่งไปให้หน้าบ้านแสดงผลนิ่ง ๆ
 */
function getSalesStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_DATA);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, today: 0, week: 0, month: 0, history: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const todayStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy"); 
    
    let totalToday = 0;
    let totalWeek = 0;
    let totalMonth = 0;
    let history = [];

    const oneDay = 24 * 60 * 60 * 1000;
    const currentTimestamp = now.getTime();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || row[0] === "") continue;

      let rowDate;
      const dateParts = String(row[0]).split(" ")[0].split("/");
      if (dateParts.length === 3) {
        rowDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
      } else {
        rowDate = new Date(row[0]);
      }
      
      if (isNaN(rowDate.getTime())) continue;
      const rowDateStr = Utilities.formatDate(rowDate, "GMT+7", "dd/MM/yyyy");
      const rowAmt = parseFloat(row[5]) || 0;
      const diffDays = Math.floor(Math.abs(currentTimestamp - rowDate.getTime()) / oneDay);
      
      if (rowDateStr === todayStr) {
        totalToday += rowAmt;
      }
      if (diffDays <= 7) {
        totalWeek += rowAmt;
      }
      if (rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear()) {
        totalMonth += rowAmt;
      }

      // ล็อกเวลาคอลัมน์ A ให้แปลงเป็นตัวหนังสือสากลนิ่งๆ จากเซิร์ฟเวอร์โดยตรง
      let formattedTimeStr = "";
      try {
        if (row[0] instanceof Date) {
          formattedTimeStr = Utilities.formatDate(row[0], "GMT+7", "EEE MMM dd yyyy 'เวลา:' HH:mm");
        } else {
          let checkDate = new Date(row[0]);
          if (!isNaN(checkDate.getTime())) {
            formattedTimeStr = Utilities.formatDate(checkDate, "GMT+7", "EEE MMM dd yyyy 'เวลา:' HH:mm");
          } else {
            formattedTimeStr = String(row[0]);
          }
        }
      } catch(err) {
        formattedTimeStr = String(row[0]);
      }

      history.push({
        time: formattedTimeStr, 
        customer: row[1] || "ทั่วไป",
        num: row[3] || "-",
        type: row[2] || "-",
        amt: rowAmt,
        seller: row[8] || "แอดมิน" 
      });
    }

    history.reverse();

    return {
      success: true,
      today: totalToday,
      week: totalWeek,
      month: totalMonth,
      history: history
    };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * ฟังก์ชันรับข้อมูลบิลจากหน้าเว็บและบันทึกลงชีต
 */
function saveOrderFromWeb(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    if (!data) throw new Error("ไม่ได้รับข้อมูล");
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("ไม่พบรายการสั่งซื้อ");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_DATA);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_DATA);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["วันที่", "ลูกค้า", "ประเภท", "เลข", "ตำแหน่ง/ชุด", "จำนวนเงิน", "การชำระ", "นามสัตว์", "ผู้บันทึก"]);
    }

    const now = new Date();
    const timestamp = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");
    const rows = [];
    let orderTable = "";
    let totalAll = 0;
    
    let sellerName = "แอดมินระบบ";
    if (data.user) {
      try {
        const uSheet = ss.getSheetByName("USER");
        if (uSheet) {
          const uData = uSheet.getDataRange().getValues();
          for (let k = 1; k < uData.length; k++) {
            if (uData[k][0] && uData[k][0].toString().trim().toLowerCase() === data.user.toString().trim().toLowerCase()) {
              sellerName = uData[k][1] ? uData[k][1].toString().trim() : uData[k][0].toString().trim();
              break;
            }
          }
        }
      } catch(e) {
        sellerName = data.user;
      }
    }

    data.items.forEach(item => {
      totalAll += item.amt;
      const typeIcon = (item.type === "ไทย") ? "🇹🇭" : "🇱🇦";
      
      orderTable += `${String(item.num).padEnd(4, " ")} | ${typeIcon} | ${String(item.qty || "1").padEnd(3, " ")} | ${item.amt.toLocaleString()} ₭\n`;
      
      rows.push([
        now, 
        data.customer || "ทั่วไป",
        item.type,
        "'" + item.num,  
        item.qty || "1",
        item.amt,
        data.payment || "เงินสด",
        "", 
        sellerName
      ]);
    });

    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }

    sendToTelegramWithSeller(data.customer || "ทั่วไป", orderTable, totalAll, data.payment || "เงินสด", timestamp, sellerName);
    return JSON.stringify({ status: "success", message: "บันทึกเรียบร้อย" });

  } catch (err) {
    return JSON.stringify({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function sendToTelegramWithSeller(cust, table, total, pay, time, sellerName) {
  try {
    let msg = `🔔 <b>รายการสั่งซื้อใหม่</b>\n`;
    msg += `👤 <b>ลูกค้าชื่อ:</b> ${escapeHtml(cust)}\n`;
    msg += `👤 <b>ผู้บันทึก:</b> ${escapeHtml(sellerName)}\n`;
    msg += `<code>──────────\n`;
    msg += `เลข  │ หวย │ ชุด  │ จำนวน\n`;
    msg += `──────────\n`;
    msg += `${table}`;
    msg += `──────────</code>\n`;
    msg += `💰 <b>รวมเงิน:</b> <code>${total.toLocaleString()} ₭</code>\n`;
    msg += `💳 <b>ชำระ:</b> ${pay}\n`;
    msg += `⏰ <b>เวลา:</b> ${time}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: GROUP_ID,
        text: msg,
        parse_mode: "HTML"
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error("Telegram Error: " + e.toString());
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * ฟังก์ชันตรวจเช็คผู้ชนะหวยในวันที่กำหนด
 */
function checkWinners(winningNum, targetDate) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_DATA);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, winners: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const winners = [];
    const customerBills = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || row[0] === "") continue;

      // ตรวจเช็คว่าวันที่ตรงกับวันที่ค้นหาหรือไม่
      let rowDate;
      const dateParts = String(row[0]).split(" ")[0].split("/");
      if (dateParts.length === 3) {
        rowDate = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
      } else {
        const date = new Date(row[0]);
        rowDate = Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy");
      }
      
      if (rowDate !== targetDate) continue;

      // ตรวจเช็คเลขหวย
      const billNum = String(row[3] || "").replace(/[^0-9]/g, "");
      if (billNum.slice(-3) === winningNum) {
        const customer = row[1] || "ทั่วไป";
        const billKey = customer + "_" + rowDate;
        
        if (!customerBills[billKey]) {
          customerBills[billKey] = {
            customer: customer,
            items: [],
            payment: row[6] || "เงินสด",
            seller: row[8] || "แอดมิน"
          };
        }
        
        const qty = row[4] || "1";
        const amt = row[5] || 0;
        const type = row[2] || "-";
        const position = row[3] || "-";
        
        customerBills[billKey].items.push({
          num: billNum,
          type: type,
          position: position,
          qty: qty,
          amt: amt
        });
      }
    }

    // สร้างบิลข้อความสำหรับแสดงผล
    for (let billKey in customerBills) {
      const bill = customerBills[billKey];
      let billText = "";
      
      bill.items.forEach((item, idx) => {
        billText += `${idx + 1}.🎉 ${item.num} [${item.position}] x${item.qty} - ${item.amt} ₭ถูกหวย!!\n`;
      });
      
      billText += `เวลาซื้อ: ${Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")}\n`;
      billText += `ชำระโดย: ${bill.payment}\n`;
      billText += `ผู้ขาย: ${bill.seller}\n`;
      
      const totalAmt = bill.items.reduce((sum, item) => sum + item.amt, 0);
      billText += `ยอดรวม: ${totalAmt} ₭`;
      
      winners.push({
        customer: bill.customer,
        billText: billText,
        items: bill.items
      });
    }

    return { success: true, winners: winners };
  } catch (error) {
    Logger.log("Check Winners Error: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

// 🆕 แก้ไขฟังก์ชัน doGet(e) ให้เป็นระบบ API คลีนๆ ไม่เรนเดอร์หน้าจอเก่าซ้ำซ้อน
function doGet(e) {
  return ContentService.createTextOutput("Smart Huay Pro API Connected Successfully! 🚀")
                       .setMimeType(ContentService.MimeType.TEXT);
}

// ฟังก์ชันสำหรับรับส่งข้อมูลในรูปแบบ POST API ข้ามค่ายจาก GitHub Pages
function doPost(e) {
  const JSON_OUTPUT = (res) => ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  try {
    const postData = JSON.parse(e.postData.contents);
    
    if (postData.action === "login") {
      const loginRes = checkLogin(postData.username, postData.pin);
      return JSON_OUTPUT(loginRes);
    }
    if (postData.action === "getUsernames") {
      const users = getAllUsernames();
      return JSON_OUTPUT({ success: true, users: users });
    }
    if (postData.action === "getStats") {
      const stats = getSalesStats();
      return JSON_OUTPUT(stats);
    }
    if (postData.action === "saveOrder") {
      const saveResStr = saveOrderFromWeb(postData.payload);
      return JSON_OUTPUT(JSON.parse(saveResStr));
    }
    if (postData.action === "checkWinners") {
      const winners = checkWinners(postData.winningNum, postData.targetDate);
      return JSON_OUTPUT(winners);
    }
    return JSON_OUTPUT({ success: false, message: "ไม่พบคำสั่งที่ระบุ" });
  } catch (err) {
    return JSON_OUTPUT({ success: false, message: err.toString() });
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}