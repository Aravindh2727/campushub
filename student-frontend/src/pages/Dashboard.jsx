import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { User, Award, BookOpen, Megaphone } from 'lucide-react';
import { FilePreviewModal } from '../components/ui/FilePreviewModal';

export default function Dashboard() {
  const { student } = useOutletContext();
  const [circulars, setCirculars] = useState([]);
  const [loadingCirculars, setLoadingCirculars] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseURL}/student-portal/circulars`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCirculars(response.data.data || []);
      } catch (error) {
        console.error('Error fetching circulars:', error);
      } finally {
        setLoadingCirculars(false);
      }
    };
    fetchCirculars();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 shadow-xl">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-white/70" />
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {student.name}!</h1>
            {student.tamilName && <p className="text-indigo-100 mb-4">{student.tamilName}</p>}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
                Std {student.standard} - {student.section}
              </span>
              <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
                EMIS No: {student.emisNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Exams</p>
            <p className="text-lg font-bold text-gray-900">{student.terms ? student.terms.length : 0}</p>
          </div>
        </div>
      </div>
      
      {/* Circulars Section */}
      {!loadingCirculars && circulars.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl shadow-sm border border-orange-200 mt-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Recent Announcements</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circulars.map(circular => (
              <div key={circular._id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{circular.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{circular.description}</p>
                
                {circular.fileUrl && circular.fileType === 'image' && (
                  <div 
                    className="mb-3 h-32 rounded-lg overflow-hidden border border-gray-100 cursor-pointer"
                    onClick={() => setPreviewFile(circular)}
                  >
                    <img src={circular.fileUrl} alt="Attachment" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                )}

                {circular.fileUrl && circular.fileType !== 'image' && (
                  <button 
                    onClick={() => setPreviewFile(circular)}
                    className="mb-3 p-2 rounded-lg border border-orange-200 bg-orange-50 flex items-center gap-2 hover:bg-orange-100 transition-colors text-left w-full"
                  >
                    <div className="p-1.5 bg-orange-500/10 rounded-md shrink-0">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {circular.fileName || "View Document"}
                      </p>
                    </div>
                  </button>
                )}
                
                <div className="mt-auto text-[10px] font-bold text-orange-600/70 uppercase tracking-wider">
                  Posted by {circular.postedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Navigate using the sidebar</h2>
        <p className="text-gray-500">
          Check out your <strong>Profile</strong> for full personal details, or visit <strong>Marks</strong> to see your academic performance in all exams.
        </p>
      </div>

      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileUrl={previewFile.fileUrl}
          fileType={previewFile.fileType}
          fileName={previewFile.fileName}
        />
      )}
    </div>
  );
}
