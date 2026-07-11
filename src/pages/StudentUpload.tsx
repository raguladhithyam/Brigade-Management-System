import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Download,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ListChecks,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  parseWorkbook,
  validateStudents,
  batchUpload,
  findExistingKeys,
  type ValidationReport,
  type Student,
} from '@/lib/uploadValidation';

type Phase = 'select' | 'analyzing' | 'review' | 'uploading' | 'done';

const StudentUpload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [report, setReport] = useState<ValidationReport<Student> | null>(null);
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setReport(null);
    setExistingKeys(new Set());
    setProgress({ done: 0, total: 0 });
    setUploadedCount(0);
    setPhase('select');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      toast.error('Please select an Excel (.xlsx) file');
      return;
    }
    setFile(selected);
    setReport(null);
    setPhase('select');
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Roll Number', 'Student Name', 'Brigade Number'],
      ['15394', 'John Doe', 'BG001'],
      ['15395', 'Jane Smith', 'BG002'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ width: 15 }, { width: 25 }, { width: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_upload_template.xlsx');
    toast.success('Template downloaded');
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    setPhase('analyzing');
    try {
      const rows = await parseWorkbook(file);
      const result = validateStudents(rows);
      // Cross-check which valid keys already exist (will be overwritten).
      let existing = new Set<string>();
      try {
        existing = await findExistingKeys('students', result.validRecords.map((r) => r.stdroll));
      } catch (err) {
        console.error('Existing-key check failed (non-fatal):', err);
      }
      setReport(result);
      setExistingKeys(existing);
      setPhase('review');
    } catch (err) {
      console.error('Failed to analyze file:', err);
      toast.error('Could not read the Excel file');
      setPhase('select');
    }
  };

  const handleCommit = async () => {
    if (!report) return;
    setPhase('uploading');
    setProgress({ done: 0, total: report.validRecords.length });
    try {
      const count = await batchUpload('students', report.validRecords, 'stdroll', (done, total) =>
        setProgress({ done, total })
      );
      setUploadedCount(count);
      setPhase('done');
      toast.success(`Uploaded ${count} students`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Some records may not have been saved.');
      setPhase('review');
    }
  };

  const busy = phase === 'analyzing' || phase === 'uploading';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate('/admin/students')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            disabled={busy}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </button>
          <h1 className="text-2xl font-bold text-foreground">Bulk Upload Students</h1>
          <p className="text-sm text-muted-foreground">
            Upload an Excel file, review any issues, then commit clean records.
          </p>
        </motion.div>

        {/* Persistent do-not-close warning while working */}
        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
            >
              <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-semibold">
                  {phase === 'analyzing' ? 'Analyzing your file…' : 'Uploading…'} Please DO NOT close this tab or browser
                  window.
                </p>
                <p className="text-amber-800">
                  This can take a little while for large files. Closing now may interrupt the process.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: file + template */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5 text-primary" /> Select File
                </CardTitle>
                <CardDescription>Excel .xlsx with columns: Roll Number, Name, Brigade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" onClick={downloadTemplate} disabled={busy}>
                  <Download className="h-4 w-4" /> Download Template
                </Button>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  disabled={busy}
                  className="block w-full cursor-pointer rounded-lg border border-input bg-background text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-secondary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
                />
                {file && (
                  <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="truncate font-medium">{file.name}</span>
                  </div>
                )}
                {(phase === 'select' || phase === 'analyzing') && (
                  <Button className="w-full" onClick={handleAnalyze} disabled={!file || busy}>
                    {phase === 'analyzing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                      </>
                    ) : (
                      <>
                        <ListChecks className="h-4 w-4" /> Analyze File
                      </>
                    )}
                  </Button>
                )}
                {(phase === 'review' || phase === 'done') && (
                  <Button variant="outline" className="w-full" onClick={reset}>
                    Upload a Different File
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expected format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Column A</span>
                  <span className="font-medium text-foreground">Roll Number</span>
                </div>
                <div className="flex justify-between">
                  <span>Column B</span>
                  <span className="font-medium text-foreground">Student Name</span>
                </div>
                <div className="flex justify-between">
                  <span>Column C</span>
                  <span className="font-medium text-foreground">Brigade Number</span>
                </div>
                <p className="pt-2 text-xs">First row must be headers. Roll numbers are unique keys.</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: review / progress / done */}
          <div className="lg:col-span-2">
            {phase === 'select' && (
              <Card className="flex h-full min-h-[320px] items-center justify-center border-dashed">
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <ListChecks className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm">Select a file and click “Analyze File” to preview issues before uploading.</p>
                </div>
              </Card>
            )}

            {phase === 'analyzing' && (
              <Card className="flex h-full min-h-[320px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Reading and validating every row…</p>
                </div>
              </Card>
            )}

            {phase === 'review' && report && (
              <ReviewPanel
                report={report}
                existingCount={existingKeys.size}
                onCommit={handleCommit}
                entity="students"
              />
            )}

            {phase === 'uploading' && (
              <UploadProgress done={progress.done} total={progress.total} entity="students" />
            )}

            {phase === 'done' && (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle className="h-9 w-9 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Upload complete</h3>
                    <p className="text-sm text-muted-foreground">
                      {uploadedCount.toLocaleString()} student records saved.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={reset}>
                      Upload More
                    </Button>
                    <Button onClick={() => navigate('/admin/students')}>View Students</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

/* ---------- shared sub-components ---------- */

export function ReviewPanel<T>({
  report,
  existingCount,
  onCommit,
  entity,
}: {
  report: ValidationReport<T>;
  existingCount: number;
  onCommit: () => void;
  entity: string;
}) {
  const hasIssues = report.issues.length > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5 text-primary" /> Review
        </CardTitle>
        <CardDescription>Check the summary and issues below before committing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Rows found" value={report.totalRows} />
          <Stat label="Ready to upload" value={report.validRecords.length} tone="success" />
          <Stat label="Invalid" value={report.invalidCount} tone={report.invalidCount ? 'danger' : 'muted'} />
          <Stat label="Duplicates" value={report.duplicateCount} tone={report.duplicateCount ? 'warn' : 'muted'} />
        </div>

        {existingCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <span>
              <span className="font-semibold">{existingCount}</span> record{existingCount === 1 ? '' : 's'} already
              exist in the database and will be <span className="font-semibold">overwritten</span>.
            </span>
          </div>
        )}

        {hasIssues ? (
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-sm font-medium">
              <span>Issues ({report.issues.length})</span>
              <span className="text-muted-foreground">Invalid rows are skipped</span>
            </div>
            <div className="max-h-64 divide-y divide-border overflow-y-auto">
              {report.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 px-4 py-2 text-sm">
                  <Badge variant={issue.type === 'invalid' ? 'destructive' : 'default'} className="mt-0.5 shrink-0">
                    Row {issue.row}
                  </Badge>
                  <div>
                    <span className="font-medium">{issue.key}</span>
                    <span className="text-muted-foreground"> — {issue.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
            <CheckCircle className="h-4 w-4" /> No issues found — every row is valid.
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <span>
            Uploading may take a while for large files. Once you start, <span className="font-semibold">do not close
            the tab or browser window</span> until it finishes.
          </span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onCommit}
          disabled={report.validRecords.length === 0}
        >
          <Upload className="h-4 w-4" /> Upload {report.validRecords.length.toLocaleString()} {entity}
        </Button>
      </CardContent>
    </Card>
  );
}

export function UploadProgress({ done, total, entity }: { done: number; total: number; entity: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card>
      <CardContent className="space-y-4 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="text-lg font-semibold">Uploading {entity}…</h3>
          <p className="text-sm text-muted-foreground">
            {done.toLocaleString()} / {total.toLocaleString()} ({pct}%)
          </p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-3 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center text-xs font-medium text-amber-700">
          Do not close this tab or browser window until the upload completes.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'danger' | 'warn' | 'muted';
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-destructive',
    warn: 'text-amber-600',
    muted: 'text-muted-foreground',
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default StudentUpload;
