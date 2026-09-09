import { auth } from './firebase';
import { appState } from './appState';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to attach the Firebase JWT to fetch requests
 */
async function fetchWithAuth(endpoint, options = {}) {
  let token = null;

  if (import.meta.env.VITE_APP_MODE === 'demo') {
    token = localStorage.getItem('demoToken');
  } else if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const isMutation = options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase());
  if (isMutation) {
    appState.incrementMutation();
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403 && errorData.error && errorData.error.includes('deactivated')) {
        if (auth) await auth.signOut();
        window.location.href = '/login?error=' + encodeURIComponent(errorData.error);
      }

      const err = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      if (errorData.validationErrors) {
        err.validationErrors = errorData.validationErrors;
      }
      throw err;
    }

    return await response.json();
  } finally {
    if (isMutation) {
      appState.decrementMutation();
    }
  }
}

export const api = {
  // Students
  addStudent: (data) => fetchWithAuth('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getStudents: (standard, section) => fetchWithAuth(`/students?standard=${standard}&section=${section}`),

  getStudentById: (studentId) => fetchWithAuth(`/students/${studentId}`),

  updateMarks: (studentId, termName, marks) => fetchWithAuth(`/students/${studentId}/marks`, {
    method: 'PUT',
    body: JSON.stringify({ termName, marks })
  }),

  updateStudent: (studentId, data) => fetchWithAuth(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  deleteStudent: (studentId) => fetchWithAuth(`/students/${studentId}`, {
    method: 'DELETE'
  }),

  bulkDeleteStudents: (studentIds) => fetchWithAuth('/students/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ studentIds })
  }),

  bulkUpdateMarks: (termName, records) => fetchWithAuth('/students/bulk-marks', {
    method: 'POST',
    body: JSON.stringify({ termName, records })
  }),

  universalBulkUpdateMarks: (termName, records) => fetchWithAuth('/students/bulk-marks-universal', {
    method: 'POST',
    body: JSON.stringify({ termName, records })
  }),

  // Homework
  getHomeworkByClass: (standard, section) => fetchWithAuth(`/homework?standard=${standard}&section=${section}`),
  addHomework: (data) => fetchWithAuth('/homework', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteHomework: (id) => fetchWithAuth(`/homework/${id}`, {
    method: 'DELETE'
  }),

  // Notifications
  getNotifications: () => fetchWithAuth('/notifications'),
  markNotificationRead: (id) => fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' }),
  
  // Feedback
  getFeedback: () => fetchWithAuth('/feedback'),
  deleteFeedback: (id) => fetchWithAuth(`/feedback/${id}`, { method: 'DELETE' }),

  // Circulars
  getCirculars: () => fetchWithAuth('/circulars'),
  addCircular: (data) => fetchWithAuth('/circulars', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteCircular: (id) => fetchWithAuth(`/circulars/${id}`, {
    method: 'DELETE'
  }),

  // Analytics Leaderboard
  getLeaderboard: (standard, section) => fetchWithAuth(`/analytics/leaderboard?standard=${standard}&section=${section}`),
  getDashboardStats: () => fetchWithAuth('/analytics/dashboard'),

  // AI Assistant
  askAI: (question) => fetchWithAuth('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ question })
  }),

  // Auth
  post: (url, data) => fetchWithAuth(url, { method: 'POST', body: JSON.stringify(data || {}) }),
  get: (url) => fetchWithAuth(url),
  put: (url, data) => fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(data || {}) }),
  patch: (url, data) => fetchWithAuth(url, { method: 'PATCH', body: JSON.stringify(data || {}) }),
  delete: (url) => fetchWithAuth(url, { method: 'DELETE' }),
  getMe: () => fetchWithAuth('/auth/me'),
  updateProfile: (data) => fetchWithAuth('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getAllUsers: () => fetchWithAuth('/auth/users'),

  // Attendance
  getAttendance: (standard, section, date, period, attendanceType = 'period') => {
    let url = `/attendance?standard=${standard}&section=${section}&date=${date}&attendanceType=${attendanceType}`;
    if (period) url += `&period=${period}`;
    return fetchWithAuth(url);
  },
  getAttendanceSummary: (standard, section, date) => fetchWithAuth(`/attendance/summary?standard=${standard}&section=${section}&date=${date}`),
  saveAttendance: (data) => fetchWithAuth('/attendance', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAttendance: (standard, section, date, period, attendanceType = 'period') => {
    let url = `/attendance?standard=${standard}&section=${section}&date=${date}&attendanceType=${attendanceType}`;
    if (period) url += `&period=${period}`;
    return fetchWithAuth(url, { method: 'DELETE' });
  },
  bulkImportDailyAttendance: (records) => fetchWithAuth('/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify(records)
  }),
  getAttendanceReport: (fromDate, toDate, standard, section, percentage) => {
    let url = `/attendance/report?standard=${standard}&section=${section}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    if (percentage) url += `&percentage=${encodeURIComponent(percentage)}`;
    return fetchWithAuth(url);
  },
  exportDailyAttendance: (fromDate, toDate, standard, section) => {
    let url = `/attendance/export?standard=${standard}&section=${section}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    return fetchWithAuth(url);
  },

  // Materials
  addMaterial: (data) => fetchWithAuth('/materials', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMaterialsByClass: (standard, section) => fetchWithAuth(`/materials?standard=${standard}&section=${section}`),
  updateMaterial: (id, data) => fetchWithAuth(`/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteMaterial: (id) => fetchWithAuth(`/materials/${id}`, {
    method: 'DELETE'
  }),

  // Class Configurations
  getClassConfigs: () => fetchWithAuth('/classes'),
  addClassConfig: (data) => fetchWithAuth('/classes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateClassConfig: (id, data) => fetchWithAuth(`/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteClassConfig: (id) => fetchWithAuth(`/classes/${id}`, {
    method: 'DELETE'
  }),
};

export default api;
