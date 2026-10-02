import { Router, Response } from 'express';
import {
  db,
  hashPassword,
  PERMISSIONS_LIST,
  Equipment,
  Problem,
  ProblemImage,
  Employee,
  Contractor,
  User,
  Role,
  EquipmentType,
} from './db.js';
import {
  authenticate,
  requirePermission,
  requireAdmin,
  generateToken,
  AuthenticatedRequest,
} from './auth.js';

export const apiRouter = Router();

// Helper to calculate deadline status & days remaining
export function getDeadlineInfo(deadlineStr: string, status: string) {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  const deadline = new Date(deadlineStr);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === 'CLOSED') {
    return {
      condition: 'CLOSED',
      diffDays,
      labelEn: 'Closed',
      labelAr: 'مغلقة',
      badgeColor: 'green',
    };
  }

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      condition: 'OVERDUE',
      diffDays,
      labelEn: `${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`,
      labelAr: `متأخر ${overdueDays} يوم`,
      badgeColor: 'red',
    };
  }

  if (diffDays === 0) {
    return {
      condition: 'DUE_TODAY',
      diffDays: 0,
      labelEn: 'Due Today',
      labelAr: 'يستحق اليوم',
      badgeColor: 'orange',
    };
  }

  if (diffDays <= 2) {
    return {
      condition: 'DUE_SOON',
      diffDays,
      labelEn: `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`,
      labelAr: `متبقي ${diffDays} يوم`,
      badgeColor: 'yellow',
    };
  }

  return {
    condition: 'OPEN',
    diffDays,
    labelEn: `${diffDays} days remaining`,
    labelAr: `متبقي ${diffDays} يوم`,
    badgeColor: 'blue',
  };
}

// ----------------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// ----------------------------------------------------------------------

apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const database = db.getData();
  const user = database.users.find(
    (u) => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase())
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  if (user.status !== 'Active') {
    return res.status(403).json({ error: 'Your account is deactivated. Please contact an Administrator.' });
  }

  const hashed = hashPassword(password);
  if (user.passwordHash !== hashed) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  db.save();

  db.logAudit(user.id, user.username, 'LOGIN', 'User', user.id, 'User successfully logged in');

  const token = generateToken(user);
  const role = database.roles.find((r) => r.id === user.roleId);
  const permissions = role ? role.permissions : [];

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      mobile: user.mobile,
      roleId: user.roleId,
      status: user.status,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
    role,
    permissions,
  });
});

apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const role = req.role;
  const permissions = req.permissions || [];

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      mobile: user.mobile,
      roleId: user.roleId,
      status: user.status,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
    role,
    permissions,
  });
});

apiRouter.post('/auth/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.logAudit(req.user.id, req.user.username, 'LOGOUT', 'User', req.user.id, 'User logged out');
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ----------------------------------------------------------------------
// 2. DASHBOARD & STATS
// ----------------------------------------------------------------------

apiRouter.get('/dashboard/stats', authenticate, requirePermission('DASHBOARD_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  // Refresh notifications when dashboard is loaded
  db.refreshDeadlineNotifications();

  const database = db.getData();
  const equipment = database.equipment;
  const problems = database.problems;
  const equipmentTypes = database.equipmentTypes;

  const totalEquipment = equipment.length;
  const totalProblems = problems.length;

  let openProblems = 0;
  let closedProblems = 0;
  let dueWithin2Days = 0;
  let overdueOpenProblems = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  for (const p of problems) {
    if (p.status === 'CLOSED') {
      closedProblems++;
    } else {
      openProblems++;
      const deadline = new Date(p.deadline);
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdueOpenProblems++;
      } else if (diffDays <= 2) {
        dueWithin2Days++;
      }
    }
  }

  // Category counts with open problems
  const categoryStats = equipmentTypes.map((type) => {
    const eqList = equipment.filter((e) => e.equipmentType.toLowerCase() === type.name.toLowerCase());
    const eqCodes = new Set(eqList.map((e) => e.equipmentCode));
    const openProbCount = problems.filter((p) => p.status === 'OPEN' && eqCodes.has(p.equipmentCode)).length;

    return {
      id: type.id,
      code: type.code,
      name: type.name,
      nameAr: type.nameAr,
      icon: type.icon,
      equipmentCount: eqList.length,
      openProblemsCount: openProbCount,
    };
  });

  // Problems by equipment type
  const problemsByType: Record<string, { total: number; open: number; closed: number }> = {};
  for (const type of equipmentTypes) {
    problemsByType[type.name] = { total: 0, open: 0, closed: 0 };
  }
  for (const p of problems) {
    if (!problemsByType[p.equipmentType]) {
      problemsByType[p.equipmentType] = { total: 0, open: 0, closed: 0 };
    }
    problemsByType[p.equipmentType].total++;
    if (p.status === 'OPEN') problemsByType[p.equipmentType].open++;
    else problemsByType[p.equipmentType].closed++;
  }

  // Problems by contractor
  const contractorMap = new Map<string, string>();
  for (const eq of equipment) {
    contractorMap.set(eq.equipmentCode, eq.contractor);
  }
  const problemsByContractor: Record<string, { contractor: string; open: number; closed: number; total: number }> = {};
  for (const p of problems) {
    const contractor = contractorMap.get(p.equipmentCode) || 'Unknown';
    if (!problemsByContractor[contractor]) {
      problemsByContractor[contractor] = { contractor, open: 0, closed: 0, total: 0 };
    }
    problemsByContractor[contractor].total++;
    if (p.status === 'OPEN') problemsByContractor[contractor].open++;
    else problemsByContractor[contractor].closed++;
  }

  return res.json({
    kpis: {
      totalEquipment,
      totalProblems,
      openProblems,
      dueWithin2Days,
      overdueOpenProblems,
      closedProblems,
    },
    categoryStats,
    problemsByType,
    problemsByContractor: Object.values(problemsByContractor),
    recentProblems: problems.slice(0, 5).map((p) => ({
      ...p,
      deadlineInfo: getDeadlineInfo(p.deadline, p.status),
    })),
  });
});

