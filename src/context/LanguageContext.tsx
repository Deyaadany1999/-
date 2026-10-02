import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRtl: boolean;
  t: (key: string, defaultText?: string) => string;
  formatDate: (dateStr?: string | null) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App branding
    appName: 'نظام إدارة السلامة والصحة المهنية للمعدات الثقيلة',
    appShortName: 'HSE للمعدات الثقيلة',
    safetyFirst: 'السلامة أولاً - التزام ومسؤولية',
    companySubtitle: 'منظومة إدارة سلامة المعدات والامتثال الميداني',

    // Nav
    dashboard: 'لوحة التحكم',
    equipment: 'المعدات',
    allEquipment: 'كافة المعدات',
    problems: 'البلاغات والملاحظات',
    employees: 'السائقين والموظفين',
    idCards: 'بطاقات الهوية والسلامة',
    contractors: 'المقاولين',
    reports: 'التقارير',
    notifications: 'مركز الإشعارات',
    administration: 'لوحة الإدارة',
    usersManagement: 'إدارة المستخدمين',
    rolesPermissions: 'الأدوار والصلاحيات',
    activityLog: 'سجل العمليات والتدقيق',
    systemSettings: 'إعدادات النظام',

    // Equipment Categories
    Cranes: 'رافعات',
    Trailers: 'مقطورات / تريلات',
    'Truck Cranes': 'رافعات شاحنة',
    Loaders: 'لوادر / جرافات',
    'Dump Trucks': 'قلابات',
    'Fork Lifts': 'رافعات شوكية',
    'Water Tanks': 'تناكر مياه',
    'Man Lifts': 'رافعات أفراد / مان لفت',
    'Jumbo Trucks': 'شاحنات جامبو',
    'Fuel Tanks': 'تناكر وقود',

    // Dashboard KPIs
    totalEquipment: 'إجمالي المعدات',
    totalProblems: 'إجمالي البلاغات',
    openProblems: 'البلاغات المفتوحة',
    dueWithin2Days: 'تستحق خلال يومين',
    overdueOpenProblems: 'متأخرة عن الموعد',
    closedProblems: 'البلاغات المغلقة',
    equipmentCategories: 'تصنيفات المعدات',
    units: 'معدة',
    openDefects: 'ملاحظات مفتوحة',
    statusDistribution: 'توزيع حالة البلاغات',
    problemsByCategory: 'البلاغات حسب نوع المعدة',
    problemsByContractor: 'البلاغات حسب المقاول',
    recentAlerts: 'أحدث التنبيهات والبلاغات',
    viewAll: 'عرض الكل',

    // Equipment fields
    equipmentCode: 'كود المعدة',
    equipmentType: 'نوع المعدة',
    contractor: 'المقاول',
    driverName: 'اسم السائق / المشغل',
    driverMobile: 'جوال السائق',
    licenseGrade: 'درجة الرخصة',
    nationalId: 'رقم الهوية / الإقامة',
    openProblemsCount: 'المشاكل المفتوحة',
    complianceStatus: 'حالة الامتثال',
    addEquipment: 'إضافة معدة جديدة',
    editEquipment: 'تعديل بيانات المعدة',
    equipmentDetails: 'ملف تفاصيل المعدة',
    driverInformation: 'بيانات السائق / المشغل',
    equipmentInformation: 'بيانات المعدة والمقاول',
    problemsSection: 'سجل ملاحظات وسلامة المعدة',

    // Problem fields
    problemDescription: 'وصف المشكلة / الملاحظة',
    problemDate: 'تاريخ التسجيل',
    deadline: 'الموعد النهائي للمعالجة',
    status: 'الحالة',
    daysRemaining: 'المدة المتبقية',
    closedDate: 'تاريخ الإغلاق',
    closedBy: 'تم الإغلاق بواسطة',
    closeNotes: 'ملاحظات الإغلاق والإصلاح',
    addProblem: 'تسجيل بلاغ سلامة جديد',
    editProblem: 'تعديل البلاغ',
    closeProblem: 'إغلاق البلاغ والمعالجة',
    reopenProblem: 'إعادة فتح البلاغ',
    problemImages: 'صور فحص المشكلة',
    uploadImages: 'رفع صور جديدة',
    imagePreview: 'معاينة الصورة',
    noImagesYet: 'لم يتم رفع صور لهذه المشكلة بعد',
    dragDropImages: 'اسحب الصور هنا أو اضغط للاختيار من جهازك',
    supportedFormats: 'الصيغ المدعومة: JPG, PNG, WEBP (بحد أقصى 10 ميجابايت)',

    // Statuses
    STATUS_OPEN: 'مفتوحة',
    STATUS_CLOSED: 'مغلقة',
    DUE_TODAY: 'تستحق اليوم',
    DUE_SOON: 'تستحق خلال يومين',
    OVERDUE: 'متأخرة',
    SAFE: 'سليمة ومطابقة',
    DEFECT_ACTIVE: 'يوجد ملاحظات نشطة',

    // Actions & Buttons
    actions: 'الإجراءات',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ البيانات',
    cancel: 'إلغاء',
    search: 'بحث...',
    searchPlaceholder: 'ابحث برقم المعدة، السائق، المقاول...',
    filter: 'تصفية',
    all: 'الكل',
    quickFilters: 'تصفيات سريعة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    confirm: 'تأكيد',
    print: 'طباعة',
    exportCsv: 'تصدير Excel / CSV',
    printIdCard: 'طباعة بطاقة السلامة',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    rememberMe: 'تذكرني على هذا الجهاز',
    forgotPassword: 'نسيت كلمة المرور؟',
    usernameOrEmail: 'اسم المستخدم أو البريد الإلكتروني',
    password: 'كلمة المرور',
    loginSubtitle: 'يرجى إدخال بيانات الدخول المعتمدة للوصول إلى النظام',

    // Confirmation & Warnings
    deleteConfirmTitle: 'تأكيد الحذف',
    deleteConfirmMessage: 'هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي؟',
    deleteWarningRelated: 'تحذير: هذا السجل مرتبط ببيانات وبلاغات أخرى في النظام!',
    forceDelete: 'حذف إجباري مع كافة البيانات المرتبطة',
    adminOnlyDelete: 'صلاحية الحذف مخصصة لمدير النظام فقط.',

    // Employee & ID Card
    employeeId: 'الرقم الوظيفي',
    fullName: 'الاسم الكامل',
    position: 'المسمى الوظيفي',
    inductionDate: 'تاريخ دورة السلامة (Induction)',
    linkedEquipment: 'المعدة المسندة',
    safetyIdBadge: 'بطاقة هوية السلامة المهنية للمعدات',
    authorizedOperator: 'مشغل / سائق معتمد',
    emergencyContact: 'طوارئ السلامة',
    authorizedUntil: 'ساري المفعول حتى',
    issueDate: 'تاريخ الإصدار',
    addEmployee: 'إضافة موظف / سائق',
    editEmployee: 'تعديل بيانات الموظف',

    // Reports
    hseReportsHub: 'مركز تقارير السلامة والصحة المهنية',
    selectReport: 'اختر نوع التقرير',
    report1: 'تقرير المعدات الشامل',
    report2: 'تقرير البلاغات والمشاكل المفتوحة',
    report3: 'تقرير المشاكل المغلقة والمحلولة',
    report4: 'تقرير البلاغات المتأخرة عن الموعد',
    report5: 'تقرير المشاكل المستحقة خلال يومين',
    report6: 'تقرير توزيع المعدات حسب التصنيف',
    report7: 'تقرير أداء المقاولين والامتثال',
    report8: 'تقرير السائقين والمشغلين المعتمدين',
    report9: 'التقرير التنفيذي الشامل للسلامة (HSE Summary)',
    generatedAt: 'تاريخ الإنشاء',
    generatedBy: 'تم التوليد بواسطة',

    // Empty states
    noDataFound: 'لا توجد بيانات متاحة',
    noEquipmentFound: 'لم يتم العثور على أي معدات تطابق معايير البحث',
    noProblemsFound: 'لا توجد بلاغات مسجلة حالياً',
    noNotifications: 'لا توجد إشعارات جديدة',
    noEmployeesFound: 'لا يوجد موظفين مسجلين',
    noContractorsFound: 'لا يوجد مقاولين مسجلين',

    // Pagination
    page: 'صفحة',
    of: 'من',
    showing: 'عرض',
    to: 'إلى',
    records: 'سجلات',
  },
  en: {
    // App branding
    appName: 'Heavy Equipment HSE Management System',
    appShortName: 'Heavy HSE',
    safetyFirst: 'Safety First - Commitment & Compliance',
    companySubtitle: 'Heavy Fleet Safety & HSE Compliance Platform',

    // Nav
    dashboard: 'Dashboard',
    equipment: 'Equipment',
    allEquipment: 'All Equipment',
    problems: 'Problems & Incidents',
    employees: 'Employees & Drivers',
    idCards: 'Safety ID Cards',
    contractors: 'Contractors',
    reports: 'Reports',
    notifications: 'Notifications',
    administration: 'Administration',
    usersManagement: 'Users Management',
    rolesPermissions: 'Roles & Permissions',
    activityLog: 'Activity / Audit Log',
    systemSettings: 'System Settings',

    // Equipment Categories
    Cranes: 'Cranes',
    Trailers: 'Trailers',
    'Truck Cranes': 'Truck Cranes',
    Loaders: 'Loaders',
    'Dump Trucks': 'Dump Trucks',
    'Fork Lifts': 'Fork Lifts',
    'Water Tanks': 'Water Tanks',
    'Man Lifts': 'Man Lifts',
    'Jumbo Trucks': 'Jumbo Trucks',
    'Fuel Tanks': 'Fuel Tanks',

    // Dashboard KPIs
    totalEquipment: 'Total Equipment',
    totalProblems: 'Total Problems',
    openProblems: 'Open Problems',
    dueWithin2Days: 'Due Within 2 Days',
    overdueOpenProblems: 'Overdue Open Problems',
    closedProblems: 'Closed Problems',
    equipmentCategories: 'Equipment Categories',
    units: 'Units',
    openDefects: 'Open Defects',
    statusDistribution: 'Problem Status Distribution',
    problemsByCategory: 'Problems by Equipment Type',
    problemsByContractor: 'Problems by Contractor',
    recentAlerts: 'Recent Safety Alerts',
    viewAll: 'View All',

    // Equipment fields
    equipmentCode: 'Equipment Code',
    equipmentType: 'Equipment Type',
    contractor: 'Contractor',
    driverName: 'Driver Name',
    driverMobile: 'Driver Mobile',
    licenseGrade: 'License Grade',
    nationalId: 'National ID',
    openProblemsCount: 'Open Problems',
    complianceStatus: 'Compliance Status',
    addEquipment: 'Add Equipment',
    editEquipment: 'Edit Equipment',
    equipmentDetails: 'Equipment Details',
    driverInformation: 'Driver Information',
    equipmentInformation: 'Equipment & Contractor Info',
    problemsSection: 'Safety Problems & Defect History',

    // Problem fields
    problemDescription: 'Problem Description',
    problemDate: 'Problem Date',
    deadline: 'Deadline',
    status: 'Status',
    daysRemaining: 'Days Remaining',
    closedDate: 'Closed Date',
    closedBy: 'Closed By',
    closeNotes: 'Closing & Resolution Notes',
    addProblem: 'Add Safety Problem',
    editProblem: 'Edit Problem',
    closeProblem: 'Close Problem',
    reopenProblem: 'Reopen Problem',
    problemImages: 'Inspection Photos',
    uploadImages: 'Upload Photos',
    imagePreview: 'Image Preview',
    noImagesYet: 'No photos uploaded for this problem yet',
    dragDropImages: 'Drag & drop photos here or click to browse',
    supportedFormats: 'Supported: JPG, PNG, WEBP (Max 10MB each)',

    // Statuses
    STATUS_OPEN: 'Open',
    STATUS_CLOSED: 'Closed',
    DUE_TODAY: 'Due Today',
    DUE_SOON: 'Due in 2 Days',
    OVERDUE: 'Overdue',
    SAFE: 'Compliant & Safe',
    DEFECT_ACTIVE: 'Defect Active',

    // Actions & Buttons
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save Changes',
    cancel: 'Cancel',
    search: 'Search...',
    searchPlaceholder: 'Search equipment code, driver, contractor...',
    filter: 'Filter',
    all: 'All',
    quickFilters: 'Quick Filters',
    apply: 'Apply',
    reset: 'Reset',
    confirm: 'Confirm',
    print: 'Print',
    exportCsv: 'Export CSV',
    printIdCard: 'Print ID Card',
    login: 'Log In',
    logout: 'Log Out',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    usernameOrEmail: 'Username or Email',
    password: 'Password',
    loginSubtitle: 'Enter your credentials to access the HSE safety management portal',

    // Confirmation & Warnings
    deleteConfirmTitle: 'Confirm Deletion',
    deleteConfirmMessage: 'Are you sure you want to permanently delete this record?',
    deleteWarningRelated: 'Warning: This record has associated safety defect history!',
    forceDelete: 'Force Delete with all associated records',
    adminOnlyDelete: 'Deletion is strictly restricted to Administrators.',

    // Employee & ID Card
    employeeId: 'Employee ID',
    fullName: 'Full Name',
    position: 'Position',
    inductionDate: 'HSE Induction Date',
    linkedEquipment: 'Linked Equipment',
    safetyIdBadge: 'Heavy Equipment Safety ID Card',
    authorizedOperator: 'Authorized Operator',
    emergencyContact: 'Emergency Contact',
    authorizedUntil: 'Valid Until',
    issueDate: 'Issue Date',
    addEmployee: 'Add Employee',
    editEmployee: 'Edit Employee',

    // Reports
    hseReportsHub: 'HSE Safety & Fleet Reports Hub',
    selectReport: 'Select Report Type',
    report1: 'Equipment Inventory & Status Report',
    report2: 'Open Safety Problems Report',
    report3: 'Closed & Resolved Problems Report',
    report4: 'Overdue Safety Defect Report',
    report5: 'Problems Due Within 2 Days Report',
    report6: 'Equipment Distribution by Category',
    report7: 'Contractor Safety Performance Report',
    report8: 'Certified Drivers & Operators Report',
    report9: 'Executive HSE Summary Report',
    generatedAt: 'Generated At',
    generatedBy: 'Generated By',

    // Empty states
    noDataFound: 'No data found',
    noEquipmentFound: 'No equipment records found matching criteria',
    noProblemsFound: 'No safety problems currently recorded',
    noNotifications: 'No notifications',
    noEmployeesFound: 'No employee records found',
    noContractorsFound: 'No contractors found',

    // Pagination
    page: 'Page',
    of: 'of',
    showing: 'Showing',
    to: 'to',
    records: 'records',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default primary language is Arabic as specified in prompt
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('hse_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    localStorage.setItem('hse_lang', language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language][key] || defaultText || key;
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      if (language === 'ar') {
        // Natural Arabic date formatting: YYYY/MM/DD
        return d.toLocaleDateString('ar-SA-u-ca-gregory', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRtl, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
