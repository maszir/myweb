import React, { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time to Asia/Jakarta (WIB)
  const formattedTime = time.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Format date to Indonesian
  const formattedDate = time.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        {/* Main Clock Container */}
        <div className="relative bg-dark-surface/80 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white font-mono tracking-[0.15em] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
              {formattedTime}
            </span>
            <div className="mt-1 flex items-center space-x-2">
              <div className="h-px w-4 bg-neon-cyan/30"></div>
              <span className="text-[9px] text-neon-cyan font-bold uppercase tracking-wider opacity-90">
                {formattedDate}
              </span>
              <div className="h-px w-4 bg-neon-cyan/30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
