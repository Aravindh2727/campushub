import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useMobileSidebar(initialState = false, breakpoint = 768) {
  const [isSidebarOpen, setIsSidebarOpenState] = useState(initialState);
  const isOpenRef = useRef(isSidebarOpen);
  const navigate = useNavigate();

  useEffect(() => {
    isOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < breakpoint) {
      if (!window.history.state?.__sidebarOpen) {
        window.history.pushState({ ...window.history.state, __sidebarOpen: true }, '');
      }
    }
  }, [isSidebarOpen, breakpoint]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (isOpenRef.current && window.innerWidth < breakpoint) {
        setIsSidebarOpenState(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [breakpoint]);

  const setIsSidebarOpen = useCallback((val) => {
    const newVal = typeof val === 'function' ? val(isOpenRef.current) : val;
    if (newVal === isOpenRef.current) return;
    
    if (newVal === false && window.innerWidth < breakpoint && window.history.state?.__sidebarOpen) {
      window.history.back();
    } else {
      setIsSidebarOpenState(newVal);
    }
  }, [breakpoint]);

  const closeSidebarSafely = useCallback((callback) => {
    if (isOpenRef.current && window.innerWidth < breakpoint) {
      if (window.history.state?.__sidebarOpen) {
        window.history.back();
      } else {
        setIsSidebarOpenState(false);
      }
      if (callback) {
        setTimeout(callback, 10);
      }
    } else {
      setIsSidebarOpenState(false);
      if (callback) callback();
    }
  }, [breakpoint]);

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    closeSidebarSafely,
    navigate
  };
}
