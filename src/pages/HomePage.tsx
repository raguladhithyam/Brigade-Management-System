import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, MapPin, Phone, ExternalLink, X, Clock, Calendar } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

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

const HomePage: React.FC = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [result, setResult] = useState<{
    student: Student;
    brigade: Brigade;
  } | null>(null);
  const { db } = useFirebase();
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rollNumber.trim()) {
      toast.error('Please enter your roll number');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Search for student
      const studentQuery = query(
        collection(db, 'students'),
        where('stdroll', '==', rollNumber.trim())
      );
      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        toast.error('No student found with this roll number');
        setLoading(false);
        return;
      }

      const studentData = studentSnapshot.docs[0].data() as Student;

      if (!studentData.stdbg) {
        toast.error('No brigade information available for this student');
        setLoading(false);
        return;
      }

      // Search for brigade
      const brigadeQuery = query(
        collection(db, 'brigades'),
        where('bnameno', '==', studentData.stdbg)
      );
      const brigadeSnapshot = await getDocs(brigadeQuery);

      if (brigadeSnapshot.empty) {
        toast.error('Brigade information not found');
        setLoading(false);
        return;
      }

      const brigadeData = brigadeSnapshot.docs[0].data() as Brigade;

      setResult({
        student: studentData,
        brigade: brigadeData
      });

      toast.success('Brigade details found!');
      
      // Scroll to results after a brief delay to allow state update
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Session Announcement Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Important Announcement
                </h3>
                
                <div className="bg-primary-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-primary-700">Today (30/6)</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3">
                    <strong>First Session Location:</strong>
                  </p>
                  
                  <div className="bg-white rounded-md p-3 mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <MapPin className="w-4 h-4 text-accent-600" />
                      <span className="font-medium text-gray-900">Sarabai Kalam Theatre</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-4 h-4 text-accent-600" />
                      <span className="font-medium text-gray-900">8:30 AM onwards</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    After the session, you may proceed to your respective brigade venues.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full btn-primary py-3"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-montserrat text-gray-900 mb-4">
            Brigade Venue Finder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter your temporary roll number to find your brigade details, venue location, and brigade lead contact information.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="card">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Roll Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter your 5-digit roll number"
                    className="input-field pl-10"
                    disabled={loading}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Find Brigade</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-accent-600" />
                </div>
                <h2 className="text-2xl font-bold font-montserrat text-gray-900">
                  Your Brigade Details
                </h2>
              </div>

              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{result.student.stdname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Roll Number:</span>
                      <span className="font-medium">{result.student.stdroll}</span>
                    </div>
                  </div>
                </div>

                {/* Brigade Info */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Brigade Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Brigade Number:</span>
                      <span className="font-medium text-primary-700">{result.brigade.bnameno}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Brigade Lead:</span>
                      <span className="font-medium">{result.brigade.blname}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <a
                        href={`tel:+91${result.brigade.blno}`}
                        className="font-medium text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{result.brigade.blno}</span>
                      </a>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <div className="text-right">
                        <div className="font-medium flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-accent-600" />
                          <span>{result.brigade.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-accent-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    For venue clarification, please contact:
                  </p>
                  <a
                    href="tel:+9104222661100"
                    className="inline-flex items-center space-x-2 text-accent-600 hover:text-accent-700 font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    <span>04222661100</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;