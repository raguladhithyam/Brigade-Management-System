import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, User, Shield, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PopupDialog } from '@/components/PopupDialog';
import { DEFAULT_POPUP, HomePopup, loadPopup, popupHasContent } from '@/lib/popup';
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
  const [result, setResult] = useState<{ student: Student; brigade: Brigade } | null>(null);
  const [popup, setPopup] = useState<HomePopup>(DEFAULT_POPUP);
  const [popupOpen, setPopupOpen] = useState(false);
  const { db } = useFirebase();
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Load the admin-managed home popup and show it on every visit while enabled.
  useEffect(() => {
    (async () => {
      try {
        const config = await loadPopup();
        setPopup(config);
        if (config.enabled && popupHasContent(config)) setPopupOpen(true);
      } catch (err) {
        console.error('Failed to load home popup:', err);
      }
    })();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      toast.error('Please enter your roll number');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const searchRollNumber = rollNumber.trim().toUpperCase();
      const studentQuery = query(collection(db, 'students'), where('stdroll', '==', searchRollNumber));
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

      const brigadeQuery = query(collection(db, 'brigades'), where('bnameno', '==', studentData.stdbg));
      const brigadeSnapshot = await getDocs(brigadeQuery);

      if (brigadeSnapshot.empty) {
        toast.error('Brigade information not found');
        setLoading(false);
        return;
      }

      const brigadeData = brigadeSnapshot.docs[0].data() as Brigade;
      setResult({ student: studentData, brigade: brigadeData });
      toast.success('Brigade details found!');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <img src="/Ignite.png" alt="Ignite" className="mx-auto mb-5 h-14 w-auto sm:h-20" />
          <Badge variant="secondary" className="mb-4">
            Brigade Portal · 2026
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find Your Brigade &amp; Venue
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Enter your roll number to instantly see your brigade, venue location, and your brigade lead's contact
            details.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-10 max-w-md"
        >
          <Card className="shadow-xl shadow-slate-200/50">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter your roll number (e.g., 15394)"
                    className="h-12 pl-11 text-base"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Search className="h-5 w-5" /> Find My Brigade
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-8 max-w-md"
          >
            <Card className="overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="bg-primary px-6 py-5 text-primary-foreground">
                <p className="text-sm/none opacity-80">Brigade assignment for</p>
                <p className="mt-1 text-xl font-semibold">{result.student.stdname}</p>
                <p className="text-sm opacity-80">Roll No. {result.student.stdroll}</p>
              </div>
              <CardContent className="space-y-4 p-6">
                <DetailRow icon={<Shield className="h-4 w-4" />} label="Brigade">
                  <Badge>{result.brigade.bnameno}</Badge>
                </DetailRow>
                <DetailRow icon={<User className="h-4 w-4" />} label="Brigade Lead">
                  <span className="font-medium">{result.brigade.blname}</span>
                </DetailRow>
                <DetailRow icon={<MapPin className="h-4 w-4 text-success" />} label="Venue">
                  <span className="font-medium">{result.brigade.venue}</span>
                </DetailRow>

                <a
                  href={`tel:+91${result.brigade.blno}`}
                  className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Call your brigade lead</p>
                      <p className="font-semibold text-foreground">{result.brigade.blno}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Having trouble? Contact your brigade lead for venue clarification.
        </p>
      </div>

      <PopupDialog popup={popup} open={popupOpen} onOpenChange={setPopupOpen} />
    </div>
  );
};

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </span>
      {children}
    </div>
  );
}

export default HomePage;
