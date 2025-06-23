import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Shield, CheckCircle, Download } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Brigade {
  bnameno: string;
  blname: string;
  blno: string;
  venue: string;
}

const BrigadeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
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
    }
  };

  const downloadTemplate = () => {
    try {
      // Create sample data
      const templateData = [
        ['Brigade Number', 'Brigade Lead Name', 'Lead Phone Number', 'Venue Location'],
        ['BG001', 'John Smith', '9876543210', 'Main Hall A'],
        ['BG002', 'Jane Doe', '9876543211', 'Conference Room B'],
        ['BG003', 'Bob Wilson', '9876543212', 'Auditorium C'],
        ['BG004', 'Alice Johnson', '9876543213', 'Meeting Room D'],
        ['BG005', 'David Brown', '9876543214', 'Hall E']
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 15 }, // Brigade Number
        { width: 20 }, // Brigade Lead Name
        { width: 18 }, // Lead Phone Number
        { width: 25 }  // Venue Location
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Brigade Template');

      // Generate and download file
      const fileName = 'brigade_upload_template.xlsx';
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const uploadPromises = rows.map(async (row, index) => {
            if (index === 0 || !row[0]) return; // Skip header or empty rows

            const brigade: Brigade = {
              bnameno: String(row[0]).trim(),
              blname: String(row[1] || '').trim(),
              blno: String(row[2] || '').trim(),
              venue: String(row[3] || '').trim(),
            };

            if (!brigade.bnameno) return;

            try {
              await setDoc(doc(db, 'brigades', brigade.bnameno), brigade);
              successCount++;
              setUploadedCount(successCount);
            } catch (error) {
              console.error(`Error uploading brigade ${brigade.bnameno}:`, error);
            }
          });

          await Promise.all(uploadPromises);
          
          toast.success(`Successfully uploaded ${successCount} brigades!`);
          setFile(null);
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Error processing the Excel file');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload brigades');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Upload Brigades</h1>
          <p className="text-gray-600 mt-2">Upload brigade information from Excel files</p>
        </motion.div>

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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Excel File</h2>
              <p className="text-gray-600">Select an Excel file containing brigade data</p>
            </div>

            <div className="space-y-4">
              {/* Template Download Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Need a template?</h3>
                    <p className="text-sm text-blue-700">Download sample Excel file</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="btn-secondary flex items-center space-x-2 px-4 py-2"
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

              {file && (
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
                disabled={!file || uploading}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Uploading... ({uploadedCount} processed)</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Brigades</span>
                  </>
                )}
              </button>
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
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
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
                    <span className="font-medium">Brigade Number</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Column B:</span>
                    <span className="font-medium">Brigade Lead Name</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Column C:</span>
                    <span className="font-medium">Lead Phone Number</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Column D:</span>
                    <span className="font-medium">Venue Location</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Example Data:</h3>
                <div className="text-sm font-mono space-y-1">
                  <div>BG001 | John Smith | 9876543210 | Main Hall A</div>
                  <div>BG002 | Jane Doe | 9876543211 | Conference Room B</div>
                  <div>BG003 | Bob Wilson | 9876543212 | Auditorium C</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• First row should contain headers</li>
                  <li>• Brigade numbers must be unique</li>
                  <li>• All fields are required</li>
                  <li>• Phone numbers should be 10 digits</li>
                  <li>• File must be in .xlsx format</li>
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

export default BrigadeUpload;