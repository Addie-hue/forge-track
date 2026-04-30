// Program start date — no attendance before this
export const PROGRAM_START_DATE = '2025-08-04';

// Default batch
export const DEFAULT_BATCH = '2024-2028';

// Allowed target fields for CSV mapping
export const CSV_TARGET_FIELDS = [
  'student_name',
  'usn',
  'admission_number',
  'email',
  'branch_code',
  'date',
  'session_topic',
  'attendance_status',
  'IGNORE',
];

// Attendance conventions the AI agent can detect
export const ATTENDANCE_CONVENTIONS = [
  'TRUE/FALSE',
  'P/A',
  'Present/Absent',
  '1/0',
  'Y/N',
];

// Date formats the AI agent can detect
export const DATE_FORMATS = [
  'DD/M/YY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'D-MMM',
  'OTHER',
];

// CSV import batch size
export const IMPORT_BATCH_SIZE = 50;

// Max file size for CSV upload (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Accepted file types
export const ACCEPTED_FILE_TYPES = ['.csv', '.xlsx'];

// Attendance thresholds for color coding
export const ATTENDANCE_THRESHOLDS = {
  good: 75,    // >= 75% = green
  warning: 60, // >= 60% = yellow
  // < 60% = red
};

// Material types
export const MATERIAL_TYPES = ['slides', 'recording', 'document', 'link'];

// Session types
export const SESSION_TYPES = ['offline', 'online'];
