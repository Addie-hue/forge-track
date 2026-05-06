import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { analyzeCsvHeaders } from '../../lib/gemini';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/ToastProvider';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Upload, Sparkles, Database, CheckCircle2, AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import Papa from 'papaparse';

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
  const [mapping, setMapping] = useState({ 
    usnColumn: '', dateColumns: [], nameColumn: '', emailColumn: '', branchColumn: '' 
  });
  const [selectedRowIndices, setSelectedRowIndices] = useState(new Set());
  const [unpivotedData, setUnpivotedData] = useState([]);
  const [validationSummary, setValidationSummary] = useState({ matched: 0, missing: 0, missingUsns: [] });

  // --- Step 1: File Upload ---
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setLoading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processParsedData(results);
      },
      error: (err) => {
        toast.error('Error reading CSV file');
        setLoading(false);
      }
    });
  };

  const processParsedData = async (results) => {
    const rawData = results.data || [];
    const csvHeaders = results.meta?.fields?.filter(Boolean) || [];
    if (rawData.length === 0 || csvHeaders.length === 0) {
      toast.error('CSV file appears to be empty.');
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
            nameColumn: aiMapping.nameColumn || prev.nameColumn,
            emailColumn: aiMapping.emailColumn || prev.emailColumn,
            branchColumn: aiMapping.branchColumn || prev.branchColumn
          }));
        }
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
        
        mapping.dateColumns.forEach(dateCol => {
          const val = row[dateCol]?.toString().trim().toLowerCase();
          const isPresent = val === 'p' || val === 'present' || val === '1' || val === 'true' || (val !== '' && val !== '0' && val !== 'a' && val !== 'absent');
          unpivoted.push({
            usn, name: row[mapping.nameColumn] || usn, email: row[mapping.emailColumn] || null,
            branch: row[mapping.branchColumn] || 'CS', date: dateCol, present: isPresent, isNew: !isExisting
          });
        });
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
            uniqueStudents.push({ usn: r.usn, name: r.name, email: r.email, branch_code: r.branch, is_active: true });
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
        for (const colName of uniqueDates) {
          const parsed = new Date(colName);
          const dateStr = !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('sessions')
            .upsert({ date: dateStr, topic: `Imported: ${colName}`, month_number: new Date(dateStr).getMonth() + 1 }, { onConflict: 'date' })
            .select('id').single();
          if (error) throw error;
          sessionIds[colName] = data.id;
        }

        const attendanceRecords = unpivotedData
          .filter((_, index) => selectedRowIndices.has(index))
          .map(record => ({
            student_id: usnToId[record.usn],
            session_id: sessionIds[record.date],
            present: record.present,
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
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} disabled={loading} />
            <div className="w-20 h-20 rounded-full bg-accent-glow-soft text-accent-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-accent-glow/5">
              {loading ? <Sparkles className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <h3 className="text-h3 font-display text-fg-primary mb-2">{loading ? 'AI analyzing...' : 'Click to upload CSV'}</h3>
            <p className="text-caption text-fg-tertiary">We'll automatically map your columns using Gemini AI.</p>
          </Card>
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6 animate-slide-up">
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

          {importMode === 'attendance' && (
            <Card className="flex flex-col gap-4 border-accent-glow/20 bg-accent-glow-soft/5">
              <label className="text-label uppercase text-accent-glow flex items-center gap-2 font-bold"><Calendar className="w-4 h-4" /> Select Attendance Session Columns</label>
              <div className="flex flex-wrap gap-2">
                {(headers || []).filter(h => h !== mapping?.usnColumn && !isAttributeColumn(h)).map((header) => (
                  <button key={header} onClick={() => setMapping(prev => ({ ...prev, dateColumns: prev.dateColumns.includes(header) ? prev.dateColumns.filter(c => c !== header) : [...prev.dateColumns, header] }))} className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-all ${mapping?.dateColumns?.includes(header) ? 'bg-accent-glow border-accent-glow text-black' : 'bg-surface border-border text-fg-tertiary'}`}>{header}</button>
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