// ----------------------------------------------------------------------
// 3. EQUIPMENT ROUTES
// ----------------------------------------------------------------------

apiRouter.get('/equipment', authenticate, requirePermission('EQUIPMENT_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  let list = [...database.equipment];

  const { search, type, contractor, page = '1', limit = '10', sortBy = 'equipmentCode', sortDir = 'asc' } = req.query;

  if (type && typeof type === 'string' && type !== 'all') {
    list = list.filter((e) => e.equipmentType.toLowerCase() === type.toLowerCase());
  }

  if (contractor && typeof contractor === 'string' && contractor !== 'all') {
    list = list.filter((e) => e.contractor.toLowerCase() === contractor.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.equipmentCode.toLowerCase().includes(q) ||
        e.equipmentType.toLowerCase().includes(q) ||
        e.contractor.toLowerCase().includes(q) ||
        e.driverName.toLowerCase().includes(q) ||
        e.driverMobile.includes(q) ||
        e.nationalId.includes(q)
    );
  }

  // Calculate open problems count for each equipment
  const problems = database.problems;
  const openCountMap = new Map<string, number>();
  const totalCountMap = new Map<string, number>();

  for (const p of problems) {
    totalCountMap.set(p.equipmentCode, (totalCountMap.get(p.equipmentCode) || 0) + 1);
    if (p.status === 'OPEN') {
      openCountMap.set(p.equipmentCode, (openCountMap.get(p.equipmentCode) || 0) + 1);
    }
  }

  const enriched = list.map((e) => ({
    ...e,
    openProblems: openCountMap.get(e.equipmentCode) || 0,
    totalProblems: totalCountMap.get(e.equipmentCode) || 0,
    status: (openCountMap.get(e.equipmentCode) || 0) > 0 ? 'Defect Active' : 'Compliant',
    statusAr: (openCountMap.get(e.equipmentCode) || 0) > 0 ? 'يوجد ملاحظات' : 'مطابق للسلامة',
  }));

  // Sorting
  enriched.sort((a, b) => {
    let valA = (a as Record<string, any>)[sortBy as string] || '';
    let valB = (b as Record<string, any>)[sortBy as string] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const pNum = Math.max(1, parseInt(page as string, 10) || 1);
  const lNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const total = enriched.length;
  const paginated = enriched.slice((pNum - 1) * lNum, pNum * lNum);

  return res.json({
    data: paginated,
    total,
    page: pNum,
    totalPages: Math.ceil(total / lNum),
    limit: lNum,
  });
});

apiRouter.get('/equipment/:code', authenticate, requirePermission('EQUIPMENT_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  const code = req.params.code;
  const database = db.getData();
  const eq = database.equipment.find((e) => e.equipmentCode.toUpperCase() === code.toUpperCase());

  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found', errorAr: 'المعدة غير موجودة' });
  }

  // Get associated problems
  const eqProblems = database.problems
    .filter((p) => p.equipmentCode.toUpperCase() === code.toUpperCase())
    .map((p) => ({
      ...p,
      deadlineInfo: getDeadlineInfo(p.deadline, p.status),
      imagesCount: database.problemImages.filter((img) => img.problemId === p.id).length,
    }));

  const totalProblems = eqProblems.length;
  const openProblems = eqProblems.filter((p) => p.status === 'OPEN').length;
  const closedProblems = eqProblems.filter((p) => p.status === 'CLOSED').length;
  const overdueProblems = eqProblems.filter(
    (p) => p.status === 'OPEN' && p.deadlineInfo.condition === 'OVERDUE'
  ).length;

  return res.json({
    equipment: eq,
    problems: eqProblems,
    summary: {
      totalProblems,
      openProblems,
      closedProblems,
      overdueProblems,
    },
  });
});

apiRouter.post('/equipment', authenticate, requirePermission('EQUIPMENT_ADD'), (req: AuthenticatedRequest, res: Response) => {
  const { equipmentCode, equipmentType, contractor, driverName, driverMobile, licenseGrade, nationalId } = req.body;

  if (!equipmentCode || !equipmentType || !contractor || !driverName) {
    return res.status(400).json({
      error: 'Please fill in all required fields (Equipment Code, Type, Contractor, Driver Name)',
      errorAr: 'يرجى تعبئة جميع الحقول الإلزامية (كود المعدة، النوع، المقاول، اسم السائق)',
    });
  }

  const database = db.getData();
  const cleanCode = equipmentCode.trim().toUpperCase();

  // Check code uniqueness
  const existing = database.equipment.find((e) => e.equipmentCode.toUpperCase() === cleanCode);
  if (existing) {
    return res.status(400).json({
      error: `Equipment Code "${cleanCode}" already exists. Equipment code must be unique.`,
      errorAr: `كود المعدة "${cleanCode}" موجود مسبقاً. يجب أن يكون كود المعدة فريداً.`,
    });
  }

  // Check if driver is already registered in employees; if not, create or link
  const cleanMobile = (driverMobile || '').trim();
  const cleanNatId = (nationalId || '').trim();
  if (cleanNatId) {
    const existingEmp = database.employees.find((emp) => emp.nationalId === cleanNatId);
    if (existingEmp) {
      existingEmp.linkedEquipmentCode = cleanCode;
      existingEmp.licenseGrade = licenseGrade || existingEmp.licenseGrade;
    }
  }

  const newEquipment: Equipment = {
    id: `eq-${Date.now()}`,
    equipmentCode: cleanCode,
    equipmentType: equipmentType.trim(),
    contractor: contractor.trim(),
    driverName: driverName.trim(),
    driverMobile: cleanMobile,
    licenseGrade: (licenseGrade || '').trim(),
    nationalId: cleanNatId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user?.username || 'admin',
  };

  database.equipment.push(newEquipment);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EQUIPMENT_CREATE',
    'Equipment',
    cleanCode,
    `Added equipment ${cleanCode} (${equipmentType}) for contractor ${contractor}`
  );

  return res.status(201).json(newEquipment);
});

