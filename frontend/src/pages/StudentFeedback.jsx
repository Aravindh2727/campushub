import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Trash2, Mic, FileText, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function StudentFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, text, voice, expiring

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await api.getFeedback();
      if (data.success) {
        setFeedback(data.data);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      const data = await api.deleteFeedback(id);
      if (data.success) {
        setFeedback(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Unable to delete feedback.');
    }
  };

  const isExpiringSoon = (expiresAt) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = (expirationDate - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  const filteredFeedback = feedback.filter(item => {
    // Search filter
    const matchesSearch = item.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.studentId?.emisNumber?.includes(searchTerm);
    
    // Type filter
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'text') return matchesSearch && item.type === 'text';
    if (filterType === 'voice') return matchesSearch && item.type === 'voice';
    if (filterType === 'expiring') return matchesSearch && isExpiringSoon(item.expiresAt);
    
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-indigo-600" />
            Student Feedback
          </h1>
          <p className="mt-2 text-gray-600">View and manage feedback submitted by students. Records automatically expire after 7 days.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name or EMIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {['all', 'text', 'voice', 'expiring'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterType === type
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No feedback found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters.' : "There is no active student feedback at this time."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedback.map((item) => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate pr-4">{item.studentId?.name || 'Unknown Student'}</h3>
                    <p className="text-sm text-gray-500 mt-1">EMIS: {item.studentId?.emisNumber || 'N/A'}</p>
                  </div>
                  <div className={`p-2 rounded-full ${item.type === 'text' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {item.type === 'text' ? <FileText className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </div>
                </div>

                <div className="flex-1 my-4">
                  {item.type === 'text' ? (
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm h-full max-h-48 overflow-y-auto whitespace-pre-wrap border border-gray-100">
                      {item.message}
                    </div>
                  ) : (
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center h-full space-y-4">
                      <audio controls src={item.voiceData} className="w-full h-10 outline-none" />
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="space-y-1">
                    <p>Created: {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className={isExpiringSoon(item.expiresAt) ? 'text-orange-600 font-medium' : ''}>
                      Expires: {new Date(item.expiresAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    title="Delete Feedback"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
