import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { useClassConfig } from '../context/ClassConfigContext';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { classConfigs } = useClassConfig();
  const availableStandards = [...new Set(classConfigs.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [newClass, setNewClass] = useState({ standard: '6', section: 'A', accessLevel: 'full' });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedTeachers = users.filter(u => u.status === 'approved' && u.role === 'teacher');

  const openModal = (user) => {
    setSelectedUser(user);
    setAssignedClasses(user.assignedClasses || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setAssignedClasses([]);
  };

  const addClass = () => {
    const existingIndex = assignedClasses.findIndex(
      c => c.standard === newClass.standard && c.section === newClass.section
    );
    
    if (existingIndex >= 0) {
      // Update existing class with new access level
      const updatedClasses = [...assignedClasses];
      updatedClasses[existingIndex] = { ...newClass };
      setAssignedClasses(updatedClasses);
    } else {
      // Add new class
      setAssignedClasses([...assignedClasses, { ...newClass }]);
    }
  };

  const removeClass = (index) => {
    setAssignedClasses(assignedClasses.filter((_, i) => i !== index));
  };

  const handleReject = async (uid) => {
    if (isProcessing) return;
    if (!window.confirm('Are you sure you want to reject and delete this request?')) return;
    
    setIsProcessing(true);
    try {
      await api.delete(`/auth/users/${uid}`);
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err) {
      console.error('Failed to reject user', err);
      alert('Failed to reject user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (uid) => {
    if (isProcessing) return;
    if (!window.confirm('Delete this teacher account permanently?\n\nThis action permanently removes the teacher account and cannot be undone.')) return;
    
    setIsProcessing(true);
    try {
      await api.delete(`/auth/users/${uid}`);
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err) {
      console.error('Failed to delete user', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = async (uid) => {
    if (isProcessing) return;
    if (!window.confirm('Are you sure you want to deactivate this teacher?')) return;
    
    setIsProcessing(true);
    try {
      const res = await api.patch(`/auth/users/${uid}/deactivate`);
      setUsers(users.map(u => u.uid === uid ? { ...u, isActive: false } : u));
    } catch (err) {
      console.error('Failed to deactivate user', err);
      alert(err.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivate = async (uid) => {
    if (isProcessing) return;
    if (!window.confirm('Activate this teacher account?')) return;
    
    setIsProcessing(true);
    try {
      const res = await api.patch(`/auth/users/${uid}/activate`);
      setUsers(users.map(u => u.uid === uid ? { ...u, isActive: true } : u));
    } catch (err) {
      console.error('Failed to activate user', err);
      alert(err.response?.data?.message || 'Failed to activate user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // If user is pending, we are approving them. If approved, we are just updating classes.
      const payload = {
        status: 'approved', // always set to approved on save
        assignedClasses
      };
      
      const res = await api.put(`/auth/users/${selectedUser.uid}/approve`, payload);
      
      // Update local state (extract user from response)
      const updatedUser = res.user || res;
      setUsers(users.map(u => u.uid === selectedUser.uid ? updatedUser : u));
      closeModal();
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Failed to update user');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-900 text-center mt-10">Loading users...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Review access requests and manage teacher classes</p>
        </div>
        <NeonButton onClick={fetchUsers} variant="secondary" className="px-4 py-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </NeonButton>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending' 
              ? 'bg-adminSidebar text-white shadow-sm' 
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Pending Requests ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'approved' 
              ? 'bg-adminSidebar text-white shadow-sm' 
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Approved Teachers ({approvedTeachers.length})
        </button>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm">
        {activeTab === 'pending' && (
          pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No pending access requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-adminSidebar bg-gray-50">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Registered Date</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 text-gray-900 font-medium">{user.name || 'Unknown'}</td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => handleReject(user.uid)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:text-gray-900 hover:bg-red-500/20 transition-colors border border-red-500/30 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <NeonButton onClick={() => openModal(user)} variant="primary" className="py-1.5 px-4 text-sm" disabled={isProcessing}>
                          Approve & Assign Classes
                        </NeonButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'approved' && (
          approvedTeachers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No approved teachers yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-adminAccent2 bg-gray-50">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Assigned Classes</th>
                    <th className="p-4 font-medium text-center">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvedTeachers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 text-gray-900 font-medium">{user.name || 'Unknown'}</td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4 text-gray-500 text-sm">
                        {user.assignedClasses?.length > 0 
                          ? user.assignedClasses.map(c => `${c.standard}-${c.section}`).join(', ') 
                          : 'None'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <NeonButton onClick={() => openModal(user)} variant="secondary" className="py-1.5 px-4 text-sm" disabled={isProcessing}>
                          Edit Classes
                        </NeonButton>
                        {user.isActive !== false ? (
                          <button onClick={() => handleDeactivate(user.uid)} disabled={isProcessing} className="px-3 py-1.5 rounded-lg text-sm font-medium text-orange-600 hover:text-white hover:bg-orange-500 transition-colors border border-orange-200 hover:border-transparent disabled:opacity-50">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(user.uid)} disabled={isProcessing} className="px-3 py-1.5 rounded-lg text-sm font-medium text-green-600 hover:text-white hover:bg-green-500 transition-colors border border-green-200 hover:border-transparent disabled:opacity-50">
                            Activate
                          </button>
                        )}
                        <button onClick={() => handleDelete(user.uid)} disabled={isProcessing} className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 transition-colors border border-red-200 hover:border-transparent disabled:opacity-50">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal for Assigning Classes */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedUser.status === 'pending' ? 'Approve & Assign Classes' : 'Edit Assigned Classes'}
            </h2>
            <p className="text-sm text-gray-500">
              User: <span className="text-gray-900 font-medium">{selectedUser.name} ({selectedUser.email})</span>
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Class/Standard</label>
                  <select 
                    value={newClass.standard}
                    onChange={(e) => {
                      const newStandard = e.target.value;
                      const validSections = classConfigs.filter(c => c.standard === newStandard).map(c => c.section).sort();
                      setNewClass({
                        ...newClass, 
                        standard: newStandard,
                        section: validSections.includes(newClass.section) ? newClass.section : (validSections[0] || '')
                      });
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 [&>option]:bg-white"
                  >
                    <option value="">Select Class</option>
                    {availableStandards.map(n => <option key={n} value={n.toString()}>Standard {n}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Section</label>
                  <select 
                    value={newClass.section}
                    onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 [&>option]:bg-white"
                    disabled={!newClass.standard}
                  >
                    <option value="">Select Section</option>
                    {classConfigs.filter(c => c.standard === newClass.standard).map(c => c.section).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Access Level</label>
                  <select 
                    value={newClass.accessLevel}
                    onChange={(e) => setNewClass({...newClass, accessLevel: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 [&>option]:bg-white"
                  >
                    <option value="full">Full Access</option>
                    <option value="view">View Only</option>
                  </select>
                </div>
                <NeonButton onClick={addClass} variant="secondary" className="py-2 px-4 whitespace-nowrap">
                  Add
                </NeonButton>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg min-h-[100px] border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Classes:</h3>
                {assignedClasses.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No classes assigned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignedClasses.map((cls, idx) => (
                      <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${cls.accessLevel === 'view' ? 'bg-adminAccent2/10 text-adminAccent2 border-adminAccent2/20' : 'bg-adminSidebar/10 text-adminSidebar border-adminSidebar/20'}`}>
                        {cls.standard} - {cls.section} ({cls.accessLevel === 'view' ? 'View' : 'Full'})
                        <button onClick={() => removeClass(idx)} className={`hover:text-gray-900 transition-colors`}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                onClick={closeModal}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <NeonButton onClick={handleSave} variant="primary" disabled={isProcessing}>
                {selectedUser.status === 'pending' ? (isProcessing ? 'Approving...' : 'Approve User') : (isProcessing ? 'Saving...' : 'Save Changes')}
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