apiRouter.put('/equipment/:id', authenticate, requirePermission('EQUIPMENT_EDIT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { equipmentCode, equipmentType, contractor, driverName, driverMobile, licenseGrade, nationalId } = req.body;

  const database = db.getData();
  const eq = database.equipment.find((e) => e.id === id);

  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found', errorAr: 'المعدة غير موجودة' });
  }

  const cleanCode = equipmentCode ? equipmentCode.trim().toUpperCase() : eq.equipmentCode;

  // If equipmentCode changed, check duplicate
  if (cleanCode !== eq.equipmentCode) {
    const duplicate = database.equipment.find((e) => e.id !== id && e.equipmentCode.toUpperCase() === cleanCode);
    if (duplicate) {
      return res.status(400).json({
        error: `Equipment Code "${cleanCode}" is already in use by another equipment.`,
        errorAr: `كود المعدة "${cleanCode}" مستخدم بالفعل بواسطة معدة أخرى.`,
      });
    }

    // Cascade update to problems
    for (const p of database.problems) {
      if (p.equipmentCode === eq.equipmentCode) {
        p.equipmentCode = cleanCode;
      }
    }
  }

  const oldCode = eq.equipmentCode;
  eq.equipmentCode = cleanCode;
  if (equipmentType) eq.equipmentType = equipmentType.trim();
  if (contractor) eq.contractor = contractor.trim();
  if (driverName) eq.driverName = driverName.trim();
  if (driverMobile !== undefined) eq.driverMobile = driverMobile.trim();
  if (licenseGrade !== undefined) eq.licenseGrade = licenseGrade.trim();
  if (nationalId !== undefined) eq.nationalId = nationalId.trim();
  eq.updatedAt = new Date().toISOString();

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EQUIPMENT_UPDATE',
    'Equipment',
    cleanCode,
    `Updated equipment details for ${cleanCode} (originally ${oldCode})`
  );

  return res.json(eq);
});

// Admin-only deletion for equipment
apiRouter.delete('/equipment/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { force } = req.query;
  const database = db.getData();
  const eqIndex = database.equipment.findIndex((e) => e.id === id);

  if (eqIndex === -1) {
    return res.status(404).json({ error: 'Equipment not found', errorAr: 'المعدة غير موجودة' });
  }

  const eq = database.equipment[eqIndex];
  const relatedProblems = database.problems.filter((p) => p.equipmentCode === eq.equipmentCode);

  if (relatedProblems.length > 0 && force !== 'true') {
    return res.status(400).json({
      error: `Cannot delete equipment "${eq.equipmentCode}". It has ${relatedProblems.length} associated safety problem(s). Please confirm force deletion.`,
      errorAr: `لا يمكن حذف المعدة "${eq.equipmentCode}" لوجود ${relatedProblems.length} مشكلة مسجلة عليها. يرجى تأكيد الحذف الإجباري.`,
      hasRelated: true,
      relatedProblemsCount: relatedProblems.length,
    });
  }

  // If force is confirmed, remove associated problems and their images
  if (relatedProblems.length > 0 && force === 'true') {
    const probIds = new Set(relatedProblems.map((p) => p.id));
    database.problemImages = database.problemImages.filter((img) => !probIds.has(img.problemId));
    database.problems = database.problems.filter((p) => !probIds.has(p.id));
  }

  database.equipment.splice(eqIndex, 1);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EQUIPMENT_DELETE',
    'Equipment',
    eq.equipmentCode,
    `Deleted equipment ${eq.equipmentCode} (${eq.equipmentType}) along with any related problems`
  );

  return res.json({ success: true, message: `Equipment ${eq.equipmentCode} deleted successfully` });
});

// ----------------------------------------------------------------------
// 4. PROBLEMS MANAGEMENT
// ----------------------------------------------------------------------

