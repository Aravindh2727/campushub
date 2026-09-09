import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Code, Briefcase, GraduationCap, Globe, User, Layout, Smartphone, BrainCircuit, Server, Database, MonitorPlay, Cloud, Network, X } from 'lucide-react';

const DEVELOPER_INFO = {
  name: 'Aravindh V',
  photoUrl: '/Aravindh.jpeg?v=2',
  bannerUrl: '/aravindh profile banner.png?v=2',
  title: 'Full-Stack Web & Mobile App Developer',
  education: 'B.Sc Computer Science (AI & ML)',
  university: 'Takshashila University',
  expectedGraduation: '2027',
  summary: 'Results-driven software developer focused on building full-stack web applications, mobile applications, AI/ML solutions, and scalable digital systems.',
  techStack: [
    'React.js', 'JavaScript', 'HTML5', 'CSS3',
    'Node.js', 'Express.js', 'Python', 'MongoDB',
    'REST APIs', 'Kotlin', 'Jetpack Compose', 'Firebase',
    'Git', 'GitHub', 'Docker', 'CI/CD', 'AI / Machine Learning'
  ],
  links: {
    portfolio: 'https://aravindh2727.github.io/',
    github: 'https://github.com/Aravindh2727',
    linkedin: 'https://www.linkedin.com/in/aravindh-v2727'
  },
  developmentAreas: [
    { title: 'Full-Stack Web Development', icon: Layout },
    { title: 'Mobile App Development', icon: Smartphone },
    { title: 'Artificial Intelligence & Machine Learning', icon: BrainCircuit },
    { title: 'REST API Development', icon: Server },
    { title: 'Database Development', icon: Database },
    { title: 'Responsive UI/UX', icon: MonitorPlay },
    { title: 'Cloud & Deployment', icon: Cloud },
    { title: 'Software Architecture', icon: Network },
  ]
};

export function DeveloperProfile() {
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-12">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="relative bg-gray-900 w-full">
            {DEVELOPER_INFO.bannerUrl ? (
              <img src={DEVELOPER_INFO.bannerUrl} alt="Developer Banner" className="w-full h-auto block object-contain" />
            ) : (
              <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-orange-500"></div>
            )}
          </div>
          <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-t border-gray-100 dark:border-gray-800">
            <div className="shrink-0 bg-white dark:bg-gray-900 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              {DEVELOPER_INFO.photoUrl ? (
                <button 
                  onClick={() => setIsImageOpen(true)}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 block transition-transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  title="Click to view clearly"
                >
                  <img src={DEVELOPER_INFO.photoUrl} alt="Developer Profile" className="w-full h-full object-cover" />
                </button>
              ) : (
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-4 sm:p-6 rounded-2xl flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32">
                  <Code className="w-10 h-10 sm:w-14 sm:h-14" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1 pt-2 sm:pt-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{DEVELOPER_INFO.name}</h1>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium mt-3 flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
                {DEVELOPER_INFO.title}
              </p>
              
              <div className="mt-5 text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base max-w-2xl mx-auto sm:mx-0">
                <p>Have a website, mobile app, or software project in mind? Feel free to contact me to discuss your requirements.</p>
                <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xl">📞</span> Contact: 9342695097
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Me */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About Me</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {DEVELOPER_INFO.summary}
              </p>
            </section>

            {/* Development Areas */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Development Areas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEVELOPER_INFO.developmentAreas.map((area, index) => {
                  const Icon = area.icon;
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{area.title}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Education */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Education</h2>
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{DEVELOPER_INFO.education}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{DEVELOPER_INFO.university}</p>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-2">Expected Graduation: {DEVELOPER_INFO.expectedGraduation}</p>
                </div>
              </div>
            </section>

            {/* Connect With Me */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Connect With Me</h2>
              <div className="space-y-3">
                <a
                  href={DEVELOPER_INFO.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-all group"
                >
                  <Globe className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                  Portfolio Website
                </a>
                <a
                  href={DEVELOPER_INFO.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-semibold transition-all group"
                >
                  <Code className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  GitHub Profile
                </a>
                <a
                  href={DEVELOPER_INFO.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#0077b5] bg-white dark:bg-gray-800 hover:bg-[#f0f7fb] dark:hover:bg-[#0077b5]/10 text-gray-700 dark:text-gray-200 hover:text-[#0077b5] font-semibold transition-all group"
                >
                  <User className="w-5 h-5 text-[#0077b5] group-hover:scale-110 transition-transform" />
                  LinkedIn Profile
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-4">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Developed by {DEVELOPER_INFO.name}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            &copy; 2026
          </p>
        </div>
      </div>

      {/* Image Modal/Lightbox */}
      {isImageOpen && DEVELOPER_INFO.photoUrl && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsImageOpen(false)}
        >
          <button
            onClick={() => setIsImageOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white z-50"
            aria-label="Close image"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={DEVELOPER_INFO.photoUrl}
              alt="Developer Profile Full"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
