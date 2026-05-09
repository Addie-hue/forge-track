import * as XLSX from 'xlsx';
import fs from 'fs';

try {
  const fileBuffer = fs.readFileSync('Data Engineering and AI - Actual Program (2).xlsx');
  const workbook = XLSX.read(fileBuffer);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  let firstDataRowIndex = rows.findIndex(r => r && r.length > 0 && r.some(c => c));
  console.log('First non-empty row index:', firstDataRowIndex);

  const rowA = rows[firstDataRowIndex];
  const rowB = rows[firstDataRowIndex + 1] || [];
  
  let processedHeaders = [];
  let startRow = firstDataRowIndex + 1;

  const isGroupingRow = rowA.filter(c => c).length < rowB.filter(c => c).length && rowB.some(c => {
    const s = String(c).toLowerCase();
    return s.includes('usn') || s.includes('name') || s.includes('email');
  });

  console.log('Is Grouping Row detected:', isGroupingRow);

  if (isGroupingRow) {
    let lastMainHeader = '';
    processedHeaders = rowB.map((sub, i) => {
      if (rowA[i]) lastMainHeader = String(rowA[i]).trim();
      const subTitle = sub ? String(sub).trim() : '';
      
      if (lastMainHeader && subTitle) {
        const isDetail = subTitle.toLowerCase().includes('attendance') || 
                         subTitle.toLowerCase().includes('score') || 
                         subTitle.toLowerCase().includes('knowledge') || 
                         subTitle.toLowerCase().includes('skill');
        return isDetail ? `${lastMainHeader} | ${subTitle}` : subTitle;
      }
      return subTitle || lastMainHeader || `Col ${i}`;
    });
    startRow = firstDataRowIndex + 2;
  } else {
    processedHeaders = rowA.map((h, i) => h ? String(h).trim() : `Col ${i}`);
    startRow = firstDataRowIndex + 1;
  }

  console.log('Processed Headers (first 15):', processedHeaders.slice(0, 15));
  
  const finalData = rows.slice(startRow).map(row => {
    const obj = {};
    processedHeaders.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });

  console.log('First Data Object (sample):', JSON.stringify(finalData[0], null, 2));

} catch (error) {
  console.error('Error:', error);
}