apiRouter.get('/problems', authenticate, requirePermission('PROBLEMS_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  let list = [...database.problems];

  const {
    search,
    status,
    equipmentType,
    equipmentCode,
    contractor,
    quickFilter, // 'ALL' | 'OPEN' | 'CLOSED' | 'DUE_SOON' | 'OVERDUE'
    page = '1',
    limit = '10',
    sortBy = 'deadline',
    sortDir = 'asc',
  } = req.query;

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  // Build contractor map
  const contractorMap = new Map<string, string>();
  for (const eq of database.equipment) {
    contractorMap.set(eq.equipmentCode, eq.contractor);
  }

  // Filter: status
  if (status && typeof status === 'string' && status !== 'ALL') {
    list = list.filter((p) => p.status === status);
  }

  // Filter: equipmentType
  if (equipmentType && typeof equipmentType === 'string' && equipmentType !== 'ALL') {
    list = list.filter((p) => p.equipmentType.toLowerCase() === equipmentType.toLowerCase());
  }

  // Filter: equipmentCode
  if (equipmentCode && typeof equipmentCode === 'string') {
    list = list.filter((p) => p.equipmentCode.toUpperCase() === equipmentCode.toUpperCase());
  }

  // Filter: contractor
  if (contractor && typeof contractor === 'string' && contractor !== 'ALL') {
    list = list.filter((p) => {
      const c = contractorMap.get(p.equipmentCode) || '';
      return c.toLowerCase() === contractor.toLowerCase();
    });
  }

  // Quick filters
  if (quickFilter === 'OPEN') {
    list = list.filter((p) => p.status === 'OPEN');
  } else if (quickFilter === 'CLOSED') {
    list = list.filter((p) => p.status === 'CLOSED');
  } else if (quickFilter === 'DUE_SOON') {
    list = list.filter((p) => {
      if (p.status !== 'OPEN') return false;
      const diffDays = Math.ceil((new Date(p.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 2;
    });
  } else if (quickFilter === 'OVERDUE') {
    list = list.filter((p) => {
      if (p.status !== 'OPEN') return false;
      const diffDays = Math.ceil((new Date(p.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays < 0;
    });
  }

  // Search
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter((p) => {
      const c = contractorMap.get(p.equipmentCode) || '';
      return (
        p.equipmentCode.toLowerCase().includes(q) ||
        p.problemDescription.toLowerCase().includes(q) ||
        (p.problemDescriptionAr && p.problemDescriptionAr.toLowerCase().includes(q)) ||
        p.equipmentType.toLowerCase().includes(q) ||
        c.toLowerCase().includes(q)
      );
    });
  }

  // Enrich with images count, deadlineInfo, and contractor
  const enriched = list.map((p) => {
    const imagesCount = database.problemImages.filter((img) => img.problemId === p.id).length;
    return {
      ...p,
      contractor: contractorMap.get(p.equipmentCode) || 'Unknown Contractor',
      imagesCount,
      deadlineInfo: getDeadlineInfo(p.deadline, p.status),
    };
  });

  // Sorting
  enriched.sort((a, b) => {
    let valA = (a as Record<string, any>)[sortBy as string] || '';
    let valB = (b as Record<string, any>)[sortBy as string] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const pNum = Math.max(1, parseInt(page as string, 10) || 1);
  const lNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const total = enriched.length;
  const paginated = enriched.slice((pNum - 1) * lNum, pNum * lNum);

  return res.json({
    data: paginated,
    total,
    page: pNum,
    totalPages: Math.ceil(total / lNum),
    limit: lNum,
  });
});

apiRouter.get('/problems/:id', authenticate, requirePermission('PROBLEMS_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const problem = database.problems.find((p) => p.id === id);

  if (!problem) {
    return res.status(404).json({ error: 'Problem not found', errorAr: 'المشكلة غير موجودة' });
  }

  const equipment = database.equipment.find((e) => e.equipmentCode === problem.equipmentCode);
  const images = database.problemImages.filter((img) => img.problemId === problem.id);
  const deadlineInfo = getDeadlineInfo(problem.deadline, problem.status);

  return res.json({
    problem,
    equipment,
    images,
    deadlineInfo,
  });
});

apiRouter.post('/problems', authenticate, requirePermission('PROBLEMS_ADD'), (req: AuthenticatedRequest, res: Response) => {
  const { equipmentCode, problemDescription, problemDescriptionAr, problemDate, deadline, initialImages } = req.body;

  if (!equipmentCode || !problemDescription || !deadline) {
    return res.status(400).json({
      error: 'Equipment Code, Description, and Deadline are required',
      errorAr: 'كود المعدة ووصف المشكلة والموعد النهائي حقول إلزامية',
    });
  }

  const database = db.getData();
  const eq = database.equipment.find((e) => e.equipmentCode.toUpperCase() === equipmentCode.trim().toUpperCase());

  if (!eq) {
    return res.status(400).json({
      error: `Equipment "${equipmentCode}" does not exist. Please register the equipment first.`,
      errorAr: `المعدة "${equipmentCode}" غير مسجلة بالنظام. يرجى تسجيل المعدة أولاً.`,
    });
  }

  const newProblem: Problem = {
    id: `prb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    equipmentCode: eq.equipmentCode,
    equipmentType: eq.equipmentType,
    problemDescription: problemDescription.trim(),
    problemDescriptionAr: (problemDescriptionAr || '').trim(),
    problemDate: problemDate || new Date().toISOString().split('T')[0],
    deadline: deadline.trim(),
    status: 'OPEN',
    closedDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user?.username || 'admin',
  };

  database.problems.unshift(newProblem);

  // Handle optional initial images
  if (Array.isArray(initialImages) && initialImages.length > 0) {
    for (const img of initialImages) {
      if (img.dataUrl) {
        database.problemImages.push({
          id: `img-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          problemId: newProblem.id,
          fileName: img.fileName || 'defect_photo.jpg',
          fileSize: img.fileSize || 1024,
          dataUrl: img.dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      }
    }
  }

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_CREATE',
    'Problem',
    newProblem.id,
    `Registered safety problem for equipment ${eq.equipmentCode} (Deadline: ${deadline})`
  );

  return res.status(201).json(newProblem);
});

apiRouter.put('/problems/:id', authenticate, requirePermission('PROBLEMS_EDIT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { problemDescription, problemDescriptionAr, problemDate, deadline } = req.body;

  const database = db.getData();
  const problem = database.problems.find((p) => p.id === id);

  if (!problem) {
    return res.status(404).json({ error: 'Problem not found', errorAr: 'المشكلة غير موجودة' });
  }

  if (problemDescription) problem.problemDescription = problemDescription.trim();
  if (problemDescriptionAr !== undefined) problem.problemDescriptionAr = problemDescriptionAr.trim();
  if (problemDate) problem.problemDate = problemDate;
  if (deadline) problem.deadline = deadline;
  problem.updatedAt = new Date().toISOString();

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_UPDATE',
    'Problem',
    problem.id,
    `Updated safety defect details for equipment ${problem.equipmentCode}`
  );

  return res.json(problem);
});

apiRouter.post('/problems/:id/close', authenticate, requirePermission('PROBLEMS_CLOSE'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { closedDate, closeNotes } = req.body;

  const database = db.getData();
  const problem = database.problems.find((p) => p.id === id);

  if (!problem) {
    return res.status(404).json({ error: 'Problem not found', errorAr: 'المشكلة غير موجودة' });
  }

  problem.status = 'CLOSED';
  problem.closedDate = closedDate || new Date().toISOString().split('T')[0];
  problem.closedBy = req.user?.username || 'admin';
  problem.closeNotes = (closeNotes || '').trim();
  problem.updatedAt = new Date().toISOString();

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_CLOSE',
    'Problem',
    problem.id,
    `Closed safety problem for equipment ${problem.equipmentCode} (Closed on ${problem.closedDate})`
  );

  return res.json({ success: true, problem });
});

apiRouter.post('/problems/:id/reopen', authenticate, requirePermission('PROBLEMS_EDIT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const problem = database.problems.find((p) => p.id === id);

  if (!problem) {
    return res.status(404).json({ error: 'Problem not found', errorAr: 'المشكلة غير موجودة' });
  }

  problem.status = 'OPEN';
  problem.closedDate = null;
  problem.closeNotes = undefined;
  problem.updatedAt = new Date().toISOString();

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_REOPEN',
    'Problem',
    problem.id,
    `Reopened safety problem for equipment ${problem.equipmentCode}`
  );

  return res.json({ success: true, problem });
});

apiRouter.delete('/problems/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const pIndex = database.problems.findIndex((p) => p.id === id);

  if (pIndex === -1) {
    return res.status(404).json({ error: 'Problem not found', errorAr: 'المشكلة غير موجودة' });
  }

  const p = database.problems[pIndex];
  database.problemImages = database.problemImages.filter((img) => img.problemId !== id);
  database.problems.splice(pIndex, 1);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_DELETE',
    'Problem',
    id,
    `Deleted safety problem on equipment ${p.equipmentCode}`
  );

  return res.json({ success: true, message: 'Problem and associated images deleted' });
});

