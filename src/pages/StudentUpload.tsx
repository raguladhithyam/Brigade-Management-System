import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Users, CheckCircle, Download, Check } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Student {
  stdroll: string;
  stdname: string;
  stdbg: string;
}

const StudentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedStudents, setUploadedStudents] = useState<Student[]>([]);
  const { db } = useFirebase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        toast.error('Please select an Excel (.xlsx) file');
        return;
      }
      setFile(selectedFile);
      setUploadedCount(0);
      setUploadComplete(false);
      setUploadedStudents([]);
    }
  };

  const downloadTemplate = () => {
    // Create sample data
    const templateData = [
      ['Roll Number', 'Student Name', 'Brigade Number'], // Headers
      ['12345', 'John Doe', 'BG001'],
      ['12346', 'Jane Smith', 'BG002'],
      ['12347', 'Bob Johnson', 'BG001'],
      ['12348', 'Alice Brown', 'BG003'],
      ['12349', 'Charlie Wilson', 'BG002']
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // Roll Number
      { width: 25 }, // Student Name
      { width: 15 }  // Brigade Number
    ];

    // Style headers (make them bold)
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E3F2FD" } }
    };

    // Apply header styling
    ws['A1'].s = headerStyle;
    ws['B1'].s = headerStyle;
    ws['C1'].s = headerStyle;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Generate file and trigger download
    const fileName = 'student_upload_template.xlsx';
    XLSX.writeFile(wb, fileName);
    
    toast.success('Template downloaded successfully!');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadComplete(false);
    setUploadedCount(0);
    setUploadedStudents([]);
    
    let successCount = 0;
    const successfulUploads: Student[] = [];

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          // Filter out header and empty rows to get actual count
          const validRows = rows.filter((row, index) => index !== 0 && row[0]);
          setTotalCount(validRows.length);

          // Process each student one by one for better progress tracking
          for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i];
            
            const student: Student = {
              stdroll: String(row[0]).trim(),
              stdname: String(row[1] || '').trim(),
              stdbg: String(row[2] || '').trim(),
            };

            if (student.stdroll) {
              try {
                await setDoc(doc(db, 'students', student.stdroll), student);
                successCount++;
                successfulUploads.push(student);
                setUploadedCount(successCount);
                setUploadedStudents([...successfulUploads]);
                
                // Small delay to show progress (optional - remove for faster upload)
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                console.error(`Error uploading student ${student.stdroll}:`, error);
              }
            }
          }
          
          setUploadComplete(true);
          toast.success(`Successfully uploaded ${successCount} students!`);
          
          // Reset file input after a delay to show success state
          setTimeout(() => {
            setFile(null);
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }, 3000);
          
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Error processing the Excel file');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload students');
    } finally {
      setUploading(false);
    }
  };

  const progressPercentage = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Upload Students</h1>
          <p className="text-gray-600 mt-2">Upload student data from Excel files</p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {uploadComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="bg-green-50 border border-green-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Upload Successful!</h3>
                  <p className="text-green-700">
                    {uploadedCount} out of {totalCount} students uploaded successfully
                  </p>
                </div>
              </div>
              
              {uploadedStudents.length > 0 && (
                <div className="bg-white rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Students:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {uploadedStudents.slice(0, 10).map((student, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{student.stdroll} - {student.stdname}</span>
                      </div>
                    ))}
                    {uploadedStudents.length > 10 && (
                      <div className="text-sm text-gray-500 col-span-2">
                        ... and {uploadedStudents.length - 10} more students
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Excel File</h2>
              <p className="text-gray-600">Select an Excel file containing student data</p>
            </div>

            <div className="space-y-4">
              {/* Download Template Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Need a template?</h3>
                    <p className="text-sm text-blue-700">Download sample Excel file</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="btn-secondary flex items-center space-x-2 px-4 py-2"
                    disabled={uploading}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (.xlsx)
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="input-field"
                  disabled={uploading}
                />
              </div>

              {file && !uploading && !uploadComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      File selected: {file.name}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading || uploadComplete}
                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-200 ${
                  !file || uploading || uploadComplete
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary hover:bg-blue-700'
                }`}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Uploading... ({uploadedCount}/{totalCount})</span>
                  </>
                ) : uploadComplete ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Upload Complete</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Students</span>
                  </>
                )}
              </button>

              {/* Enhanced Progress Indicator */}
              {uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Processing students...</span>
                    <span className="text-sm font-bold text-blue-900">
                      {uploadedCount}/{totalCount} ({Math.round(progressPercentage)}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  
                  {uploadedCount > 0 && (
                    <div className="text-xs text-blue-700">
                      Last uploaded: {uploadedStudents[uploadedStudents.length - 1]?.stdname || 'Processing...'}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Real-time Upload Status */}
              {uploading && uploadedStudents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto"
                >
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recently Uploaded:</h4>
                  <div className="space-y-1">
                    {uploadedStudents.slice(-5).reverse().map((student, index) => (
                      <motion.div
                        key={`${student.stdroll}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-gray-600 flex items-center space-x-2"
                      >
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span>{student.stdroll} - {student.stdname}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">File Format</h2>
              <p className="text-gray-600">Follow this format for your Excel file</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Required Columns (in order):</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Column A:</span>
                    <span className="font-medium">Roll Number</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Column B:</span>
                    <span className="font-medium">Student Name</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Column C:</span>
                    <span className="font-medium">Brigade Number</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Example Data:</h3>
                <div className="text-sm font-mono space-y-1">
                  <div>12345 | John Doe | BG001</div>
                  <div>12346 | Jane Smith | BG002</div>
                  <div>12347 | Bob Johnson | BG001</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• First row should contain headers</li>
                  <li>• Roll numbers must be unique</li>
                  <li>• All fields are required</li>
                  <li>• File must be in .xlsx format</li>
                  <li>• Use the template for best results</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Quick Start:</h3>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Download the template above</li>
                  <li>2. Fill in your student data</li>
                  <li>3. Save and upload the file</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentUpload;