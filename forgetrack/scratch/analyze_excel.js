import * as XLSX from 'xlsx';
import fs from 'fs';

try {
  const fileBuffer = fs.readFileSync('Data Engineering and AI - Actual Program (2).xlsx');
  const workbook = XLSX.read(fileBuffer);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  if (data.length > 0) {
    console.log('--- Row 0 ---');
    console.log(data[0]);
    console.log('--- Row 1 ---');
    console.log(data[1]);
    console.log('--- Row 2 ---');
    console.log(data[2]);
    console.log('--- Row 3 ---');
    console.log(data[3]);
    console.log('--- Row 4 ---');
    console.log(data[4]);
  } else {
    console.log('Sheet is empty');
  }
} catch (error) {
  console.error('Error reading Excel file:', error);
}
