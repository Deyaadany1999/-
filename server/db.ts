import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  mobile: string;
  passwordHash: string;
  roleId: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
}

export interface EquipmentType {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
}

export interface Contractor {
  id: string;
  name: string;
  nameAr: string;
  contactPerson: string;
  mobile: string;
  email: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  fullNameAr: string;
  position: string;
  positionAr: string;
  mobile: string;
  nationalId: string;
  inductionDate: string;
  licenseGrade: string;
  linkedEquipmentCode?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  equipmentCode: string; // e.g. TR-003, C-15, L-02
  equipmentType: string; // Cranes, Trailers, etc.
  contractor: string;
  driverName: string;
  driverMobile: string;
  licenseGrade: string;
  nationalId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProblemImage {
  id: string;
  problemId: string;
  fileName: string;
  fileSize: number;
  dataUrl: string; // base64 or url
  uploadedAt: string;
}

export interface Problem {
  id: string;
  equipmentCode: string;
  equipmentType: string;
  problemDescription: string;
  problemDescriptionAr?: string;
  problemDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  status: 'OPEN' | 'CLOSED';
  closedDate?: string | null;
  closedBy?: string;
  closeNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: 'due_soon' | 'due_today' | 'overdue' | 'system';
  problemId?: string;
  equipmentCode?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  companyName: string;
  companyNameAr: string;
  safetyContactMobile: string;
  warningDaysThreshold: number;
  hsePolicyNumber: string;
  allowSelfRegistration: boolean;
}

export interface DatabaseSchema {
  users: User[];
  roles: Role[];
  equipmentTypes: EquipmentType[];
  contractors: Contractor[];
  employees: Employee[];
  equipment: Equipment[];
  problems: Problem[];
  problemImages: ProblemImage[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'hse_db.json');

// Simple secure hash helper (SHA-256 with salt)
export function hashPassword(password: string): string {
  const salt = 'hse_safety_salt_2026_';
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

export const PERMISSIONS_LIST = [
  // Dashboard
  { code: 'DASHBOARD_VIEW', category: 'Dashboard', name: 'View Dashboard', nameAr: 'عرض لوحة التحكم' },
  // Equipment
  { code: 'EQUIPMENT_VIEW', category: 'Equipment', name: 'View Equipment', nameAr: 'عرض المعدات' },
  { code: 'EQUIPMENT_ADD', category: 'Equipment', name: 'Add Equipment', nameAr: 'إضافة معدة' },
  { code: 'EQUIPMENT_EDIT', category: 'Equipment', name: 'Edit Equipment', nameAr: 'تعديل معدة' },
  { code: 'EQUIPMENT_DELETE', category: 'Equipment', name: 'Delete Equipment', nameAr: 'حذف معدة' },
  // Problems
  { code: 'PROBLEMS_VIEW', category: 'Problems', name: 'View Problems', nameAr: 'عرض المشاكل والبلاغات' },
  { code: 'PROBLEMS_ADD', category: 'Problems', name: 'Add Problem', nameAr: 'تسجيل مشكلة جديدة' },
  { code: 'PROBLEMS_EDIT', category: 'Problems', name: 'Edit Problem', nameAr: 'تعديل مشكلة' },
  { code: 'PROBLEMS_CLOSE', category: 'Problems', name: 'Close Problem', nameAr: 'إغلاق المشكلة' },
  { code: 'PROBLEMS_DELETE', category: 'Problems', name: 'Delete Problem', nameAr: 'حذف مشكلة' },
  { code: 'PROBLEMS_IMAGE_UPLOAD', category: 'Problems', name: 'Upload Problem Images', nameAr: 'رفع صور المشاكل' },
  { code: 'PROBLEMS_IMAGE_DELETE', category: 'Problems', name: 'Delete Problem Images', nameAr: 'حذف صور المشاكل' },
  // Employees
  { code: 'EMPLOYEES_VIEW', category: 'Employees', name: 'View Employees', nameAr: 'عرض السائقين والموظفين' },
  { code: 'EMPLOYEES_ADD', category: 'Employees', name: 'Add Employee', nameAr: 'إضافة موظف/سائق' },
  { code: 'EMPLOYEES_EDIT', category: 'Employees', name: 'Edit Employee', nameAr: 'تعديل موظف/سائق' },
  { code: 'EMPLOYEES_DELETE', category: 'Employees', name: 'Delete Employee', nameAr: 'حذف موظف/سائق' },
  // ID Cards
  { code: 'IDCARDS_VIEW', category: 'ID Cards', name: 'View ID Cards', nameAr: 'عرض بطاقات الهوية' },
  { code: 'IDCARDS_CREATE', category: 'ID Cards', name: 'Create ID Card', nameAr: 'إنشاء بطاقة هوية' },
  { code: 'IDCARDS_PRINT', category: 'ID Cards', name: 'Print ID Card', nameAr: 'طباعة بطاقة الهوية' },
  // Contractors
  { code: 'CONTRACTORS_VIEW', category: 'Contractors', name: 'View Contractors', nameAr: 'عرض المقاولين' },
  { code: 'CONTRACTORS_MANAGE', category: 'Contractors', name: 'Manage Contractors', nameAr: 'إدارة المقاولين' },
  // Reports
  { code: 'REPORTS_VIEW', category: 'Reports', name: 'View Reports', nameAr: 'عرض التقارير' },
  { code: 'REPORTS_EXPORT', category: 'Reports', name: 'Export Reports', nameAr: 'تصدير التقارير' },
  { code: 'REPORTS_PRINT', category: 'Reports', name: 'Print Reports', nameAr: 'طباعة التقارير' },
  // Users
  { code: 'USERS_VIEW', category: 'Users', name: 'View Users', nameAr: 'عرض المستخدمين' },
  { code: 'USERS_ADD', category: 'Users', name: 'Add Users', nameAr: 'إضافة مستخدم' },
  { code: 'USERS_EDIT', category: 'Users', name: 'Edit Users', nameAr: 'تعديل مستخدم' },
  { code: 'USERS_DELETE', category: 'Users', name: 'Delete Users', nameAr: 'حذف مستخدم' },
  // Roles
  { code: 'ROLES_VIEW', category: 'Roles', name: 'View Roles', nameAr: 'عرض الأدوار' },
  { code: 'ROLES_MANAGE', category: 'Roles', name: 'Manage Roles & Permissions', nameAr: 'إدارة الأدوار والصلاحيات' },
  // Notifications & Audit
  { code: 'NOTIFICATIONS_VIEW', category: 'Notifications', name: 'View Notifications', nameAr: 'عرض الإشعارات' },
  { code: 'AUDIT_VIEW', category: 'System', name: 'View Activity Log', nameAr: 'عرض سجل العمليات' },
  { code: 'SYSTEM_SETTINGS', category: 'System', name: 'Manage System Settings', nameAr: 'إدارة إعدادات النظام' },
];

export const INITIAL_EQUIPMENT_TYPES: EquipmentType[] = [
  { id: 'et-1', code: 'CR', name: 'Cranes', nameAr: 'رافعات', icon: 'TowerControl', description: 'Heavy lifting mobile and crawler cranes' },
  { id: 'et-2', code: 'TR', name: 'Trailers', nameAr: 'مقطورات / تريلات', icon: 'Truck', description: 'Flatbed and lowbed heavy haul trailers' },
  { id: 'et-3', code: 'TC', name: 'Truck Cranes', nameAr: 'رافعات شاحنة', icon: 'Wrench', description: 'Truck mounted boom cranes' },
  { id: 'et-4', code: 'LD', name: 'Loaders', nameAr: 'لوادر / جرافات', icon: 'Construction', description: 'Wheel loaders and tracked earthmovers' },
  { id: 'et-5', code: 'DT', name: 'Dump Trucks', nameAr: 'قلابات', icon: 'HardHat', description: 'Heavy off-highway articulated dump trucks' },
  { id: 'et-6', code: 'FL', name: 'Fork Lifts', nameAr: 'رافعات شوكية', icon: 'Package', description: 'All-terrain and warehouse forklifts' },
  { id: 'et-7', code: 'WT', name: 'Water Tanks', nameAr: 'تناكر مياه', icon: 'Droplets', description: 'Site dust control and water tankers' },
  { id: 'et-8', code: 'ML', name: 'Man Lifts', nameAr: 'رافعات أفراد / مان لفت', icon: 'Activity', description: 'Boom lifts, scissor lifts, and spider platforms' },
  { id: 'et-9', code: 'JB', name: 'Jumbo Trucks', nameAr: 'شاحنات جامبو', icon: 'Boxes', description: 'High-payload commercial transport trucks' },
  { id: 'et-10', code: 'FT', name: 'Fuel Tanks', nameAr: 'تناكر وقود', icon: 'Flame', description: 'Mobile diesel refueling and tanker trucks' },
];

function getSampleImages() {
  // Ultra-lightweight valid SVG data-uris representing industrial HSE safety photos
  const img1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><circle cx="300" cy="200" r="100" fill="%23e11d48" opacity="0.2"/><path d="M250 250 L350 150 M350 250 L250 150" stroke="%23f43f5e" stroke-width="8"/><text x="300" y="320" fill="%23cbd5e1" font-size="20" font-family="sans-serif" text-anchor="middle">Hydraulic Leakage Inspection Area</text><rect x="50" y="50" width="180" height="35" rx="5" fill="%23b91c1c"/><text x="140" y="74" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">HSE DEFECT DETECTED</text></svg>`;
  const img2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><polygon points="300,100 450,300 150,300" fill="%23f59e0b" opacity="0.2"/><polygon points="300,120 430,290 170,290" fill="none" stroke="%23f59e0b" stroke-width="6"/><text x="300" y="240" fill="%23fbbf24" font-size="50" font-weight="bold" text-anchor="middle">!</text><text x="300" y="340" fill="%23e2e8f0" font-size="18" font-family="sans-serif" text-anchor="middle">Worn Outrigger Pad & Lock Pin</text></svg>`;
  const img3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23182234"/><circle cx="300" cy="180" r="80" fill="%233b82f6" opacity="0.2"/><circle cx="300" cy="180" r="70" fill="none" stroke="%2360a5fa" stroke-width="4"/><line x1="300" y1="180" x2="330" y2="150" stroke="%23ef4444" stroke-width="5"/><text x="300" y="320" fill="%2394a3b8" font-size="18" font-family="sans-serif" text-anchor="middle">Pressure Gauge Gauge Calibration Check</text></svg>`;
  return { img1, img2, img3 };
}

export function createInitialDatabase(): DatabaseSchema {
  const allPerms = PERMISSIONS_LIST.map((p) => p.code);
  const managerPerms = allPerms.filter((p) => !['USERS_DELETE', 'ROLES_MANAGE', 'SYSTEM_SETTINGS'].includes(p));
  const officerPerms = allPerms.filter((p) => [
    'DASHBOARD_VIEW', 'EQUIPMENT_VIEW', 'EQUIPMENT_ADD', 'EQUIPMENT_EDIT',
    'PROBLEMS_VIEW', 'PROBLEMS_ADD', 'PROBLEMS_EDIT', 'PROBLEMS_CLOSE', 'PROBLEMS_IMAGE_UPLOAD',
    'EMPLOYEES_VIEW', 'EMPLOYEES_ADD', 'EMPLOYEES_EDIT', 'IDCARDS_VIEW', 'IDCARDS_PRINT',
    'CONTRACTORS_VIEW', 'REPORTS_VIEW', 'REPORTS_PRINT', 'NOTIFICATIONS_VIEW'
  ].includes(p));
  const dataEntryPerms = [
    'DASHBOARD_VIEW', 'EQUIPMENT_VIEW', 'EQUIPMENT_ADD', 'EQUIPMENT_EDIT',
    'PROBLEMS_VIEW', 'PROBLEMS_ADD', 'PROBLEMS_EDIT', 'PROBLEMS_IMAGE_UPLOAD',
    'EMPLOYEES_VIEW', 'EMPLOYEES_ADD', 'CONTRACTORS_VIEW'
  ];
  const viewerPerms = [
    'DASHBOARD_VIEW', 'EQUIPMENT_VIEW', 'PROBLEMS_VIEW', 'EMPLOYEES_VIEW', 'IDCARDS_VIEW',
    'CONTRACTORS_VIEW', 'REPORTS_VIEW', 'NOTIFICATIONS_VIEW'
  ];

  const roles: Role[] = [
    {
      id: 'role-admin',
      name: 'Administrator',
      nameAr: 'مدير النظام',
      description: 'Full system access including user control, role management, and deletion rights',
      isSystem: true,
      permissions: allPerms,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'role-hse-mgr',
      name: 'HSE Manager',
      nameAr: 'مدير السلامة والصحة المهنية',
      description: 'Oversees safety compliance, approves problem closures, generates safety audits',
      isSystem: true,
      permissions: managerPerms,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'role-hse-off',
      name: 'HSE Officer',
      nameAr: 'مسؤول السلامة الميداني',
      description: 'Field inspections, equipment safety reporting, problem logging, and image uploads',
      isSystem: true,
      permissions: officerPerms,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'role-data-entry',
      name: 'Data Entry',
      nameAr: 'مدخل بيانات',
      description: 'Equipment registration, driver profile updates, problem input',
      isSystem: true,
      permissions: dataEntryPerms,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'role-viewer',
      name: 'Viewer',
      nameAr: 'مستعرض / مراقب',
      description: 'Read-only access for corporate auditors, client representatives, and observers',
      isSystem: true,
      permissions: viewerPerms,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const users: User[] = [
    {
      id: 'usr-1',
      username: 'admin',
      email: 'admin@hseheavy.com',
      fullName: 'Eng. Khalid Al-Mansoor',
      mobile: '+966 50 123 4567',
      passwordHash: hashPassword('admin123'),
      roleId: 'role-admin',
      status: 'Active',
      createdAt: '2026-01-10T08:00:00Z',
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-2',
      username: 'hse_manager',
      email: 'manager@hseheavy.com',
      fullName: 'Tariq Al-Ghamdi',
      mobile: '+966 55 987 6543',
      passwordHash: hashPassword('manager123'),
      roleId: 'role-hse-mgr',
      status: 'Active',
      createdAt: '2026-01-15T09:30:00Z',
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-3',
      username: 'hse_officer',
      email: 'officer@hseheavy.com',
      fullName: 'Fahad Al-Otaibi',
      mobile: '+966 54 321 0987',
      passwordHash: hashPassword('officer123'),
      roleId: 'role-hse-off',
      status: 'Active',
      createdAt: '2026-02-01T10:00:00Z',
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-4',
      username: 'viewer',
      email: 'viewer@hseheavy.com',
      fullName: 'Sultan Al-Dossary',
      mobile: '+966 56 444 3322',
      passwordHash: hashPassword('viewer123'),
      roleId: 'role-viewer',
      status: 'Active',
      createdAt: '2026-02-15T11:00:00Z',
      lastLogin: new Date().toISOString(),
    },
  ];

  const contractors: Contractor[] = [
    {
      id: 'cont-1',
      name: 'Al-Bawardi Heavy Transport',
      nameAr: 'شركة البواردي للنقل الثقيل',
      contactPerson: 'Saleh Al-Bawardi',
      mobile: '+966 50 222 1100',
      email: 'operations@albawardi-logistics.com',
      createdAt: '2026-01-05T00:00:00Z',
    },
    {
      id: 'cont-2',
      name: 'Al-Fahad Contracting & Equipment',
      nameAr: 'الفهد للمقاولات والمعدات',
      contactPerson: 'Majed Al-Fahad',
      mobile: '+966 55 333 4411',
      email: 'heavy@alfahad-group.com',
      createdAt: '2026-01-06T00:00:00Z',
    },
    {
      id: 'cont-3',
      name: 'PetroBuild Engineering Fleet',
      nameAr: 'أسطول بتروبيلد الهندسية',
      contactPerson: 'Hassan Al-Zahrani',
      mobile: '+966 53 444 5522',
      email: 'fleet@petrobuild-sa.com',
      createdAt: '2026-01-08T00:00:00Z',
    },
    {
      id: 'cont-4',
      name: 'Gulf Desert Logistics',
      nameAr: 'لوجستيات صحراء الخليج',
      contactPerson: 'Nasser Al-Subaie',
      mobile: '+966 54 555 6633',
      email: 'logistics@gulfdesert.com',
      createdAt: '2026-01-12T00:00:00Z',
    },
    {
      id: 'cont-5',
      name: 'Al-Watania Heavy Crane Services',
      nameAr: 'الوطنية لخدمات الرافعات الثقيلة',
      contactPerson: 'Bandar Al-Harbi',
      mobile: '+966 56 666 7744',
      email: 'cranes@alwatania-heavy.com',
      createdAt: '2026-01-14T00:00:00Z',
    },
  ];

  const employees: Employee[] = [
    {
      id: 'emp-1',
      employeeId: 'EMP-1001',
      fullName: 'Mohammed Abdullah Al-Shehri',
      fullNameAr: 'محمد عبدالله الشهري',
      position: 'Heavy Mobile Crane Operator',
      positionAr: 'مشغل رافعات متحركة ثقيلة',
      mobile: '+966 50 887 1122',
      nationalId: '1088492011',
      inductionDate: '2025-08-15',
      licenseGrade: 'Grade 1 - Heavy Mobile Cranes (أولى - رافعات ثقيلة)',
      linkedEquipmentCode: 'C-15',
      createdAt: '2025-08-15T09:00:00Z',
    },
    {
      id: 'emp-2',
      employeeId: 'EMP-1002',
      fullName: 'Yousef Ibrahim Al-Mutairi',
      fullNameAr: 'يوسف إبراهيم المطيري',
      position: 'Heavy Lowbed Trailer Driver',
      positionAr: 'سائق تريلات لوبد ومقطورات ثقيلة',
      mobile: '+966 55 776 2233',
      nationalId: '1092384756',
      inductionDate: '2025-09-01',
      licenseGrade: 'Grade 1 - Heavy Articulated Trailer (أولى - تريلات ومقطورات)',
      linkedEquipmentCode: 'TR-003',
      createdAt: '2025-09-01T08:30:00Z',
    },
    {
      id: 'emp-3',
      employeeId: 'EMP-1003',
      fullName: 'Rami Salem Al-Harthi',
      fullNameAr: 'رامي سالم الحارثي',
      position: 'Front End Loader Operator',
      positionAr: 'مشغل لودر وجرافات',
      mobile: '+966 54 665 3344',
      nationalId: '1074839201',
      inductionDate: '2025-10-10',
      licenseGrade: 'Grade 2 - Heavy Earthmoving (ثانية - معدات حفر وردم)',
      linkedEquipmentCode: 'L-02',
      createdAt: '2025-10-10T10:00:00Z',
    },
    {
      id: 'emp-4',
      employeeId: 'EMP-1004',
      fullName: 'Hamad Mubarak Al-Dosari',
      fullNameAr: 'حمد مبارك الدوسري',
      position: 'Dump Truck Driver',
      positionAr: 'سائق شاحنات قلاب',
      mobile: '+966 56 554 4455',
      nationalId: '1063920194',
      inductionDate: '2025-11-05',
      licenseGrade: 'Heavy Transport (نقل ثقيل عمومي)',
      linkedEquipmentCode: 'DT-05',
      createdAt: '2025-11-05T09:15:00Z',
    },
    {
      id: 'emp-5',
      employeeId: 'EMP-1005',
      fullName: 'Bilal Ahmad Noor',
      fullNameAr: 'بلال أحمد نور',
      position: 'Certified Forklift Operator',
      positionAr: 'مشغل رافعات شوكية معتمد',
      mobile: '+966 53 443 5566',
      nationalId: '2394857201',
      inductionDate: '2025-11-20',
      licenseGrade: 'Industrial Lift Truck (رافعات شوكية صناعية)',
      linkedEquipmentCode: 'FL-09',
      createdAt: '2025-11-20T11:00:00Z',
    },
    {
      id: 'emp-6',
      employeeId: 'EMP-1006',
      fullName: 'Mansour Saad Al-Qarni',
      fullNameAr: 'منصور سعد القرني',
      position: 'Fuel Tanker Driver',
      positionAr: 'سائق ناقلات وقود ومواد خطرة',
      mobile: '+966 50 332 6677',
      nationalId: '1058392018',
      inductionDate: '2025-12-01',
      licenseGrade: 'HAZMAT Heavy Tanker (نقل مواد بترولية وخطرة)',
      linkedEquipmentCode: 'FT-01',
      createdAt: '2025-12-01T08:00:00Z',
    },
    {
      id: 'emp-7',
      employeeId: 'EMP-1007',
      fullName: 'Ammar Zaid Al-Ghamdi',
      fullNameAr: 'عمار زيد الغامدي',
      position: 'Man Lift & MEWP Operator',
      positionAr: 'مشغل رافعات أفراد ومنصات عمل هوائية',
      mobile: '+966 55 221 7788',
      nationalId: '1047291038',
      inductionDate: '2026-01-05',
      licenseGrade: 'MEWP IPAF Certified (منصات عمل هوائية معتمدة)',
      linkedEquipmentCode: 'ML-04',
      createdAt: '2026-01-05T09:45:00Z',
    },
    {
      id: 'emp-8',
      employeeId: 'EMP-1008',
      fullName: 'Ibrahim Farhan Al-Enezi',
      fullNameAr: 'إبراهيم فرحان العنزي',
      position: 'Truck Mounted Crane Driver & Operator',
      positionAr: 'سائق ومشغل رافعة شاحنة (بوم ترك)',
      mobile: '+966 54 110 8899',
      nationalId: '1038291049',
      inductionDate: '2026-01-18',
      licenseGrade: 'Grade 1 - Truck Crane (أولى - بوم ترك)',
      linkedEquipmentCode: 'TC-07',
      createdAt: '2026-01-18T10:30:00Z',
    },
  ];

  // Equipment records matching exact fields:
  // Equipment Type, Equipment Code, Contractor, Driver Name, Driver Mobile, License Grade, National ID
  const equipment: Equipment[] = [
    {
      id: 'eq-1',
      equipmentCode: 'TR-003',
      equipmentType: 'Trailers',
      contractor: 'Al-Bawardi Heavy Transport',
      driverName: 'Yousef Ibrahim Al-Mutairi',
      driverMobile: '+966 55 776 2233',
      licenseGrade: 'Grade 1 - Heavy Articulated Trailer',
      nationalId: '1092384756',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-2',
      equipmentCode: 'C-15',
      equipmentType: 'Cranes',
      contractor: 'Al-Watania Heavy Crane Services',
      driverName: 'Mohammed Abdullah Al-Shehri',
      driverMobile: '+966 50 887 1122',
      licenseGrade: 'Grade 1 - Heavy Mobile Cranes',
      nationalId: '1088492011',
      createdAt: '2026-01-12T11:00:00Z',
      updatedAt: '2026-01-12T11:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-3',
      equipmentCode: 'L-02',
      equipmentType: 'Loaders',
      contractor: 'Al-Fahad Contracting & Equipment',
      driverName: 'Rami Salem Al-Harthi',
      driverMobile: '+966 54 665 3344',
      licenseGrade: 'Grade 2 - Heavy Earthmoving',
      nationalId: '1074839201',
      createdAt: '2026-01-15T09:00:00Z',
      updatedAt: '2026-01-15T09:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-4',
      equipmentCode: 'TC-07',
      equipmentType: 'Truck Cranes',
      contractor: 'Al-Watania Heavy Crane Services',
      driverName: 'Ibrahim Farhan Al-Enezi',
      driverMobile: '+966 54 110 8899',
      licenseGrade: 'Grade 1 - Truck Crane',
      nationalId: '1038291049',
      createdAt: '2026-01-18T14:00:00Z',
      updatedAt: '2026-01-18T14:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-5',
      equipmentCode: 'DT-05',
      equipmentType: 'Dump Trucks',
      contractor: 'PetroBuild Engineering Fleet',
      driverName: 'Hamad Mubarak Al-Dosari',
      driverMobile: '+966 56 554 4455',
      licenseGrade: 'Heavy Transport',
      nationalId: '1063920194',
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-01-20T10:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-6',
      equipmentCode: 'FL-09',
      equipmentType: 'Fork Lifts',
      contractor: 'Gulf Desert Logistics',
      driverName: 'Bilal Ahmad Noor',
      driverMobile: '+966 53 443 5566',
      licenseGrade: 'Industrial Lift Truck',
      nationalId: '2394857201',
      createdAt: '2026-01-22T08:30:00Z',
      updatedAt: '2026-01-22T08:30:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-7',
      equipmentCode: 'WT-02',
      equipmentType: 'Water Tanks',
      contractor: 'Al-Fahad Contracting & Equipment',
      driverName: 'Saad Manea Al-Otaibi',
      driverMobile: '+966 50 119 4488',
      licenseGrade: 'Heavy Tanker Grade',
      nationalId: '1048291837',
      createdAt: '2026-01-25T13:00:00Z',
      updatedAt: '2026-01-25T13:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-8',
      equipmentCode: 'ML-04',
      equipmentType: 'Man Lifts',
      contractor: 'PetroBuild Engineering Fleet',
      driverName: 'Ammar Zaid Al-Ghamdi',
      driverMobile: '+966 55 221 7788',
      licenseGrade: 'MEWP IPAF Certified',
      nationalId: '1047291038',
      createdAt: '2026-01-28T11:15:00Z',
      updatedAt: '2026-01-28T11:15:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-9',
      equipmentCode: 'JB-11',
      equipmentType: 'Jumbo Trucks',
      contractor: 'Gulf Desert Logistics',
      driverName: 'Waleed Ali Al-Khaldi',
      driverMobile: '+966 56 339 0011',
      licenseGrade: 'Heavy Commercial Transport',
      nationalId: '1029485731',
      createdAt: '2026-02-01T09:40:00Z',
      updatedAt: '2026-02-01T09:40:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-10',
      equipmentCode: 'FT-01',
      equipmentType: 'Fuel Tanks',
      contractor: 'Al-Bawardi Heavy Transport',
      driverName: 'Mansour Saad Al-Qarni',
      driverMobile: '+966 50 332 6677',
      licenseGrade: 'HAZMAT Heavy Tanker',
      nationalId: '1058392018',
      createdAt: '2026-02-05T12:00:00Z',
      updatedAt: '2026-02-05T12:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-11',
      equipmentCode: 'TR-018',
      equipmentType: 'Trailers',
      contractor: 'Al-Bawardi Heavy Transport',
      driverName: 'Yousef Ibrahim Al-Mutairi',
      driverMobile: '+966 55 776 2233',
      licenseGrade: 'Grade 1 - Heavy Articulated Trailer',
      nationalId: '1092384756',
      createdAt: '2026-02-10T10:00:00Z',
      updatedAt: '2026-02-10T10:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'eq-12',
      equipmentCode: 'C-22',
      equipmentType: 'Cranes',
      contractor: 'Al-Watania Heavy Crane Services',
      driverName: 'Abdullah Fahad Al-Ajmi',
      driverMobile: '+966 55 448 9911',
      licenseGrade: 'Grade 1 - Heavy Mobile Cranes',
      nationalId: '1073829104',
      createdAt: '2026-02-12T15:20:00Z',
      updatedAt: '2026-02-12T15:20:00Z',
      createdBy: 'admin',
    }
  ];

  // Helper dates relative to today:
  // Today: 2026-10-01
  // Overdue: 2026-09-25, 2026-09-28
  // Due today: 2026-10-01
  // Due in 1-2 days: 2026-10-02, 2026-10-03
  // Open normal: 2026-10-15
  // Closed: previously resolved
  const todayStr = '2026-10-01';

  const problems: Problem[] = [
    {
      id: 'prb-1',
      equipmentCode: 'TR-003',
      equipmentType: 'Trailers',
      problemDescription: 'Hydraulic oil leakage observed under main trailer landing gear and worn kingpin safety latch.',
      problemDescriptionAr: 'تسريب زيت هيدروليك أسفل أرجل المقطورة وتآكل في قفل الأمان للكينغ بن.',
      problemDate: '2026-09-20',
      deadline: '2026-09-28', // OVERDUE
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
      createdBy: 'hse_officer',
    },
    {
      id: 'prb-2',
      equipmentCode: 'C-15',
      equipmentType: 'Cranes',
      problemDescription: 'Anti-two-block (A2B) limit switch cable damaged, boom angle indicator requires calibration.',
      problemDescriptionAr: 'تلف كابل مفتاح قطع الرفع الزائد (A2B) ومؤشر زاوية ذراع الرافعة يحتاج معايرة.',
      problemDate: '2026-09-25',
      deadline: '2026-10-01', // DUE TODAY
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-25T08:30:00Z',
      updatedAt: '2026-09-25T08:30:00Z',
      createdBy: 'hse_manager',
    },
    {
      id: 'prb-3',
      equipmentCode: 'L-02',
      equipmentType: 'Loaders',
      problemDescription: 'Reverse backup alarm not functioning and right side rear view mirror cracked.',
      problemDescriptionAr: 'جرس إنذار الرجوع للخلف لا يعمل وتصدع المرآة الجانبية الخلفية اليمنى.',
      problemDate: '2026-09-28',
      deadline: '2026-10-03', // DUE IN 2 DAYS
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-28T09:15:00Z',
      updatedAt: '2026-09-28T09:15:00Z',
      createdBy: 'hse_officer',
    },
    {
      id: 'prb-4',
      equipmentCode: 'TC-07',
      equipmentType: 'Truck Cranes',
      problemDescription: 'Outrigger hydraulic foot pad safety pin missing and slight leak on left front stabilizer cylinder.',
      problemDescriptionAr: 'فقدان مسمار أمان قاعدة ركيزة التثبيت الهيدروليكية وتسريب خفيف بأسطوانة التثبيت اليسرى.',
      problemDate: '2026-09-22',
      deadline: '2026-09-29', // OVERDUE
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-22T11:45:00Z',
      updatedAt: '2026-09-22T11:45:00Z',
      createdBy: 'hse_officer',
    },
    {
      id: 'prb-5',
      equipmentCode: 'FL-09',
      equipmentType: 'Fork Lifts',
      problemDescription: 'Operator seatbelt retractor jammed, 6kg dry chemical fire extinguisher tag expired.',
      problemDescriptionAr: 'تعليق آلية سحب حزام الأمان للسائق، وانتهاء صلاحية بطاقة فحص طفاية الحريق البودرة 6 كجم.',
      problemDate: '2026-09-29',
      deadline: '2026-10-02', // DUE IN 1 DAY (WITHIN 2 DAYS)
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-29T14:20:00Z',
      updatedAt: '2026-09-29T14:20:00Z',
      createdBy: 'hse_officer',
    },
    {
      id: 'prb-6',
      equipmentCode: 'FT-01',
      equipmentType: 'Fuel Tanks',
      problemDescription: 'Earth grounding reel cable damaged, emergency fuel shutoff switch sticker faded.',
      problemDescriptionAr: 'تلف كابل بكرة التأريض والتفريغ الكهروستاتيكي، وتآكل ملصق مفتاح إيقاف الوقود في الطوارئ.',
      problemDate: '2026-09-27',
      deadline: '2026-10-12', // OPEN (Future)
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-27T08:00:00Z',
      updatedAt: '2026-09-27T08:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'prb-7',
      equipmentCode: 'TR-003',
      equipmentType: 'Trailers',
      problemDescription: 'Rear brake light assembly shattered, replaced with certified LED safety lamp.',
      problemDescriptionAr: 'كسر في مجموعة إضاءة الفرامل الخلفية، تم استبدالها بمصباح LED أمان معتمد.',
      problemDate: '2026-09-05',
      deadline: '2026-09-12',
      status: 'CLOSED',
      closedDate: '2026-09-10',
      closedBy: 'hse_manager',
      closeNotes: 'New sealed waterproof LED lights installed and inspected by HSE engineer.',
      createdAt: '2026-09-05T09:00:00Z',
      updatedAt: '2026-09-10T16:00:00Z',
      createdBy: 'hse_officer',
    },
    {
      id: 'prb-8',
      equipmentCode: 'DT-05',
      equipmentType: 'Dump Trucks',
      problemDescription: 'Hydraulic lift bed safety prop bar bent, replaced with OEM heavy structural steel prop.',
      problemDescriptionAr: 'انحناء دعامة أمان حوض القلاب الهيدروليكي، تم تركيب دعامة صلب أصلية معتمدة.',
      problemDate: '2026-09-08',
      deadline: '2026-09-15',
      status: 'CLOSED',
      closedDate: '2026-09-14',
      closedBy: 'admin',
      closeNotes: 'Certified welding test completed and signed off.',
      createdAt: '2026-09-08T10:30:00Z',
      updatedAt: '2026-09-14T11:00:00Z',
      createdBy: 'admin',
    },
    {
      id: 'prb-9',
      equipmentCode: 'ML-04',
      equipmentType: 'Man Lifts',
      problemDescription: 'Emergency lowering ground control valve valve sticking during pre-shift test.',
      problemDescriptionAr: 'صمام التحكم اليدوي للهبوط الاضطراري الأرضي يعلق أثناء الفحص الصباحي.',
      problemDate: '2026-09-30',
      deadline: '2026-10-02', // DUE IN 1 DAY
      status: 'OPEN',
      closedDate: null,
      createdAt: '2026-09-30T07:45:00Z',
      updatedAt: '2026-09-30T07:45:00Z',
      createdBy: 'hse_officer',
    },
    {
      id: 'prb-10',
      equipmentCode: 'WT-02',
      equipmentType: 'Water Tanks',
      problemDescription: 'Water delivery hose coupling gasket worn out causing minor leakage on site roads.',
      problemDescriptionAr: 'تآكل جوان توصيل خرطوم تفريغ المياه مسبباً تسريباً خفيفاً في مسارات الموقع.',
      problemDate: '2026-09-18',
      deadline: '2026-09-24',
      status: 'CLOSED',
      closedDate: '2026-09-22',
      closedBy: 'hse_manager',
      closeNotes: 'Gaskets replaced with reinforced nitrile rubber seals.',
      createdAt: '2026-09-18T13:00:00Z',
      updatedAt: '2026-09-22T14:30:00Z',
      createdBy: 'hse_officer',
    }
  ];

  const sampleImages = getSampleImages();
  const problemImages: ProblemImage[] = [
    {
      id: 'img-1',
      problemId: 'prb-1',
      fileName: 'hydraulic_oil_leak_TR003.jpg',
      fileSize: 245000,
      dataUrl: sampleImages.img1,
      uploadedAt: '2026-09-20T10:05:00Z',
    },
    {
      id: 'img-2',
      problemId: 'prb-1',
      fileName: 'landing_gear_defect.jpg',
      fileSize: 312000,
      dataUrl: sampleImages.img2,
      uploadedAt: '2026-09-20T10:06:00Z',
    },
    {
      id: 'img-3',
      problemId: 'prb-2',
      fileName: 'a2b_limit_switch_damage.jpg',
      fileSize: 189000,
      dataUrl: sampleImages.img3,
      uploadedAt: '2026-09-25T08:35:00Z',
    },
    {
      id: 'img-4',
      problemId: 'prb-4',
      fileName: 'outrigger_pad_missing_pin.jpg',
      fileSize: 260000,
      dataUrl: sampleImages.img2,
      uploadedAt: '2026-09-22T11:50:00Z',
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      title: 'Overdue Safety Defect',
      titleAr: 'بلاغ سلامة متأخر عن الموعد',
      message: 'Problem TR-003 deadline passed on 2026-09-28. Immediate corrective action required.',
      messageAr: 'المشكلة في المعدة TR-003 تجاوزت الموعد في 28-09-2026. مطلوب إجراء تصحيحي فوري.',
      type: 'overdue',
      problemId: 'prb-1',
      equipmentCode: 'TR-003',
      read: false,
      createdAt: '2026-09-29T00:00:00Z',
    },
    {
      id: 'notif-2',
      title: 'Problem Due Today',
      titleAr: 'مشكلة تستحق المعالجة اليوم',
      message: 'Problem C-15 deadline is today (2026-10-01). Verify A2B limit switch repair.',
      messageAr: 'الموعد النهائي لمشكلة الرافعة C-15 هو اليوم (01-10-2026). تأكد من إصلاح مفتاح A2B.',
      type: 'due_today',
      problemId: 'prb-2',
      equipmentCode: 'C-15',
      read: false,
      createdAt: '2026-10-01T06:00:00Z',
    },
    {
      id: 'notif-3',
      title: 'Problem Due In 2 Days',
      titleAr: 'مشكلة تستحق خلال يومين',
      message: 'Problem L-02 deadline approaches on 2026-10-03 (Reverse alarm & mirror).',
      messageAr: 'الموعد النهائي للمعدة L-02 يقترب في 03-10-2026 (إنذار الرجوع والمرآة).',
      type: 'due_soon',
      problemId: 'prb-3',
      equipmentCode: 'L-02',
      read: false,
      createdAt: '2026-10-01T07:00:00Z',
    },
    {
      id: 'notif-4',
      title: 'Problem Due In 1 Day',
      titleAr: 'مشكلة تستحق خلال يوم واحد',
      message: 'Problem FL-09 deadline is tomorrow 2026-10-02 (Seatbelt & Extinguisher).',
      messageAr: 'الموعد النهائي للرافعة الشوكية FL-09 غداً 02-10-2026 (حزام الأمان والطفاية).',
      type: 'due_soon',
      problemId: 'prb-5',
      equipmentCode: 'FL-09',
      read: true,
      createdAt: '2026-09-30T07:00:00Z',
    },
    {
      id: 'notif-5',
      title: 'Overdue Safety Defect',
      titleAr: 'بلاغ سلامة متأخر عن الموعد',
      message: 'Problem TC-07 outrigger pin is overdue since 2026-09-29.',
      messageAr: 'مشكلة مسمار ركيزة الرافعة TC-07 متأخرة منذ 29-09-2026.',
      type: 'overdue',
      problemId: 'prb-4',
      equipmentCode: 'TC-07',
      read: false,
      createdAt: '2026-09-30T01:00:00Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      userId: 'usr-1',
      username: 'admin',
      action: 'SYSTEM_INIT',
      entityType: 'System',
      entityId: 'SYSTEM',
      details: 'Heavy Equipment HSE Management System initialized with standard safety roles and categories',
      timestamp: '2026-01-01T08:00:00Z',
    },
    {
      id: 'log-2',
      userId: 'usr-3',
      username: 'hse_officer',
      action: 'PROBLEM_CREATE',
      entityType: 'Problem',
      entityId: 'prb-1',
      details: 'Registered safety defect for Equipment TR-003: Hydraulic oil leakage and kingpin latch',
      timestamp: '2026-09-20T10:00:00Z',
    },
    {
      id: 'log-3',
      userId: 'usr-2',
      username: 'hse_manager',
      action: 'PROBLEM_CLOSE',
      entityType: 'Problem',
      entityId: 'prb-7',
      details: 'Verified and closed safety defect for Equipment TR-003 (Rear brake light replacement)',
      timestamp: '2026-09-10T16:00:00Z',
    },
    {
      id: 'log-4',
      userId: 'usr-1',
      username: 'admin',
      action: 'EQUIPMENT_REGISTER',
      entityType: 'Equipment',
      entityId: 'C-22',
      details: 'Registered Crane C-22 for contractor Al-Watania Heavy Crane Services',
      timestamp: '2026-02-12T15:20:00Z',
    },
  ];

  const settings: SystemSettings = {
    companyName: 'Heavy Equipment HSE Management Co.',
    companyNameAr: 'شركة إدارة السلامة والصحة المهنية للمعدات الثقيلة',
    safetyContactMobile: '+966 50 000 9999',
    warningDaysThreshold: 2,
    hsePolicyNumber: 'HSE-SOP-2026-004',
    allowSelfRegistration: false,
  };

  return {
    users,
    roles,
    equipmentTypes: INITIAL_EQUIPMENT_TYPES,
    contractors,
    employees,
    equipment,
    problems,
    problemImages,
    notifications,
    auditLogs,
    settings,
  };
}

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required collections exist
        const initial = createInitialDatabase();
        return {
          users: parsed.users || initial.users,
          roles: parsed.roles || initial.roles,
          equipmentTypes: parsed.equipmentTypes || initial.equipmentTypes,
          contractors: parsed.contractors || initial.contractors,
          employees: parsed.employees || initial.employees,
          equipment: parsed.equipment || initial.equipment,
          problems: parsed.problems || initial.problems,
          problemImages: parsed.problemImages || initial.problemImages,
          notifications: parsed.notifications || initial.notifications,
          auditLogs: parsed.auditLogs || initial.auditLogs,
          settings: parsed.settings || initial.settings,
        };
      }
    } catch (err) {
      console.error('Failed reading database file, recreating fresh initial data:', err);
    }

    const fresh = createInitialDatabase();
    this.persistSync(fresh);
    return fresh;
  }

