import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { api } from '../lib/api';

export function AiDashboard() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your Data Analyst AI. Ask me anything about the school records and Student\'s Detail' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, '').replace(/#/g, ''));
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const response = await api.askAI(userQuery);
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred.';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}. (Please check your backend Render logs for more details)` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#2E1C40] dark:text-gray-900 flex items-center gap-2">
          <Bot className="w-8 h-8 text-adminSidebar dark:text-adminAccent2" />
          AI Data Analyst
        </h2>
        <p className="text-[#4C677C] dark:text-gray-500">
          Ask questions about student performance, rankings, and analytics.
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-white border border-[#E5D9C4] dark:border-gray-200 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#F2FCFA] dark:bg-adminBg">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] md:max-w-[75%] rounded-3xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-adminSidebar text-white dark:bg-adminAccent2 text-white text-[#2E1C40] dark:text-[#0B1221] font-medium rounded-br-sm' 
                  : 'bg-white dark:bg-white border border-[#E5D9C4] dark:border-gray-200 text-[#2E1C40] dark:text-gray-900 rounded-bl-sm'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                        isSpeaking 
                          ? 'text-red-500 bg-red-50 dark:bg-red-500/20' 
                          : 'text-[#4C677C] dark:text-gray-500 hover:text-[#2E1C40] dark:hover:text-gray-900 bg-[#E5D9C4] dark:bg-gray-100 hover:bg-[#D8FDF6] dark:hover:bg-white/20'
                      }`}
                      title={isSpeaking ? "Stop reading" : "Read aloud"}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          Stop Reading
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          Read Aloud
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-white border border-[#E5D9C4] dark:border-gray-200 rounded-3xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3 text-[#4C677C] dark:text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-adminSidebar dark:text-adminAccent2" />
                <span>Analyzing database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 bg-white dark:bg-white border-t border-[#E5D9C4] dark:border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 items-center max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 min-w-0 bg-[#F2FCFA] dark:bg-adminBg border border-[#E5D9C4] dark:border-gray-200 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-sm md:text-base text-[#2E1C40] dark:text-gray-900 placeholder-[#4C677C]/60 dark:placeholder-white/40 focus:outline-none focus:border-adminSidebar dark:focus:border-adminAccent2 focus:ring-2 focus:ring-[#62D4CA]/20 dark:focus:ring-[#F9CB84]/20 transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={startListening}
              className={`p-3 md:p-4 shrink-0 rounded-xl md:rounded-2xl transition-all shadow-sm ${isListening ? 'bg-red-500 hover:bg-red-600 text-gray-900 animate-pulse' : 'bg-[#E5D9C4] dark:bg-gray-100 text-[#4C677C] dark:text-gray-500 hover:text-[#2E1C40] dark:hover:text-gray-900 hover:bg-[#D8FDF6] dark:hover:bg-white/20'}`}
              title="Speak"
            >
              {isListening ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 md:p-4 shrink-0 bg-adminSidebar text-white dark:bg-adminAccent2 text-white hover:bg-[#4C677C] dark:hover:bg-adminAccent2 disabled:opacity-50 disabled:cursor-not-allowed text-[#2E1C40] dark:text-[#0B1221] rounded-xl md:rounded-2xl transition-all shadow-md hover:shadow-lg"
              title="Send Message"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
