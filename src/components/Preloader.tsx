import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 seconds preloader

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-dark-bg"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer glowing ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute h-32 w-32 rounded-full border-t-2 border-r-2 border-neon-cyan/80 shadow-[0_0_30px_rgba(0,240,255,0.5)]"
            />
            {/* Inner glowing ring */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute h-24 w-24 rounded-full border-b-2 border-l-2 border-neon-purple/80 shadow-[0_0_30px_rgba(176,38,255,0.5)]"
            />
            
            {/* Center Logo/Text */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="z-10 text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            >
              ZIR<span className="text-neon-purple">GG</span>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-sm font-medium tracking-widest text-neon-cyan uppercase"
          >
            Loading...
          </motion.div>
          
          {/* Progress bar */}
          <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
