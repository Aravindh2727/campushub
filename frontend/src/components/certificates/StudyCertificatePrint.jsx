import React from 'react';

export const StudyCertificatePrint = React.forwardRef(({ student, language = 'TAMIL' }, ref) => {
  if (!student) return null;

  const isEnglish = language === 'ENGLISH';

  const t = {
    title: isEnglish ? 'STUDY CERTIFICATE' : 'படிப்புச் சான்றிதழ்',
    schoolNameLabel: isEnglish ? 'Name of the School' : 'பள்ளியின் பெயர்',
    schoolName: isEnglish ? 'Government Hr Sec School, Dadapuram-604207.' : 'அரசு மேல்நிலைப் பள்ளி தாதாபுரம்-604207.',
    schoolCodeLabel: isEnglish ? 'School Code' : 'பள்ளி எண்',
    studentNameLabel: isEnglish ? 'Name of the student' : 'மாணவரின் பெயர்',
    fatherNameLabel: isEnglish ? 'Name of the Father' : 'தந்தையின் பெயர்',
    emisNoLabel: isEnglish ? 'EMIS Number' : 'EMIS எண்',
    dobLabel: isEnglish ? 'Date of Birth' : 'பிறந்த தேதி',
    admissionNoLabel: isEnglish ? 'Admission Number' : 'சேர்க்கை எண்',
    academicYearLabel: isEnglish ? 'Academic Year' : 'கல்வி ஆண்டு',
    standardLabel: isEnglish ? 'Standard Studying / Section' : 'படிப்பு / படித்த வகுப்பு',
    mediumLabel: isEnglish ? 'Medium of Student' : 'மொழிப் படிப்பு',
    religionLabel: isEnglish ? 'Religion' : 'மதம்',
    communityLabel: isEnglish ? 'Community' : 'பிரிவு',
    addressLabel: isEnglish ? 'Address' : 'முகவரி',
    declaration: isEnglish 
      ? 'Certified that the above particulars are verified with the school records and found correct.'
      : <>மேற்கண்ட அனைத்து விவரங்களும் பள்ளி ஆவணங்களுடன் சரிபார்க்கப்பட்டு,<br/>சரியானவை எனச் சான்றளிக்கப்பட்டுள்ளன.</>,
    classTeacherSign: isEnglish ? <>Class Teacher<br/>Signature</> : <>வகுப்பு ஆசிரியர்<br/>கையொப்பம்</>,
    hmSign: isEnglish ? 'Headmaster Signature' : 'தலைமை ஆசிரியர்'
  };

  const getTamilStandard = (std) => {
    const map = {
      '6': 'ஆறாம்',
      '7': 'ஏழாம்',
      '8': 'எட்டாம்',
      '9': 'ஒன்பதாம்',
      '10': 'பத்தாம்',
      '11': 'பதினொன்றாம்',
      '12': 'பன்னிரண்டாம்'
    };
    return map[String(std)] || std;
  };

  const getStandardString = () => {
    if (isEnglish) return `${student.standard} Standard - ${student.section} Section`;
    return `${getTamilStandard(student.standard)} வகுப்பு - ${student.section} பிரிவு`;
  };

  const getMediumString = () => {
    if (isEnglish) return student.medium === 'TAMIL' ? 'Tamil' : 'English';
    return student.medium === 'TAMIL' ? 'தமிழ்' : 'ஆங்கிலம்';
  };

  return (
    <div ref={ref} className={`print-certificate p-12 bg-white text-black ${isEnglish ? 'font-sans' : 'font-serif'} hidden`}>
      <h1 className="text-2xl font-bold text-center mb-8 uppercase">{t.title}</h1>

      <div className="space-y-4 max-w-3xl mx-auto text-lg">
        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.schoolNameLabel}</div>
          <div>: {t.schoolName}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.schoolCodeLabel}</div>
          <div>: 33070401302</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4 mt-6">
          <div className="font-semibold">{t.studentNameLabel}</div>
          <div>: {isEnglish ? (student.name) : (student.tamilName || student.name)}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.fatherNameLabel}</div>
          <div>: {student.fatherName || '-'}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.emisNoLabel}</div>
          <div>: {student.emisNumber || '-'}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.dobLabel}</div>
          <div>: {student.dob ? student.dob.split('-').reverse().join('-') : '-'}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.admissionNoLabel}</div>
          <div>: {student.admissionNumber || '-'}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4 mt-6">
          <div className="font-semibold">{t.academicYearLabel}</div>
          <div>: 2026-27</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.standardLabel}</div>
          <div>: {getStandardString()}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.mediumLabel}</div>
          <div>: {getMediumString()}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4 mt-6">
          <div className="font-semibold">{t.religionLabel}</div>
          <div>: {student.religion || '-'}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.communityLabel}</div>
          <div>: {student.community || '-'}</div>
        </div>

        <div className="grid grid-cols-[300px_auto] gap-4">
          <div className="font-semibold">{t.addressLabel}</div>
          <div>: {student.address || '-'}</div>
        </div>

        <div className="mt-10 text-center font-medium leading-relaxed px-10">
          {t.declaration}
        </div>

        <div className="flex justify-between items-end px-8 font-bold" style={{ marginTop: '60px' }}>
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
