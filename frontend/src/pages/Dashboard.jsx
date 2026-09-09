import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, GraduationCap, Award, Megaphone } from 'lucide-react';
import { StudentProfileModal } from '../components/ui/StudentProfileModal';
import { FilePreviewModal } from '../components/ui/FilePreviewModal';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [circulars, setCirculars] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const fetchStatsAndCirculars = async () => {
      try {
        const [statsRes, circularsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getCirculars().catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setCirculars(circularsRes.data?.slice(0, 3) || []); // Show only latest 3
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndCirculars();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Premium Vibrant Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-lg border border-[#E5D9C4]/20 dark:border-gray-200 flex flex-col items-center text-center justify-center isolate bg-gradient-to-br from-[#1A2942] to-[#0F172A] dark:from-[#131E3A] dark:to-[#0B132B]">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#732A26]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-32 w-64 h-64 bg-[#4C677C]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/2 right-16 w-32 h-32 bg-adminSidebar/20 rounded-full blur-2xl -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[#D8FDF6]/10 border border-[#D8FDF6]/20 text-[#D8FDF6] font-medium text-[10px] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-adminSidebar text-white animate-pulse"></span>
          Teacher Dashboard
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#E5D9C4] tracking-tight drop-shadow-sm">
          Dadapuram Government HR Sec School
        </h1>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10 font-medium">Loading statistics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#D8FDF6] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3 bg-adminSidebar text-white/15 text-adminSidebar rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#4C677C] text-[10px] font-bold uppercase tracking-widest mb-0.5">Total Students</p>
                <h3 className="text-3xl font-extrabold text-[#2E1C40] tracking-tight">{stats?.totalStudents || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5D9C4] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3 bg-[#586F54]/15 text-[#586F54] rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#586F54]/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Male Students</p>
                <h3 className="text-3xl font-extrabold text-[#586F54] tracking-tight">{stats?.maleStudents || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5D9C4] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3 bg-[#AE634A]/15 text-[#AE634A] rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#AE634A]/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Female Students</p>
                <h3 className="text-3xl font-extrabold text-[#AE634A] tracking-tight">{stats?.femaleStudents || 0}</h3>
              </div>
            </div>
          </div>

          {/* Circulars Section */}
          {circulars.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-[#2a1a0f] dark:to-[#1a120b] p-6 rounded-2xl shadow-sm border border-orange-200/50 dark:border-orange-900/30 mt-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-[#2E1C40] dark:text-gray-900 tracking-tight">Recent Announcements</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {circulars.map(circular => (
                  <div key={circular._id} className="bg-white/80 dark:bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200/50 dark:border-orange-900/30 shadow-sm flex flex-col">
                    <h3 className="font-bold text-[#2E1C40] dark:text-gray-900 mb-1 line-clamp-1">{circular.title}</h3>
                    <p className="text-sm text-[#4C677C] dark:text-gray-300 mb-3 line-clamp-2">{circular.description}</p>
                    
                    {circular.fileUrl && circular.fileType === 'image' && (
                      <div 
                        className="mb-3 h-24 rounded-lg overflow-hidden border border-orange-100 dark:border-gray-200 cursor-pointer"
                        onClick={() => setPreviewFile(circular)}
                      >
                        <img src={circular.fileUrl} alt="Attachment" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    )}
                    
                    {circular.fileUrl && circular.fileType !== 'image' && (
                      <button 
                        onClick={() => setPreviewFile(circular)}
                        className="mb-3 p-2 rounded-lg border border-orange-200/50 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10 flex items-center gap-2 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors text-left w-full"
                      >
                        <div className="p-1.5 bg-orange-500/10 rounded-md shrink-0">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2E1C40] dark:text-gray-900 truncate">
                            {circular.fileName || "View Document"}
                          </p>
                        </div>
                      </button>
                    )}
                    
                    <div className="mt-auto text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider">
                      Posted by {circular.postedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 3 Rankers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8FDF6]/80 mt-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-[#4C677C]/10 text-[#4C677C] rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#2E1C40] tracking-tight">Top 3 School Rankers</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.topStudents?.map((student, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                
                return (
                  <div 
                    key={student._id} 
                    onClick={() => setSelectedStudentId(student._id)}
                    className={`relative flex flex-col items-center p-6 rounded-3xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isFirst ? 'bg-[#FDF9F7] border-[#AE634A]/20' : 
                    isSecond ? 'bg-[#F2FCFA] border-adminSidebar/30' : 
                    'bg-[#FCF9F9] border-[#732A26]/20'
                  }`}>
                    {/* Rank Badge */}
                    <div className={`absolute -top-4 w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg shadow-md border-2 border-white ${
                      isFirst ? 'bg-[#AE634A] text-[#E5D9C4]' : 
                      isSecond ? 'bg-adminSidebar text-white text-[#2E1C40]' : 
                      'bg-[#732A26] text-[#E5D9C4]'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mt-3 ${
                      isFirst ? 'bg-[#AE634A]/10 text-[#AE634A]' : 
                      isSecond ? 'bg-adminSidebar text-white/15 text-adminSidebar' : 
                      'bg-[#732A26]/10 text-[#732A26]'
                    }`}>
                      <span className="text-2xl font-black">{student.name.charAt(0)}</span>
                    </div>

                    <h3 className={`text-lg font-bold text-center mb-0.5 ${
                      isFirst ? 'text-[#AE634A]' : isSecond ? 'text-[#4C677C]' : 'text-[#732A26]'
                    }`}>{student.name}</h3>
                    <p className={`font-medium text-sm mb-5 ${
                      isFirst ? 'text-[#AE634A]/60' : isSecond ? 'text-[#4C677C]/60' : 'text-[#732A26]/60'
                    }`}>Class {student.standard}-{student.section}</p>
                    
                    <div className="bg-white px-4 py-3 rounded-xl border border-white flex flex-col items-center w-full shadow-sm">
                      <span className={`text-[9px] uppercase tracking-widest font-bold mb-0.5 ${
                        isFirst ? 'text-[#AE634A]/70' : isSecond ? 'text-[#4C677C]/70' : 'text-[#732A26]/70'
                      }`}>Total Score</span>
                      <span className={`text-2xl font-black ${
                        isFirst ? 'text-[#AE634A]' : isSecond ? 'text-adminSidebar' : 'text-[#732A26]'
                      }`}>
                        {student.totalMarks}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {(!stats?.topStudents || stats.topStudents.length === 0) && (
                <div className="col-span-3 text-center py-10 text-[#4C677C]/60 font-medium bg-[#F4F8F7] rounded-2xl border border-[#D8FDF6] border-dashed">
                  No student scores available yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {selectedStudentId && (
        <StudentProfileModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}

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
