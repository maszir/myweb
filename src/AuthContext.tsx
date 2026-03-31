import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isPinVerified: boolean;
  needsPin: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false,
  isPinVerified: false,
  needsPin: false,
  verifyPin: async () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [needsPin, setNeedsPin] = useState(false);

  useEffect(() => {
    const checkPinRequirement = async () => {
      try {
        const res = await fetch('/api/needs-pin');
        if (res.ok) {
          const data = await res.json();
          setNeedsPin(data.needsPin);
          
          if (!data.needsPin) {
            setIsPinVerified(true);
          }
          
          // Check if already verified in this session
          const savedPin = localStorage.getItem('adminPin');
          if (savedPin && data.needsPin) {
            const verifyRes = await fetch('/api/verify-pin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pin: savedPin })
            });
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setIsPinVerified(true);
              } else {
                localStorage.removeItem('adminPin');
              }
            }
          }
        } else {
          console.error('API call failed:', await res.text());
          // Fallback: assume no PIN needed if API fails, or handle as needed
          setNeedsPin(false);
          setIsPinVerified(true);
        }
      } catch (err) {
        console.error('Failed to check PIN requirement', err);
      }
    };

    checkPinRequirement();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const verifyPin = async (pin: string) => {
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsPinVerified(true);
          localStorage.setItem('adminPin', pin);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('PIN verification failed', err);
      return false;
    }
  };

  const isAdmin = !!(user?.email === 'wazirusid@gmail.com' && isPinVerified);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isPinVerified, needsPin, verifyPin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
