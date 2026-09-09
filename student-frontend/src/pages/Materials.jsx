import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, Link as LinkIcon, Calendar, ExternalLink } from 'lucide-react';

export default function Materials() {
  const { student } = useOutletContext();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseURL}/student-portal/materials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMaterials(response.data.data || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-[#62D4CA]/20 text-[#62D4CA] rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
          <p className="text-sm text-gray-500">Materials shared by your teachers</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading study materials...</div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Materials Yet</h3>
          <p className="text-gray-500 text-sm">Your teachers haven't uploaded any study materials yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div key={mat._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#62D4CA]"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="bg-[#62D4CA]/10 text-[#62D4CA] px-3 py-1 rounded-full text-xs font-bold">
                  {mat.subject}
                </span>
                <span className="text-xs text-gray-400 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(mat.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{mat.title}</h3>
              
              {mat.description && (
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  {mat.description}
                </p>
              )}
              
              <div className="mt-auto pt-4">
                <a 
                  href={mat.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#0f8b80] font-bold rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Material
                </a>
              </div>
              
              <div className="mt-3 text-center text-xs text-gray-400">
                Uploaded by: {mat.uploadedBy}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