// Image upload for problems
apiRouter.post('/problems/:id/images', authenticate, requirePermission('PROBLEMS_IMAGE_UPLOAD'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { dataUrl, fileName, fileSize } = req.body;

  if (!dataUrl) {
    return res.status(400).json({ error: 'Image data URL is required' });
  }

  // Validate format (jpg, jpeg, png, webp)
  const isImageValid = /^data:image\/(jpeg|jpg|png|webp|svg\+xml);base64,/i.test(dataUrl) || dataUrl.startsWith('data:image/');
  if (!isImageValid) {
    return res.status(400).json({
      error: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP image files are allowed.',
      errorAr: 'صيغة الملف غير مدعومة. يسمح فقط بملفات الصور JPG، PNG، WEBP.',
    });
  }

  const database = db.getData();
  const problem = database.problems.find((p) => p.id === id);
  if (!problem) {
    return res.status(404).json({ error: 'Problem not found' });
  }

  const newImage: ProblemImage = {
    id: `img-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    problemId: id,
    fileName: fileName || 'defect_evidence.jpg',
    fileSize: fileSize || 2048,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };

  database.problemImages.push(newImage);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_IMAGE_UPLOAD',
    'ProblemImage',
    newImage.id,
    `Uploaded inspection photo for problem ${id} on ${problem.equipmentCode}`
  );

  return res.status(201).json(newImage);
});

apiRouter.delete('/problems/:id/images/:imageId', authenticate, requirePermission('PROBLEMS_IMAGE_DELETE'), (req: AuthenticatedRequest, res: Response) => {
  const { id, imageId } = req.params;
  const database = db.getData();
  const imgIndex = database.problemImages.findIndex((img) => img.id === imageId && img.problemId === id);

  if (imgIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  database.problemImages.splice(imgIndex, 1);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PROBLEM_IMAGE_DELETE',
    'ProblemImage',
    imageId,
    `Deleted inspection photo ${imageId} for problem ${id}`
  );

  return res.json({ success: true, message: 'Image deleted' });
});

// ----------------------------------------------------------------------
// 5. EMPLOYEES / DRIVERS ROUTES
// ----------------------------------------------------------------------

apiRouter.get('/employees', authenticate, requirePermission('EMPLOYEES_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  let list = [...database.employees];

  const { search, page = '1', limit = '10', sortBy = 'fullName', sortDir = 'asc' } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (emp) =>
        emp.employeeId.toLowerCase().includes(q) ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.fullNameAr.toLowerCase().includes(q) ||
        emp.nationalId.includes(q) ||
        emp.mobile.includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        (emp.linkedEquipmentCode && emp.linkedEquipmentCode.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => {
    let valA = (a as Record<string, any>)[sortBy as string] || '';
    let valB = (b as Record<string, any>)[sortBy as string] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const pNum = Math.max(1, parseInt(page as string, 10) || 1);
  const lNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const total = list.length;
  const paginated = list.slice((pNum - 1) * lNum, pNum * lNum);

  return res.json({
    data: paginated,
    total,
    page: pNum,
    totalPages: Math.ceil(total / lNum),
  });
});

apiRouter.post('/employees', authenticate, requirePermission('EMPLOYEES_ADD'), (req: AuthenticatedRequest, res: Response) => {
  const { employeeId, fullName, fullNameAr, position, positionAr, mobile, nationalId, inductionDate, licenseGrade, linkedEquipmentCode } = req.body;

  if (!employeeId || !fullName || !nationalId || !mobile) {
    return res.status(400).json({
      error: 'Employee ID, Full Name, National ID, and Mobile are required',
      errorAr: 'الرقم الوظيفي والاسم ورقم الهوية ورقم الجوال حقول إلزامية',
    });
  }

  const database = db.getData();
  const cleanId = employeeId.trim().toUpperCase();

  if (database.employees.some((e) => e.employeeId.toUpperCase() === cleanId)) {
    return res.status(400).json({
      error: `Employee ID "${cleanId}" is already registered.`,
      errorAr: `الرقم الوظيفي "${cleanId}" مسجل مسبقاً.`,
    });
  }

  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    employeeId: cleanId,
    fullName: fullName.trim(),
    fullNameAr: (fullNameAr || fullName).trim(),
    position: (position || 'Equipment Operator').trim(),
    positionAr: (positionAr || 'مشغل معدات').trim(),
    mobile: mobile.trim(),
    nationalId: nationalId.trim(),
    inductionDate: inductionDate || new Date().toISOString().split('T')[0],
    licenseGrade: (licenseGrade || 'Heavy Equipment Grade 1').trim(),
    linkedEquipmentCode: linkedEquipmentCode ? linkedEquipmentCode.trim().toUpperCase() : undefined,
    createdAt: new Date().toISOString(),
  };

  database.employees.push(newEmp);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EMPLOYEE_CREATE',
    'Employee',
    cleanId,
    `Registered new employee/operator: ${fullName} (${cleanId})`
  );

  return res.status(201).json(newEmp);
});

apiRouter.put('/employees/:id', authenticate, requirePermission('EMPLOYEES_EDIT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const emp = database.employees.find((e) => e.id === id);

  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const { fullName, fullNameAr, position, positionAr, mobile, nationalId, inductionDate, licenseGrade, linkedEquipmentCode } = req.body;

  if (fullName) emp.fullName = fullName.trim();
  if (fullNameAr !== undefined) emp.fullNameAr = fullNameAr.trim();
  if (position) emp.position = position.trim();
  if (positionAr !== undefined) emp.positionAr = positionAr.trim();
  if (mobile) emp.mobile = mobile.trim();
  if (nationalId) emp.nationalId = nationalId.trim();
  if (inductionDate) emp.inductionDate = inductionDate;
  if (licenseGrade !== undefined) emp.licenseGrade = licenseGrade.trim();
  if (linkedEquipmentCode !== undefined) emp.linkedEquipmentCode = linkedEquipmentCode ? linkedEquipmentCode.trim().toUpperCase() : undefined;

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EMPLOYEE_UPDATE',
    'Employee',
    emp.employeeId,
    `Updated details for employee ${emp.fullName}`
  );

  return res.json(emp);
});

apiRouter.delete('/employees/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const index = database.employees.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const emp = database.employees[index];
  database.employees.splice(index, 1);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EMPLOYEE_DELETE',
    'Employee',
    emp.employeeId,
    `Deleted employee record: ${emp.fullName} (${emp.employeeId})`
  );

  return res.json({ success: true, message: 'Employee deleted' });
});

// ----------------------------------------------------------------------
// 6. CONTRACTORS ROUTES
// ----------------------------------------------------------------------

apiRouter.get('/contractors', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  const equipment = database.equipment;

  // Enrich with equipment count
  const countMap = new Map<string, number>();
  for (const eq of equipment) {
    countMap.set(eq.contractor, (countMap.get(eq.contractor) || 0) + 1);
  }

  const list = database.contractors.map((c) => ({
    ...c,
    equipmentCount: countMap.get(c.name) || 0,
  }));

  return res.json(list);
});

apiRouter.post('/contractors', authenticate, requirePermission('CONTRACTORS_MANAGE'), (req: AuthenticatedRequest, res: Response) => {
  const { name, nameAr, contactPerson, mobile, email } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Contractor name is required', errorAr: 'اسم المقاول مطلوب' });
  }

  const database = db.getData();
  if (database.contractors.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Contractor name already exists' });
  }

  const newContractor: Contractor = {
    id: `cont-${Date.now()}`,
    name: name.trim(),
    nameAr: (nameAr || name).trim(),
    contactPerson: (contactPerson || '').trim(),
    mobile: (mobile || '').trim(),
    email: (email || '').trim(),
    createdAt: new Date().toISOString(),
  };

  database.contractors.push(newContractor);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'CONTRACTOR_CREATE',
    'Contractor',
    newContractor.id,
    `Added contractor company: ${name}`
  );

  return res.status(201).json(newContractor);
});

apiRouter.put('/contractors/:id', authenticate, requirePermission('CONTRACTORS_MANAGE'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const c = database.contractors.find((item) => item.id === id);

  if (!c) {
    return res.status(404).json({ error: 'Contractor not found' });
  }

  const { name, nameAr, contactPerson, mobile, email } = req.body;
  const oldName = c.name;
  if (name) c.name = name.trim();
  if (nameAr !== undefined) c.nameAr = nameAr.trim();
  if (contactPerson !== undefined) c.contactPerson = contactPerson.trim();
  if (mobile !== undefined) c.mobile = mobile.trim();
  if (email !== undefined) c.email = email.trim();

  // If name changed, update equipment contractor strings
  if (name && name.trim() !== oldName) {
    for (const eq of database.equipment) {
      if (eq.contractor === oldName) {
        eq.contractor = name.trim();
      }
    }
  }

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'CONTRACTOR_UPDATE',
    'Contractor',
    c.id,
    `Updated contractor ${c.name}`
  );

  return res.json(c);
});

apiRouter.delete('/contractors/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const index = database.contractors.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Contractor not found' });
  }

  const c = database.contractors[index];
  const linkedEquipment = database.equipment.filter((e) => e.contractor === c.name);
  if (linkedEquipment.length > 0) {
    return res.status(400).json({
      error: `Cannot delete contractor "${c.name}". It is assigned to ${linkedEquipment.length} equipment unit(s).`,
      errorAr: `لا يمكن حذف المقاول "${c.name}" لأنه مرتبط بـ ${linkedEquipment.length} معدة.`,
    });
  }

  database.contractors.splice(index, 1);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'CONTRACTOR_DELETE',
    'Contractor',
    c.id,
    `Deleted contractor ${c.name}`
  );

  return res.json({ success: true, message: 'Contractor deleted' });
});

// ----------------------------------------------------------------------
// 7. EQUIPMENT TYPES (CATEGORIES)
// ----------------------------------------------------------------------

apiRouter.get('/equipment-types', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  return res.json(database.equipmentTypes);
});

apiRouter.post('/equipment-types', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, nameAr, code, description, icon } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Name and Code are required' });
  }

  const database = db.getData();
  const newType: EquipmentType = {
    id: `et-${Date.now()}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    nameAr: (nameAr || name).trim(),
    icon: icon || 'Construction',
    description: (description || '').trim(),
  };

  database.equipmentTypes.push(newType);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'EQUIPMENT_TYPE_CREATE',
    'EquipmentType',
    newType.id,
    `Added equipment category ${name}`
  );

  return res.status(201).json(newType);
});

