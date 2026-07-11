import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white px-4">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg text-center"
      >
        <img src="/Ignite.png" alt="Ignite" className="mx-auto mb-8 h-12 w-auto" />

        <div className="relative mb-2">
          <p className="bg-gradient-to-b from-primary to-primary/40 bg-clip-text text-8xl font-black tracking-tight text-transparent sm:text-9xl">
            404
          </p>
          <motion.div
            initial={{ rotate: -12, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, delay: 0.15 }}
            className="absolute -right-2 top-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 sm:right-8"
          >
            <Compass className="h-7 w-7 text-primary-foreground" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" /> Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
