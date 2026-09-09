import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User, LogOut, GraduationCap, BarChart3, FileText, Backpack, Menu, X, ChevronLeft, ChevronRight, ChevronUp, Bot, BookOpen, Database, Settings, PieChart, Download, CalendarCheck, Link as LinkIcon, MessageSquare, Code } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useMobileSidebar } from '../../hooks/useMobileSidebar';

export function AdminLayout() {
  const { isSidebarOpen, setIsSidebarOpen, closeSidebarSafely, navigate } = useMobileSidebar(window.innerWidth >= 768, 768);
  const [isBottomMenuExpanded, setIsBottomMenuExpanded] = useState(true);
  const { logout, dbUser } = useAuth();
  const { isInstallable, installApp } = usePWAInstall();

  const handleNavClick = (e, path) => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      closeSidebarSafely(() => navigate(path));
    }
  };

  const navItems = [
    { name: 'System Dashboard', path: '/admin', exact: true, icon: LayoutDashboard },
    { name: 'Admin Reports', path: '/admin/reports', exact: false, icon: PieChart },
    { name: 'User Management', path: '/admin/users', exact: false, icon: Users },
    { name: 'Students', path: '/admin/students', exact: false, icon: Backpack },
    { name: 'Gradebook', path: '/admin/gradebook', exact: false, icon: GraduationCap },
    { name: 'Homework', path: '/admin/homework', exact: false, icon: BookOpen },
    { name: 'Materials', path: '/admin/materials', exact: false, icon: LinkIcon },
    { name: 'Circulars', path: '/admin/circulars', exact: false, icon: MessageSquare },
    { name: 'Leaderboard', path: '/admin/leaderboard', exact: false, icon: BarChart3 },
    { name: 'Certificates', path: '/admin/certificates', exact: false, icon: FileText },
    { name: 'Attendance', path: '/admin/attendance', exact: false, icon: CalendarCheck },
    { name: 'Class Config', path: '/admin/classes', exact: false, icon: Settings },
    { name: 'Student Feedback', path: '/admin/feedback', exact: false, icon: MessageSquare },
    { name: 'Data Sync', path: '/admin/data-sync', exact: false, icon: Database },
    { name: 'AI Analyst', path: '/admin/ai', exact: false, icon: Bot },
  ];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-adminBg text-gray-900 font-sans relative z-10">
      
      {/* Mobile Topbar */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-adminSidebar/90 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-white rounded-lg p-1">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            DGHSS 360
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button 
              onClick={installApp}
              className="p-1.5 px-3 text-xs font-bold bg-adminAccent2 text-white rounded-lg shadow-sm flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-white/10 text-white rounded-lg border border-white/20"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => closeSidebarSafely()}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-adminSidebar m-4 rounded-2xl shadow-xl border border-white/20 flex flex-col justify-between transition-all duration-300 z-50 shrink-0",
        "fixed md:relative h-[calc(100vh-2rem)]",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-[150%] md:translate-x-0 w-[5.5rem]"
      )}>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className={cn("p-6 flex items-center h-24", isSidebarOpen ? "justify-between" : "justify-center")}>
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white rounded-xl p-1 shadow-sm">
                  <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  DGHSS 360
                </h1>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
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
                    "flex items-center rounded-2xl transition-all duration-300",
                    isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mb-2 mx-auto w-12",
                    isActive 
                      ? "bg-adminAccent1 text-white shadow-md font-bold" 
                      : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
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

        <div className={cn("p-4 shrink-0 border-t border-white/5", !isSidebarOpen && "flex flex-col items-center")}>
          {isInstallable && (
            <button 
              onClick={installApp}
              className={cn(
                "flex items-center rounded-2xl transition-all duration-300 w-full font-bold mb-2",
                isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                "bg-adminAccent2 text-white shadow-md"
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
              className="p-1.5 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors focus:outline-none"
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
              to="/admin/profile"
              onClick={(e) => handleNavClick(e, '/admin/profile')}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-2xl transition-all duration-300 w-full",
                  isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                  isActive 
                    ? "bg-adminAccent1 text-white shadow-md font-bold" 
                    : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
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
                  "flex items-center rounded-xl transition-all duration-300 w-full",
                  isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                  isActive 
                    ? "bg-adminAccent1 text-white shadow-md font-bold" 
                    : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
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
                "flex items-center rounded-xl text-white/70 hover:bg-adminAccent1 hover:text-white transition-all duration-300 w-full font-medium",
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
      <main className="flex-1 overflow-y-auto p-4 md:pl-0 pt-20 md:pt-4 w-full bg-adminBg">
        <div className="h-full rounded-3xl w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
