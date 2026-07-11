import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle,
  Download,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  ListChecks,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReviewPanel, UploadProgress } from '@/pages/StudentUpload';
import {
  parseWorkbook,
  validateBrigades,
  batchUpload,
  findExistingKeys,
  type ValidationReport,
  type Brigade,
} from '@/lib/uploadValidation';

type Phase = 'select' | 'analyzing' | 'review' | 'uploading' | 'done';

const BrigadeUpload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [report, setReport] = useState<ValidationReport<Brigade> | null>(null);
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
      ['Brigade Number', 'Brigade Lead Name', 'Lead Phone Number', 'Venue Location'],
      ['BG001', 'John Smith', '9876543210', 'Main Hall A'],
      ['BG002', 'Jane Doe', '9876543211', 'Conference Room B'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ width: 15 }, { width: 20 }, { width: 18 }, { width: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Brigades');
    XLSX.writeFile(wb, 'brigade_upload_template.xlsx');
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
      const result = validateBrigades(rows);
      let existing = new Set<string>();
      try {
        existing = await findExistingKeys('brigades', result.validRecords.map((r) => r.bnameno));
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
      const count = await batchUpload('brigades', report.validRecords, 'bnameno', (done, total) =>
        setProgress({ done, total })
      );
      setUploadedCount(count);
      setPhase('done');
      toast.success(`Uploaded ${count} brigades`);
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
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate('/admin/brigades')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            disabled={busy}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Brigades
          </button>
          <h1 className="text-2xl font-bold text-foreground">Bulk Upload Brigades</h1>
          <p className="text-sm text-muted-foreground">
            Upload an Excel file, review any issues, then commit clean records.
          </p>
        </motion.div>

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
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5 text-success" /> Select File
                </CardTitle>
                <CardDescription>Excel .xlsx: Brigade No, Lead, Phone, Venue.</CardDescription>
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
                  <span className="font-medium text-foreground">Brigade Number</span>
                </div>
                <div className="flex justify-between">
                  <span>Column B</span>
                  <span className="font-medium text-foreground">Lead Name</span>
                </div>
                <div className="flex justify-between">
                  <span>Column C</span>
                  <span className="font-medium text-foreground">Phone (10 digits)</span>
                </div>
                <div className="flex justify-between">
                  <span>Column D</span>
                  <span className="font-medium text-foreground">Venue</span>
                </div>
              </CardContent>
            </Card>
          </div>

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
                entity="brigades"
              />
            )}

            {phase === 'uploading' && (
              <UploadProgress done={progress.done} total={progress.total} entity="brigades" />
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
                      {uploadedCount.toLocaleString()} brigade records saved.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={reset}>
                      Upload More
                    </Button>
                    <Button onClick={() => navigate('/admin/brigades')}>View Brigades</Button>
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

export default BrigadeUpload;