// ----------------------------------------------------------------------
// 8. USERS MANAGEMENT (Admin-Only)
// ----------------------------------------------------------------------

apiRouter.get('/users', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  const users = database.users.map((u) => {
    const role = database.roles.find((r) => r.id === u.roleId);
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      mobile: u.mobile,
      roleId: u.roleId,
      roleName: role ? role.name : 'Unknown Role',
      roleNameAr: role ? role.nameAr : 'غير محدد',
      status: u.status,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    };
  });

  return res.json(users);
});

apiRouter.post('/users', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { username, email, fullName, mobile, password, roleId, status } = req.body;

  if (!username || !email || !password || !roleId) {
    return res.status(400).json({
      error: 'Username, Email, Password, and Role are required',
      errorAr: 'اسم المستخدم والبريد وكلمة المرور والدور حقول إلزامية',
    });
  }

  const database = db.getData();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  if (database.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  if (database.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'Email address is already in use' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    email: cleanEmail,
    fullName: (fullName || cleanUsername).trim(),
    mobile: (mobile || '').trim(),
    passwordHash: hashPassword(password),
    roleId,
    status: status === 'Inactive' ? 'Inactive' : 'Active',
    createdAt: new Date().toISOString(),
  };

  database.users.push(newUser);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'USER_CREATE',
    'User',
    newUser.id,
    `Created new user ${cleanUsername} with role ${roleId}`
  );

  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    fullName: newUser.fullName,
    mobile: newUser.mobile,
    roleId: newUser.roleId,
    status: newUser.status,
    createdAt: newUser.createdAt,
  });
});

