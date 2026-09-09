import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FileText, Download, X, Eye, Grid, BookOpen, CheckCircle, XCircle, GraduationCap, Printer, ClipboardCheck, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export function AdminReports() {
  const [allStudents, setAllStudents] = useState([]);
  const [homeworkData, setHomeworkData] = useState([]);
  const [classConfigsData, setClassConfigsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student');
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  // Attendance Report State
  const [attReportData, setAttReportData] = useState([]);
  const [attReportLoading, setAttReportLoading] = useState(false);
  const [attFilters, setAttFilters] = useState({
    fromDate: '',
    toDate: '',
    standard: 'All',
    section: 'All',
    percentage: 'All'
  });

  // Matrix specific state
  const [selectedMatrixGroup, setSelectedMatrixGroup] = useState(null);
  const [selectedMatrixStudents, setSelectedMatrixStudents] = useState([]);
  const [previewExamContext, setPreviewExamContext] = useState(null);

  const [matrixRow, setMatrixRow] = useState(['standard']);
  const [matrixCol, setMatrixCol] = useState(['gender']);
  const [showGlobalPreview, setShowGlobalPreview] = useState(false);

  // Reset preview when dimensions change
  useEffect(() => {
    setSelectedMatrixGroup(null);
    setSelectedMatrixStudents([]);
    setShowGlobalPreview(false);
    setPreviewExamContext(null);
  }, [matrixRow, matrixCol]);

  const matrixDimensions = [
    { id: 'standard', label: 'Class' },
    { id: 'section', label: 'Section' },
    { id: 'gender', label: 'Gender' },
    { id: 'community', label: 'Community' },
    { id: 'religion', label: 'Religion' },
    { id: 'medium', label: 'Medium' }
  ];

  const getDimensionValue = (student, dimIds) => {
    if (!Array.isArray(dimIds)) dimIds = [dimIds];
    if (dimIds.length === 0) return 'ALL';
    return dimIds.map(dimId => {
      const val = student[dimId];
      return val ? String(val).toUpperCase() : 'UNKNOWN';
    }).join(' - ');
  };

  const toggleDimension = (type, id) => {
    if (type === 'row') {
      setMatrixRow(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    } else {
      setMatrixCol(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, homeworkRes, classConfigsRes] = await Promise.all([
          api.getStudents('All', 'All'),
          api.getHomeworkByClass('All', 'All'),
          api.getClassConfigs()
        ]);
        setAllStudents(studentsRes.data || []);
        setHomeworkData(homeworkRes.data || []);
        setClassConfigsData(Array.isArray(classConfigsRes) ? classConfigsRes : (classConfigsRes.data || []));
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const mapStudentToExcelRow = (student) => ({
    'EMIS Num': student.emisNumber || student.rollNumber || '',
    'Name': student.name || '',
    'Standard': student.standard || '',
    'Section': student.section || '',
    'Gender': student.gender || '',
    'Medium': student.medium || '',
    'Tamil Nam': student.tamilName || '',
    'Father Nam': student.fatherName || '',
    'DOB': formatDate(student.dob),
    'Admission': student.admissionNumber || '',
    'Religion': student.religion || '',
    'Communit': student.community || '',
    'Address': student.address || '',
    'Mobile Number': student.mobileNumber || ''
  });

  const handleDownloadExcel = (groupKey, studentsToDownload) => {
    if (!studentsToDownload || studentsToDownload.length === 0) return;

    const excelData = studentsToDownload.map(mapStudentToExcelRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    XLSX.writeFile(workbook, `${groupKey.replace(/[^a-zA-Z0-9]/g, '_')}_students_report.xlsx`);
  };

  const handleDownloadSingleStudent = (student) => {
    handleDownloadExcel(student.name, [student]);
  };

  const handleDownloadMatrixExcel = (matrixData, rowValues, colValues, rowLabel, colLabel) => {
    const excelData = [];
    rowValues.forEach(rowVal => {
      const rowData = { [rowLabel]: rowVal };
      colValues.forEach(colVal => {
        rowData[colVal] = matrixData[rowVal]?.[colVal] || 0;
      });
      rowData['Total'] = matrixData[rowVal]?.total || 0;
      excelData.push(rowData);
    });
    const totalRow = { [rowLabel]: 'GRAND TOTAL' };
    colValues.forEach(colVal => {
      totalRow[colVal] = matrixData.colTotals?.[colVal] || 0;
    });
    totalRow['Total'] = matrixData.grandTotal || 0;
    excelData.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrix Report");
    XLSX.writeFile(workbook, `Matrix_Report_${rowLabel}_vs_${colLabel}.xlsx`);
  };

  const handlePrintMatrix = (rowValues, colValues, matrixData, rowLabel, colLabel) => {
    const printWindow = window.open('', '_blank');

    let tableHtml = `
      <html>
      <head>
        <title>Matrix Report - ${rowLabel} vs ${colLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .left-align { text-align: left; font-weight: bold; }
          .grand-total { font-weight: bold; background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>${rowLabel} vs ${colLabel} Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th class="left-align">${rowLabel} \\ ${colLabel}</th>
              ${colValues.map(c => `<th>${c}</th>`).join('')}
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${rowValues.map(r => `
              <tr>
                <td class="left-align">${r}</td>
                ${colValues.map(c => `<td>${matrixData[r]?.[c] || 0}</td>`).join('')}
                <td style="font-weight:bold;">${matrixData[r]?.total || 0}</td>
              </tr>
            `).join('')}
            <tr class="grand-total">
              <td class="left-align">GRAND TOTAL</td>
              ${colValues.map(c => `<td>${matrixData.colTotals[c] || 0}</td>`).join('')}
              <td>${matrixData.grandTotal || 0}</td>
            </tr>
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
  };

  const renderMatrixReport = () => {
    if (loading) return <div className="text-gray-500 text-center py-10 font-medium">Loading report data...</div>;
    if (!allStudents.length) return <div className="text-gray-500 text-center py-10 font-medium">No student data available for reports.</div>;

    const matrixData = {
      grandTotal: 0,
      colTotals: {},
      colStudents: {},
      grandTotalStudents: []
    };
    const rowSet = new Set();
    const colSet = new Set();

    allStudents.forEach(student => {
      const rVal = getDimensionValue(student, matrixRow);
      const cVal = getDimensionValue(student, matrixCol);
      rowSet.add(rVal);
      colSet.add(cVal);

      if (!matrixData[rVal]) {
        matrixData[rVal] = { total: 0, students: {}, totalStudents: [] };
      }
      if (!matrixData[rVal].students[cVal]) {
        matrixData[rVal].students[cVal] = [];
      }

      // Store counts
      matrixData[rVal][cVal] = (matrixData[rVal][cVal] || 0) + 1;
      matrixData[rVal].total += 1;
      matrixData.colTotals[cVal] = (matrixData.colTotals[cVal] || 0) + 1;
      matrixData.grandTotal += 1;

      // Store actual student objects for preview
      matrixData[rVal].students[cVal].push(student);
      matrixData[rVal].totalStudents.push(student);

      if (!matrixData.colStudents[cVal]) {
        matrixData.colStudents[cVal] = [];
      }
      matrixData.colStudents[cVal].push(student);
      matrixData.grandTotalStudents.push(student);
    });

    const customSort = (a, b) => {
      if (a === 'UNKNOWN') return 1;
      if (b === 'UNKNOWN') return -1;
      // Handle combined keys sorting by sorting each part
      const partsA = a.split(' - ');
      const partsB = b.split(' - ');
      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        const pA = partsA[i];
        const pB = partsB[i];
        const numA = parseInt(pA);
        const numB = parseInt(pB);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
        if (pA !== pB) return pA.localeCompare(pB);
      }
      return partsA.length - partsB.length;
    };

    const rowValues = Array.from(rowSet).sort(customSort);
    const colValues = Array.from(colSet).sort(customSort);

    const rowLabel = matrixRow.map(id => matrixDimensions.find(d => d.id === id)?.label).filter(Boolean).join(' - ') || 'Row';
    const colLabel = matrixCol.map(id => matrixDimensions.find(d => d.id === id)?.label).filter(Boolean).join(' - ') || 'Column';

    return (
      <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
          <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-adminAccent2 text-white"></span>
                {rowLabel} vs {colLabel} Breakdown
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-white shadow-sm border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-3 py-2 text-left border-r border-gray-200 bg-gray-50">{rowLabel} \ {colLabel}</th>
                  {colValues.map(c => (
                    <th key={c} className="px-3 py-2 bg-white/[0.01]">{c}</th>
                  ))}
                  <th className="px-3 py-2 text-gray-500 bg-gray-50 border-l border-gray-200">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {rowValues.map(r => (
                  <tr key={r} className="hover:bg-white shadow-sm transition-colors">
                    <td className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200 bg-white/[0.01]">{r}</td>
                    {colValues.map(c => {
                      const count = matrixData[r]?.[c] || 0;
                      return (
                        <td key={c} className="px-3 py-2 text-gray-500">
                          {count > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedMatrixGroup(`${r} / ${c}`);
                                setSelectedMatrixStudents(matrixData[r].students[c]);
                              }}
                              className="hover:text-adminSidebar underline decoration-dashed underline-offset-4 transition-colors"
                            >
                              {count}
                            </button>
                          ) : (
                            0
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 font-bold text-adminAccent2 bg-white shadow-sm border-l border-gray-200">
                      {matrixData[r]?.total > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedMatrixGroup(`${r} (Total)`);
                            setSelectedMatrixStudents(matrixData[r].totalStudents);
                          }}
                          className="hover:text-gray-900 underline decoration-dashed underline-offset-4 transition-colors"
                        >
                          {matrixData[r].total}
                        </button>
                      ) : (
                        0
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-white shadow-sm font-bold text-gray-900 border-t-2 border-gray-200">
                  <td className="px-3 py-2 text-left border-r border-gray-200 text-gray-700">GRAND TOTAL</td>
                  {colValues.map(c => {
                    const count = matrixData.colTotals[c] || 0;
                    return (
                      <td key={c} className="px-3 py-2 text-adminSidebar">
                        {count > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedMatrixGroup(`${c} (Total)`);
                              setSelectedMatrixStudents(matrixData.colStudents[c]);
                            }}
                            className="hover:text-gray-900 underline decoration-dashed underline-offset-4 transition-colors"
                          >
                            {count}
                          </button>
                        ) : (
                          0
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 bg-adminAccent2 text-white font-bold border-l border-gray-200">
                    {matrixData.grandTotal > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedMatrixGroup(`Grand Total`);
                          setSelectedMatrixStudents(matrixData.grandTotalStudents);
                        }}
                        className="hover:text-white/80 underline decoration-dashed underline-offset-4 transition-colors"
                      >
                        {matrixData.grandTotal}
                      </button>
                    ) : (
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handlePrintMatrix(rowValues, colValues, matrixData, rowLabel, colLabel)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminAccent2/10 hover:bg-adminAccent2/20 text-gray-700 border border-[#EBD8BE]/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
            >
              <Printer className="w-4.5 h-4.5" />
              Print
            </button>
            <button
              onClick={() => {
                setSelectedMatrixGroup("Custom Matrix Report");
                setSelectedMatrixStudents(matrixData.grandTotalStudents);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminSidebar/10 hover:bg-adminSidebar/20 text-adminSidebar border border-adminSidebar/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
            >
              <Eye className="w-4.5 h-4.5" />
              Preview
            </button>
            <button
              onClick={() => handleDownloadMatrixExcel(matrixData, rowValues, colValues, rowLabel, colLabel)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminAccent2 hover:bg-[#E07D08] text-white border border-adminAccent2/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
            >
              <Download className="w-4.5 h-4.5" />
              Download Excel
            </button>
          </div>
        </div>

      </div>
    );
  };
  const subjectOrder = [
    "Tamil",
    "English",
    "Maths",
    "Science",
    "Social Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Botany",
    "Zoology"
  ];

  const sortSubjects = (subjectsArray) => {
    return [...subjectsArray].sort((a, b) => {
      let indexA = subjectOrder.indexOf(a);
      let indexB = subjectOrder.indexOf(b);
      if (indexA === -1) indexA = 999;
      if (indexB === -1) indexB = 999;
      if (indexA !== indexB) return indexA - indexB;
      return a.localeCompare(b);
    });
  };

  const handleDownloadHomeworkExcel = (matrix, classes) => {
    const group1 = classes.filter(c => ['6', '7', '8', '9', '10'].includes(String(c.standard)));
    const group2 = classes.filter(c => ['11', '12'].includes(String(c.standard)));
    const groupOther = classes.filter(c => !['6', '7', '8', '9', '10', '11', '12'].includes(String(c.standard)));

    const aoa = [];

    const addGroupToAoA = (groupClasses) => {
      if (groupClasses.length === 0) return;

      const uniqueSubjects = Array.from(new Set(groupClasses.flatMap(c => c.subjects || [])));
      const groupSubjects = sortSubjects(uniqueSubjects);

      const headerRow = ['Class & Section', ...groupSubjects];
      aoa.push(headerRow);

      groupClasses.forEach(c => {
        const row = [`${c.standard} - ${c.section}`];
        groupSubjects.forEach(sub => {
          if (!c.subjects?.includes(sub)) {
            row.push('');
          } else {
            row.push(matrix[`${c.standard}-${c.section}`]?.[sub] ? 'Added' : 'Not Added');
          }
        });
        aoa.push(row);
      });
      aoa.push([]); // Empty row separator
    };

    addGroupToAoA(group1);
    addGroupToAoA(group2);
    addGroupToAoA(groupOther);

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Homework Report");
    XLSX.writeFile(workbook, `Homework_Report.xlsx`);
  };

  const renderHomeworkReport = () => {
    if (loading) return <div className="text-gray-500 text-center py-10 font-medium">Loading report data...</div>;

    // Sort classes
    const sortedClasses = [...classConfigsData].sort((a, b) => {
      const numA = parseInt(a.standard);
      const numB = parseInt(b.standard);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      return a.standard.localeCompare(b.standard) || a.section.localeCompare(b.section);
    });

    // Map homework
    const hwMap = {};
    homeworkData.forEach(hw => {
      const key = `${hw.standard}-${hw.section}`;
      if (!hwMap[key]) hwMap[key] = {};
      hwMap[key][hw.subject] = true;
    });

    const renderHomeworkMatrix = (title, classesGroup, showDownload = false) => {
      if (classesGroup.length === 0) return null;

      const uniqueSubjects = Array.from(new Set(classesGroup.flatMap(c => c.subjects || [])));
      const subjects = sortSubjects(uniqueSubjects);

      return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl mb-6 last:mb-0">
          <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-adminSidebar text-white"></span>
                {title}
              </h3>
            </div>
            {showDownload && (
              <button
                onClick={() => handleDownloadHomeworkExcel(hwMap, sortedClasses)}
                className="flex items-center justify-center gap-2 bg-adminSidebar/10 hover:bg-adminSidebar/20 text-adminSidebar border border-adminSidebar/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-white shadow-sm border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 text-left border-r border-gray-200 bg-gray-50 whitespace-nowrap sticky left-0 z-10">Class & Section</th>
                  {subjects.map(sub => (
                    <th key={sub} className="p-4 bg-white/[0.01]">
                      {sub}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {classesGroup.map(c => {
                  const key = `${c.standard}-${c.section}`;
                  return (
                    <tr key={key} className="hover:bg-white shadow-sm transition-colors">
                      <td className="p-4 text-left font-bold text-gray-700 border-r border-gray-200 bg-white whitespace-nowrap sticky left-0 z-10">{c.standard} - {c.section}</td>
                      {subjects.map(sub => {
                        if (!c.subjects?.includes(sub)) {
                          return <td key={sub} className="p-4 bg-white shadow-sm"></td>;
                        }
                        const hasHw = hwMap[key]?.[sub];
                        return (
                          <td key={sub} className="p-4">
                            <div className="flex justify-center">
                              {hasHw ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500/80" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const group1 = sortedClasses.filter(c => ['6', '7', '8', '9', '10'].includes(String(c.standard)));
    const group2 = sortedClasses.filter(c => ['11', '12'].includes(String(c.standard)));
    const groupOther = sortedClasses.filter(c => !['6', '7', '8', '9', '10', '11', '12'].includes(String(c.standard)));
    const allSubjects = Array.from(new Set(sortedClasses.flatMap(c => c.subjects || []))).sort();

    return (
      <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
        {sortedClasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 font-medium shadow-xl">
            No class configurations found
          </div>
        ) : (
          <>
            {renderHomeworkMatrix("Standards 6 to 10", group1, true)}
            {renderHomeworkMatrix("Standards 11 & 12", group2, group1.length === 0)}
            {renderHomeworkMatrix("Other Standards", groupOther, group1.length === 0 && group2.length === 0)}
          </>
        )}
      </div>
    );
  };

  const EXAMS = ['First Midterm', 'Quarterly', 'Second Midterm', 'Half-Yearly', 'Third Midterm', 'Annual'];

  const handleDownloadGradeBookExcel = (abstractData, standards) => {
    const excelData = [];
    standards.forEach(std => {
      const row = { 'Class & Sec': std };
      EXAMS.forEach(exam => {
        const stats = abstractData[std]?.[exam];
        if (stats) {
          row[`${exam} - Total`] = stats.total;
          row[`${exam} - Pass`] = stats.pass;
          row[`${exam} - Fail`] = stats.fail;
          row[`${exam} - Pass %`] = `${stats.passPercent}%`;
        } else {
          row[`${exam} - Total`] = '-';
        }
      });
      excelData.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grade Book Report");
    XLSX.writeFile(workbook, `Grade_Book_Report.xlsx`);
  };

  const renderGradeBookReport = () => {
    if (loading) return <div className="text-gray-500 text-center py-10 font-medium">Loading report data...</div>;

    const abstractData = {};
    const stdSet = new Set();

    allStudents.forEach(student => {
      const std = student.standard;
      const sec = student.section;
      if (!std || !sec) return;
      const clsSec = `${std} - ${sec}`;
      stdSet.add(clsSec);

      if (!abstractData[clsSec]) abstractData[clsSec] = {};

      if (student.terms && Array.isArray(student.terms)) {
        student.terms.forEach(term => {
          if (!term.termName || !term.marks || term.marks.length === 0) return;

          if (!abstractData[clsSec][term.termName]) {
            abstractData[clsSec][term.termName] = {
              total: 0, pass: 0, fail: 0,
              totalStudents: [], passStudents: [], failStudents: []
            };
          }

          abstractData[clsSec][term.termName].total += 1;
          abstractData[clsSec][term.termName].totalStudents.push(student);

          const passedAll = term.marks.every(m => m.score >= 35);
          if (passedAll) {
            abstractData[clsSec][term.termName].pass += 1;
            abstractData[clsSec][term.termName].passStudents.push(student);
          } else {
            abstractData[clsSec][term.termName].fail += 1;
            abstractData[clsSec][term.termName].failStudents.push(student);
          }
        });
      }
    });

    const standards = Array.from(stdSet).sort((a, b) => {
      const numA = parseInt(a.split(' - ')[0]);
      const numB = parseInt(b.split(' - ')[0]);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    // Calculate percentages
    standards.forEach(std => {
      EXAMS.forEach(exam => {
        if (abstractData[std]?.[exam]) {
          const stats = abstractData[std][exam];
          stats.passPercent = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
        }
      });
    });

    return (
      <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
          <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-start sm:items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-adminAccent2 shrink-0 mt-2 sm:mt-0"></span>
                <span>Class & Section-wise Pass/Fail Abstract</span>
              </h3>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors print:hidden whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => {
                  setSelectedMatrixGroup(`All Classes & Sections (Total)`);
                  const allStatsStudents = [];
                  standards.forEach(std => {
                    EXAMS.forEach(exam => {
                      if (abstractData[std]?.[exam]?.totalStudents) {
                        allStatsStudents.push(...abstractData[std][exam].totalStudents);
                      }
                    });
                  });
                  const uniqueStudents = Array.from(new Set(allStatsStudents.map(s => s._id)))
                    .map(id => allStatsStudents.find(s => s._id === id));
                  setSelectedMatrixStudents(uniqueStudents);
                  setPreviewExamContext(null);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminSidebar/10 hover:bg-adminSidebar/20 text-adminSidebar border border-adminSidebar/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => handleDownloadGradeBookExcel(abstractData, standards)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminAccent2/10 hover:bg-adminAccent2/20 text-gray-700 border border-[#EBD8BE]/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-white shadow-sm border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 text-left border-r border-gray-200 bg-gray-50 whitespace-nowrap sticky left-0 z-10" rowSpan="2">Class & Sec</th>
                  {EXAMS.map(exam => (
                    <th key={exam} className="p-3 border-b border-r border-gray-200 bg-white/[0.01]" colSpan="4">{exam}</th>
                  ))}
                </tr>
                <tr className="bg-white/[0.01] border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  {EXAMS.map(exam => (
                    <React.Fragment key={`${exam}-headers`}>
                      <th className="p-3 border-r border-gray-200">Total</th>
                      <th className="p-3 border-r border-gray-200 text-green-400">Pass</th>
                      <th className="p-3 border-r border-gray-200 text-red-400">Fail</th>
                      <th className="p-3 border-r border-gray-200 text-gray-700">Pass %</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {standards.map(std => (
                  <tr key={std} className="hover:bg-white shadow-sm transition-colors">
                    <td className="p-4 text-left font-bold text-gray-700 border-r border-gray-200 bg-white whitespace-nowrap sticky left-0 z-10">{std}</td>
                    {EXAMS.map(exam => {
                      const stats = abstractData[std]?.[exam];
                      if (!stats) {
                        return (
                          <React.Fragment key={`${std}-${exam}`}>
                            <td className="p-3 border-r border-gray-200 text-gray-500">-</td>
                            <td className="p-3 border-r border-gray-200 text-gray-500">-</td>
                            <td className="p-3 border-r border-gray-200 text-gray-500">-</td>
                            <td className="p-3 border-r border-gray-200 text-gray-500">-</td>
                          </React.Fragment>
                        );
                      }
                      return (
                        <React.Fragment key={`${std}-${exam}`}>
                          <td className="p-3 border-r border-gray-200 font-semibold text-gray-500">
                            {stats.total > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedMatrixGroup(`Class ${std} - ${exam} (Total)`);
                                  setSelectedMatrixStudents(stats.totalStudents);
                                  setPreviewExamContext(exam);
                                }}
                                className="hover:text-gray-900 underline decoration-dashed underline-offset-4 transition-colors"
                              >
                                {stats.total}
                              </button>
                            ) : 0}
                          </td>
                          <td className="p-3 border-r border-gray-200 font-bold text-green-400">
                            {stats.pass > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedMatrixGroup(`Class ${std} - ${exam} (Pass)`);
                                  setSelectedMatrixStudents(stats.passStudents);
                                  setPreviewExamContext(exam);
                                }}
                                className="hover:text-green-300 underline decoration-dashed underline-offset-4 transition-colors"
                              >
                                {stats.pass}
                              </button>
                            ) : 0}
                          </td>
                          <td className="p-3 border-r border-gray-200 font-bold text-red-400">
                            {stats.fail > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedMatrixGroup(`Class ${std} - ${exam} (Fail)`);
                                  setSelectedMatrixStudents(stats.failStudents);
                                  setPreviewExamContext(exam);
                                }}
                                className="hover:text-red-300 underline decoration-dashed underline-offset-4 transition-colors"
                              >
                                {stats.fail}
                              </button>
                            ) : 0}
                          </td>
                          <td className="p-3 border-r border-gray-200 font-bold text-gray-700">{stats.passPercent}%</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
                {standards.length === 0 && (
                  <tr>
                    <td colSpan={1 + EXAMS.length * 4} className="p-8 text-gray-500 font-medium">No grade book data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const fetchAttendanceReport = async () => {
    setAttReportLoading(true);
    try {
      const res = await api.getAttendanceReport(
        attFilters.fromDate, 
        attFilters.toDate, 
        attFilters.standard, 
        attFilters.section, 
        attFilters.percentage
      );
      if (res.success) {
        setAttReportData(res.data);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setAttReportLoading(false);
    }
  };

  const handleExportAttendanceReport = () => {
    if (!attReportData.length) return;
    const excelData = attReportData.map(r => ({
      'EMIS Number': r.emisNumber,
      'Student Name': r.name,
      'Standard': r.standard,
      'Section': r.section,
      'Total Days': r.totalDays,
      'Present Days': r.presentDays,
      'Absent Days': r.absentDays,
      'Attendance Percentage': `${r.percentage}%`
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `Attendance_Report.xlsx`);
  };

  const renderAttendanceReport = () => {
    const standards = ['All', ...Array.from(new Set(classConfigsData.map(c => c.standard))).sort((a,b) => {
       const order = ['LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', '11', '12'];
       let iA = order.indexOf(a); let iB = order.indexOf(b);
       if (iA === -1) iA = parseInt(a) || 999;
       if (iB === -1) iB = parseInt(b) || 999;
       return iA - iB;
    })];
    
    const sections = ['All', ...Array.from(new Set(classConfigsData
       .filter(c => attFilters.standard === 'All' || c.standard === attFilters.standard)
       .map(c => c.section))).sort()];
       
    return (
      <div className="mt-6 animate-in slide-in-from-top-4 duration-300 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FCA311]"></span>
            Attendance Report Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input type="date" value={attFilters.fromDate} onChange={e => setAttFilters({...attFilters, fromDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input type="date" value={attFilters.toDate} onChange={e => setAttFilters({...attFilters, toDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Standard</label>
              <select value={attFilters.standard} onChange={e => setAttFilters({...attFilters, standard: e.target.value, section: 'All'})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none">
                {standards.map(std => <option key={std} value={std}>{std}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
              <select value={attFilters.section} onChange={e => setAttFilters({...attFilters, section: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none">
                {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage</label>
              <select value={attFilters.percentage} onChange={e => setAttFilters({...attFilters, percentage: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none">
                <option value="All">All</option>
                <option value="90% and Above">90% and Above</option>
                <option value="80%–89%">80%–89%</option>
                <option value="75%–79%">75%–79%</option>
                <option value="Below 75%">Below 75%</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
             <button onClick={fetchAttendanceReport} disabled={attReportLoading} className="flex items-center gap-2 bg-[#2E1C40] hover:bg-[#4C677C] text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50">
               {attReportLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Search className="w-4 h-4" />}
               Generate Report
             </button>
          </div>
        </div>
        
        {attReportData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
             <div className="p-4 md:p-5 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Report Results ({attReportData.length} students)</h3>
                <button onClick={handleExportAttendanceReport} className="flex items-center gap-2 bg-[#FCA311] hover:bg-[#E07D08] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Download className="w-4 h-4" /> Export Report
                </button>
             </div>
             <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse relative">
                   <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                      <tr className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                         <th className="p-4 border-b border-gray-200">EMIS Number</th>
                         <th className="p-4 border-b border-gray-200">Student Name</th>
                         <th className="p-4 border-b border-gray-200 text-center">Standard</th>
                         <th className="p-4 border-b border-gray-200 text-center">Section</th>
                         <th className="p-4 border-b border-gray-200 text-center">Total Days</th>
                         <th className="p-4 border-b border-gray-200 text-center text-green-600">Present</th>
                         <th className="p-4 border-b border-gray-200 text-center text-red-600">Absent</th>
                         <th className="p-4 border-b border-gray-200 text-center">Attendance %</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {attReportData.map(r => (
                         <tr key={r.studentId} className="hover:bg-gray-50 transition-colors text-sm">
                            <td className="p-4 text-gray-600 font-medium">{r.emisNumber}</td>
                            <td className="p-4 font-bold text-gray-800">{r.name}</td>
                            <td className="p-4 text-center">{r.standard}</td>
                            <td className="p-4 text-center">{r.section}</td>
                            <td className="p-4 text-center font-semibold text-gray-600">{r.totalDays}</td>
                            <td className="p-4 text-center font-bold text-green-500">{r.presentDays}</td>
                            <td className="p-4 text-center font-bold text-red-500">{r.absentDays}</td>
                            <td className="p-4 text-center font-bold text-[#FCA311]">{r.percentage}%</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderSelectedGroupPreview = () => {
    return (
      <>
        {selectedMatrixGroup && selectedMatrixStudents.length > 0 && (
          <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl">
              <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-adminSidebar text-white"></span>
                    {selectedMatrixGroup} Students Preview
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                    {selectedMatrixStudents.length} Total
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadExcel(selectedMatrixGroup, selectedMatrixStudents)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminSidebar/10 hover:bg-adminSidebar/20 text-adminSidebar border border-adminSidebar/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Excel
                  </button>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      const tableHtml = `
                        <html>
                        <head>
                          <title>Print - ${selectedMatrixGroup} Students</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            h2 { text-align: center; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            th, td { border: 1px solid #ccc; padding: 10px; text-left: left; }
                            th { background-color: #f5f5f5; font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          <h2>${selectedMatrixGroup} Students (${selectedMatrixStudents.length} Total)</h2>
                          <table>
                            <thead>
                              <tr>
                                <th>EMIS Number</th>
                                <th>Name</th>
                                <th>Class & Section</th>
                                <th>Gender</th>
                                <th>Community</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${selectedMatrixStudents.map(s => `
                                <tr>
                                  <td>${s.emisNumber || s.rollNumber || 'N/A'}</td>
                                  <td>${s.name}</td>
                                  <td>${s.standard} - ${s.section}</td>
                                  <td>${s.gender || 'N/A'}</td>
                                  <td>${s.community || 'N/A'}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <script>
                            window.onload = function() {
                              window.print();
                              setTimeout(function() { window.close(); }, 500);
                            }
                          </script>
                        </body>
                        </html>
                      `;
                      printWindow.document.write(tableHtml);
                      printWindow.document.close();
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-adminAccent2/10 hover:bg-adminAccent2/20 text-gray-700 border border-[#EBD8BE]/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMatrixGroup(null);
                      setSelectedMatrixStudents([]);
                      setPreviewExamContext(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 bg-white z-10 shadow-md">
                    <tr className="bg-white shadow-sm border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                      <th className="p-4 font-semibold">EMIS Number</th>
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Class & Section</th>
                      {previewExamContext ? (
                        <th className="p-4 font-semibold text-center">Subject Status ({previewExamContext})</th>
                      ) : (
                        <>
                          <th className="p-4 font-semibold">Gender</th>
                          <th className="p-4 font-semibold">Community</th>
                          <th className="p-4 font-semibold text-right">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...selectedMatrixStudents].sort((a, b) => {
                      const classA = parseInt(a.standard) || 0;
                      const classB = parseInt(b.standard) || 0;
                      if (classA !== classB) return classA - classB;

                      const sectionA = (a.section || '').toLowerCase();
                      const sectionB = (b.section || '').toLowerCase();
                      if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);

                      const genderA = (a.gender || '').toLowerCase();
                      const genderB = (b.gender || '').toLowerCase();
                      if (genderA !== genderB) {
                        if (genderA === 'male') return -1;
                        if (genderB === 'male') return 1;
                        return genderA.localeCompare(genderB);
                      }

                      const nameA = (a.name || '').toLowerCase();
                      const nameB = (b.name || '').toLowerCase();
                      return nameA.localeCompare(nameB);
                    }).map((student) => (
                      <tr key={student._id} className="hover:bg-white shadow-sm transition-colors">
                        <td className="p-4 text-sm text-gray-500 font-medium">{student.emisNumber || student.rollNumber || 'N/A'}</td>
                        <td className="p-4 text-sm font-bold text-gray-700">{student.name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1F2937] text-white border border-[#374151]">
                            {student.standard} - {student.section}
                          </span>
                        </td>
                        {previewExamContext ? (
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 justify-center max-w-[250px]">
                              {student.terms?.find(t => t.termName === previewExamContext)?.marks
                                ?.filter(m => {
                                  if (selectedMatrixGroup?.includes('(Pass)')) return m.score >= 35;
                                  if (selectedMatrixGroup?.includes('(Fail)')) return m.score < 35;
                                  return true;
                                })
                                .map((m, i) => (
                                  <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.score >= 35 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {String(m.subject).substring(0, 3)}: {m.score}
                                  </span>
                                ))}
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="p-4 text-sm text-gray-500">{student.gender || 'N/A'}</td>
                            <td className="p-4 text-sm text-gray-500">{student.community || 'N/A'}</td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudentDetails(student)}
                                className="p-2 bg-adminSidebar/10 hover:bg-adminSidebar/20 text-adminSidebar rounded-xl transition-colors"
                                title="View Student Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadSingleStudent(student)}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors"
                                title="Download Student Record"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-700 drop-shadow-sm flex items-center gap-3">
            <div className="p-2 bg-adminAccent2/10 rounded-xl">
              <FileText className="w-8 h-8 text-gray-700" />
            </div>
            Admin Reports
          </h1>

        </div>
      </div>
      <div className="flex overflow-x-auto bg-white border border-gray-200 shadow-sm rounded-2xl p-1.5 gap-2 hide-scrollbar">
        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'student' 
              ? 'bg-adminSidebar text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Grid className="w-5 h-5" />
          Student Report
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'homework' 
              ? 'bg-adminSidebar text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Student Homework Report
        </button>
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'gradebook' 
              ? 'bg-adminSidebar text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          Student Grade Book Report
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'attendance' 
              ? 'bg-[#FCA311] text-gray-900 shadow-md' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          Attendance Report
        </button>
      </div>

      {activeTab === 'student' && (
        <>
          {/* Custom Matrix Report Builder */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 md:p-8">


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Row Selection */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-inner">
                <h3 className="text-xs text-gray-700 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-adminAccent2"></span>
                  Select Row Dimension
                </h3>
                <div className="flex flex-wrap gap-3">
                  {matrixDimensions.map(dim => {
                    const isSelected = matrixRow.includes(dim.id);
                    const isDisabled = matrixCol.includes(dim.id);
                    return (
                      <label key={`row-${dim.id}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-adminAccent2 text-white border-adminAccent2 font-semibold shadow-[0_0_10px_rgba(249,203,132,0.4)]' :
                        isDisabled ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' :
                          'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}>
                        <input
                          type="checkbox"
                          name="matrixRow"
                          value={dim.id}
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleDimension('row', dim.id)}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-adminAccent2' : 'border-gray-300 bg-white'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-sm bg-white" />}
                        </div>
                        <span className="text-sm font-medium">{dim.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Column Selection */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-inner">
                <h3 className="text-xs text-adminSidebar uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-adminSidebar text-white"></span>
                  Select Column Dimension
                </h3>
                <div className="flex flex-wrap gap-3">
                  {matrixDimensions.map(dim => {
                    const isSelected = matrixCol.includes(dim.id);
                    const isDisabled = matrixRow.includes(dim.id);
                    return (
                      <label key={`col-${dim.id}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-adminSidebar border-adminSidebar text-white font-semibold shadow-sm' :
                        isDisabled ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' :
                          'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}>
                        <input
                          type="checkbox"
                          name="matrixCol"
                          value={dim.id}
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleDimension('col', dim.id)}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-adminSidebar' : 'border-gray-300 bg-white'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-sm bg-white" />}
                        </div>
                        <span className="text-sm font-medium">{dim.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {renderMatrixReport()}
          </div>

          {/* Student Details Modal */}
          {selectedStudentDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-adminSidebar text-white"></span>
                    Student Details
                  </h3>
                  <button
                    onClick={() => setSelectedStudentDetails(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h4 className="text-adminSidebar text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2">Personal Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Full Name</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Tamil Name</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.tamilName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Gender</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Date of Birth</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.dob ? selectedStudentDetails.dob.split('-').reverse().join('-') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Father's Name</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.fatherName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Info */}
                    <div className="space-y-4">
                      <h4 className="text-adminAccent2 text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2">Academic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">EMIS Number</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.emisNumber || selectedStudentDetails.rollNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Admission Number</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.admissionNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Class & Section</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.standard} - {selectedStudentDetails.section}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Medium</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.medium || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4 md:col-span-2">
                      <h4 className="text-gray-700 text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2">Contact & Background</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Mobile Number</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.mobileNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Religion / Community</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.religion || 'N/A'} / {selectedStudentDetails.community || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Address</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedStudentDetails.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white shadow-sm flex justify-end">
                  <button
                    onClick={() => setSelectedStudentDetails(null)}
                    className="px-6 py-2 bg-gray-100 hover:bg-white/20 text-gray-900 rounded-xl text-sm font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'homework' && renderHomeworkReport()}
      {activeTab === 'gradebook' && renderGradeBookReport()}
      {activeTab === 'attendance' && renderAttendanceReport()}

      {renderSelectedGroupPreview()}
    </div>
  );
}
