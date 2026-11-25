const SHEET_NAME = 'ชีต1'; // เปลี่ยนให้ตรงกับชื่อแท็บด้านล่างของ Google Sheet

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'updateStatus') {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.orderId) {
        sheet.getRange(i + 1, 9).setValue('แพ็คแล้ว');
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status: 'updated'})).setMimeType(ContentService.MimeType.JSON);
  }

  const orderId = 'HG-' + Math.floor(100000 + Math.random() * 900000);
  const timestamp = new Date().toLocaleString('th-TH');
  sheet.appendRow([
    orderId,
    timestamp,
    data.name,
    "'" + data.phone,
    data.address,
    data.sku1,
    data.sku2,
    data.total,
    'รอจัดส่ง'
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success', orderId: orderId})).setMimeType(ContentService.MimeType.JSON);
}