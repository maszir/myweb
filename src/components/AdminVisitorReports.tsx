import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, Globe, Monitor, Chrome, MapPin, Clock } from 'lucide-react';

interface VisitorLog {
  id: string;
  ip: string;
  location: string;
  os: string;
  browser: string;
  timestamp: any;
}

export default function AdminVisitorReports() {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'visitor_logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitorLog[];
      setVisitors(logs);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-6 bg-dark-surface rounded-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Globe className="text-neon-cyan" /> Visitor Reports
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase bg-dark-bg text-gray-300">
            <tr>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Browser</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor) => (
              <tr key={visitor.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-neon-cyan">{visitor.ip}</td>
                <td className="px-4 py-3">{visitor.location}</td>
                <td className="px-4 py-3 flex items-center gap-2"><Monitor className="w-3 h-3" /> {visitor.os}</td>
                <td className="px-4 py-3 flex items-center gap-2"><Chrome className="w-3 h-3" /> {visitor.browser}</td>
                <td className="px-4 py-3">{visitor.timestamp?.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
