import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { useClassConfig } from '../context/ClassConfigContext';
import { compressImage } from '../lib/utils';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export function Students() {
  const [formData, setFormData] = useState({
    name: '',
    emisNumber: '',
    standard: '6',
    section: 'A',
    gender: 'Other',
    medium: 'TAMIL',
    tamilName: '',
    fatherName: '',
    dob: '',
    admissionNumber: '',
    religion: '',
    community: '',
    address: '',
    mobileNumber: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [listStandard, setListStandard] = useState('All');
  const [listSection, setListSection] = useState('All');
  
  const [studentsList, setStudentsList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { dbUser } = useAuth();
  const { classConfigs } = useClassConfig();

  let availableStandards = [];
  let availableListSections = [];
  let availableFormSections = [];

  if (dbUser?.role === 'admin') {
    availableStandards = [...new Set(classConfigs.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    
    let listSecs = classConfigs.filter(c => listStandard === 'All' ? true : c.standard === listStandard).map(c => c.section);
    availableListSections = [...new Set(listSecs)].sort();
    
    availableFormSections = classConfigs.filter(c => c.standard === formData.standard).map(c => c.section).sort();
  } else if (dbUser?.assignedClasses) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    
    let listSecs = dbUser.assignedClasses.filter(c => listStandard === 'All' ? true : c.standard === listStandard).map(c => c.section);
    availableListSections = [...new Set(listSecs)].sort();

    availableFormSections = dbUser.assignedClasses
      .filter(c => c.standard === formData.standard)
      .map(c => c.section)
      .sort();
  }

  const hasFullAccess = dbUser?.role === 'admin' || (
    dbUser?.assignedClasses?.some(c => c.accessLevel !== 'view')
  );

  useEffect(() => {
    if (availableStandards.length > 0 && !availableStandards.includes(formData.standard)) {
      setFormData(prev => ({ ...prev, standard: availableStandards[0] }));
    }
  }, [availableStandards, formData.standard]);

  useEffect(() => {
    if (availableFormSections.length > 0 && !availableFormSections.includes(formData.section)) {
      setFormData(prev => ({ ...prev, section: availableFormSections[0] }));
    }
  }, [availableFormSections, formData.section, formData.standard]);

  useEffect(() => {
    if (listSection !== 'All' && availableListSections.length > 0 && !availableListSections.includes(listSection)) {
      setListSection('All');
    }
  }, [listStandard, availableListSections, listSection]);

  const fetchStudents = async () => {
    if (!listStandard || !listSection) return;
    setListLoading(true);
    try {
      const response = await api.getStudents(listStandard, listSection);
      setStudentsList(response.data || []);
      setSelectedStudents([]);
    } catch (err) {
      console.error('Error fetching student list:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [listStandard, listSection]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(prev => ({
      ...prev,
      name: '', emisNumber: '', medium: 'TAMIL', gender: 'Other',
      tamilName: '', fatherName: '', dob: '', admissionNumber: '', religion: '', community: '', address: '', photoUrl: '', mobileNumber: ''
    }));
    setFile(null);
    setMessage('');
    setIsFormOpen(true);
  };

  const formatDobForInput = (dobStr) => {
    if (!dobStr) return '';
    try {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) return dobStr;
      return d.toISOString().split('T')[0];
    } catch(e) {
      return dobStr;
    }
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setFormData({
      name: student.name || '',
      emisNumber: student.emisNumber || '',
      standard: student.standard || formData.standard,
      section: student.section || formData.section,
      gender: student.gender || 'Other',
      medium: student.medium || 'TAMIL',
      tamilName: student.tamilName || '',
      fatherName: student.fatherName || '',
      dob: formatDobForInput(student.dob),
      admissionNumber: student.admissionNumber || '',
      religion: student.religion || '',
      community: student.community || '',
      address: student.address || '',
      photoUrl: student.photoUrl || '',
      mobileNumber: student.mobileNumber || ''
    });
    setFile(null);
    setMessage('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      let photoUrl = formData.photoUrl || null; 
      
      if (file) {
        try {
          // Compress the image and use the resulting Base64 string directly
          photoUrl = await compressImage(file, 0.1);
        } catch (err) {
          console.error("Compression failed", err);
          setMessage("Failed to process image. Please try again.");
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        photoUrl
      };

      if (editingId) {
        await api.updateStudent(editingId, payload);
      } else {
        await api.addStudent(payload);
      }
      
      fetchStudents();
      closeForm();
      
    } catch (err) {
      console.error(err);
      setMessage(`Error ${editingId ? 'updating' : 'adding'} student.`);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    
    try {
      await api.deleteStudent(id);
      fetchStudents();
      setSelectedStudents(prev => prev.filter(sId => sId !== id));
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Failed to delete student.");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(studentsList.map(s => s._id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) return;
    setListLoading(true);
    try {
      await api.bulkDeleteStudents(selectedStudents);
      setSelectedStudents([]);
      fetchStudents();
    } catch (err) {
      console.error("Error bulk deleting students:", err);
      alert("Failed to delete some students.");
      setListLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#2E1C40] dark:text-gray-900 font-black drop-shadow-sm  ">
          Student Management
        </h1>
      </div>

      {/* Class & Section Selectors (Always visible) */}
      <GlassCard className="flex flex-wrap gap-6 items-end   ">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-[#4C677C] dark:text-[#E5D9C4] font-semibold ">Class / Standard</label>
          <select 
            value={listStandard}
            onChange={(e) => setListStandard(e.target.value)}
            className="glass-input w-full dark:!text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
          >
            <option value="All">All Standards</option>
            {availableStandards.map(std => (
              <option key={std} value={std}>Standard {std}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-[#4C677C] dark:text-[#E5D9C4] font-semibold ">Section</label>
          <select 
            value={listSection}
            onChange={(e) => setListSection(e.target.value)}
            className="glass-input w-full dark:!text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
          >
            <option value="All">All Sections</option>
            {availableListSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* STUDENT LIST */}
      <GlassCard className="  ">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900">
            {listStandard === 'All' ? 'All Students' : `Students in ${listStandard}${listSection !== 'All' ? '-' + listSection : ''}`}
          </h2>
          <div className="flex items-center gap-3">
            {hasFullAccess && selectedStudents.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="py-2 px-4 flex items-center gap-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedStudents.length})
              </button>
            )}
            {hasFullAccess && (
              <NeonButton onClick={openAddForm} className="py-2 px-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Student
              </NeonButton>
            )}
          </div>
        </div>

        {listLoading ? (
          <p className="text-[#4C677C]/60 dark:text-gray-400 text-center py-8">Loading students...</p>
        ) : studentsList.length === 0 ? (
          <p className="text-[#4C677C]/60 dark:text-gray-400 text-center py-8">No students found in this section.</p>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F2FCFA] dark:bg-white sticky top-0 backdrop-blur-md">
                <tr className="border-b border-[#E5D9C4] dark:border-[#4C677C]/30 text-[#2E1C40] dark:text-[#E5D9C4] uppercase text-xs tracking-wider">
                  {hasFullAccess && (
                    <th className="p-3 rounded-tl-lg w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.length === studentsList.length && studentsList.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-[#E5D9C4] text-adminSidebar focus:ring-[#62D4CA] cursor-pointer"
                      />
                    </th>
                  )}
                  <th className={`p-3 font-medium ${!hasFullAccess ? 'rounded-tl-lg' : ''}`}>EMIS No</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Medium</th>
                  {hasFullAccess && <th className="p-3 rounded-tr-lg font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {studentsList.map((s) => (
                  <tr key={s._id} className={`hover:bg-[#F2FCFA] dark:hover:bg-[#2E1C40]/20 transition-colors ${selectedStudents.includes(s._id) ? 'bg-[#F2FCFA] dark:bg-[#2E1C40]/30' : ''}`}>
                    {hasFullAccess && (
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.includes(s._id)}
                          onChange={() => handleSelectStudent(s._id)}
                          className="rounded border-[#E5D9C4] text-adminSidebar focus:ring-[#62D4CA] cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-3 text-[#4C677C] dark:text-gray-300">{s.emisNumber || s.rollNumber || 'N/A'}</td>
                    <td className="p-3 font-medium text-[#2E1C40] dark:text-gray-900">{s.name}</td>
                    <td className="p-3 text-[#4C677C] dark:text-gray-300">{s.medium}</td>
                    {hasFullAccess && (
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(s)}
                            className="p-2 text-adminSidebar hover:bg-adminSidebar/20 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s._id)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* MODAL OVERLAY FOR ADD/EDIT FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-auto">
            <GlassCard className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar  ">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-white backdrop-blur-md py-4 border-b border-[#E5D9C4] dark:border-[#4C677C]/30 z-10 -mx-6 px-6 -mt-6">
                <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900">
                  {editingId ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button onClick={closeForm} className="p-2 text-[#4C677C]/60 hover:text-[#2E1C40] dark:text-gray-400 dark:hover:text-gray-900 transition-colors rounded-full hover:bg-[#E5D9C4] dark:hover:bg-[#2E1C40]/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold">Class / Standard</label>
                    <select 
                      value={formData.standard}
                      onChange={(e) => setFormData({...formData, standard: e.target.value})}
                      className="glass-input w-full dark:!text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                      disabled={availableStandards.length === 0}
                    >
                      {availableStandards.map(std => (
                        <option key={std} value={std}>Standard {std}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Section</label>
                    <select 
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="glass-input w-full dark:!text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                      disabled={availableFormSections.length === 0}
                    >
                      {availableFormSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Medium</label>
                    <select 
                      value={formData.medium}
                      onChange={(e) => setFormData({...formData, medium: e.target.value})}
                      className="glass-input w-full dark:!text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="TAMIL">TAMIL</option>
                      <option value="ENGLISH">ENGLISH</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="glass-input w-full dark:!text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">EMIS Number</label>
                    <input 
                      type="text" 
                      required
                      value={formData.emisNumber}
                      onChange={(e) => setFormData({...formData, emisNumber: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. 101"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="glass-input w-full"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Tamil Name</label>
                    <input 
                      type="text" 
                      value={formData.tamilName}
                      onChange={(e) => setFormData({...formData, tamilName: e.target.value})}
                      className="glass-input w-full"
                      placeholder="தமிழ் பெயர்"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Father's Name</label>
                    <input 
                      type="text" 
                      value={formData.fatherName}
                      onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                      className="glass-input w-full"
                      placeholder="Father's Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className="glass-input w-full &::-webkit-calendar-picker-indicator]:filter &::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Admission Number</label>
                    <input 
                      type="text" 
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. 1249"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Religion</label>
                    <input 
                      type="text" 
                      value={formData.religion}
                      onChange={(e) => setFormData({...formData, religion: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. Hindu"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Community</label>
                    <input 
                      type="text" 
                      value={formData.community}
                      onChange={(e) => setFormData({...formData, community: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. BC"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Mobile Number (For Student Login)</label>
                  <input 
                    type="tel" 
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                    className="glass-input w-full"
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="glass-input w-full h-24 resize-none"
                    placeholder="Full Address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4C677C]  font-semibold ">Profile Photo</label>
                  {editingId && formData.photoUrl && (
                    <div className="mb-2">
                      <img src={formData.photoUrl} alt="Current" className="w-16 h-16 rounded-full object-cover border border-white/20" />
                      <p className="text-xs text-[#4C677C]/60   mt-1">Upload new to replace</p>
                    </div>
                  )}
                  {file && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-green-600 ">Photo selected!</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <label className="flex-1 text-center cursor-pointer py-3 px-4 rounded-xl font-bold text-sm bg-adminSidebar/20 text-[#2E1C40] hover:bg-adminSidebar text-white/40 dark:text-gray-900 dark:hover:bg-adminSidebar text-white/40 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      Take Photo
                    </label>
                    <label className="flex-1 text-center cursor-pointer py-3 px-4 rounded-xl font-bold text-sm bg-[#2E1C40]/10 text-[#2E1C40] hover:bg-[#2E1C40]/20 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white/20 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      Upload Photo
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={closeForm}
                    className="flex-1 py-3 px-4 rounded-lg font-medium text-[#4C677C] bg-[#F2FCFA] hover:bg-[#E5D9C4] dark:bg-white dark:text-[#E5D9C4] dark:hover:bg-[#2E4657] transition-colors"
                  >
                    Cancel
                  </button>
                  <NeonButton type="submit" disabled={loading} className="flex-1">
                    {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Student' : 'Add Student')}
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
