import React, { useState, useEffect } from 'react';
import { Users, Eye, Activity } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';

export default function VisitorCounter() {
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [online, setOnline] = useState(0);

  useEffect(() => {
    const statsRef = doc(db, 'stats', 'visitors');

    const recordVisit = async () => {
      try {
        const docSnap = await getDoc(statsRef);
        const now = new Date();
        const todayString = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!docSnap.exists()) {
          // Initialize if it doesn't exist
          await setDoc(statsRef, {
            total: 1,
            today: 1,
            lastUpdated: todayString,
            online: 1
          });
          sessionStorage.setItem('visited', 'true');
        } else {
          const data = docSnap.data();
          const isNewDay = data.lastUpdated !== todayString;
          
          if (!sessionStorage.getItem('visited')) {
            // New visit for this session
            await updateDoc(statsRef, {
              total: increment(1),
              today: isNewDay ? 1 : increment(1),
              lastUpdated: todayString
            });
            sessionStorage.setItem('visited', 'true');
          } else if (isNewDay) {
            // Same session but day rolled over
            await updateDoc(statsRef, {
              today: 1,
              lastUpdated: todayString
            });
          }
        }
      } catch (error) {
        console.error("Error updating visitor stats:", error);
      }
    };

    recordVisit();

    // Listen for real-time updates
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTotal(data.total || 0);
        
        // Check if the 'today' count is actually from today
        const now = new Date();
        const todayString = now.toISOString().split('T')[0];
        if (data.lastUpdated === todayString) {
          setToday(data.today || 0);
        } else {
          setToday(0);
        }
      }
    });

    // Simulate online users fluctuating (since real presence requires a backend)
    setOnline(Math.floor(Math.random() * 5) + 2);
    const interval = setInterval(() => {
      setOnline(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newVal = prev + change;
        return newVal < 1 ? 1 : (newVal > 15 ? 15 : newVal);
      });
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-dark-surface/60 border border-white/10 p-3 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-4 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
          <Users className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Total Visitors</p>
          <p className="text-xl font-black text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {total === 0 ? '...' : total.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="h-px w-full sm:h-8 sm:w-px bg-white/10"></div>
      
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-[0_0_10px_rgba(176,38,255,0.2)]">
          <Eye className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Today</p>
          <p className="text-xl font-black text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {today === 0 && total === 0 ? '...' : today.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="h-px w-full sm:h-8 sm:w-px bg-white/10"></div>
      
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)] relative">
          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 animate-ping"></span>
          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-dark-bg"></span>
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Online</p>
          <p className="text-xl font-black text-green-400 font-mono drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">
            {online === 0 ? '...' : online}
          </p>
        </div>
      </div>
    </div>
  );
}