apiRouter.put('/users/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { fullName, email, mobile, roleId, status, password } = req.body;

  const database = db.getData();
  const user = database.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (email && email.trim().toLowerCase() !== user.email) {
    const existing = database.users.find((u) => u.id !== id && u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email is already in use by another user' });
    }
    user.email = email.trim().toLowerCase();
  }

  if (fullName) user.fullName = fullName.trim();
  if (mobile !== undefined) user.mobile = mobile.trim();
  if (roleId) user.roleId = roleId;
  if (status) user.status = status;
  if (password && password.trim().length >= 4) {
    user.passwordHash = hashPassword(password.trim());
  }

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'USER_UPDATE',
    'User',
    user.id,
    `Updated user profile and permissions for ${user.username}`
  );

  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    mobile: user.mobile,
    roleId: user.roleId,
    status: user.status,
  });
});

apiRouter.post('/users/:id/reset-password', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const database = db.getData();
  const user = database.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.passwordHash = hashPassword(newPassword);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'PASSWORD_RESET',
    'User',
    user.id,
    `Reset password for user ${user.username}`
  );

  return res.json({ success: true, message: 'Password reset successfully' });
});

apiRouter.delete('/users/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({
      error: 'Cannot delete your own administrative account',
      errorAr: 'لا يمكنك حذف حسابك الإداري الحالي',
    });
  }

  const database = db.getData();
  const index = database.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const u = database.users[index];
  database.users.splice(index, 1);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'USER_DELETE',
    'User',
    id,
    `Deleted user account ${u.username}`
  );

  return res.json({ success: true, message: 'User deleted successfully' });
});

// ----------------------------------------------------------------------
// 9. ROLES & PERMISSIONS
// ----------------------------------------------------------------------

apiRouter.get('/permissions', authenticate, (req: AuthenticatedRequest, res: Response) => {
  return res.json(PERMISSIONS_LIST);
});

apiRouter.get('/roles', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  return res.json(database.roles);
});

apiRouter.post('/roles', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, nameAr, description, permissions } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  const database = db.getData();
  const newRole: Role = {
    id: `role-custom-${Date.now()}`,
    name: name.trim(),
    nameAr: (nameAr || name).trim(),
    description: (description || '').trim(),
    isSystem: false,
    permissions: Array.isArray(permissions) ? permissions : [],
    createdAt: new Date().toISOString(),
  };

  database.roles.push(newRole);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'ROLE_CREATE',
    'Role',
    newRole.id,
    `Created custom role ${name} with ${newRole.permissions.length} permissions`
  );

  return res.status(201).json(newRole);
});

apiRouter.put('/roles/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, nameAr, description, permissions } = req.body;

  const database = db.getData();
  const role = database.roles.find((r) => r.id === id);

  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  if (name && !role.isSystem) role.name = name.trim();
  if (nameAr !== undefined) role.nameAr = nameAr.trim();
  if (description !== undefined) role.description = description.trim();
  if (Array.isArray(permissions)) {
    // If admin role, ensure all permissions remain
    if (role.id === 'role-admin') {
      role.permissions = PERMISSIONS_LIST.map((p) => p.code);
    } else {
      role.permissions = permissions;
    }
  }

  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'ROLE_UPDATE',
    'Role',
    role.id,
    `Updated role ${role.name} permissions`
  );

  return res.json(role);
});

apiRouter.delete('/roles/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const role = database.roles.find((r) => r.id === id);

  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  if (role.isSystem) {
    return res.status(400).json({
      error: 'System roles cannot be deleted',
      errorAr: 'لا يمكن حذف الأدوار الافتراضية للنظام',
    });
  }

  const assignedUsers = database.users.filter((u) => u.roleId === id);
  if (assignedUsers.length > 0) {
    return res.status(400).json({
      error: `Cannot delete role "${role.name}". It is assigned to ${assignedUsers.length} user(s).`,
      errorAr: `لا يمكن حذف الدور "${role.name}" لوجود مستخدمين مسندين إليه.`,
    });
  }

  database.roles = database.roles.filter((r) => r.id !== id);
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'ROLE_DELETE',
    'Role',
    id,
    `Deleted custom role ${role.name}`
  );

  return res.json({ success: true, message: 'Role deleted' });
});

// ----------------------------------------------------------------------
// 10. NOTIFICATIONS
// ----------------------------------------------------------------------

