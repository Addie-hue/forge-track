import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { analyzeCsvHeaders } from '../../lib/gemini';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/ToastProvider';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Upload, Sparkles, Database, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';

export function CsvUploadPage() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Workflow State
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview, 4: Success
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ usnColumn: '', dateColumns: [] });
  const [unpivotedData, setUnpivotedData] = useState([]);

  // --- Step 1: File Upload & AI Analysis ---
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file');
          setLoading(false);
          return;
        }

        const data = results.data;
        const csvHeaders = results.meta.fields;
        
        setParsedData(data);
        setHeaders(csvHeaders);

        // Call Gemini to map columns
        try {
          toast.info('AI is analyzing column structures...', { duration: 3000 });
          const aiMapping = await analyzeCsvHeaders(csvHeaders, data[0]);
          
          setMapping({
            usnColumn: aiMapping.usnColumn || csvHeaders[0],
            dateColumns: aiMapping.dateColumns || []
          });
          
          setStep(2);
        } catch (error) {
          console.error(error);
          toast.error('AI mapping failed. Please map manually.');
          // Provide default mapping so they can continue manually
          setMapping({
            usnColumn: csvHeaders[0],
            dateColumns: []
          });
          setStep(2);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // --- Step 2: Validate & Unpivot Data ---
  const handleConfirmMapping = () => {
    if (!mapping.usnColumn || mapping.dateColumns.length === 0) {
      toast.error('Please select at least a USN column and one Date column.');
      return;
    }

    // Unpivot the data
    const unpivoted = [];
    let validRows = 0;
    
    parsedData.forEach(row => {
      const usn = row[mapping.usnColumn]?.trim().toUpperCase();
      if (!usn) return; // Skip rows without USN
      validRows++;

      mapping.dateColumns.forEach(dateCol => {
        const val = row[dateCol]?.toString().trim().toLowerCase();
        // Determine presence: simple heuristic (not empty, "p", "present", "1")
        const isPresent = val === 'p' || val === 'present' || val === '1' || val === 'true' || (val !== '' && val !== '0' && val !== 'a' && val !== 'absent');
        
        unpivoted.push({
          usn,
          date: dateCol, // Raw column name, will be converted to date string or session name later
          present: isPresent,
          rawValue: val
        });
      });
    });

    if (validRows === 0) {
      toast.error('No valid data found matching the USN column.');
      return;
    }

    setUnpivotedData(unpivoted);
    setStep(3);
  };

  const toggleDateColumn = (col) => {
    setMapping(prev => {
      const isSelected = prev.dateColumns.includes(col);
      return {
        ...prev,
        dateColumns: isSelected 
          ? prev.dateColumns.filter(c => c !== col)
          : [...prev.dateColumns, col]
      };
    });
  };

  // --- Step 3: Batch Write to Supabase ---
  const handleImport = async () => {
    setLoading(true);
    try {
      // 1. Fetch active students to map USN -> student_id
      const { data: students, error: studentErr } = await supabase.from('students').select('id, usn');
      if (studentErr) throw studentErr;

      const usnToId = {};
      students.forEach(s => usnToId[s.usn.toUpperCase()] = s.id);

      // 2. Identify unique dates/sessions to create
      const uniqueDates = [...new Set(mapping.dateColumns)];
      
      // Attempt to parse standard dates (YYYY-MM-DD), fallback to today
      const dateMap = {}; // Maps column name -> YYYY-MM-DD string
      uniqueDates.forEach(col => {
        // Very basic date extraction logic or just use today if invalid
        const parsed = new Date(col);
        dateMap[col] = !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      });

      // Insert/Upsert Sessions
      const sessionRecords = uniqueDates.map(col => ({
        date: dateMap[col],
        topic: `Imported: ${col}`,
        month_number: 1,
        session_type: 'offline'
      }));

      // We need to insert them one by one to get their IDs, or bulk insert and fetch
      const sessionIds = {}; // column name -> session_id
      
      for (const sessionData of sessionRecords) {
        const { data, error } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select('id, topic')
          .single();
          
        if (error) {
           if (error.code === '23505') {
             // Session exists for this date, fetch it
             const { data: existing } = await supabase.from('sessions').select('id, topic').eq('date', sessionData.date).single();
             if (existing) sessionIds[sessionData.topic.replace('Imported: ', '')] = existing.id;
           } else {
             throw error;
           }
        } else {
          sessionIds[sessionData.topic.replace('Imported: ', '')] = data.id;
        }
      }

      // 3. Prepare attendance records
      const attendanceRecords = [];
      let skippedRecords = 0;

      unpivotedData.forEach(record => {
        const studentId = usnToId[record.usn];
        const sessionId = sessionIds[record.date];
        
        if (studentId && sessionId) {
          attendanceRecords.push({
            student_id: studentId,
            session_id: sessionId,
            present: record.present,
            marked_by: user.id
          });
        } else {
          skippedRecords++;
        }
      });

      if (attendanceRecords.length === 0) {
        throw new Error('No valid records to insert. Ensure USNs match the database.');
      }

      // 4. Upsert attendance
      const { error: attError } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'session_id, student_id' });
        
      if (attError) throw attError;

      // 5. Log Import
      await supabase.from('import_log').insert({
        filename: file.name,
        uploaded_by: user.displayName || 'Mentor',
        total_rows: parsedData.length,
        imported_rows: attendanceRecords.length,
        skipped_rows: skippedRecords,
        status: 'completed'
      });

      toast.success(`Imported ${attendanceRecords.length} records successfully!`);
      if (skippedRecords > 0) {
        toast.warning(`Skipped ${skippedRecords} records (USN not found in database).`);
      }
      
      setStep(4);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Import failed.');
      
      // Log failure
      await supabase.from('import_log').insert({
        filename: file.name,
        uploaded_by: user.displayName || 'Mentor',
        total_rows: parsedData.length,
        imported_rows: 0,
        skipped_rows: 0,
        status: 'failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setMapping({ usnColumn: '', dateColumns: [] });
    setUnpivotedData([]);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-display text-fg-primary tracking-tight">AI Data Import</h1>
        <p className="text-body text-fg-secondary max-w-2xl">
          Upload attendance sheets exported from Google Meet or Excel. 
          Our AI agent will automatically detect columns, restructure matrix data, and sync it with your database.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 py-4 mb-4 overflow-x-auto border-b border-border">
        {[
          { num: 1, label: 'Upload' },
          { num: 2, label: 'AI Mapping' },
          { num: 3, label: 'Preview' },
          { num: 4, label: 'Complete' }
        ].map((s) => (
          <div key={s.num} className={`flex items-center gap-2 whitespace-nowrap ${step >= s.num ? 'text-fg-primary' : 'text-fg-tertiary opacity-50'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold ${
              step === s.num ? 'bg-accent-glow text-white shadow-[0_0_10px_var(--accent-glow)]' : 
              step > s.num ? 'bg-success-bg text-success' : 'bg-surface-inset border border-border'
            }`}>
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className="font-medium text-body-sm">{s.label}</span>
            {s.num < 4 && <ArrowRight className="w-4 h-4 mx-2 text-border" />}
          </div>
        ))}
      </div>

      {/* --- STEP 1: UPLOAD --- */}
      {step === 1 && (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-2 bg-surface-inset hover:bg-surface hover:border-accent-glow transition-all cursor-pointer group relative" onClick={() => fileInputRef.current?.click()}>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={loading}
          />
          <div className="w-20 h-20 rounded-full bg-accent-glow-soft text-accent-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(var(--accent-glow-rgb),0.1)]">
            {loading ? (
              <Sparkles className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-h3 font-display text-fg-primary mb-2">
            {loading ? 'Analyzing with Gemini AI...' : 'Click or drag CSV file to upload'}
          </h3>
          <p className="text-body text-fg-tertiary">
            Support for matrix formats (Student rows × Date columns).
          </p>
        </Card>
      )}

      {/* --- STEP 2: AI MAPPING --- */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-accent-glow-soft border border-[var(--accent-glow)]/20">
            <Sparkles className="w-6 h-6 text-accent-glow flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-body font-medium text-fg-primary">AI Mapping Complete</h4>
              <p className="text-caption text-fg-secondary mt-1">
                Gemini analyzed your CSV. Please verify the detected USN column and attendance date columns before proceeding.
              </p>
            </div>
          </div>

          <Card className="flex flex-col gap-6">
            <div>
              <label className="text-label uppercase text-fg-secondary block mb-2">Primary Identifier (USN/Roll No)</label>
              <Select
                value={mapping.usnColumn}
                onChange={(e) => setMapping({ ...mapping, usnColumn: e.target.value })}
                options={headers.map(h => ({ label: h, value: h }))}
                className="w-full md:w-96"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-label uppercase text-fg-secondary">Attendance Session Columns</label>
                <span className="text-caption text-accent-glow">{mapping.dateColumns.length} columns selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {headers.filter(h => h !== mapping.usnColumn).map((header) => {
                  const isSelected = mapping.dateColumns.includes(header);
                  return (
                    <button
                      key={header}
                      onClick={() => toggleDateColumn(header)}
                      className={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors border ${
                        isSelected 
                          ? 'bg-accent-glow/20 border-accent-glow text-fg-primary' 
                          : 'bg-surface border-border text-fg-tertiary hover:border-fg-tertiary'
                      }`}
                    >
                      {header}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button variant="ghost" onClick={resetFlow}>Cancel</Button>
              <Button onClick={handleConfirmMapping}>Confirm Mapping</Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- STEP 3: PREVIEW --- */}
      {step === 3 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div className="grid grid-cols-3 gap-6">
            <Card className="flex flex-col gap-1">
              <span className="text-label uppercase text-fg-tertiary">Students Found</span>
              <span className="text-display-sm text-fg-primary">{parsedData.length}</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-label uppercase text-fg-tertiary">Sessions Detected</span>
              <span className="text-display-sm text-fg-primary">{mapping.dateColumns.length}</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-label uppercase text-fg-tertiary">Total Records to Sync</span>
              <span className="text-display-sm text-accent-glow">{unpivotedData.length}</span>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden flex flex-col">
            <CardHeader label="Preview" title="Unpivoted Data Sample" />
            <div className="overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHead>Student USN</TableHead>
                    <TableHead>Session (Extracted)</TableHead>
                    <TableHead>Raw Value</TableHead>
                    <TableHead>Detected Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpivotedData.slice(0, 50).map((row, i) => (
                    <TableRow key={i} hover={false}>
                      <TableCell className="font-mono text-body-sm text-fg-secondary">{row.usn}</TableCell>
                      <TableCell className="font-medium text-fg-primary">{row.date}</TableCell>
                      <TableCell className="text-fg-tertiary italic">"{row.rawValue}"</TableCell>
                      <TableCell>
                        {row.present ? (
                          <span className="text-success text-body-sm font-medium">Present</span>
                        ) : (
                          <span className="text-danger text-body-sm font-medium">Absent</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {unpivotedData.length > 50 && (
                    <TableRow hover={false}>
                      <TableCell colSpan={4} className="text-center text-fg-tertiary h-16">
                        ... and {unpivotedData.length - 50} more records
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between bg-surface-inset">
              <div className="flex items-center gap-2 text-warning text-caption">
                <AlertCircle className="w-4 h-4" />
                <span>Existing records for these sessions will be updated.</span>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>Back</Button>
                <Button onClick={handleImport} loading={loading} className="bg-accent-glow hover:bg-accent-glow-strong text-black">
                  <Database className="w-4 h-4 mr-2" /> Start Import
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- STEP 4: SUCCESS --- */}
      {step === 4 && (
        <Card className="flex flex-col items-center justify-center py-20 text-center animate-scale-in border-success-border">
          <div className="w-20 h-20 rounded-full bg-success-bg text-success flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(var(--success-rgb),0.1)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-h2 font-display text-fg-primary mb-2">Import Successful!</h3>
          <p className="text-body text-fg-secondary max-w-md mb-8">
            The database is now synced. Sessions were automatically created and attendance records were securely updated.
          </p>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={resetFlow}>Upload Another File</Button>
            <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
          </div>
        </Card>
      )}

    </div>
  );
}
