import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, GraduationCap, LogOut, BarChart3, ShieldAlert, FileText, User, ChevronLeft, ChevronRight, ChevronUp, Menu, X, Bot, BookOpen, Bell, Megaphone, CalendarCheck, Link, MessageSquare, Code } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useMobileSidebar } from '../../hooks/useMobileSidebar';

export function TeacherLayout() {
  const { isSidebarOpen, setIsSidebarOpen, closeSidebarSafely, navigate } = useMobileSidebar(window.innerWidth >= 768, 768);
  const [isBottomMenuExpanded, setIsBottomMenuExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [circularIds, setCircularIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { logout, dbUser } = useAuth();
  const { isInstallable, installApp } = usePWAInstall();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.getCirculars();
        const data = res.data || [];
        
        const sortedCirculars = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(sortedCirculars);
        
        const ids = data.map(c => c._id);
        setCircularIds(ids);
        
        const readIds = JSON.parse(localStorage.getItem('teacherReadCirculars') || '[]');
        const unread = data.filter(c => !readIds.includes(c._id));
        setUnreadCount(unread.length);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = () => {
    localStorage.setItem('teacherReadCirculars', JSON.stringify(circularIds));
    setUnreadCount(0);
    setIsNotificationPanelOpen(true);
  };

  const handleNavClick = (e, path) => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      closeSidebarSafely(() => navigate(path));
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/teacher', exact: true, icon: LayoutDashboard },
    { name: 'Students', path: '/teacher/students', exact: false, icon: Users },
    { name: 'Gradebook', path: '/teacher/gradebook', exact: false, icon: GraduationCap },
    { name: 'Homework', path: '/teacher/homework', exact: false, icon: BookOpen },
    { name: 'Materials', path: '/teacher/materials', exact: false, icon: Link },
    { name: 'Circulars', path: '/teacher/circulars', exact: false, icon: MessageSquare },
    { name: 'Certificates', path: '/teacher/certificates', exact: false, icon: FileText },
    { name: 'Attendance', path: '/teacher/attendance', exact: false, icon: CalendarCheck },
    { name: 'AI Analyst', path: '/teacher/ai', exact: false, icon: Bot },
  ];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F4F8F7] text-[#2E1C40] font-sans relative z-10">
      
      {/* Mobile Topbar */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-[#2E1C40] border-b border-[#4C677C]/30 flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#D8FDF6] rounded-lg p-1">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#E5D9C4] tracking-tight">
            Edu Teacher
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button 
              onClick={installApp}
              className="p-1.5 px-3 text-xs font-bold bg-[#D8FDF6] text-[#2E1C40] rounded-lg shadow-sm flex items-center gap-1 mr-1"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}
          <button 
            onClick={handleNotificationClick}
            className="relative p-2 text-[#E5D9C4] hover:text-adminSidebar transition-colors rounded-full"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-transparent"></span>
            )}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-adminSidebar text-white text-[#2E1C40] rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-[#2E1C40]/40 backdrop-blur-sm z-40"
          onClick={() => closeSidebarSafely()}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-[#2E1C40] m-4 rounded-2xl shadow-xl border border-[#4C677C]/30 flex flex-col justify-between transition-all duration-300 z-50 shrink-0",
        "fixed md:relative h-[calc(100vh-2rem)]",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-[150%] md:translate-x-0 w-[5.5rem]"
      )}>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className={cn("p-6 flex items-center h-24", isSidebarOpen ? "justify-between" : "justify-center")}>
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#D8FDF6] rounded-xl p-1 shadow-sm">
                  <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-[#E5D9C4] tracking-tight">
                  Edu Teacher
                </h1>
              </div>
            )}
            <div className={cn("hidden md:flex items-center gap-1", !isSidebarOpen && "flex-col mt-4")}>
              <button 
                onClick={handleNotificationClick}
                className="relative p-2 rounded-xl hover:bg-[#4C677C]/40 text-[#D8FDF6]/70 hover:text-[#D8FDF6] transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-xl hover:bg-[#4C677C]/40 text-[#D8FDF6]/70 hover:text-[#D8FDF6] transition-colors"
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <nav className="mt-2 px-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={(e) => handleNavClick(e, item.path)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-xl transition-all duration-300",
                    isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mb-2 mx-auto w-12",
                    isActive 
                      ? "bg-adminSidebar text-white text-[#2E1C40] shadow-md font-bold border-l-4 border-[#D8FDF6]" 
                      : "text-[#E5D9C4]/70 hover:bg-[#4C677C]/40 hover:text-[#E5D9C4] font-medium border-l-4 border-transparent"
                  )
                }
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
                {isSidebarOpen ? (
                  <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                ) : (
                  <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">{item.name}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={cn("p-4 shrink-0 border-t border-[#4C677C]/30", !isSidebarOpen && "flex flex-col items-center")}>
          {isInstallable && (
            <button 
              onClick={installApp}
              className={cn(
                "flex items-center rounded-xl transition-all duration-300 w-full font-bold mb-2",
                isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                "bg-[#D8FDF6] text-[#2E1C40] shadow-md border-l-4 border-transparent"
              )}
              title={!isSidebarOpen ? "Install App" : undefined}
            >
              <Download className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
              {isSidebarOpen ? (
                <span className="whitespace-nowrap overflow-hidden">Install App</span>
              ) : (
                <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">Install App</span>
              )}
            </button>
          )}

          <div className="flex justify-center w-full mb-1">
            <button 
              type="button"
              onClick={() => setIsBottomMenuExpanded(!isBottomMenuExpanded)}
              className="p-1.5 rounded-full text-[#E5D9C4]/50 hover:bg-[#4C677C]/40 hover:text-[#E5D9C4] transition-colors focus:outline-none"
              aria-label={isBottomMenuExpanded ? "Collapse account menu" : "Expand account menu"}
              aria-expanded={isBottomMenuExpanded}
            >
              <ChevronUp className={cn("w-4 h-4 transition-transform duration-300", isBottomMenuExpanded && "rotate-180")} />
            </button>
          </div>

          <div 
            className={cn(
              "flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out w-full",
              isBottomMenuExpanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
            )}
          >
            <NavLink
              to="/teacher/profile"
              onClick={(e) => handleNavClick(e, '/teacher/profile')}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl transition-all duration-300 w-full",
                  isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                  isActive 
                    ? "bg-adminSidebar text-white text-[#2E1C40] shadow-md font-bold border-l-4 border-[#D8FDF6]" 
                    : "text-[#E5D9C4]/70 hover:bg-[#4C677C]/40 hover:text-[#E5D9C4] font-medium border-l-4 border-transparent"
                )
              }
              title={!isSidebarOpen ? "My Profile" : undefined}
            >
              <User className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
              {isSidebarOpen ? (
                <span className="whitespace-nowrap overflow-hidden">My Profile</span>
              ) : (
                <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">My Profile</span>
              )}
            </NavLink>
            <NavLink 
              to="developer-profile"
              onClick={(e) => handleNavClick(e, 'developer-profile')}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl transition-all duration-300 w-full font-medium border-l-4",
                  isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                  isActive 
                    ? "bg-adminSidebar text-[#2E1C40] shadow-md font-bold border-[#D8FDF6]" 
                    : "border-transparent text-[#E5D9C4]/70 hover:bg-[#4C677C]/40 hover:text-[#E5D9C4]"
                )
              }
              title={!isSidebarOpen ? "Developer Profile" : undefined}
            >
              <Code className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
              {isSidebarOpen ? (
                <span className="whitespace-nowrap overflow-hidden">Developer Profile</span>
              ) : (
                <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">Developer Profile</span>
              )}
            </NavLink>
            <button 
              onClick={() => closeSidebarSafely(logout)}
              className={cn(
                "flex items-center rounded-xl text-[#E5D9C4]/70 hover:bg-[#732A26] hover:text-[#E5D9C4] transition-all duration-300 w-full font-medium border border-transparent hover:border-[#AE634A]/50",
                isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12"
              )}
              title={!isSidebarOpen ? "Logout" : undefined}
            >
              <LogOut className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
              {isSidebarOpen ? (
                <span className="whitespace-nowrap overflow-hidden">Logout</span>
              ) : (
                <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:pl-0 pt-20 md:pt-4 w-full">
        <div className="h-full rounded-3xl w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Notification Panel Overlay */}
      {isNotificationPanelOpen && (
        <div 
          className="fixed inset-0 bg-[#2E1C40]/20 backdrop-blur-sm z-[60]"
          onClick={() => setIsNotificationPanelOpen(false)}
        />
      )}

      {/* Notification Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${
        isNotificationPanelOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#F4F8F7]">
          <h2 className="text-lg font-bold text-[#2E1C40] flex items-center gap-2">
            <Bell className="w-5 h-5 text-adminSidebar" />
            Notifications
          </h2>
          <button 
            onClick={() => setIsNotificationPanelOpen(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  <div className="p-2 bg-[#D8FDF6] text-adminSidebar rounded-lg shrink-0 h-fit">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2E1C40] text-sm mb-1">{n.title}</h4>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{n.description}</p>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {n.postedBy || 'Admin'} • {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
