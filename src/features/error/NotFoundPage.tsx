import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSeo } from '@/hooks/useSeo';

export function NotFoundPage() {
  const navigate = useNavigate();

  useSeo({
    title: '404 - Lost in Space',
    description: "The page you're looking for has drifted out of orbit.",
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute right-[15%] bottom-[10%] h-80 w-80 rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 border border-white/10 shadow-glow-blue sm:h-32 sm:w-32">
          <Compass className="h-12 w-12 text-blue-400 sm:h-16 sm:w-16 animate-spin-slow" />
        </div>

        <h1 className="text-7xl font-black tracking-tighter text-white sm:text-9xl">
          4<span className="text-blue-500">0</span>4
        </h1>

        <div className="mt-4 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Orbit Lost</h2>
          <p className="max-w-md text-sm font-medium text-slate-500 leading-relaxed sm:text-base">
            The coordinates you provided lead to a void. The page has either been moved, deleted, or
            never existed in this timeline.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            onClick={() => {
              void navigate(-1);
            }}
            className="group h-14 rounded-2xl border border-white/5 bg-white/5 px-8 transition-all hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>

          <Button
            onClick={() => {
              void navigate('/');
            }}
            className="h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 px-10 font-bold text-white shadow-glow-blue transition-all hover:scale-105 active:scale-95"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Base
          </Button>
        </div>
      </motion.div>

      {/* Decorative Text */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
          Titan Protocol • Signal Lost
        </span>
      </div>
    </div>
  );
}
