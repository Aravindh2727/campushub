import React from 'react';

export const RankCardPrint = React.forwardRef(({ student, language = 'TAMIL' }, ref) => {
  if (!student) return null;

  const isEnglish = language === 'ENGLISH';

  const t = {
    title: isEnglish ? 'STUDENT RANK CARD' : 'மாணவர் தரச் சான்றிதழ்',
    schoolName: isEnglish ? 'GOVERNMENT HR SEC SCHOOL DADAPURAM' : 'அரசு மேல்நிலைப் பள்ளி தாதாபுரம்',
    name: isEnglish ? 'Name' : 'பெயர்',
    classSection: isEnglish ? 'Class & Section' : 'வகுப்பு மற்றும் பிரிவு',
    emisNumber: isEnglish ? 'Roll/EMIS Number' : 'பதிவு / EMIS எண்',
    dob: isEnglish ? 'DOB' : 'பிறந்த தேதி',
    noMarks: isEnglish ? 'No marks available for this student.' : 'இந்த மாணவருக்கு மதிப்பெண்கள் இல்லை.',
    examSuffix: isEnglish ? 'Examination' : 'தேர்வு',
    subject: isEnglish ? 'Subject' : 'பாடம்',
    marksObtained: isEnglish ? 'Marks Obtained' : 'பெற்ற மதிப்பெண்கள்',
    total: isEnglish ? 'Total' : 'மொத்தம்',
    classTeacherSign: isEnglish ? <>Class Teacher<br/>Signature</> : <>வகுப்பு ஆசிரியர்<br/>கையொப்பம்</>,
    hmSign: isEnglish ? <>Headmaster<br/>Signature</> : <>தலைமை ஆசிரியர்<br/>கையொப்பம்</>
  };

  const translateTerm = (termName) => {
    if (isEnglish) return termName;
    const map = {
      'First Midterm': 'முதல் இடைப்பருவம்',
      'Quarterly': 'காலாண்டு',
      'Second Midterm': 'இரண்டாம் இடைப்பருவம்',
      'Half-Yearly': 'அரையாண்டு',
      'Third Midterm': 'மூன்றாம் இடைப்பருவம்',
      'Annual': 'ஆண்டு'
    };
    return map[termName] || termName;
  };

  // Aggregate marks for display
  const terms = student.terms || [];
  let totalScore = 0;

  return (
    <div ref={ref} className={`print-certificate p-12 bg-white text-black ${isEnglish ? 'font-sans' : 'font-serif'} hidden`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-2 uppercase">{t.title}</h1>
        <h2 className="text-xl font-bold text-center mb-8">{t.schoolName}</h2>

        <div className="flex justify-between mb-8 text-lg border-b-2 border-black pb-4">
          <div>
            <p><span className="font-semibold">{t.name}:</span> {isEnglish ? student.name : (student.tamilName || student.name)}</p>
            <p><span className="font-semibold">{t.classSection}:</span> {student.standard} - {student.section}</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">{t.emisNumber}:</span> {student.emisNumber || student.admissionNumber || '-'}</p>
            <p><span className="font-semibold">{t.dob}:</span> {student.dob ? student.dob.split('-').reverse().join('-') : '-'}</p>
          </div>
        </div>

        {terms.length === 0 ? (
          <p className="text-center text-lg italic mt-10">{t.noMarks}</p>
        ) : (
          <div className="space-y-8">
            {terms.map((term, i) => {
              const termTotal = term.marks.reduce((acc, curr) => acc + curr.score, 0);
              totalScore += termTotal;
              return (
                <div key={i} className="mb-6">
                  <h3 className="text-lg font-bold mb-3 uppercase">{translateTerm(term.termName)} {t.examSuffix}</h3>
                  <table className="w-full text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-2/3">{t.subject}</th>
                        <th className="border border-black p-2 text-center w-1/3">{t.marksObtained}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {term.marks.map((m, idx) => (
                        <tr key={idx}>
                          <td className="border border-black p-2 font-medium">{m.subject}</td>
                          <td className="border border-black p-2 text-center">{m.score}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-black p-2 text-right">{t.total}</td>
                        <td className="border border-black p-2 text-center">{termTotal}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 flex justify-between items-end px-8 font-bold">
          <div className="text-center">
            {t.classTeacherSign}
          </div>
          <div className="text-center">
            {t.hmSign}
          </div>
        </div>
      </div>
    </div>
  );
});
