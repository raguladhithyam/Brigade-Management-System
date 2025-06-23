import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Plus, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface Student {
  stdroll: string;
  stdname: string;
  stdbg: string;
}

interface Brigade {
  bnameno: string;
  blname: string;
  blno: string;
  venue: string;
}

const StudBrigManagement: React.FC = () => {
  const [brigades, setBrigades] = useState<Brigade[]>([]);
  const [loadingBrigades, setLoadingBrigades] = useState(true);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addingBrigade, setAddingBrigade] = useState(false);
  const { db } = useFirebase();

  // Student form state
  const [studentForm, setStudentForm] = useState({
    stdroll: '',
    stdname: '',
    stdbg: ''
  });

  // Brigade form state
  const [brigadeForm, setBrigadeForm] = useState({
    bnameno: '',
    blname: '',
    blno: '',
    venue: ''
  });

  // Load brigades on component mount
  useEffect(() => {
    loadBrigades();
  }, []);

  const loadBrigades = async () => {
    try {
      setLoadingBrigades(true);
      const brigadesRef = collection(db, 'brigades');
      const q = query(brigadesRef, orderBy('bnameno'));
      const querySnapshot = await getDocs(q);
      
      const brigadesData: Brigade[] = [];
      querySnapshot.forEach((doc) => {
        brigadesData.push(doc.data() as Brigade);
      });
      
      setBrigades(brigadesData);
    } catch (error) {
      console.error('Error loading brigades:', error);
      toast.error('Failed to load brigades');
    } finally {
      setLoadingBrigades(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentForm.stdroll.trim() || !studentForm.stdname.trim() || !studentForm.stdbg) {
      toast.error('Please fill in all student fields');
      return;
    }

    setAddingStudent(true);

    try {
      const student: Student = {
        stdroll: studentForm.stdroll.trim(),
        stdname: studentForm.stdname.trim(),
        stdbg: studentForm.stdbg
      };

      await setDoc(doc(db, 'students', student.stdroll), student);
      
      toast.success(`Student ${student.stdname} added successfully to ${student.stdbg}!`);
      
      // Reset form
      setStudentForm({
        stdroll: '',
        stdname: '',
        stdbg: ''
      });
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleBrigadeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brigadeForm.bnameno.trim() || !brigadeForm.blname.trim() || !brigadeForm.blno.trim() || !brigadeForm.venue.trim()) {
      toast.error('Please fill in all brigade fields');
      return;
    }

    setAddingBrigade(true);

    try {
      const brigade: Brigade = {
        bnameno: brigadeForm.bnameno.trim(),
        blname: brigadeForm.blname.trim(),
        blno: brigadeForm.blno.trim(),
        venue: brigadeForm.venue.trim()
      };

      await setDoc(doc(db, 'brigades', brigade.bnameno), brigade);
      
      toast.success(`Brigade ${brigade.bnameno} created successfully!`);
      
      // Reset form
      setBrigadeForm({
        bnameno: '',
        blname: '',
        blno: '',
        venue: ''
      });

      // Reload brigades to update dropdown
      loadBrigades();
    } catch (error) {
      console.error('Error adding brigade:', error);
      toast.error('Failed to create brigade');
    } finally {
      setAddingBrigade(false);
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
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Brigade Management</h1>
          <p className="text-gray-600 mt-2">Add students to brigades and create new brigades</p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Student Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Add Student to Brigade</h2>
              <p className="text-gray-600">Register a new student and assign to brigade</p>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label htmlFor="student-roll" className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number *
                </label>
                <input
                  id="student-roll"
                  type="text"
                  value={studentForm.stdroll}
                  onChange={(e) => setStudentForm({ ...studentForm, stdroll: e.target.value })}
                  className="input-field"
                  placeholder="Enter student roll number"
                  disabled={addingStudent}
                  required
                />
              </div>

              <div>
                <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentForm.stdname}
                  onChange={(e) => setStudentForm({ ...studentForm, stdname: e.target.value })}
                  className="input-field"
                  placeholder="Enter student full name"
                  disabled={addingStudent}
                  required
                />
              </div>

              <div>
                <label htmlFor="student-brigade" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Brigade *
                </label>
                {loadingBrigades ? (
                  <div className="input-field flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-gray-500">Loading brigades...</span>
                  </div>
                ) : (
                  <select
                    id="student-brigade"
                    value={studentForm.stdbg}
                    onChange={(e) => setStudentForm({ ...studentForm, stdbg: e.target.value })}
                    className="input-field"
                    disabled={addingStudent}
                    required
                  >
                    <option value="">Select a brigade</option>
                    {brigades.map((brigade) => (
                      <option key={brigade.bnameno} value={brigade.bnameno}>
                        {brigade.bnameno} - {brigade.blname}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {brigades.length === 0 && !loadingBrigades && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      No brigades available. Create a brigade first using the form on the right.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={addingStudent || brigades.length === 0}
                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-200 ${
                  addingStudent || brigades.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary hover:bg-blue-700'
                }`}
              >
                {addingStudent ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Adding Student...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Add Student</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Add Brigade Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Brigade</h2>
              <p className="text-gray-600">Set up a new brigade with leader details</p>
            </div>

            <form onSubmit={handleBrigadeSubmit} className="space-y-4">
              <div>
                <label htmlFor="brigade-number" className="block text-sm font-medium text-gray-700 mb-2">
                  Brigade Number *
                </label>
                <input
                  id="brigade-number"
                  type="text"
                  value={brigadeForm.bnameno}
                  onChange={(e) => setBrigadeForm({ ...brigadeForm, bnameno: e.target.value })}
                  className="input-field"
                  placeholder="e.g., BG001"
                  disabled={addingBrigade}
                  required
                />
              </div>

              <div>
                <label htmlFor="brigade-leader" className="block text-sm font-medium text-gray-700 mb-2">
                  Brigade Leader Name *
                </label>
                <input
                  id="brigade-leader"
                  type="text"
                  value={brigadeForm.blname}
                  onChange={(e) => setBrigadeForm({ ...brigadeForm, blname: e.target.value })}
                  className="input-field"
                  placeholder="Enter leader's full name"
                  disabled={addingBrigade}
                  required
                />
              </div>

              <div>
                <label htmlFor="brigade-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Leader Phone Number *
                </label>
                <input
                  id="brigade-phone"
                  type="tel"
                  value={brigadeForm.blno}
                  onChange={(e) => setBrigadeForm({ ...brigadeForm, blno: e.target.value })}
                  className="input-field"
                  placeholder="Enter 10-digit phone number"
                  disabled={addingBrigade}
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div>
                <label htmlFor="brigade-venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Location *
                </label>
                <input
                  id="brigade-venue"
                  type="text"
                  value={brigadeForm.venue}
                  onChange={(e) => setBrigadeForm({ ...brigadeForm, venue: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Main Hall A"
                  disabled={addingBrigade}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={addingBrigade}
                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-200 ${
                  addingBrigade
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {addingBrigade ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating Brigade...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Create Brigade</span>
                  </>
                )}
              </button>
            </form>

            {/* Brigade List Preview */}
            {brigades.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Existing Brigades ({brigades.length})
                </h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {brigades.map((brigade) => (
                    <div key={brigade.bnameno} className="text-xs bg-gray-50 rounded p-2">
                      <div className="font-medium text-gray-900">{brigade.bnameno}</div>
                      <div className="text-gray-600">{brigade.blname} • {brigade.venue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Student Management Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Roll numbers must be unique across all students</li>
              <li>• Students can only be assigned to existing brigades</li>
              <li>• Use the upload feature for bulk student additions</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Brigade Management Tips</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Brigade numbers should follow a consistent format</li>
              <li>• Phone numbers must be exactly 10 digits</li>
              <li>• Create brigades before adding students to them</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default StudBrigManagement;