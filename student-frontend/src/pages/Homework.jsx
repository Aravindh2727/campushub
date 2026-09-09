import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Calendar, AlertCircle, Mic, Image as ImageIcon, X, FileText, Download, Link as LinkIcon, Eye } from 'lucide-react';

export default function Homework() {
  const { student } = useOutletContext();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState(null);

  const handleViewDocument = (e, url) => {
    e.preventDefault();
    if (url.startsWith('data:')) {
      try {
        const arr = url.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], {type: mime});
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        
        // Clean up object URL after a delay (give browser time to open it)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      } catch (err) {
        console.error("Failed to parse base64 for viewing:", err);
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseURL}/student-portal/homework`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHomeworkList(response.data.data || []);
      } catch (error) {
        console.error('Error fetching homework:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, []);

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600 bg-red-50 border-red-200' };
    if (diffDays === 0) return { text: 'Due Today', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    return { text: `Due in ${diffDays} days`, color: 'text-green-600 bg-green-50 border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
            <p className="text-gray-500 text-sm">Your assignments for Standard {student.standard} - {student.section}</p>
          </div>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-100 shadow-sm hidden sm:block">
          Auto-deletes after 48 hours
        </div>
      </div>

      {homeworkList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Homework Assigned</h3>
          <p className="text-gray-500">You're all caught up! Enjoy your free time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {homeworkList.map((hw) => {
            const status = getDaysRemaining(hw.dueDate);
            
            return (
              <div key={hw._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${status.text === 'Overdue' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {hw.subject}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                      {status.text === 'Overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {status.text}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {hw.title}
                  </h3>
                  
                  {hw.description && (
                    <p className="text-gray-600 text-sm mb-4 flex-1 whitespace-pre-wrap">
                      {hw.description}
                    </p>
                  )}
                  
                  {/* Media Attachments Section */}
                  {(hw.photoUrls?.length > 0 || hw.photoUrl || hw.voiceUrl || hw.link) && (
                    <div className="mb-6 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attachments</h4>
                      
                      {hw.link && (
                        <div className="flex flex-col mb-3">
                          <a 
                            href={hw.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-3 rounded-xl transition-colors border border-indigo-100 w-fit"
                          >
                            <LinkIcon className="w-4 h-4 mr-2" /> 
                            Open External Link
                          </a>
                        </div>
                      )}
                      
                      {hw.link && (hw.photoUrls?.length > 0 || hw.photoUrl || hw.voiceUrl) && <hr className="border-gray-200 mb-3" />}
                      
                      {(hw.photoUrls?.length > 0 ? hw.photoUrls : hw.photoUrl ? [hw.photoUrl] : []).length > 0 && (
                        <div className="flex flex-col">
                          <span className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Attached Files ({ (hw.photoUrls?.length > 0 ? hw.photoUrls : hw.photoUrl ? [hw.photoUrl] : []).length })
                          </span>
                          <div className="flex flex-wrap gap-3">
                            {(hw.photoUrls?.length > 0 ? hw.photoUrls : hw.photoUrl ? [hw.photoUrl] : []).map((url, index) => {
                              const isImage = url.startsWith('data:image/');
                              return isImage ? (
                                <button 
                                  key={index}
                                  onClick={() => setExpandedImage(url)}
                                  className="relative rounded-lg overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-fit shrink-0"
                                >
                                  <img 
                                    src={url} 
                                    alt={`Homework attachment ${index + 1}`} 
                                    className="h-24 w-auto object-cover hover:opacity-90 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-colors">
                                    <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                                      Click to expand
                                    </span>
                                  </div>
                                </button>
                              ) : (
                                <div key={index} className="flex flex-col items-center justify-between h-28 w-[120px] rounded-lg border border-gray-200 bg-white p-2 shrink-0 hover:shadow-sm transition-shadow">
                                  <div className="flex flex-col items-center flex-1 justify-center w-full overflow-hidden">
                                    <FileText className="w-8 h-8 text-indigo-400 mb-1 shrink-0" />
                                    <span className="text-[10px] text-gray-600 px-1 truncate w-full text-center">Document {index + 1}</span>
                                  </div>
                                  <div className="flex w-full items-center justify-center gap-1.5 mt-1 border-t border-gray-100 pt-2 shrink-0">
                                    <button onClick={(e) => handleViewDocument(e, url)} className="flex-1 text-[9px] font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors px-1 py-1.5 rounded">
                                      <Eye className="w-3 h-3 mr-1" /> View
                                    </button>
                                    <a href={url} download={`Attachment-${index + 1}`} className="flex-1 text-[9px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 transition-colors px-1 py-1.5 rounded">
                                      <Download className="w-3 h-3 mr-1" /> Save
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {(hw.photoUrls?.length > 0 || hw.photoUrl) && hw.voiceUrl && <hr className="border-gray-200" />}
                      
                      {hw.voiceUrl && (
                        <div className="flex flex-col">
                          <span className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <Mic className="w-4 h-4 mr-2 text-red-500" /> Voice Instructions
                          </span>
                          <audio src={hw.voiceUrl} controls className="w-full h-10" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-gray-50 rounded-lg">
                      By {hw.assignedBy}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Image Modal overlay */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full"
              onClick={(e) => { e.stopPropagation(); setExpandedImage(null); }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded homework attachment" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
          </div>
        </div>
      )}
    </div>
  );
}
