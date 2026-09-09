import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login, loginWithGoogle, logout, resetPassword } = useAuth();

  React.useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
    const params = new URLSearchParams(location.search);
    const urlError = params.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [currentUser, navigate, location]);

  React.useEffect(() => {
    if (import.meta.env.VITE_APP_MODE === 'demo') {
      setEmail(selectedRole === 'admin' ? 'admin@demo.com' : 'teacher@demo.com');
      setPassword('Demo@123');
    }
  }, [selectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await login(email.trim(), password);
      
      // Verify role against backend
      try {
        const dbUser = await api.get('/auth/me');
        if (dbUser.role !== selectedRole) {
          await logout();
          setError(`Access denied. You do not have ${selectedRole} privileges.`);
          // Note: AuthContext handles logging out if we want, but for now we just show an error.
          // Since AuthContext already sets currentUser, they are technically logged into Firebase,
          // but we can just show the error and not navigate.
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        // If backend is down, we can't verify role. We'll proceed and let ProtectedRoute handle it.
      }
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Login failed:", err.code, err.message);
      
      let errorMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/unverified-email') {
        errorMsg = err.message;
      } else if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please try again later.';
      } else if (err.message) {
        // Fallback to the exact Firebase error message if available
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await loginWithGoogle();
      
      // Verify role against backend
      try {
        const dbUser = await api.get('/auth/me');
        if (dbUser.role !== selectedRole) {
          await logout();
          setError(`Access denied. You do not have ${selectedRole} privileges.`);
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        // proceed if backend is down
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to sign in with Google. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please type your email address into the box first to reset your password.');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setResetting(true);

      // Verify the role matches before sending the reset email
      try {
        const roleCheck = await api.get(`/auth/check-role?email=${encodeURIComponent(trimmedEmail)}`);
        
        // If the backend responds with a role, we ensure it matches the selected tab.
        // 'unknown' means the email isn't in MongoDB yet, so we assume it doesn't match the required role.
        if (roleCheck.role !== selectedRole) {
          setError(`This email is not registered as an ${selectedRole}.`);
          setResetting(false);
          return;
        }
      } catch (backendErr) {
        // If backend fails, we allow it to proceed as a fallback
        console.warn("Backend role check failed, proceeding to Firebase reset.");
      }

      await resetPassword(trimmedEmail);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address is invalid or badly formatted.');
      } else {
        setError('Failed to send reset email. ' + err.message);
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center p-4 bg-[#080808] relative overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2E4657]/40 via-[#122C46]/20 to-[#080808] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[#FA7848]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-[#122C46]/40 rounded-full blur-[150px] pointer-events-none" />
      
      <GlassCard className="w-full max-w-md p-8 md:p-10 relative z-10 !bg-[#080808]/80 !border-[#2E4657]/50 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-white overflow-hidden ring-4 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter text-[#F2F2F2] drop-shadow-md">
            Edu<span className="text-[#FA7848]">Pulse</span>
          </h1>
          <p className="text-[#CDD3C6] text-sm font-medium tracking-wide uppercase">Academic Analytics Dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="flex bg-[#080808]/60 border border-[#2E4657]/50 p-1.5 rounded-2xl mb-8">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              selectedRole === 'admin' 
                ? 'bg-[#885D40] text-[#EFE6D5] shadow-lg shadow-[#080808]/50' 
                : 'text-[#CDD3C6]/70 hover:text-[#F2F2F2]'
            }`}
            onClick={() => setSelectedRole('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              selectedRole === 'teacher' 
                ? 'bg-[#2E4657] text-[#F2F2F2] shadow-lg shadow-[#080808]/50' 
                : 'text-[#CDD3C6]/70 hover:text-[#F2F2F2]'
            }`}
            onClick={() => setSelectedRole('teacher')}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#CDD3C6]">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#080808]/40 border border-[#2E4657] rounded-xl px-4 py-3.5 text-[#F2F2F2] placeholder-[#2E4657] focus:outline-none focus:border-[#FA7848] focus:ring-1 focus:ring-[#FA7848]/50 transition-all"
              placeholder={import.meta.env.VITE_APP_MODE === 'demo' ? "admin@demo.com" : "admin@school.edu"}
              autoComplete="off"
            />
          </div>
          
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#CDD3C6]">Password</label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                disabled={resetting}
                className="text-xs font-medium text-[#FA7848] hover:text-[#F2F2F2] transition-colors"
              >
                {resetting ? 'Sending...' : 'Forgot Password?'}
              </button>
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#080808]/40 border border-[#2E4657] rounded-xl px-4 py-3.5 text-[#F2F2F2] placeholder-[#2E4657] focus:outline-none focus:border-[#FA7848] focus:ring-1 focus:ring-[#FA7848]/50 transition-all"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold bg-[#FA7848] text-[#080808] hover:bg-[#F2F2F2] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_20px_rgba(250,120,72,0.3)] hover:shadow-[0_0_25px_rgba(242,242,242,0.4)] disabled:opacity-50 disabled:hover:translate-y-0 text-base">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <span className="w-1/5 border-b border-[#2E4657] lg:w-1/4"></span>
          <span className="text-[10px] font-bold text-[#CDD3C6]/50 uppercase tracking-widest">or continue with</span>
          <span className="w-1/5 border-b border-[#2E4657] lg:w-1/4"></span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#122C46]/30 hover:bg-[#2E4657]/80 border border-[#2E4657] rounded-xl transition-all duration-300 text-[#F2F2F2] font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        <div className="mt-10 text-center text-sm font-medium text-[#CDD3C6]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#FA7848] hover:text-[#F2F2F2] transition-colors border-b border-transparent hover:border-[#F2F2F2] pb-0.5">
            Register for access
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
