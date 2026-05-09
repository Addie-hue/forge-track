import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { analyzeCsvHeaders } from '../../lib/gemini';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/ToastProvider';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Upload, Sparkles, Database, CheckCircle2, AlertCircle, ArrowRight, Calendar, FileCode } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function CsvUploadPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Workflow State
  const [step, setStep] = useState(1); // 1: Upload, 2: Review & Approve, 3: Success
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState('attendance'); // 'attendance' or 'roster'
  
  // Data State
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [mapping, setMapping] = useState({ 
    usnColumn: '', dateColumns: [], marksMapping: {}, sessionDates: {}, nameColumn: '', emailColumn: '', branchColumn: '' 
  });
  const [fallbackDate, setFallbackDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRowIndices, setSelectedRowIndices] = useState(new Set());
  const [unpivotedData, setUnpivotedData] = useState([]);
  const [validationSummary, setValidationSummary] = useState({ matched: 0, missing: 0, missingUsns: [] });

  // --- Step 1: File Upload ---
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setLoading(true);

    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (isExcel) {
      handleExcelUpload(selectedFile);
    } else {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(results.data, results.meta?.fields?.filter(Boolean) || []);
        },
        error: (err) => {
          toast.error('Error reading CSV file');
          setLoading(false);
        }
      });
    }
  };

  const handleExcelUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays first to handle multi-row headers
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          toast.error('Excel file is empty or has insufficient data.');
          setLoading(false);
          return;
        }

        // Find the first non-empty row to start analysis
        let firstDataRowIndex = rows.findIndex(r => r && r.length > 0 && r.some(c => c));
        if (firstDataRowIndex === -1) {
          toast.error('Excel file appears to be empty.');
          setLoading(false);
          return;
        }

        const rowA = rows[firstDataRowIndex];
        const rowB = rows[firstDataRowIndex + 1] || [];
        
        let processedHeaders = [];
        let startRow = firstDataRowIndex + 1;

        // Check if rowA is a "Grouping" row (like Day 1, Day 2) 
        // and rowB is the "Detail" row (like Attendance, Score)
        const isGroupingRow = rowA.filter(c => c).length < rowB.filter(c => c).length && rowB.some(c => {
          const s = String(c).toLowerCase();
          return s.includes('usn') || s.includes('name') || s.includes('email');
        });

        if (isGroupingRow) {
          let lastMainHeader = '';
          processedHeaders = rowB.map((sub, i) => {
            if (rowA[i]) lastMainHeader = String(rowA[i]).trim();
            const subTitle = sub ? String(sub).trim() : '';
            
            if (lastMainHeader && subTitle) {
              // Only prefix if it's an attendance/score column to keep USN/Name clean
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

        // Convert remaining rows to objects
        const finalData = rows.slice(startRow).map(row => {
          const obj = {};
          processedHeaders.forEach((h, i) => {
            obj[h] = row[i];
          });
          return obj;
        });

        processParsedData(finalData, processedHeaders);
      } catch (err) {
        console.error('Excel Error:', err);
        toast.error('Failed to parse Excel file.');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processParsedData = async (rawData, csvHeaders) => {
    if (rawData.length === 0 || csvHeaders.length === 0) {
      toast.error('File appears to be empty.');
      setLoading(false);
      return;
    }

    setParsedData(rawData);
    setHeaders(csvHeaders);

    // Initial Mapping
    const initialMapping = {
      usnColumn: csvHeaders[0] || '',
      dateColumns: [],
      nameColumn: csvHeaders.find(h => h.toLowerCase().includes('name')) || '',
      emailColumn: csvHeaders.find(h => h.toLowerCase().includes('email')) || '',
      branchColumn: ''
    };
    setMapping(initialMapping);

    // Get AI Suggestions in background
    analyzeCsvHeaders(csvHeaders, rawData[0], importMode)
      .then(aiMapping => {
        if (aiMapping) {
          setMapping(prev => ({
            ...prev,
            usnColumn: aiMapping.usnColumn || prev.usnColumn,
            dateColumns: Array.isArray(aiMapping.dateColumns) ? aiMapping.dateColumns : prev.dateColumns,
            marksMapping: aiMapping.marksMapping || {},
            nameColumn: aiMapping.nameColumn || prev.nameColumn,
            emailColumn: aiMapping.emailColumn || prev.emailColumn,
            branchColumn: aiMapping.branchColumn || prev.branchColumn
          }));
          if (aiMapping.explanation) setAiExplanation(aiMapping.explanation);
          toast.success('AI Mapping Complete');
        }
      })
      .catch(err => {
        console.error('AI Error:', err);
      })
      .finally(() => {
        setStep(2);
        setLoading(false);
      });
  };

  // --- Step 2 logic: Dynamically Unpivot & Validate ---
  useEffect(() => {
    if (step === 2) {
      updateValidation();
    }
  }, [mapping, step, importMode]);

  const updateValidation = async () => {
    if (importMode === 'attendance') {
      if (!mapping.usnColumn) return;
      
      const { data: existingStudents } = await supabase.from('students').select('usn');
      const existingUsns = new Set(existingStudents?.map(s => s.usn.toUpperCase()) || []);

      const unpivoted = [];
      let matched = 0;
      let missing = 0;
      const missingUsns = new Set();
      
      parsedData.forEach(row => {
        const usn = row[mapping.usnColumn]?.trim().toUpperCase();
        if (!usn) return;
        
        const isExisting = existingUsns.has(usn);
        if (isExisting) matched++; else { missing++; missingUsns.add(usn); }
        
      if (mapping.dateColumns.length > 0) {
        mapping.dateColumns.forEach(dateCol => {
          const val = row[dateCol]?.toString().trim().toLowerCase();
          const isPresent = val === 'p' || val === 'present' || val === '1' || val === 'true' || (val !== '' && val !== '0' && val !== 'a' && val !== 'absent');
          
          // Use manual date mapping if available
          const manualDate = mapping.sessionDates[dateCol];
          let dateStr = manualDate;
          
          if (!dateStr) {
            const parsed = new Date(dateCol);
            dateStr = !isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 
              ? parsed.toISOString().split('T')[0] 
              : fallbackDate;
          }

          // Extract marks if available
          const kCol = mapping.marksMapping[dateCol]?.knowledge;
          const sCol = mapping.marksMapping[dateCol]?.skill;
          const kScore = kCol ? parseFloat(row[kCol]) : null;
          const sScore = sCol ? parseFloat(row[sCol]) : null;

          unpivoted.push({
            usn, name: row[mapping.nameColumn] || usn, email: row[mapping.emailColumn] || null,
            branch: row[mapping.branchColumn] || 'CS', date: dateStr, present: isPresent, 
            knowledge_score: kScore, skill_score: sScore,
            isNew: !isExisting,
            originalHeader: dateCol
          });
        });
      } else if (importMode === 'attendance' && fallbackDate) {
        // Handle case where no date columns are selected - use fallback date
        // Assume the entire row is "Present" or look for an 'Attendance' column
        const attCol = headers.find(h => h.toLowerCase().includes('attendance')) || headers[0];
        const val = row[attCol]?.toString().trim().toLowerCase();
        const isPresent = val === 'p' || val === 'present' || val === '1' || val === 'true' || (val !== '' && val !== '0' && val !== 'a' && val !== 'absent');
        
        unpivoted.push({
          usn, name: row[mapping.nameColumn] || usn, email: row[mapping.emailColumn] || null,
          branch: row[mapping.branchColumn] || 'CS', date: fallbackDate, present: isPresent, 
          knowledge_score: null, skill_score: null,
          isNew: !isExisting
        });
      }
      });

      setUnpivotedData(unpivoted);
      setValidationSummary({ matched, missing, missingUsns: Array.from(missingUsns).slice(0, 5) });
      setSelectedRowIndices(new Set(Array.from({ length: unpivoted.length }, (_, i) => i)));
    } else {
      setSelectedRowIndices(new Set(Array.from({ length: parsedData.length }, (_, i) => i)));
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      if (importMode === 'attendance') {
        if (mapping.dateColumns.length === 0) throw new Error('Please select at least one session column.');
        
        const uniqueStudents = [];
        const seenUsns = new Set();
        unpivotedData.filter((_, index) => selectedRowIndices.has(index)).forEach(r => {
          if (!seenUsns.has(r.usn)) {
            uniqueStudents.push({ 
              usn: r.usn, 
              name: r.name || r.usn, 
              email: r.email, 
              branch_code: r.branch || 'CS', 
              is_active: true,
              batch: '2024-2028'
            });
            seenUsns.add(r.usn);
          }
        });

        if (uniqueStudents.length > 0) {
          const { error } = await supabase.from('students').upsert(uniqueStudents, { onConflict: 'usn' });
          if (error) throw error;
        }

        const { data: students } = await supabase.from('students').select('id, usn');
        const usnToId = {};
        students.forEach(s => usnToId[s.usn.toUpperCase()] = s.id);

        const uniqueDates = [...new Set(unpivotedData.filter((_, index) => selectedRowIndices.has(index)).map(r => r.date))];
        const sessionIds = {};
        
        // Base date for sequential "Day X" sessions
        let baseDate = new Date(fallbackDate);
        if (isNaN(baseDate.getTime())) baseDate = new Date();

        for (let i = 0; i < uniqueDates.length; i++) {
          const colName = uniqueDates[i];
          const parsed = new Date(colName);
          let dateStr;

          if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
            dateStr = parsed.toISOString().split('T')[0];
          } else {
            // Sequential dates: Base Date + i days
            const nextDate = new Date(baseDate);
            nextDate.setDate(baseDate.getDate() + i);
            dateStr = nextDate.toISOString().split('T')[0];
          }

          const { data, error } = await supabase
            .from('sessions')
            .upsert({ 
              date: dateStr, 
              topic: colName.includes('|') ? colName : `Session: ${colName}`, 
              month_number: new Date(dateStr).getMonth() + 1 
            }, { onConflict: 'date' })
            .select('id').single();
            
          if (error) {
            console.error('Session Error:', error);
            throw new Error(`Failed to create session for ${colName}: ${error.message}`);
          }
          sessionIds[colName] = data.id;
        }

        const attendanceRecords = unpivotedData
          .filter((_, index) => selectedRowIndices.has(index))
          .map(record => ({
            student_id: usnToId[record.usn],
            session_id: sessionIds[record.date],
            present: record.present,
            knowledge_score: record.knowledge_score,
            skill_score: record.skill_score,
            marked_by: user.id
          })).filter(r => r.student_id && r.session_id);

        const { error: attError } = await supabase.from('attendance').upsert(attendanceRecords, { onConflict: 'session_id, student_id' });
        if (attError) throw attError;
      } else {
        const rosterRecords = parsedData
          .filter((_, index) => selectedRowIndices.has(index))
          .map(row => ({
            usn: row[mapping.usnColumn]?.trim().toUpperCase(),
            name: row[mapping.nameColumn]?.trim(),
            email: row[mapping.emailColumn]?.trim() || null,
            branch_code: row[mapping.branchColumn]?.trim() || 'CS',
            is_active: true
          })).filter(r => r.usn && r.name);

        const { error } = await supabase.from('students').upsert(rosterRecords, { onConflict: 'usn' });
        if (error) throw error;
      }

      setStep(3);
    } catch (error) {
      toast.error(error.message || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setParsedData([]);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isAttributeColumn = (col) => {
    const common = ['name', 'usn', 'email', 'branch', 'batch', 'roll', 'sl no', 'sl.no', 'phone', 'mobile', 'address', 'gender', 'dob'];
    return common.some(attr => col.toLowerCase().includes(attr));
  };

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-display text-fg-primary tracking-tight">Data Sync</h1>
        <p className="text-body text-fg-secondary">Upload, review, and approve database updates in seconds.</p>
      </div>

      {step === 1 && (
        <>
          <div className="flex p-1 bg-surface-inset rounded-lg w-fit border border-border">
            <button onClick={() => setImportMode('attendance')} className={`px-4 py-2 rounded-md text-body-sm font-medium transition-all ${importMode === 'attendance' ? 'bg-accent-glow text-black' : 'text-fg-tertiary'}`}>Attendance Import</button>
            <button onClick={() => setImportMode('roster')} className={`px-4 py-2 rounded-md text-body-sm font-medium transition-all ${importMode === 'roster' ? 'bg-accent-glow text-black' : 'text-fg-tertiary'}`}>Student Roster</button>
          </div>
          <Card className="flex flex-col items-center justify-center py-20 border-dashed border-2 bg-surface-inset hover:bg-surface hover:border-accent-glow transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} disabled={loading} />
            <div className="w-20 h-20 rounded-full bg-accent-glow-soft text-accent-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-accent-glow/5">
              {loading ? <Sparkles className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <h3 className="text-h3 font-display text-fg-primary mb-2">{loading ? 'AI analyzing...' : 'Click to upload CSV or Excel'}</h3>
            <p className="text-caption text-fg-tertiary">We'll automatically map your columns using Gemini AI.</p>
          </Card>
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          {aiExplanation && (
            <Card className="border-accent-glow/20 bg-accent-glow-soft/5 p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-glow-soft text-accent-glow flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-micro uppercase text-accent-glow font-bold">AI Rationale & Data Health</span>
                  <p className="text-caption text-fg-secondary italic">{aiExplanation}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col"><h2 className="text-h3 font-display text-fg-primary">Review & Approve</h2><p className="text-caption text-fg-tertiary">Total Rows: {parsedData.length}</p></div>
            <div className="flex gap-3"><Button variant="ghost" onClick={resetFlow}>Cancel</Button><Button onClick={handleImport} loading={loading} className="bg-accent-glow text-black px-10 font-bold shadow-lg shadow-accent-glow/20">Sync Approved Records</Button></div>
          </div>

          {/* Raw CSV Reference */}
          <Card className="p-0 overflow-hidden border-border/40 shadow-xl bg-surface-inset/20">
            <div className="px-6 py-4 border-b border-border/40 bg-surface/50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-label text-fg-tertiary uppercase font-bold tracking-widest">Original CSV Reference</span>
                <p className="text-[10px] text-fg-tertiary">Use this to verify the raw data before approving below.</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-surface-raised border border-border text-[10px] font-bold text-fg-tertiary">Row Preview</div>
            </div>
            <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow hover={false}>
                    {(headers || []).map((h, i) => (
                      <TableHead key={i} className="whitespace-nowrap bg-surface-raised/30 font-bold text-fg-secondary py-3 px-4 border-r border-border/20 last:border-0">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(parsedData || []).slice(0, 10).map((row, ri) => (
                    <TableRow key={ri} hover={false} className="border-b border-border/5 last:border-0">
                      {(headers || []).map((h, ci) => (
                        <TableCell key={ci} className="text-caption font-medium py-3 px-4 text-fg-secondary truncate max-w-[200px] border-r border-border/5 last:border-0">{row[h] || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {importMode === 'attendance' && mapping.dateColumns.length > 0 && (
            <Card className="flex flex-col gap-4 border-border-strong bg-surface/50">
              <div className="flex flex-col gap-1">
                <label className="text-label uppercase text-fg-secondary font-bold">Assign Dates to Columns</label>
                <p className="text-caption text-fg-tertiary">Confirm the exact date for each selected session column.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mapping.dateColumns.map(col => (
                  <div key={col} className="p-3 rounded-lg bg-surface-inset border border-border flex flex-col gap-2">
                    <span className="text-caption font-bold text-fg-primary truncate" title={col}>{col}</span>
                    <DatePicker 
                      value={mapping.sessionDates[col] || (new Date(col).getFullYear() > 2000 ? new Date(col).toISOString().split('T')[0] : fallbackDate)} 
                      onChange={(e) => {
                        setMapping(prev => ({
                          ...prev,
                          sessionDates: { ...prev.sessionDates, [col]: e.target.value }
                        }));
                        setTimeout(updateValidation, 0);
                      }}
                      className="h-9 text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {importMode === 'attendance' && mapping.dateColumns.length === 0 && (
            <Card className="border-warning-border/30 bg-warning-bg/5 p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-warning-bg/20 text-warning flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-body font-bold text-warning">No Date Columns Detected</h4>
                  <p className="text-caption text-fg-tertiary">Please select a fallback date for this import.</p>
                </div>
                <DatePicker 
                  value={fallbackDate} 
                  onChange={(e) => {
                    setFallbackDate(e.target.value);
                    // Trigger a re-validation to update the unpivoted data with the new date
                    setTimeout(updateValidation, 0);
                  }}
                  className="max-w-[220px]"
                />
              </div>
            </Card>
          )}

          {importMode === 'attendance' && (
            <Card className="flex flex-col gap-6 border-accent-glow/20 bg-accent-glow-soft/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label uppercase text-accent-glow flex items-center gap-2 font-bold">
                    <Calendar className="w-4 h-4" /> Map Attendance Sessions
                  </label>
                  <p className="text-caption text-fg-tertiary">Select columns that represent class sessions. Marks (K/S) will be linked automatically.</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const detected = headers.filter(h => h.toLowerCase().includes('attendance') || /\d{4}-\d{2}-\d{2}/.test(h));
                      setMapping(prev => ({ ...prev, dateColumns: detected }));
                    }}
                    className="text-micro border-border-strong h-8"
                  >
                    Select All Detected
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMapping(prev => ({ ...prev, dateColumns: [] }))}
                    className="text-micro border-border-strong h-8"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Group columns by Day or Category */}
                {Object.entries(
                  headers
                    .filter(h => h !== mapping?.usnColumn && !isAttributeColumn(h))
                    .reduce((groups, h) => {
                      const prefix = h.includes('|') ? h.split('|')[0].trim() : 'General';
                      if (!groups[prefix]) groups[prefix] = [];
                      groups[prefix].push(h);
                      return groups;
                    }, {})
                ).map(([group, groupHeaders]) => (
                  <div key={group} className="flex flex-col gap-2 p-3 rounded-xl bg-surface/40 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-micro uppercase font-bold text-fg-secondary tracking-widest">{group}</span>
                      <button 
                        onClick={() => {
                          const allInGroup = groupHeaders;
                          const current = new Set(mapping.dateColumns);
                          const someMissing = allInGroup.some(h => !current.has(h));
                          if (someMissing) allInGroup.forEach(h => current.add(h));
                          else allInGroup.forEach(h => current.delete(h));
                          setMapping(prev => ({ ...prev, dateColumns: Array.from(current) }));
                        }}
                        className="text-[9px] text-accent-glow hover:underline uppercase font-bold"
                      >
                        Toggle Group
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupHeaders.map((header) => {
                        const isAttendance = header.toLowerCase().includes('attendance');
                        const isSelected = mapping?.dateColumns?.includes(header);
                        
                        return (
                          <button 
                            key={header} 
                            onClick={() => setMapping(prev => ({ ...prev, dateColumns: prev.dateColumns.includes(header) ? prev.dateColumns.filter(c => c !== header) : [...prev.dateColumns, header] }))} 
                            className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all truncate max-w-full ${
                              isSelected 
                                ? 'bg-accent-glow border-accent-glow text-black' 
                                : isAttendance 
                                  ? 'bg-accent-glow-soft/10 border-accent-glow/30 text-fg-secondary hover:border-accent-glow'
                                  : 'bg-surface border-border text-fg-tertiary hover:border-border-strong'
                            }`}
                            title={header}
                          >
                            {header.includes('|') ? header.split('|')[1].trim() : header}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Combined Review & Approve Table */}
          <Card className="p-0 overflow-hidden shadow-xl border-border/40">
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow hover={false} className="bg-surface-raised/50">
                    <TableHead className="w-12"><input type="checkbox" checked={selectedRowIndices.size === (importMode === 'attendance' ? unpivotedData.length : parsedData.length)} onChange={(e) => { const count = importMode === 'attendance' ? unpivotedData.length : parsedData.length; if (e.target.checked) setSelectedRowIndices(new Set(Array.from({ length: count }, (_, i) => i))); else setSelectedRowIndices(new Set()); }} /></TableHead>
                    <TableHead>Student (Mapped from AI)</TableHead>
                    <TableHead>{importMode === 'attendance' ? 'Session Date' : 'Email / Details'}</TableHead>
                    <TableHead>Action / Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importMode === 'attendance' ? (unpivotedData.slice(0, 100).map((row, i) => (
                    <TableRow key={i} hover={false} className={!selectedRowIndices.has(i) ? 'opacity-40 grayscale' : ''}>
                      <TableCell><input type="checkbox" checked={selectedRowIndices.has(i)} onChange={() => { const next = new Set(selectedRowIndices); if (next.has(i)) next.delete(i); else next.add(i); setSelectedRowIndices(next); }} /></TableCell>
                      <TableCell>
                        <div className="flex flex-col py-1">
                          <span className="font-mono text-body font-bold text-fg-primary tracking-tight">{row.usn}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-fg-secondary font-medium">{row.name}</span>
                            {row.isNew && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-glow text-black font-extrabold uppercase">New Profile</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-body-sm font-medium">{row.date}</span></TableCell>
                      <TableCell>{row.present ? <span className="px-2 py-0.5 rounded bg-success-bg text-success text-[10px] font-bold uppercase">Present</span> : <span className="px-2 py-0.5 rounded bg-danger-bg text-danger text-[10px] font-bold uppercase">Absent</span>}</TableCell>
                    </TableRow>
                  ))) : (parsedData.slice(0, 100).map((row, i) => (
                    <TableRow key={i} hover={false} className={!selectedRowIndices.has(i) ? 'opacity-40 grayscale' : ''}>
                      <TableCell><input type="checkbox" checked={selectedRowIndices.has(i)} onChange={() => { const next = new Set(selectedRowIndices); if (next.has(i)) next.delete(i); else next.add(i); setSelectedRowIndices(next); }} /></TableCell>
                      <TableCell>
                        <div className="flex flex-col py-1">
                          <span className="font-mono text-body font-bold text-fg-primary tracking-tight">{row[mapping.usnColumn]}</span>
                          <span className="text-[11px] text-fg-secondary font-medium">{row[mapping.nameColumn]}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-caption text-fg-tertiary">{row[mapping.emailColumn] || 'No email provided'}</span></TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded bg-accent-glow-soft text-accent-glow text-[10px] font-bold uppercase">Add / Update</span></TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="flex flex-col items-center justify-center py-24 text-center animate-scale-in border-success-border bg-success-bg/5 shadow-2xl">
          <div className="w-24 h-24 rounded-full bg-success text-white flex items-center justify-center mb-8 shadow-xl shadow-success/20"><CheckCircle2 className="w-12 h-12" /></div>
          <h3 className="text-h1 font-display text-fg-primary mb-3">Sync Complete!</h3>
          <p className="text-body text-fg-secondary max-w-md mb-10 leading-relaxed">Your database has been successfully updated. All records are live.</p>
          <div className="flex gap-4"><Button variant="secondary" onClick={resetFlow} className="px-8">Import More</Button><Button onClick={() => navigate('/dashboard')} className="px-8 bg-accent-glow hover:bg-accent-glow-strong text-black">Finish</Button></div>
        </Card>
      )}
    </div>
  );
}
