import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Database, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, UserSquare2, GraduationCap, ClipboardCheck } from 'lucide-react';
import { api } from '../lib/api';
import * as XLSX from 'xlsx';

export function DataSync() {
  const [syncType, setSyncType] = useState('profiles'); // 'profiles', 'marks', 'attendance'
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);

  // Marks specific state
  const [marksMode, setMarksMode] = useState('universal'); // 'universal' or 'legacy'
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  
  // Attendance specific state
  const [attFromDate, setAttFromDate] = useState('');
  const [attToDate, setAttToDate] = useState('');
  const [attStandard, setAttStandard] = useState('All');
  const [attSection, setAttSection] = useState('All');

  const [classConfigs, setClassConfigs] = useState([]);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await api.getClassConfigs();
        if (Array.isArray(response)) {
          setClassConfigs(response);
        } else if (response.success) {
          setClassConfigs(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch class configs:', err);
      }
    };
    fetchConfigs();
  }, []);

  const standards = [...new Set(classConfigs.map(c => c.standard))].sort((a, b) => {
    const order = ['LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return order.indexOf(a) - order.indexOf(b);
  });
  
  const sections = selectedStandard && selectedStandard !== 'All'
    ? [...new Set(classConfigs.filter(c => c.standard === selectedStandard).map(c => c.section))].sort()
    : [...new Set(classConfigs.map(c => c.section))].sort();
    
  const attSections = attStandard && attStandard !== 'All'
    ? [...new Set(classConfigs.filter(c => c.standard === attStandard).map(c => c.section))].sort()
    : [...new Set(classConfigs.map(c => c.section))].sort();

  const terms = ['First Midterm', 'Quarterly', 'Second Midterm', 'Half-Yearly', 'Third Midterm', 'Annual'];

  // --- PROFILES LOGIC ---
  const handleExportProfiles = async () => {
    try {
      setExporting(true);
      setError(null);
      const response = await api.getStudents('All', 'All');
      const students = response.data;

      if (!students || !Array.isArray(students) || students.length === 0) {
        setError('No students found to export.');
        return;
      }

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      };

      const excelData = students.map(student => ({
        'EMIS Number': student.emisNumber,
        'Name': student.name,
        'Standard': student.standard,
        'Section': student.section,
        'Gender': student.gender || '',
        'Medium': student.medium,
        'Tamil Name': student.tamilName || '',
        'Father Name': student.fatherName || '',
        'DOB': formatDate(student.dob),
        'Admission Number': student.admissionNumber || '',
        'Religion': student.religion || '',
        'Community': student.community || '',
        'Address': student.address || '',
        'Mobile Number': student.mobileNumber || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(workbook, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export students. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleProfileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
      complete: async (results) => {
        try {
          const rows = results.data;
          
          const studentsToImport = rows.map(row => {
            const normRow = {};
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                const normKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                normRow[normKey] = row[key] != null ? String(row[key]).trim() : '';
              }
            }

            return {
              emisNumber: normRow['emisnumber'] || normRow['emisno'] || '',
              name: normRow['name'] || normRow['studentname'] || '',
              standard: normRow['standard'] || normRow['class'] || '',
              section: normRow['section'] ? String(normRow['section']).toUpperCase() : '',
              gender: normRow['gender'] || 'Other',
              medium: normRow['medium'] ? String(normRow['medium']).toUpperCase() : 'ENGLISH',
              tamilName: normRow['tamilname'] || '',
              fatherName: normRow['fathername'] || '',
              dob: normRow['dob'] || normRow['dateofbirth'] || '',
              admissionNumber: normRow['admissionnumber'] || normRow['admissionnumb'] || normRow['admissionno'] || '',
              religion: normRow['religion'] || '',
              community: normRow['community'] || '',
              address: normRow['address'] || '',
              mobileNumber: normRow['mobilenumber'] || normRow['mobile'] || ''
            };
          }).filter(student => student.emisNumber && student.name);

          if (studentsToImport.length === 0) {
            const firstRowStr = rows.length > 0 ? JSON.stringify(rows[0]) : '';
            if (firstRowStr.includes('PK\\u0003\\u0004') || file.name.endsWith('.xlsx')) {
              setError('You uploaded an Excel file (.xlsx) but the system expects a CSV file. Please export as CSV.');
            } else {
              setError('No valid student data found in the CSV. Please check the format.');
            }
            setImporting(false);
            return;
          }

          const response = await api.post('/students/bulk', studentsToImport);
          
          if (response.success) {
            setImportResults(response.data);
          } else {
            setError('Import failed on the server.');
          }
        } catch (err) {
          console.error('Import error:', err);
          setError(err.message || 'Failed to import students.');
        } finally {
          setImporting(false);
          event.target.value = '';
        }
      },
      error: (err) => {
        setImporting(false);
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const downloadProfileTemplate = () => {
    const templateData = [{
      'EMIS Number': '101',
      'Name': 'John Doe',
      'Standard': '10',
      'Section': 'A',
      'Gender': 'Male',
      'Medium': 'ENGLISH',
      'Tamil Name': '',
      'Father Name': 'Richard Doe',
      'DOB': '2005-05-15',
      'Admission Number': 'ADM001',
      'Religion': 'Hindu',
      'Community': 'BC',
      'Address': '123 Main St, City',
      'Mobile Number': '9876543210'
    }];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MARKS LOGIC ---
  const handleExportMarks = async () => {
    if (!selectedStandard || !selectedSection || !selectedTerm) {
      setError('Please select Standard, Section, and Term for exporting marks.');
      return;
    }
    try {
      setExporting(true);
      setError(null);
      
      const config = classConfigs.find(c => c.standard === selectedStandard && c.section === selectedSection);
      if (!config || !config.subjects || config.subjects.length === 0) {
        setError('No subjects configured for this class.');
        return;
      }

      const response = await api.getStudents(selectedStandard, selectedSection);
      const students = response.data;
      if (!students || students.length === 0) {
        setError('No students found in this class.');
        return;
      }

      const excelData = students.map(student => {
        const row = {
          'EMIS Number': student.emisNumber,
          'Name': student.name,
          'Standard': student.standard,
          'Section': student.section
        };
        const termData = student.terms?.find(t => t.termName === selectedTerm);
        config.subjects.forEach(subj => {
          const subjMark = termData?.marks?.find(m => m.subject.toLowerCase() === subj.toLowerCase());
          row[subj] = subjMark ? subjMark.score : '';
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedTerm.substring(0, 31)}`);
      XLSX.writeFile(workbook, `${selectedStandard}_${selectedSection}_${selectedTerm}_Marks.xlsx`.replace(/\s+/g, '_'));
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export marks.');
    } finally {
      setExporting(false);
    }
  };

  const handleMarksUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!selectedStandard || !selectedSection || !selectedTerm) {
      setError('Please select Standard, Section, and Term before importing marks.');
      event.target.value = '';
      return;
    }

    setImporting(true);
    setError(null);
    setImportResults(null);

    const config = classConfigs.find(c => c.standard === selectedStandard && c.section === selectedSection);
    if (!config || !config.subjects || config.subjects.length === 0) {
      setError('No subjects configured for this class.');
      setImporting(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
      complete: async (results) => {
        try {
          const rows = results.data;
          
          const recordsToImport = rows.map(row => {
            const marks = [];
            config.subjects.forEach(subj => {
              const headerKey = Object.keys(row).find(k => k.toLowerCase() === subj.toLowerCase());
              if (headerKey && row[headerKey] !== '' && !isNaN(row[headerKey])) {
                marks.push({
                  subject: subj,
                  score: Number(row[headerKey])
                });
              }
            });

            const emisNumber = row['EMIS Number'] || row['emisnumber'] || row['emisno'] || row['EMIS'] || '';
            const standard = row['Standard'] || row['standard'] || row['class'] || selectedStandard;
            const section = row['Section'] || row['section'] || selectedSection;

            return {
              emisNumber: String(emisNumber).trim(),
              standard: String(standard).trim(),
              section: String(section).trim().toUpperCase(),
              marks
            };
          }).filter(record => record.emisNumber);

          if (recordsToImport.length === 0) {
            setError('No valid student records found or missing EMIS Number.');
            setImporting(false);
            return;
          }

          const response = await api.bulkUpdateMarks(selectedTerm, recordsToImport);
          if (response.success) {
            setImportResults({
              added: 0,
              updated: response.data.updated,
              errors: response.data.errors
            });
          } else {
            setError('Import failed on the server.');
          }
        } catch (err) {
          console.error('Import error:', err);
          setError(err.message || 'Failed to import marks.');
        } finally {
          setImporting(false);
          event.target.value = '';
        }
      },
      error: (err) => {
        setImporting(false);
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const downloadMarksTemplate = () => {
    if (!selectedStandard || !selectedSection || !selectedTerm) {
      setError('Please select Standard, Section, and Term for the template.');
      return;
    }
    const config = classConfigs.find(c => c.standard === selectedStandard && c.section === selectedSection);
    if (!config || !config.subjects || config.subjects.length === 0) {
      setError('No subjects configured for this class.');
      return;
    }

    const templateData = [{
      'EMIS Number': '101',
      'Name': 'John Doe',
      'Standard': selectedStandard,
      'Section': selectedSection,
    }];
    
    config.subjects.forEach(subj => {
      templateData[0][subj] = '95';
    });

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedStandard}_${selectedSection}_Marks_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadUniversalMarksTemplate = () => {
    const templateData = [{
      'EMIS Number': '1012345678',
      'Student Name': 'Arun K',
      'Standard': '10',
      'Section': 'A',
      'Tamil': '85',
      'English': '90',
      'Mathematics': '95',
      'Science': '88',
      'Social Science': '92'
    }, {
      'EMIS Number': '1012345679',
      'Student Name': 'Priya S',
      'Standard': '6',
      'Section': 'B',
      'Tamil': '80',
      'English': '85',
      'Mathematics': '75',
      'Science': '82',
      'Social Science': '78'
    }];
    
    const instructionsData = [
      { 'Instruction': '1. Enter the correct 10-15 digit EMIS Number for every student. This is REQUIRED.' },
      { 'Instruction': '2. The EMIS Number must perfectly match the one in the database. DO NOT duplicate EMIS Numbers.' },
      { 'Instruction': '3. Do not change the Subject column headers.' },
      { 'Instruction': '4. You can include students from Class 6 to 10 in this ONE single file.' },
      { 'Instruction': '5. Ensure marks are between 0 and 100.' },
      { 'Instruction': '6. Standard and Section must exactly match the student\'s database record.' },
    ];

    const workbook = XLSX.utils.book_new();
    const marksSheet = XLSX.utils.json_to_sheet(templateData);
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);

    XLSX.utils.book_append_sheet(workbook, marksSheet, "Class 6-10 Marks");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
    XLSX.writeFile(workbook, `Class_6_to_10_Marks_Template.xlsx`);
  };

  const handleUniversalMarksUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!selectedTerm) {
      setError('Please select Term before importing marks.');
      event.target.value = '';
      return;
    }

    setImporting(true);
    setError(null);
    setImportResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const recordsToImport = rows.map(row => {
            const emisNumber = String(row['EMIS Number'] || row['emisnumber'] || row['emisno'] || row['EMIS'] || '').trim();
            const standard = String(row['Standard'] || row['standard'] || row['class'] || '').trim();
            const section = String(row['Section'] || row['section'] || '').trim().toUpperCase();
            
            const marks = [];
            const validSubjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];
            
            validSubjects.forEach(subj => {
              const headerKey = Object.keys(row).find(k => k.toLowerCase() === subj.toLowerCase());
              if (headerKey && row[headerKey] !== '' && !isNaN(row[headerKey])) {
                marks.push({
                  subject: subj,
                  score: Number(row[headerKey])
                });
              }
            });

            return { emisNumber, standard, section, marks };
          }).filter(record => record.emisNumber);

          if (recordsToImport.length === 0) {
            setError('No valid student records found or missing EMIS Numbers in the Excel file.');
            setImporting(false);
            return;
          }

          const response = await api.universalBulkUpdateMarks(selectedTerm, recordsToImport);
          if (response.success) {
            setImportResults({
              added: response.data.created,
              updated: response.data.updated,
              failed: response.data.failed,
              errors: response.data.errors
            });
          } else {
            setError('Import failed on the server.');
          }
        } catch (err) {
          console.error('Import parse error:', err);
          setError(err.message || 'Failed to process Excel file.');
        } finally {
          setImporting(false);
          event.target.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setImporting(false);
      setError(`Failed to read file: ${err.message}`);
      event.target.value = '';
    }
  };

  // --- ATTENDANCE LOGIC ---
  const handleExportAttendance = async () => {
    try {
      setExporting(true);
      setError(null);
      
      const response = await api.exportDailyAttendance(
        attFromDate, 
        attToDate, 
        attStandard, 
        attSection
      );
      
      if (!response.data || response.data.length === 0) {
        setError('No daily attendance records found for the selected criteria.');
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(response.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Attendance");
      XLSX.writeFile(workbook, `Daily_Attendance_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export daily attendance.');
    } finally {
      setExporting(false);
    }
  };
  
  const downloadAttendanceTemplate = () => {
    const templateData = [{
      'Date': new Date().toISOString().split('T')[0],
      'EMIS Number': '1012345678',
      'Student Name': 'Arun K',
      'Standard': '10',
      'Section': 'A',
      'Status': 'Present'
    }, {
      'Date': new Date().toISOString().split('T')[0],
      'EMIS Number': '1012345679',
      'Student Name': 'Priya S',
      'Standard': '10',
      'Section': 'A',
      'Status': 'Absent'
    }];
    
    const instructionsData = [
      { 'Instruction': '1. Date must be in YYYY-MM-DD format.' },
      { 'Instruction': '2. Enter the correct 10-15 digit EMIS Number. Name is for reference only.' },
      { 'Instruction': '3. Standard and Section must match the database exactly.' },
      { 'Instruction': '4. Status MUST be exactly "Present" or "Absent".' },
      { 'Instruction': '5. Do not include duplicate EMIS Numbers on the same Date.' }
    ];

    const workbook = XLSX.utils.book_new();
    const dataSheet = XLSX.utils.json_to_sheet(templateData);
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);

    XLSX.utils.book_append_sheet(workbook, dataSheet, "Attendance Data");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
    XLSX.writeFile(workbook, `Daily_Attendance_Template.xlsx`);
  };

  const handleAttendanceUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });

          const recordsToImport = rawData.map(row => {
            return {
              date: String(row['Date'] || '').trim(),
              emisNumber: String(row['EMIS Number'] || row['emisnumber'] || row['emisno'] || row['EMIS'] || '').trim(),
              standard: String(row['Standard'] || row['standard'] || row['class'] || '').trim(),
              section: String(row['Section'] || row['section'] || '').trim().toUpperCase(),
              status: String(row['Status'] || row['status'] || '').trim()
            };
          }).filter(record => record.emisNumber);

          if (recordsToImport.length === 0) {
            setError('No valid records found in the Excel file.');
            setImporting(false);
            return;
          }

          const response = await api.bulkImportDailyAttendance(recordsToImport);
          if (response.success) {
            setImportResults({
              added: response.data.created,
              updated: response.data.updated,
              errors: []
            });
          } else {
            setError('Import failed on the server.');
          }
        } catch (err) {
          console.error('Import parse error:', err);
          if (err.validationErrors) {
            setImportResults({
               added: 0,
               updated: 0,
               errors: err.validationErrors
            });
            setError('Validation failed. Please check the error log below.');
          } else {
            setError(err.message || 'Failed to process Excel file.');
          }
        } finally {
          setImporting(false);
          event.target.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setImporting(false);
      setError(`Failed to read file: ${err.message}`);
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-adminSidebar" />
            Data Synchronization
          </h1>
          <p className="text-[#4C677C] dark:text-gray-500 text-lg">
            Bulk import and export student profiles, marks, and daily attendance.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-col sm:flex-row bg-white/50 dark:bg-gray-900/50 p-1 rounded-xl w-full max-w-3xl mb-8 border border-gray-200 shadow-sm backdrop-blur-xl">
        <button
          onClick={() => { setSyncType('profiles'); setError(null); setImportResults(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            syncType === 'profiles' ? 'bg-adminSidebar text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserSquare2 className="w-5 h-5" />
          Student Profiles
        </button>
        <button
          onClick={() => { setSyncType('marks'); setError(null); setImportResults(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            syncType === 'marks' ? 'bg-[#62D4CA] text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          Marks / Grades
        </button>
        <button
          onClick={() => { setSyncType('attendance'); setError(null); setImportResults(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            syncType === 'attendance' ? 'bg-[#FCA311] text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          Daily Attendance
        </button>
      </div>

      {/* MARKS MODE SELECTOR & FILTERS */}
      {syncType === 'marks' && (
        <>
          <div className="flex bg-white/50 dark:bg-gray-900/50 p-1 rounded-xl w-full max-w-sm mb-4 border border-gray-200 shadow-sm backdrop-blur-xl">
            <button
              onClick={() => { setMarksMode('universal'); setError(null); setImportResults(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                marksMode === 'universal' ? 'bg-[#2E1C40] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Classes 6-10
            </button>
            <button
              onClick={() => { setMarksMode('legacy'); setError(null); setImportResults(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                marksMode === 'legacy' ? 'bg-[#2E1C40] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Classes 11-12
            </button>
          </div>
          
          <div className="mb-8 p-6 glass-card border border-[#62D4CA]/30">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              {marksMode === 'universal' ? 'Select Term for Classes 6-10 Import' : 'Select Class & Term for Classes 11-12 Import'}
            </h3>
            <div className={`grid grid-cols-1 ${marksMode === 'legacy' ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-md'} gap-6`}>
              {marksMode === 'legacy' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Standard</label>
                    <select
                      value={selectedStandard}
                      onChange={(e) => { setSelectedStandard(e.target.value); setSelectedSection(''); }}
                      className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#62D4CA] outline-none transition-all"
                    >
                      <option value="">Select Standard</option>
                      {standards.filter(std => ['XI', 'XII', '11', '12'].includes(std)).map(std => <option key={std} value={std}>{std}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      disabled={!selectedStandard}
                      className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#62D4CA] outline-none transition-all disabled:opacity-50"
                    >
                      <option value="">Select Section</option>
                      {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#62D4CA] outline-none transition-all"
                >
                  <option value="">Select Term</option>
                  {terms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ATTENDANCE FILTERS (For Export) */}
      {syncType === 'attendance' && (
        <div className="mb-8 p-6 glass-card border border-[#FCA311]/30">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            Export Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={attFromDate}
                onChange={e => setAttFromDate(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={attToDate}
                onChange={e => setAttToDate(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Standard</label>
              <select
                value={attStandard}
                onChange={(e) => { setAttStandard(e.target.value); setAttSection('All'); }}
                className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none"
              >
                <option value="All">All Standards</option>
                {standards.map(std => <option key={std} value={std}>{std}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
              <select
                value={attSection}
                onChange={(e) => setAttSection(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none"
              >
                <option value="All">All Sections</option>
                {attSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 rounded-xl border border-red-500/50 bg-red-500/10 flex items-start gap-3 text-red-500 animate-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Error</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {importResults && (
        <div className="mb-8 p-6 rounded-2xl border border-green-500/30 bg-green-500/10 flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <h3 className="text-lg font-bold">Import Completed</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {syncType === 'profiles' && (
              <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500">New Profiles Added</p>
                <p className="text-3xl font-bold text-gray-900">{importResults.added || 0}</p>
              </div>
            )}
            {(syncType === 'marks' || syncType === 'attendance') && importResults.added !== undefined && (
              <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500">New Records</p>
                <p className="text-3xl font-bold text-gray-900">{importResults.added || 0}</p>
              </div>
            )}
            <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Records Updated</p>
              <p className="text-3xl font-bold text-gray-900">{importResults.updated || 0}</p>
            </div>
            <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Errors Encountered</p>
              <p className="text-3xl font-bold text-red-500">{importResults.errors?.length || 0}</p>
            </div>
          </div>
          
          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mt-4 p-4 bg-white/50 rounded-xl border border-red-500/20 max-h-40 overflow-y-auto custom-scrollbar">
              <h4 className="text-sm font-bold text-red-500 mb-2">Error Log:</h4>
              <ul className="text-sm text-red-500/80 space-y-1 list-disc pl-4">
                {importResults.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="glass-card p-8 flex flex-col items-center text-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] transition-shadow">
            <Download className="w-10 h-10 text-blue-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {syncType === 'profiles' ? 'Export Profiles' : syncType === 'marks' ? 'Export Marks' : 'Export Daily Attendance'}
          </h2>
          <p className="text-[#4C677C] mb-8 max-w-sm">
            {syncType === 'profiles' 
              ? 'Download a complete backup of all student records in Excel format.'
              : syncType === 'marks' ? 'Download an Excel spreadsheet containing students and their subject marks.' 
              : 'Download Daily Attendance records in Excel format based on filters.'}
          </p>
          
          <button 
            onClick={syncType === 'profiles' ? handleExportProfiles : (syncType === 'marks' && marksMode === 'universal' ? downloadUniversalMarksTemplate : syncType === 'attendance' ? handleExportAttendance : handleExportMarks)}
            disabled={exporting || (syncType === 'marks' && marksMode === 'universal' ? false : false)}
            className="glass-button-primary bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs flex items-center justify-center gap-2 py-3 relative z-10"
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? 'Generating Excel...' : (syncType === 'marks' && marksMode === 'universal' ? 'Download 6-10 Template' : 'Download Excel Export')}
          </button>
        </div>

        {/* Import Card */}
        <div className="glass-card p-8 flex flex-col items-center text-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#62D4CA]/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className={`w-20 h-20 ${syncType === 'profiles' ? 'bg-adminSidebar/10 border-adminSidebar/20 text-adminSidebar' : syncType === 'marks' ? 'bg-[#62D4CA]/10 border-[#62D4CA]/20 text-[#2E1C40]' : 'bg-[#FCA311]/10 border-[#FCA311]/20 text-[#2E1C40]'} rounded-2xl flex items-center justify-center mb-6 border shadow-sm group-hover:shadow-md transition-shadow`}>
            <Upload className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {syncType === 'profiles' ? 'Import Profiles' : syncType === 'marks' ? 'Import Marks' : 'Import Daily Attendance'}
          </h2>
          <p className="text-[#4C677C] mb-6 max-w-sm">
            {syncType === 'profiles'
              ? 'Upload a CSV file to add new students or update existing ones.'
              : syncType === 'marks' ? 'Upload an Excel/CSV file containing subject marks for the selected term.'
              : 'Upload an Excel file containing Daily Attendance records.'}
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
            <label className={`cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-md transition-all ${
              syncType === 'profiles' ? 'bg-adminSidebar text-white hover:bg-adminSidebar/90' : syncType === 'marks' ? 'bg-[#62D4CA] text-gray-900 hover:bg-[#62D4CA]/90' : 'bg-[#FCA311] text-gray-900 hover:bg-[#FCA311]/90'
            }`}>
              {importing ? (
                <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              {importing ? 'Processing...' : (syncType === 'profiles' ? 'Select CSV File' : 'Select Excel File (.xlsx)')}
              <input 
                type="file" 
                accept={syncType === 'profiles' ? '.csv' : '.xlsx,.xls'} 
                className="hidden" 
                onChange={syncType === 'profiles' ? handleProfileUpload : (syncType === 'marks' && marksMode === 'universal' ? handleUniversalMarksUpload : syncType === 'attendance' ? handleAttendanceUpload : handleMarksUpload)}
                disabled={importing || (syncType === 'marks' && (marksMode === 'legacy' && (!selectedStandard || !selectedSection || !selectedTerm)))}
              />
            </label>
            
            <button 
              onClick={syncType === 'profiles' ? downloadProfileTemplate : (syncType === 'marks' && marksMode === 'universal' ? downloadUniversalMarksTemplate : syncType === 'attendance' ? downloadAttendanceTemplate : downloadMarksTemplate)}
              className="text-sm text-[#4C677C] hover:text-gray-900 underline transition-colors"
            >
              {syncType === 'profiles' ? 'Download CSV Template' : syncType === 'attendance' ? 'Download Attendance Excel Template' : 'Download Excel Template'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Import Guide */}
      <div className="mt-8 glass-card p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          How {syncType === 'profiles' ? 'Profile' : syncType === 'marks' ? 'Marks' : 'Attendance'} Import Works
        </h3>
        {syncType === 'profiles' ? (
          <ul className="space-y-3 text-[#4C677C]">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-adminSidebar/10 text-adminSidebar flex items-center justify-center text-sm font-bold mt-0.5">1</div>
              <p><strong>Upsert Logic:</strong> If a student with the same EMIS Number already exists, their information will be updated. If not, a new student will be created.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-adminSidebar/10 text-adminSidebar flex items-center justify-center text-sm font-bold mt-0.5">2</div>
              <p><strong>Required Fields:</strong> EMIS Number, Name, Standard, Section, and Medium are strictly required. Rows missing these will be skipped.</p>
            </li>
          </ul>
        ) : syncType === 'marks' ? (
          <ul className="space-y-3 text-[#4C677C]">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#62D4CA]/20 text-[#2E1C40] flex items-center justify-center text-sm font-bold mt-0.5">1</div>
              <p><strong>{marksMode === 'universal' ? 'Select Term:' : 'Select Target:'}</strong> {marksMode === 'universal' ? 'You must select the Term above. Classes 6-10 students will be matched using their EMIS Number.' : 'You must first select the Standard, Section, and Term above. The import will strictly apply to this selection.'}</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#62D4CA]/20 text-[#2E1C40] flex items-center justify-center text-sm font-bold mt-0.5">2</div>
              <p><strong>Template First:</strong> Always download the Excel Template first, as it contains exactly the right columns for the chosen format.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#62D4CA]/20 text-[#2E1C40] flex items-center justify-center text-sm font-bold mt-0.5">3</div>
              <p><strong>Match by EMIS:</strong> The system strictly matches students by EMIS Number.</p>
            </li>
          </ul>
        ) : (
          <ul className="space-y-3 text-[#4C677C]">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#FCA311]/20 text-[#2E1C40] flex items-center justify-center text-sm font-bold mt-0.5">1</div>
              <p><strong>ALL-OR-NOTHING:</strong> If any single row fails validation (e.g. unknown EMIS, wrong class, wrong status), the ENTIRE import is rejected. No partial imports.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#FCA311]/20 text-[#2E1C40] flex items-center justify-center text-sm font-bold mt-0.5">2</div>
              <p><strong>Sync to Period 1:</strong> Successfully importing Daily Attendance will automatically synchronize those statuses to Period 1.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#FCA311]/20 text-[#2E1C40] flex items-center justify-center text-sm font-bold mt-0.5">3</div>
              <p><strong>Updating:</strong> If a record for the student and date already exists, the import will UPDATE it instead of creating duplicates.</p>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
