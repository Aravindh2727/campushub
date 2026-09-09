import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';

import { useNavigate } from 'react-router-dom';

export function PendingApproval() {
  const { logout, dbUser, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleAction = () => {
    if (currentUser) {
      logout();
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-lg p-8 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6">
          <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Pending Approval</h1>
        
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-left">
          <p className="text-gray-300 mb-4">
            Hello <strong className="text-gray-900">{dbUser?.name || 'User'}</strong>,
          </p>
          <p className="text-gray-400 leading-relaxed">
            Your account has been successfully created but is currently <strong className="text-yellow-400">awaiting admin approval</strong>. 
            For security reasons, you must first verify your email address. We have sent a verification link to your inbox.
            <br/><br/>
            After you click the link to verify your email, an administrator will be able to review and approve your account.
          </p>
        </div>

        <NeonButton onClick={handleAction} variant="secondary" className="px-8">
          {currentUser ? 'Sign Out' : 'Return to Login'}
        </NeonButton>
      </GlassCard>
    </div>
  );
}