apiRouter.get('/notifications', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.refreshDeadlineNotifications();
  const database = db.getData();
  return res.json(database.notifications);
});

apiRouter.post('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.getData();
  const notif = database.notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    db.save();
  }
  return res.json({ success: true });
});

apiRouter.post('/notifications/mark-all-read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  for (const n of database.notifications) {
    n.read = true;
  }
  db.save();
  return res.json({ success: true });
});

// ----------------------------------------------------------------------
// 11. AUDIT / ACTIVITY LOG
// ----------------------------------------------------------------------

apiRouter.get('/audit-logs', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  return res.json(database.auditLogs);
});

// ----------------------------------------------------------------------
// 12. SYSTEM SETTINGS
// ----------------------------------------------------------------------

apiRouter.get('/settings', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  return res.json(database.settings);
});

apiRouter.put('/settings', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const database = db.getData();
  database.settings = {
    ...database.settings,
    ...req.body,
  };
  db.save();

  db.logAudit(
    req.user!.id,
    req.user!.username,
    'SETTINGS_UPDATE',
    'SystemSettings',
    'SYSTEM',
    'Updated company HSE system settings'
  );

  return res.json(database.settings);
});

// ----------------------------------------------------------------------
// 13. GLOBAL SEARCH
// ----------------------------------------------------------------------

apiRouter.get('/search', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json({ equipment: [], problems: [], employees: [], contractors: [] });
  }

  const database = db.getData();

  const equipment = database.equipment
    .filter(
      (e) =>
        e.equipmentCode.toLowerCase().includes(query) ||
        e.equipmentType.toLowerCase().includes(query) ||
        e.contractor.toLowerCase().includes(query) ||
        e.driverName.toLowerCase().includes(query)
    )
    .slice(0, 5);

  const problems = database.problems
    .filter(
      (p) =>
        p.equipmentCode.toLowerCase().includes(query) ||
        p.problemDescription.toLowerCase().includes(query) ||
        (p.problemDescriptionAr && p.problemDescriptionAr.toLowerCase().includes(query)) ||
        p.equipmentType.toLowerCase().includes(query)
    )
    .slice(0, 5)
    .map((p) => ({
      ...p,
      deadlineInfo: getDeadlineInfo(p.deadline, p.status),
    }));

  const employees = database.employees
    .filter(
      (emp) =>
        emp.employeeId.toLowerCase().includes(query) ||
        emp.fullName.toLowerCase().includes(query) ||
        emp.fullNameAr.toLowerCase().includes(query) ||
        emp.nationalId.includes(query) ||
        emp.position.toLowerCase().includes(query)
    )
    .slice(0, 5);

  const contractors = database.contractors
    .filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.nameAr.toLowerCase().includes(query) ||
        c.contactPerson.toLowerCase().includes(query)
    )
    .slice(0, 5);

  return res.json({
    equipment,
    problems,
    employees,
    contractors,
  });
});

// ----------------------------------------------------------------------
// 14. REPORTS MODULE
// ----------------------------------------------------------------------

apiRouter.get('/reports/data', authenticate, requirePermission('REPORTS_VIEW'), (req: AuthenticatedRequest, res: Response) => {
  const { reportType, equipmentType, contractor, status, startDate, endDate } = req.query;
  const database = db.getData();

  let problems = [...database.problems];
  let equipment = [...database.equipment];
  let employees = [...database.employees];

  // Build contractor map
  const contractorMap = new Map<string, string>();
  for (const eq of equipment) {
    contractorMap.set(eq.equipmentCode, eq.contractor);
  }

  // Filter equipment
  if (equipmentType && equipmentType !== 'ALL') {
    equipment = equipment.filter((e) => e.equipmentType.toLowerCase() === (equipmentType as string).toLowerCase());
    problems = problems.filter((p) => p.equipmentType.toLowerCase() === (equipmentType as string).toLowerCase());
  }

  if (contractor && contractor !== 'ALL') {
    equipment = equipment.filter((e) => e.contractor.toLowerCase() === (contractor as string).toLowerCase());
    problems = problems.filter((p) => {
      const c = contractorMap.get(p.equipmentCode) || '';
      return c.toLowerCase() === (contractor as string).toLowerCase();
    });
  }

  if (status && status !== 'ALL') {
    problems = problems.filter((p) => p.status === status);
  }

  if (startDate) {
    problems = problems.filter((p) => p.problemDate >= (startDate as string));
  }

  if (endDate) {
    problems = problems.filter((p) => p.problemDate <= (endDate as string));
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  const enrichedProblems = problems.map((p) => ({
    ...p,
    contractor: contractorMap.get(p.equipmentCode) || 'Unknown',
    deadlineInfo: getDeadlineInfo(p.deadline, p.status),
    imagesCount: database.problemImages.filter((img) => img.problemId === p.id).length,
  }));

  // Aggregated summary metrics
  const totalEquipment = equipment.length;
  const totalProblems = problems.length;
  const openProblems = problems.filter((p) => p.status === 'OPEN').length;
  const closedProblems = problems.filter((p) => p.status === 'CLOSED').length;
  const overdueProblems = enrichedProblems.filter((p) => p.status === 'OPEN' && p.deadlineInfo.condition === 'OVERDUE').length;
  const dueWithin2Days = enrichedProblems.filter(
    (p) => p.status === 'OPEN' && (p.deadlineInfo.condition === 'DUE_SOON' || p.deadlineInfo.condition === 'DUE_TODAY')
  ).length;

  return res.json({
    reportType: reportType || 'HSE_SUMMARY',
    generatedAt: new Date().toISOString(),
    generatedBy: req.user?.fullName || req.user?.username,
    company: database.settings,
    summary: {
      totalEquipment,
      totalProblems,
      openProblems,
      closedProblems,
      overdueProblems,
      dueWithin2Days,
    },
    equipment,
    problems: enrichedProblems,
    employees,
  });
});