  private persistSync(data: DatabaseSchema) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        this.persistSync(this.data);
      } catch (e) {
        console.error('Error saving database:', e);
      }
    }, 100);
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Audit helper
  public logAudit(userId: string, username: string, action: string, entityType: string, entityId: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      username,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    return log;
  }

  // Generate / refresh automatic notifications based on deadlines
  public refreshDeadlineNotifications() {
    const today = new Date().toISOString().split('T')[0];
    const thresholdDays = this.data.settings.warningDaysThreshold || 2;
    const existingProblemIds = new Set(this.data.notifications.map((n) => `${n.type}-${n.problemId}`));

    const openProblems = this.data.problems.filter((p) => p.status === 'OPEN');

    for (const prob of openProblems) {
      const deadline = prob.deadline;
      const diffDays = Math.ceil((new Date(deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Overdue
        const key = `overdue-${prob.id}`;
        if (!existingProblemIds.has(key)) {
          this.data.notifications.unshift({
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: 'Overdue Safety Defect',
            titleAr: 'بلاغ سلامة متأخر عن الموعد',
            message: `Problem on equipment ${prob.equipmentCode} is overdue by ${Math.abs(diffDays)} day(s).`,
            messageAr: `المشكلة على المعدة ${prob.equipmentCode} متأخرة بمقدار ${Math.abs(diffDays)} يوم.`,
            type: 'overdue',
            problemId: prob.id,
            equipmentCode: prob.equipmentCode,
            read: false,
            createdAt: new Date().toISOString(),
          });
          existingProblemIds.add(key);
        }
      } else if (diffDays === 0) {
        // Due today
        const key = `due_today-${prob.id}`;
        if (!existingProblemIds.has(key)) {
          this.data.notifications.unshift({
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: 'Problem Due Today',
            titleAr: 'مشكلة تستحق المعالجة اليوم',
            message: `Problem on equipment ${prob.equipmentCode} must be resolved today.`,
            messageAr: `المشكلة على المعدة ${prob.equipmentCode} يجب إغلاقها اليوم.`,
            type: 'due_today',
            problemId: prob.id,
            equipmentCode: prob.equipmentCode,
            read: false,
            createdAt: new Date().toISOString(),
          });
          existingProblemIds.add(key);
        }
      } else if (diffDays > 0 && diffDays <= thresholdDays) {
        // Due soon
        const key = `due_soon-${prob.id}`;
        if (!existingProblemIds.has(key)) {
          this.data.notifications.unshift({
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: `Problem Due in ${diffDays} Day(s)`,
            titleAr: `مشكلة تستحق خلال ${diffDays} يوم`,
            message: `Problem on equipment ${prob.equipmentCode} deadline is in ${diffDays} day(s).`,
            messageAr: `الموعد النهائي لمشكلة المعدة ${prob.equipmentCode} يستحق خلال ${diffDays} يوم.`,
            type: 'due_soon',
            problemId: prob.id,
            equipmentCode: prob.equipmentCode,
            read: false,
            createdAt: new Date().toISOString(),
          });
          existingProblemIds.add(key);
        }
      }
    }

    this.save();
  }
}

export const db = new Database();
