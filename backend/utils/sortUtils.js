const sortStudentsByGenderAndName = (students) => {
  return students.sort((a, b) => {
    const priority = { 'Male': 1, 'Female': 2 };
    const getPriority = (gender) => priority[gender] || 3;
    
    const pA = getPriority(a.gender);
    const pB = getPriority(b.gender);
    
    if (pA !== pB) return pA - pB;
    
    // Fallback to name sort if genders are the same (case-insensitive)
    return (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' });
  });
};

module.exports = {
  sortStudentsByGenderAndName
};
