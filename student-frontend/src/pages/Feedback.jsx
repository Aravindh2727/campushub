import React, { useState, useRef } from 'react';
import axios from 'axios';
import { appState } from '../lib/appState';
import { MessageSquare, Mic, Square, Trash2, Send, Play } from 'lucide-react';

export default function Feedback() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'voice'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Text Feedback State
  const [textMessage, setTextMessage] = useState('');

  // Voice Feedback State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const MAX_RECORDING_TIME = 120; // 2 minutes in seconds

  React.useEffect(() => {
    if (textMessage.trim() || isRecording || audioUrl) {
      appState.setFormDirty('Feedback', true);
    } else {
      appState.setFormDirty('Feedback', false);
    }
  }, [textMessage, isRecording, audioUrl]);

  React.useEffect(() => {
    return () => appState.setFormDirty('Feedback', false);
  }, []);

  const cleanupVoiceResources = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64 for upload
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result);
        };

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        cleanupVoiceResources();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission is required for voice feedback.');
      } else {
        setErrorMsg('Voice feedback is not supported on this browser. Please use text feedback.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    cleanupVoiceResources();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const token = localStorage.getItem('studentToken');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const payload = { type: activeTab };
      
      if (activeTab === 'text') {
        payload.message = textMessage;
      } else {
        payload.voiceData = audioBase64;
      }

      const response = await axios.post(`${baseURL}/student-portal/feedback`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        if (activeTab === 'text') {
          setTextMessage('');
        } else {
          deleteRecording();
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrorMsg(error.response?.data?.message || 'Unable to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full pb-24 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-indigo-600" />
          Feedback
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Send your feedback directly to the administrator. All feedback is private and automatically expires in 7 days.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setActiveTab('text'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Text Feedback
          </button>
          <button
            onClick={() => { setActiveTab('voice'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'voice' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Voice Feedback
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
              {successMsg}
            </div>
          )}

          {activeTab === 'text' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Write Feedback</label>
                <textarea
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value.slice(0, 1000))}
                  placeholder="Write your feedback here..."
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-48 transition-all bg-gray-50 focus:bg-white"
                  required
                />
                <div className="flex justify-end mt-2">
                  <span className={`text-xs ${textMessage.length >= 1000 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {textMessage.length} / 1000
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !textMessage.trim()}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6 text-center py-4">
              {!isRecording && !audioUrl && (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Mic className="w-10 h-10 text-indigo-600" />
                  </div>
                  <button
                    onClick={startRecording}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Record Voice Feedback
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Max duration: 2 minutes</p>
                </div>
              )}

              {isRecording && (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping"></div>
                    <div className="relative bg-red-500 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                      <Mic className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                    {formatTime(recordingTime)}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="flex items-center px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    Stop Recording
                  </button>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <audio src={audioUrl} controls className="w-full h-12 outline-none" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={deleteRecording}
                      disabled={loading}
                      className="w-full sm:w-auto flex items-center justify-center px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !audioBase64}
                      className="w-full sm:w-auto flex items-center justify-center px-8 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Voice Feedback
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
