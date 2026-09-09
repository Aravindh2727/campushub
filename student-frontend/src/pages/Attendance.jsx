import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = async () => {
    const token = localStorage.getItem('studentToken');
    if (!token) return;

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/student-portal/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAttendanceData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(baseURL.replace('/api', ''));

    socket.on('liveAttendanceUpdate', (data) => {
      // Re-fetch attendance when someone updates it
      fetchAttendance();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate summary stats
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;

  attendanceData.forEach(day => {
    Object.values(day.periods).forEach(status => {
      if (status === 'P') totalPresent++;
      if (status === 'A') totalAbsent++;
      if (status === 'L') totalLate++;
    });
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500">View your daily period-wise attendance records.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-green-600">{totalPresent}</span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Present</span>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-red-600">{totalAbsent}</span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Absent</span>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-yellow-600">{totalLate}</span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Late</span>
        </div>
      </div>

      {/* Attendance Grid */}
      {attendanceData.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden flex flex-col">
          <div className="w-full max-h-[60vh] overflow-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-max">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 sm:px-6 py-4 font-semibold">Date</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                    <th key={p} className="px-2 sm:px-3 py-4 font-semibold text-center">P{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceData.map(row => (
                  <tr key={row.date} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <td key={p} className="px-2 sm:px-3 py-3 text-center">
                        {row.periods[p] === 'P' && <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">P</span>}
                        {row.periods[p] === 'A' && <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">A</span>}
                        {row.periods[p] === 'L' && <span className="font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">L</span>}
                        {row.periods[p] === '-' && <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No Attendance Records</h3>
          <p className="text-gray-500 text-sm mt-1">Your attendance hasn't been submitted for any classes yet.</p>
        </div>
      )}
    </div>
  );
}
