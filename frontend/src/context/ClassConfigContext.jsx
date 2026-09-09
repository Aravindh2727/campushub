import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const ClassConfigContext = createContext();

export function useClassConfig() {
  return useContext(ClassConfigContext);
}

export function ClassConfigProvider({ children }) {
  const [classConfigs, setClassConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const { currentUser } = useAuth(); // Refresh if auth state changes

  const fetchConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const res = await api.getClassConfigs();
      // Handle both cases: direct array or nested under data property
      const configArray = Array.isArray(res) ? res : (res.data || []);
      setClassConfigs(configArray);
    } catch (err) {
      console.error('Failed to fetch class configurations:', err);
    } finally {
      setLoadingConfigs(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchConfigs();
    }
  }, [currentUser]);

  const value = {
    classConfigs,
    loadingConfigs,
    refreshConfigs: fetchConfigs
  };

  return (
    <ClassConfigContext.Provider value={value}>
      {children}
    </ClassConfigContext.Provider>
  );
}
