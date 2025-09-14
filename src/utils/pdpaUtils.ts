// PDPA utility functions for anonymizing doctor data
export const anonymizeDoctorName = (name: string): string => {
  if (!name) return '';
  
  // Return only first name initial + "แพทย์" (Doctor)
  const firstInitial = name.charAt(0).toUpperCase();
  return `แพทย์ ${firstInitial}.`;
};

export const anonymizeDoctorData = (doctor: any, isJudge: boolean) => {
  if (!isJudge) return doctor;
  
  return {
    ...doctor,
    name: anonymizeDoctorName(doctor.name),
    // Keep all other data but anonymize the name
  };
};

export const anonymizeChartData = (chartData: any[], isJudge: boolean) => {
  if (!isJudge) return chartData;
  
  return chartData.map((item, index) => ({
    ...item,
    name: `แพทย์ ${index + 1}` // Doctor 1, Doctor 2, etc.
  }));
};
