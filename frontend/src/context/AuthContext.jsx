import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); // The MongoDB profile (contains status/role)
  const [loading, setLoading] = useState(true);

  // Sync Firebase User with MongoDB
  const fetchDbUser = async (user) => {
    try {
      const res = await api.get('/auth/me');
      setDbUser(res.data || res);
    } catch (err) {
      if (err.message && err.message.includes('404')) {
        console.warn("User profile not found in MongoDB. Auto-syncing...");
        await syncWithBackend(user);
      } else {
        console.error("Failed to fetch MongoDB user profile", err);
        setDbUser(null);
      }
    }
  };

  const syncWithBackend = async (user) => {
    if (import.meta.env.VITE_APP_MODE === 'demo') return;
    try {
      const res = await api.post('/auth/sync', {});
      setDbUser(res);
    } catch (err) {
      console.error("Failed to sync user with backend", err);
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_APP_MODE === 'demo') {
      const demoToken = localStorage.getItem('demoToken');
      if (demoToken) {
        api.get('/auth/me').then(res => {
          const user = res.data || res;
          setCurrentUser(user);
          setDbUser(user);
          setLoading(false);
        }).catch(() => {
          localStorage.removeItem('demoToken');
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchDbUser(user);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (import.meta.env.VITE_APP_MODE === 'demo') {
      const res = await api.post('/auth/demo-login', { email, password });
      if (res.token) {
        localStorage.setItem('demoToken', res.token);
        setCurrentUser(res.user);
        setDbUser(res.user);
        return { user: res.user };
      }
      throw new Error("Invalid demo credentials");
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      const error = new Error('Please verify your email address before logging in.');
      error.code = 'auth/unverified-email';
      throw error;
    }
    
    return userCredential;
  };

  const register = async (email, password, name) => {
    if (import.meta.env.VITE_APP_MODE === 'demo') throw new Error("Registration disabled in demo mode");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email
    await sendEmailVerification(userCredential.user);
    
    // Sync to backend to save name
    try {
      const res = await api.post('/auth/sync', { name, email });
      setDbUser(res);
      // Immediately log out if pending
      if (res && res.status === 'pending') {
        await signOut(auth);
        setDbUser(null);
        setCurrentUser(null);
      }
    } catch(err) {
      console.error(err);
    }
    return userCredential;
  };

  const loginWithGoogle = async (isRegistering = false) => {
    if (import.meta.env.VITE_APP_MODE === 'demo') throw new Error("Google login disabled in demo mode");
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Sync with backend (creates user if new, otherwise just returns profile)
    try {
      const res = await api.post('/auth/sync', {});
      setDbUser(res);
      
      if (res && res.status === 'pending' && isRegistering) {
        await signOut(auth);
        setDbUser(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Failed to sync user with backend", err);
    }
    
    return userCredential;
  };

  const logout = () => {
    if (import.meta.env.VITE_APP_MODE === 'demo') {
      localStorage.removeItem('demoToken');
      setCurrentUser(null);
      setDbUser(null);
      return Promise.resolve();
    }
    setDbUser(null);
    return signOut(auth);
  };

  const resetPassword = (email) => {
    if (import.meta.env.VITE_APP_MODE === 'demo') return Promise.resolve();
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    dbUser,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-white/60">Connecting to server...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
