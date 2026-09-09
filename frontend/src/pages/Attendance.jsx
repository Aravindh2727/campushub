import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appState } from '../lib/appState';
import { useClassConfig } from '../context/ClassConfigContext';
import { api } from '../lib/api';
import { Calendar, Save, CheckCircle, Clock, Search, ShieldAlert, BarChart2, Edit3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { io } from 'socket.io-client';

export function Attendance() {
  const { dbUser } = useAuth();
  const { classConfigs = [] } = useClassConfig() || {};
  const configs = classConfigs;
  
  const isAdmin = dbUser?.role === 'admin';
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('');
  const [period, setPeriod] = useState('1');
  const [attendanceType, setAttendanceType] = useState('period'); // 'daily' or 'period'
  
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [activeTab, setActiveTab] = useState('take');
  const [summaryData, setSummaryData] = useState([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Real-time updates listener
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(baseURL.replace('/api', ''));

    socket.on('liveAttendanceUpdate', (data) => {
      if (standard && section && data.standard === standard && data.section === section) {
        // Automatically refresh summary if viewing the same class
        if (activeTab === 'summary' && date === data.date) {
          fetchSummaryData();
        }
        // Also refresh 'take' view if looking at same date and period/type
        if (activeTab === 'take' && date === data.date && attendanceType === data.attendanceType) {
          if (attendanceType === 'daily' || period === data.period?.toString()) {
            fetchAttendanceData();
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [standard, section, date, period, activeTab]);

  useEffect(() => {
    return () => appState.setFormDirty('Attendance', false);
  }, []);

  // Extract unique standards
  const standards = [...new Set(configs.map(c => c.standard))].sort();
  // Extract sections for selected standard
  const sections = configs
    .filter(c => c.standard === standard)
    .map(c => c.section)
    .sort();

  // If a teacher has assignedClasses, default to the first one
  useEffect(() => {
    if (!isAdmin && dbUser?.assignedClasses?.length > 0 && !standard) {
      const cls = dbUser.assignedClasses[0];
      setStandard(cls.standard);
      setSection(cls.section);
    }
  }, [dbUser, isAdmin, standard]);

  const fetchAttendanceData = async () => {
    if (!standard || !section || !date) return;
    if (attendanceType === 'period' && !period) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMsg('');
    
    try {
      // 1. Fetch Students
      const stuRes = await api.getStudents(standard, section);
      const studentList = stuRes.data || [];
      setStudents(studentList);
      
      // 2. Fetch Attendance Record
      const attRes = await api.getAttendance(standard, section, date, attendanceType === 'period' ? period : null, attendanceType);
      
      const newRecords = {};
      if (attRes.records && attRes.records.length > 0) {
        // Map existing records
        attRes.records.forEach(r => {
          newRecords[r.student._id || r.student] = r.status;
        });
        setIsSubmitted(attRes.isSubmitted || false);
      } else {
        // Default all to Present
        studentList.forEach(s => {
          newRecords[s._id] = 'Present';
        });
        setIsSubmitted(false);
      }
      
      setRecords(newRecords);
      appState.setFormDirty('Attendance', false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    if (!standard || !section || !date) return;
    setIsSummaryLoading(true);
    setError(null);
    try {
      const res = await api.getAttendanceSummary(standard, section, date);
      setSummaryData(res || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch summary data.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    if (isLocked) return;
    setRecords(prev => ({ ...prev, [studentId]: status }));
    appState.setFormDirty('Attendance', true);
  };

  const handleSave = async (submit = false) => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg('');
    
    try {
      const recordsArray = Object.keys(records).map(studentId => ({
        student: studentId,
        status: records[studentId]
      }));
      
      await api.saveAttendance({
        date,
        standard,
        section,
        period: attendanceType === 'period' ? Number(period) : null,
        attendanceType,
        records: recordsArray,
        isSubmitted: submit
      });
      
      setSuccessMsg(submit ? 'Attendance submitted successfully!' : 'Attendance saved successfully!');
      
      if (submit) {
        setIsSubmitted(true);
      }
      appState.setFormDirty('Attendance', false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete attendance for this class and date?')) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.deleteAttendance(standard, section, date, attendanceType === 'period' ? period : null, attendanceType);
      setSuccessMsg('Attendance deleted successfully!');
      setRecords({});
      setIsSubmitted(false);
      appState.setFormDirty('Attendance', false);
      fetchAttendanceData();
    } catch(err) {
      setError(err.message || 'Failed to delete attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLocked = isSubmitted && !isAdmin;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2E1C40]">Attendance Register</h1>
          <p className="text-sm text-gray-500">Manage daily period-wise attendance</p>
        </div>
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab('take')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors", activeTab === 'take' ? "bg-[#2E1C40] text-white" : "text-gray-500 hover:bg-gray-50")}
          >
            <Edit3 className="w-4 h-4" /> Take Attendance
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors", activeTab === 'summary' ? "bg-[#2E1C40] text-white" : "text-gray-500 hover:bg-gray-50")}
          >
            <BarChart2 className="w-4 h-4" /> Summary Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {/* Attendance Mode Toggle */}
      {activeTab === 'take' && (
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => { setAttendanceType('daily'); setStudents([]); setIsSubmitted(false); }}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors", attendanceType === 'daily' ? "bg-adminSidebar text-white" : "text-gray-500 hover:bg-gray-50")}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => { setAttendanceType('period'); setStudents([]); setIsSubmitted(false); }}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors", attendanceType === 'period' ? "bg-adminSidebar text-white" : "text-gray-500 hover:bg-gray-50")}
          >
            Period Attendance
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-[#4C677C] focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Standard</label>
          <select 
            value={standard} 
            onChange={e => { setStandard(e.target.value); setSection(''); }}
            disabled={!isAdmin && dbUser?.assignedClasses?.length > 0}
            className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-[#4C677C] disabled:opacity-50"
          >
            <option value="">Select</option>
            {standards.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
          <select 
            value={section} 
            onChange={e => setSection(e.target.value)}
            disabled={!standard || (!isAdmin && dbUser?.assignedClasses?.length > 0)}
            className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-[#4C677C] disabled:opacity-50"
          >
            <option value="">Select</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        {activeTab === 'take' && attendanceType === 'period' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Period</label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-[#4C677C]"
              >
                {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>
          </div>
        )}
        
        <div className="flex items-end">
          {activeTab === 'take' ? (
            <button 
              onClick={fetchAttendanceData}
              disabled={!standard || !section || (attendanceType === 'period' && !period) || isLoading}
              className="w-full bg-[#2E1C40] text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#4C677C] transition-colors disabled:opacity-50"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              Fetch
            </button>
          ) : (
            <button 
              onClick={fetchSummaryData}
              disabled={!standard || !section || !date || isSummaryLoading}
              className="w-full bg-[#2E1C40] text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#4C677C] transition-colors disabled:opacity-50"
            >
              {isSummaryLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BarChart2 className="w-4 h-4" />}
              Get Summary
            </button>
          )}
        </div>
      </div>

      {/* Attendance List */}
      {activeTab === 'take' && students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="font-bold text-[#2E1C40]">Class List</h3>
              <p className="text-xs text-gray-500">{students.length} Students</p>
            </div>
            {isSubmitted && (
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Submitted
                {isAdmin && " (Admin Override Active)"}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold">Roll No / EMIS</th>
                  <th className="px-6 py-3 font-semibold">Student Name</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{student.emisNumber}</td>
                    <td className="px-6 py-3">{student.name}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {['Present', 'Absent', 'Late'].map(status => (
                          <button
                            key={status}
                            disabled={isLocked}
                            onClick={() => handleStatusChange(student._id, status)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                              records[student._id] === status 
                                ? (status === 'Present' ? 'bg-green-100 text-green-700 border-green-200' : 
                                   status === 'Absent' ? 'bg-red-100 text-red-700 border-red-200' : 
                                   'bg-yellow-100 text-yellow-700 border-yellow-200')
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(!isLocked) && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                {isSubmitted && isAdmin && (
                  <button 
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    Delete {attendanceType === 'daily' ? 'Daily' : 'Period'} Attendance
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-[#4C677C] text-[#2E1C40] rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Draft
                </button>
                <button 
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2E1C40] text-white rounded-xl text-sm font-bold hover:bg-[#4C677C] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> {isSubmitted ? 'Update Attendance' : 'Submit Attendance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary View */}
      {activeTab === 'summary' && summaryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="font-bold text-[#2E1C40]">Attendance Summary</h3>
              <p className="text-xs text-gray-500">Submitted periods for {standard} - {section} on {date}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">EMIS No</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                    <th key={p} className="px-3 py-3 font-semibold text-center">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaryData.map(row => (
                  <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-3 text-gray-500">{row.emisNumber}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <td key={p} className="px-3 py-3 text-center">
                        {row.periods[p] === 'P' && <span className="font-bold text-green-600">P</span>}
                        {row.periods[p] === 'A' && <span className="font-bold text-red-600">A</span>}
                        {row.periods[p] === 'L' && <span className="font-bold text-yellow-600">L</span>}
                        {row.periods[p] === '-' && <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'take' && students.length === 0 && !isLoading && !error && date && standard && section && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-600">No Students Found</h3>
          <p className="text-gray-400 text-sm">Please make sure the class has students enrolled or try different filters.</p>
        </div>
      )}

      {activeTab === 'summary' && summaryData.length === 0 && !isSummaryLoading && !error && standard && section && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-600">No Summary Found</h3>
          <p className="text-gray-400 text-sm">There is no submitted attendance for this class yet.</p>
        </div>
      )}
    </div>
  );
}
