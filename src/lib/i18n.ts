// Internationalization support
export interface Translation {
  [key: string]: string;
}

export const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.doctors': 'Doctors',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.admin': 'Admin',
    'nav.profile': 'Profile',

    // Authentication
    'auth.welcome': 'Welcome to RLU 360',
    'auth.emailLogin': 'Login with Email',
    'auth.chooseMethod': 'Choose your login method',
    'auth.signingIn': 'Signing in...',
    'auth.googleLogin': 'Login with Google',
    'auth.or': 'or',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.backToOptions': 'Back to login options',
    'auth.demoHint': 'Demo credentials:',
    'auth.secureLogin': 'Secure login powered by RLU 360',
    'auth.accessDenied': 'Access Denied',
    'auth.accessDeniedMessage': 'You do not have permission to access this resource.',
    'auth.currentUser': 'Logged in as:',
    'auth.role': 'Role',
    'auth.goToDashboard': 'Go to Dashboard',
    'auth.logout': 'Logout',
    'auth.contactAdmin': 'Contact your administrator for access.',
    
    // Dashboard
    'dashboard.title': 'Hospital Dashboard',
    'dashboard.subtitle': 'Real-time insights and performance metrics',
    'dashboard.presentation': 'Presentation Mode',
    'dashboard.kpis': 'Key Performance Indicators',
    'dashboard.departments': 'Department Overview',
    
    // KPIs
    'kpi.totalTests': 'Total Tests',
    'kpi.accuracy': 'Accuracy Rate',
    'kpi.avgTurnaround': 'Avg Turnaround',
    'kpi.efficiency': 'Efficiency',
    
    // AI Features
    'ai.insights': 'AI Insights',
    'ai.generate': 'Generate Insights',
    'ai.analyzing': 'Analyzing...',
    'ai.predictive': 'Predictive Analytics',
    'ai.recommendations': 'AI Recommendations',
    'ai.optimization': 'Optimization Suggestions',
    
    // Admin
    'admin.title': 'System Administration',
    'admin.users': 'User Management',
    'admin.system': 'System Settings',
    'admin.database': 'Database',
    'admin.security': 'Security',
    'admin.addUser': 'Add User',
    
    // Common
    'common.export': 'Export',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.settings': 'Settings',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
  },
  th: {
    // Navigation
    'nav.dashboard': 'แดชบอร์ด',
    'nav.doctors': 'แพทย์',
    'nav.reports': 'รายงาน',
    'nav.analytics': 'การวิเคราะห์',
    'nav.admin': 'ผู้ดูแลระบบ',
    'nav.profile': 'โปรไฟล์',

    // Authentication
    'auth.welcome': 'ยินดีต้อนรับสู่ RLU 360',
    'auth.emailLogin': 'เข้าสู่ระบบด้วยอีเมล',
    'auth.chooseMethod': 'เลือกวิธีการเข้าสู่ระบบ',
    'auth.signingIn': 'กำลังเข้าสู่ระบบ...',
    'auth.googleLogin': 'เข้าสู่ระบบด้วย Google',
    'auth.or': 'หรือ',
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.signIn': 'เข้าสู่ระบบ',
    'auth.backToOptions': 'กลับไปยังตัวเลือกการเข้าสู่ระบบ',
    'auth.demoHint': 'ข้อมูลสำหรับทดสอบ:',
    'auth.secureLogin': 'การเข้าสู่ระบบที่ปลอดภัยโดย RLU 360',
    'auth.accessDenied': 'ไม่อนุญาตให้เข้าถึง',
    'auth.accessDeniedMessage': 'คุณไม่มีสิทธิ์ในการเข้าถึงทรัพยากรนี้',
    'auth.currentUser': 'เข้าสู่ระบบในนาม:',
    'auth.role': 'บทบาท',
    'auth.goToDashboard': 'ไปยังแดชบอร์ด',
    'auth.logout': 'ออกจากระบบ',
    'auth.contactAdmin': 'ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เข้าถึง',
    
    // Dashboard
    'dashboard.title': 'แดชบอร์ดโรงพยาบาล',
    'dashboard.subtitle': 'ข้อมูลเชิงลึกแบบเรียลไทม์และตัวชี้วัดประสิทธิภาพ',
    'dashboard.presentation': 'โหมดนำเสนอ',
    'dashboard.kpis': 'ตัวชี้วัดผลการปฏิบัติงานหลัก',
    'dashboard.departments': 'ภาพรวมแผนก',
    
    // KPIs
    'kpi.totalTests': 'จำนวนการตรวจทั้งหมด',
    'kpi.accuracy': 'อัตราความแม่นยำ',
    'kpi.avgTurnaround': 'เวลาเฉลี่ย',
    'kpi.efficiency': 'ประสิทธิภาพ',
    
    // AI Features
    'ai.insights': 'ข้อมูลเชิงลึกจาก AI',
    'ai.generate': 'สร้างข้อมูลเชิงลึก',
    'ai.analyzing': 'กำลังวิเคราะห์...',
    'ai.predictive': 'การวิเคราะห์เชิงทำนาย',
    'ai.recommendations': 'คำแนะนำจาก AI',
    'ai.optimization': 'คำแนะนำการปรับปรุง',
    
    // Admin
    'admin.title': 'การจัดการระบบ',
    'admin.users': 'การจัดการผู้ใช้',
    'admin.system': 'การตั้งค่าระบบ',
    'admin.database': 'ฐานข้อมูล',
    'admin.security': 'ความปลอดภัย',
    'admin.addUser': 'เพิ่มผู้ใช้',
    
    // Common
    'common.export': 'ส่งออก',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.view': 'ดู',
    'common.settings': 'การตั้งค่า',
    'common.loading': 'กำลังโหลด...',
    'common.success': 'สำเร็จ',
    'common.error': 'ข้อผิดพลาด',
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

class I18nService {
  private currentLanguage: Language = 'en';
  
  setLanguage(language: Language) {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
  }
  
  getLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(key: TranslationKey): string {
    return translations[this.currentLanguage][key] || translations.en[key] || key;
  }
  
  init() {
    const saved = localStorage.getItem('language') as Language;
    if (saved && saved in translations) {
      this.currentLanguage = saved;
    }
  }
}

export const i18n = new I18nService();