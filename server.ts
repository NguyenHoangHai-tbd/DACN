import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- MOCK ASP.NET CORE BACKEND ---

  // Standard API Response Wrapper
  const successResponse = (data: any, meta: any = null) => ({
    success: true,
    data,
    message: null,
    errors: null,
    meta,
  });

  const errorResponse = (message: string, errors: any = null, code = 400) => ({
    success: false,
    data: null,
    message,
    errors,
  });

  let mockUsers = [
    { id: 'u-superadmin', username: 'superadmin', email: 'superadmin@system.local', role: 'SuperAdmin', status: 'Active', tenantId: 'tenant-1' },
    { id: 'u-1', username: 'admin', email: 'admin@system.local', role: 'TenantAdmin', status: 'Active', tenantId: 'tenant-1' },
    { id: 'u-librarian', username: 'librarian', email: 'librarian@system.local', role: 'Librarian', status: 'Active', tenantId: 'tenant-1' },
    { id: 'u-member-U002', username: 'U002', email: 'john@example.com', role: 'Member', status: 'Active', tenantId: 'tenant-1' }
  ];

  let mockTenants = [
    { id: 'tenant-1', code: 'hq', name: 'Hà Nội HQ', status: 'Active', tenantAdmin: 'admin', librarian: 'librarian', createdAt: '2023-01-01T00:00:00Z' },
    { id: 'tenant-2', code: 'lib-hcm', name: 'Thư viện TP.HCM', status: 'Active', tenantAdmin: '', librarian: '', createdAt: '2023-02-15T00:00:00Z' }
  ];

  let mockAuditLogs = [
    { id: 'log-1', actor: 'superadmin@system.local', action: 'Update', entity: 'Policy', entityId: 'pol-123', tenantId: 'tenant-1', ipAddress: '192.168.1.1', timestamp: new Date().toISOString(), details: 'Updated overdue fine policy from 5000 to 10000', oldValues: { overdueFine: 5000 }, newValues: { overdueFine: 10000 } },
    { id: 'log-2', actor: 'john@example.com', action: 'Login', entity: 'System', entityId: 'auth-002', tenantId: 'tenant-1', ipAddress: '10.0.0.12', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'User login successful' },
    { id: 'log-3', actor: 'jane@example.com', action: 'Create', entity: 'Loan', entityId: 'loan-456', tenantId: 'tenant-1', ipAddress: '192.168.1.5', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Created checkout loan for book B-123' },
    { id: 'log-4', actor: 'superadmin@system.local', action: 'Delete', entity: 'Book', entityId: 'book-999', tenantId: 'tenant-1', ipAddress: '192.168.1.1', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Deleted invalid book record' }
  ];

  function addAuditLog({ actor, action, entity, entityId, details, tenantId, oldValues = null, newValues = null }: any) {
    const newLog = {
      id: 'log-' + (mockAuditLogs.length + 1) + '-' + Math.random().toString(36).substring(7),
      actor: actor || 'system',
      action,
      entity,
      entityId,
      tenantId: tenantId || 'tenant-1',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
      details,
      oldValues,
      newValues,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      correlationId: 'req-' + Math.random().toString(36).substring(7)
    };
    mockAuditLogs.unshift(newLog);
    return newLog;
  }

  app.post('/api/auth/login', (req, res) => {
    const { username, password, tenantCode } = req.body;
    const clientIp = req.ip || '127.0.0.1';

    // Fake AI Risk Hint
    const isSuspicious = clientIp.includes('192.168.0.50') || username === 'hacker';
    
    const reqTenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const matchedUser = mockUsers.find(
      u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase())
    );

    if (!matchedUser) {
      return res.status(401).json(errorResponse('auth.login.invalid_credentials'));
    }

    if (password === 'password') {
      res.json(
        successResponse({
          accessToken: 'mock-jwt-token-' + matchedUser.id,
          refreshToken: 'mock-refresh-token',
          user: {
            id: matchedUser.id,
            username: matchedUser.username,
            tenantId: reqTenantId, // Bind to requested tenant
            roles: [matchedUser.role],
            branchIds: ['b-1', 'b-2']
          },
          riskAlert: isSuspicious ? 'High risk detected by AI: Suspicious location.' : null
        })
      );
    } else {
      res.status(401).json(errorResponse('auth.login.invalid_credentials'));
    }
  });

  app.post('/api/auth/change-password', (req, res) => {
    // Requires header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(errorResponse('error.auth.unauthorized'));
    }
    const { currentPassword, newPassword } = req.body;
    if (currentPassword !== 'password') {
      return res.status(400).json(errorResponse('auth.password.invalid_current', [{ field: 'currentPassword', code: 'validation.invalid' }]));
    }
    res.json(successResponse({ success: true, message: 'auth.password.change_success' }));
  });

  app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken === 'mock-refresh-token') {
      res.json(
        successResponse({
          accessToken: 'mock-jwt-token-refreshed',
          refreshToken: 'mock-refresh-token-new',
        })
      );
    } else {
      res.status(401).json(errorResponse('auth.login.session_expired'));
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json(successResponse({ success: true }));
  });

  const getTenantIdFromCode = (code: any): string => {
    if (!code) return 'tenant-1';
    const cleanCode = code.toString().trim().toLowerCase();
    const found = mockTenants.find(t => t.code.toLowerCase() === cleanCode);
    if (found) return found.id;
    if (cleanCode === 'hq') return 'tenant-1';
    if (cleanCode === 'lib-hcm') return 'tenant-2';
    return 'tenant-1';
  };

  let mockPoliciesByTenant: Record<string, any> = {
    'tenant-1': {
      id: 'pol-tenant-1',
      tenantId: 'tenant-1',
      circulation: { maxItemsPerMember: 5, maxDaysToBorrow: 14, maxRenewals: 1 },
      fines: { finePerDay: 5000, maxFinePerItem: 100000, gracePeriodDays: 1 },
      holds: { maxHoldsPerMember: 3, holdExpirationDays: 3 },
      holidays: [
        { id: 'h1', name: 'Nghỉ lễ Quốc khánh', date: '2026-09-02' },
        { id: 'h2', name: 'Nghỉ Tết Dương lịch', date: '2027-01-01' }
      ],
      updatedAt: new Date().toISOString()
    },
    'tenant-2': {
      id: 'pol-tenant-2',
      tenantId: 'tenant-2',
      circulation: { maxItemsPerMember: 5, maxDaysToBorrow: 14, maxRenewals: 1 },
      fines: { finePerDay: 5000, maxFinePerItem: 100000, gracePeriodDays: 1 },
      holds: { maxHoldsPerMember: 3, holdExpirationDays: 3 },
      holidays: [
        { id: 'h1', name: 'Nghỉ lễ Quốc khánh', date: '2026-09-02' },
        { id: 'h2', name: 'Nghỉ Tết Dương lịch', date: '2027-01-01' }
      ],
      updatedAt: new Date().toISOString()
    }
  };

  const getPolicyByTenant = (tenantId: string) => {
    if (!mockPoliciesByTenant[tenantId]) {
      mockPoliciesByTenant[tenantId] = {
        id: `pol-${tenantId}`,
        tenantId: tenantId,
        circulation: { maxItemsPerMember: 5, maxDaysToBorrow: 14, maxRenewals: 1 },
        fines: { finePerDay: 5000, maxFinePerItem: 100000, gracePeriodDays: 1 },
        holds: { maxHoldsPerMember: 3, holdExpirationDays: 3 },
        holidays: [
          { id: 'h1', name: 'Nghỉ lễ Quốc khánh', date: '2026-09-02' },
          { id: 'h2', name: 'Nghỉ Tết Dương lịch', date: '2027-01-01' }
        ],
        updatedAt: new Date().toISOString()
      };
    }
    return mockPoliciesByTenant[tenantId];
  };

  const calculateLoanFine = (loan: any, tenantId: string) => {
    const policy = getPolicyByTenant(tenantId);
    const isOverdue = loan.status === 'Overdue' || (loan.status !== 'Returned' && new Date() > new Date(loan.dueDate));
    
    if (isOverdue) {
      const dueDate = new Date(loan.dueDate);
      const diffTime = Date.now() - dueDate.getTime();
      const overdueDaysRaw = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const gracePeriodDays = Number(policy.fines?.gracePeriodDays) !== undefined ? Number(policy.fines.gracePeriodDays) : 1;
      const finePerDay = Number(policy.fines?.finePerDay) !== undefined ? Number(policy.fines.finePerDay) : 5000;
      const maxFinePerItem = Number(policy.fines?.maxFinePerItem) !== undefined ? Number(policy.fines.maxFinePerItem) : 100000;
      
      const chargeableDays = Math.max(0, overdueDaysRaw - gracePeriodDays);
      let fineAmount = chargeableDays * finePerDay;
      if (maxFinePerItem > 0 && fineAmount > maxFinePerItem) {
        fineAmount = maxFinePerItem;
      }
      return { fineAmount, overdueDays: overdueDaysRaw };
    } else {
      return { fineAmount: loan.fineAmount || 0, overdueDays: 0 };
    }
  };

  const getCurrentRole = (req: any): string => {
    const roleHeader = req.headers['x-current-role']?.toString().toLowerCase() || 'tenant_admin';
    if (roleHeader.includes('super_admin') || roleHeader.includes('superadmin')) return 'super_admin';
    if (roleHeader.includes('tenant_admin') || roleHeader.includes('tenantadmin')) return 'tenant_admin';
    if (roleHeader.includes('librarian')) return 'librarian';
    if (roleHeader.includes('member')) return 'member';
    return 'tenant_admin'; // default fallback
  };

  // --- MOCK ADMIN ENDPOINTS ---

  app.get('/api/tenants', (req, res) => {
    const enrichedTenants = mockTenants.map(tenant => {
      const totalBooks = mockBooks.filter(b => b.tenantId === tenant.id).length;
      const totalMembers = mockMembers.filter(m => m.tenantId === tenant.id).length;
      const activeLoans = mockLoans.filter(l => l.tenantId === tenant.id && l.status !== 'Returned').length;
      
      const overdueLoans = mockLoans.filter(l => {
        if (l.tenantId !== tenant.id) return false;
        const isOverdueState = l.status === 'Overdue';
        const isPastDue = l.status !== 'Returned' && l.dueDate && new Date(l.dueDate) < new Date();
        return isOverdueState || isPastDue;
      }).length;

      return {
        ...tenant,
        totalBooks,
        totalMembers,
        activeLoans,
        overdueLoans,
        tenantAdmin: tenant.tenantAdmin || '',
        librarian: tenant.librarian || ''
      };
    });
    res.json(successResponse(enrichedTenants));
  });

  app.post('/api/tenants', (req, res) => {
    const { code, name, status, tenantAdmin, librarian } = req.body;
    if (!code || code.trim() === '') {
      return res.status(400).json(errorResponse('Mã thư viện không được để trống'));
    }
    if (!name || name.trim() === '') {
      return res.status(400).json(errorResponse('Tên thư viện không được để trống'));
    }
    
    const codeNormalized = code.trim().toLowerCase();
    const isDuplicate = mockTenants.some(t => t.code.toLowerCase() === codeNormalized);
    if (isDuplicate) {
      return res.status(400).json(errorResponse('Mã thư viện đã tồn tại trong hệ thống'));
    }

    const newTenant = {
      id: 'tenant-' + (mockTenants.length + 1) + '-' + Math.random().toString(36).substring(7),
      code: code.trim(),
      name: name.trim(),
      status: status || 'Active',
      tenantAdmin: tenantAdmin || '',
      librarian: librarian || '',
      createdAt: new Date().toISOString()
    };

    mockTenants.push(newTenant);

    // Ghi log
    addAuditLog({
      actor: 'superadmin@system.local',
      action: 'Create',
      entity: 'Tenant',
      entityId: newTenant.id,
      details: `Thêm mới thư viện "${newTenant.name}" (Mã: ${newTenant.code})`,
      tenantId: newTenant.id,
      newValues: { code: newTenant.code, name: newTenant.name, status: newTenant.status, tenantAdmin: newTenant.tenantAdmin, librarian: newTenant.librarian }
    });

    res.status(201).json(successResponse(newTenant));
  });

  app.put('/api/tenants/:id', (req, res) => {
    const { id } = req.params;
    const { name, status, tenantAdmin, librarian } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json(errorResponse('Tên thư viện không được để trống'));
    }

    const tenantIndex = mockTenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json(errorResponse('Không tìm thấy thư viện'));
    }

    const oldTenant = { ...mockTenants[tenantIndex] };
    mockTenants[tenantIndex] = {
      ...mockTenants[tenantIndex],
      name: name.trim(),
      status: status || mockTenants[tenantIndex].status,
      tenantAdmin: tenantAdmin !== undefined ? tenantAdmin : mockTenants[tenantIndex].tenantAdmin || '',
      librarian: librarian !== undefined ? librarian : mockTenants[tenantIndex].librarian || ''
    };

    const updatedTenant = mockTenants[tenantIndex];

    // Ghi log
    addAuditLog({
      actor: 'superadmin@system.local',
      action: 'Update',
      entity: 'Tenant',
      entityId: id,
      details: `Cập nhật thông tin thư viện "${oldTenant.name}" -> "${updatedTenant.name}"`,
      tenantId: id,
      oldValues: { name: oldTenant.name, status: oldTenant.status, tenantAdmin: oldTenant.tenantAdmin, librarian: oldTenant.librarian },
      newValues: { name: updatedTenant.name, status: updatedTenant.status, tenantAdmin: updatedTenant.tenantAdmin, librarian: updatedTenant.librarian }
    });

    res.json(successResponse(updatedTenant));
  });

  app.patch('/api/tenants/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'Active' && status !== 'Inactive')) {
      return res.status(400).json(errorResponse('Trạng thái không hợp lệ'));
    }

    const tenantIndex = mockTenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json(errorResponse('Không tìm thấy thư viện'));
    }

    const oldStatus = mockTenants[tenantIndex].status;
    mockTenants[tenantIndex].status = status;

    const actionText = status === 'Active' ? 'mở khóa' : 'khóa';
    
    // Ghi log
    addAuditLog({
      actor: 'superadmin@system.local',
      action: 'Update',
      entity: 'Tenant',
      entityId: id,
      details: `Đã ${status === 'Active' ? 'mở khóa' : 'khóa'} thư viện "${mockTenants[tenantIndex].name}"`,
      tenantId: id,
      oldValues: { status: oldStatus },
      newValues: { status: status }
    });

    res.json(successResponse(mockTenants[tenantIndex]));
  });

  app.get('/api/users', (req, res) => {
    const role = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = getTenantIdFromCode(tenantCode);

    if (role !== 'super_admin' && role !== 'tenant_admin') {
      return res.status(403).json(errorResponse('Bạn không có quyền truy cập danh sách tài khoản'));
    }

    if (role === 'super_admin') {
      return res.json(successResponse(mockUsers));
    }

    const result = mockUsers.filter(u => u.tenantId === tenantId);
    res.json(successResponse(result));
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { role, status } = req.body;
    const currentRole = getCurrentRole(req);
    const currentUserId = req.headers['x-current-user-id'];
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole !== 'super_admin' && currentRole !== 'tenant_admin') {
      return res.status(403).json(errorResponse('Bạn không có quyền phân quyền tài khoản này'));
    }

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json(errorResponse('user.not_found'));
    }

    const targetUser = mockUsers[userIndex];

    const validRoles = ['SuperAdmin', 'TenantAdmin', 'Librarian', 'Member'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json(errorResponse('Vai trò không hợp lệ'));
    }

    if (currentRole === 'tenant_admin') {
      if (targetUser.tenantId !== tenantId) {
        return res.status(403).json(errorResponse('Bạn không có quyền sửa tài khoản của thư viện khác'));
      }
      if (targetUser.role === 'SuperAdmin') {
        return res.status(403).json(errorResponse('Bạn không có quyền sửa tài khoản Super Admin'));
      }
      if (role === 'SuperAdmin' || role === 'TenantAdmin') {
        return res.status(403).json(errorResponse('Bạn không có quyền gán vai trò Super Admin hoặc Tenant Admin'));
      }
    } else if (currentRole === 'super_admin') {
      const isSuperAdminUser = id === 'u-superadmin' || targetUser.username.toLowerCase() === 'superadmin';
      
      if (isSuperAdminUser) {
        if (status === 'Inactive') {
          return res.status(400).json(errorResponse('Không thể tự vô hiệu hóa tài khoản của chính mình'));
        }
        if (role && role !== 'SuperAdmin') {
          return res.status(400).json(errorResponse('Không thể tự hạ cấp quyền hạn của chính mình'));
        }
      } else {
        if (role === 'SuperAdmin') {
          return res.status(400).json(errorResponse('Demo chỉ cho phép một tài khoản Super Admin'));
        }
      }
    }

    const oldUser = { ...targetUser };

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      role: role || mockUsers[userIndex].role,
      status: status || mockUsers[userIndex].status
    };
    
    const updatedUser = mockUsers[userIndex];

    if (oldUser.role !== updatedUser.role) {
      addAuditLog({
        actor: 'superadmin@system.local',
        action: 'Update',
        entity: 'User',
        entityId: id,
        details: `Thay đổi vai trò của người dùng ${updatedUser.username} từ ${oldUser.role} thành ${updatedUser.role}`,
        tenantId: updatedUser.tenantId,
        oldValues: { role: oldUser.role },
        newValues: { role: updatedUser.role }
      });
    } else if (oldUser.status !== updatedUser.status) {
      addAuditLog({
        actor: 'superadmin@system.local',
        action: 'Update',
        entity: 'User',
        entityId: id,
        details: `Thay đổi trạng thái của người dùng ${updatedUser.username} từ ${oldUser.status} thành ${updatedUser.status}`,
        tenantId: updatedUser.tenantId,
        oldValues: { status: oldUser.status },
        newValues: { status: updatedUser.status }
      });
    }
    
    // Sync status to associated member
    const memberIndex = mockMembers.findIndex(m => 
      m.memberCode === updatedUser.username || 
      'u-' + m.id === updatedUser.id || 
      'u-member-' + m.memberCode === updatedUser.id ||
      (m.memberCode === 'U001' && updatedUser.username === 'admin')
    );
    if (memberIndex !== -1) {
      mockMembers[memberIndex].status = updatedUser.status;
    }
    
    res.json(successResponse(updatedUser));
  });

  let mockBranches: any[] = [
    { id: 'b-1', code: 'BR_HQ', name: 'Central Reading Room', status: 'Active', tenantId: 'tenant-1', createdAt: new Date('2025-01-01').toISOString() },
    { id: 'b-2', code: 'BR_CH', name: 'Children Section', status: 'Active', tenantId: 'tenant-1', createdAt: new Date('2025-01-10').toISOString() },
    { id: 'b-3', code: 'BR_HCM_HQ', name: 'Central Reading Room (HCM)', status: 'Active', tenantId: 'tenant-2', createdAt: new Date('2025-01-01').toISOString() },
    { id: 'b-4', code: 'BR_HCM_CH', name: 'Children Section (HCM)', status: 'Active', tenantId: 'tenant-2', createdAt: new Date('2025-01-10').toISOString() }
  ];

  app.get('/api/branches', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const branches = mockBranches.filter(b => b.tenantId === tenantId);
    res.json(successResponse(branches));
  });

  app.post('/api/branches', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const { code, name } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json(errorResponse('Mã chi nhánh không được để trống'));
    }
    if (!name || !name.trim()) {
      return res.status(400).json(errorResponse('Tên chi nhánh không được để trống'));
    }

    const duplicate = mockBranches.find(b => b.tenantId === tenantId && b.code.toLowerCase() === code.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json(errorResponse('Mã chi nhánh đã tồn tại trong thư viện này'));
    }

    const newBranch = {
      id: `b-${Math.floor(Math.random() * 90000) + 10000}`,
      code: code.trim(),
      name: name.trim(),
      status: 'Active',
      tenantId,
      createdAt: new Date().toISOString()
    };

    mockBranches.push(newBranch);
    res.json(successResponse(newBranch));
  });

  app.put('/api/branches/:id', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const { id } = req.params;
    const { name, status } = req.body;

    const branch = mockBranches.find(b => b.id === id && b.tenantId === tenantId);
    if (!branch) {
      return res.status(404).json(errorResponse('Không tìm thấy chi nhánh thư viện này'));
    }

    if (!name || !name.trim()) {
      return res.status(400).json(errorResponse('Tên chi nhánh không được để trống'));
    }

    branch.name = name.trim();
    if (status) {
      branch.status = status;
    }

    res.json(successResponse(branch));
  });

  app.patch('/api/branches/:id/status', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const { id } = req.params;
    const { status } = req.body;

    const branch = mockBranches.find(b => b.id === id && b.tenantId === tenantId);
    if (!branch) {
      return res.status(404).json(errorResponse('Không tìm thấy chi nhánh thư viện này'));
    }

    if (status !== 'Active' && status !== 'Inactive') {
      return res.status(400).json(errorResponse('Trạng thái không hợp lệ'));
    }

    branch.status = status;
    res.json(successResponse(branch));
  });

  // --- MOCK CATALOG ENDPOINTS ---
  let mockBooks: any[] = [
    { id: 'book-1', isbn: '978-0132350884', title: 'Clean Code', author: 'Robert C. Martin', category: 'Software Engineering', totalCopies: 50, availableCopies: 45, tenantId: 'tenant-1', barcode: 'BAR-CLEAN-001', coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200&h=300' },
    { id: 'book-2', isbn: '978-0201633610', title: 'Design Patterns', author: 'Erich Gamma', category: 'Software Engineering', totalCopies: 20, availableCopies: 5, tenantId: 'tenant-1', barcode: 'BAR-DESIGN-002', coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200&h=300' },
    { id: 'book-3', isbn: '978-0134685991', title: 'Effective Java', author: 'Joshua Bloch', category: 'Programming', totalCopies: 30, availableCopies: 30, tenantId: 'tenant-1', barcode: 'BAR-JAVA-003', coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=200&h=300' },
    { id: 'book-4', isbn: '978-0131101630', title: 'The C Programming Language', author: 'Brian W. Kernighan', category: 'Programming', totalCopies: 10, availableCopies: 0, tenantId: 'tenant-1', barcode: 'BAR-C-004', coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=200&h=300' },
    
    // Seed Books for HCM (tenant-2)
    { id: 'book-1', isbn: '978-0132350884', title: 'Clean Code (HCM)', author: 'Robert C. Martin', category: 'Software Engineering', totalCopies: 15, availableCopies: 15, tenantId: 'tenant-2', barcode: 'HCM-BAR-CLEAN-001', coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200&h=300' },
    { id: 'book-2', isbn: '978-0201633610', title: 'Design Patterns (HCM)', author: 'Erich Gamma', category: 'Software Engineering', totalCopies: 10, availableCopies: 10, tenantId: 'tenant-2', barcode: 'HCM-BAR-DESIGN-002', coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200&h=300' },
    { id: 'book-3', isbn: '978-0134685991', title: 'Effective Java (HCM)', author: 'Joshua Bloch', category: 'Programming', totalCopies: 25, availableCopies: 25, tenantId: 'tenant-2', barcode: 'HCM-BAR-JAVA-003', coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=200&h=300' },
    { id: 'book-4', isbn: '978-0131101630', title: 'The C Programming Language (HCM)', author: 'Brian W. Kernighan', category: 'Programming', totalCopies: 5, availableCopies: 0, tenantId: 'tenant-2', barcode: 'HCM-BAR-C-004', coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=200&h=300' }
  ];

  let mockLoans: any[] = [
    { id: 'loan-1', bookId: 'book-1', bookTitle: 'Clean Code', userId: 'U002', userName: 'John Doe', checkoutDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: 'Active', tenantId: 'tenant-1' },
    { id: 'loan-2', bookId: 'book-2', bookTitle: 'Design Patterns', userId: 'U003', userName: 'Jane Smith', checkoutDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), status: 'Overdue', tenantId: 'tenant-1' },
    { id: 'loan-overdue-1', bookId: 'book-2', bookTitle: 'Design Patterns', userId: 'U002', userName: 'John Doe', checkoutDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Overdue', tenantId: 'tenant-1', finePaid: false },
    
    // Seed Loans for HCM (tenant-2)
    { id: 'loan-hcm-1', bookId: 'book-1', bookTitle: 'Clean Code (HCM)', userId: 'U002', userName: 'John Doe HCM', checkoutDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: 'Active', tenantId: 'tenant-2' },
    { id: 'loan-hcm-2', bookId: 'book-2', bookTitle: 'Design Patterns (HCM)', userId: 'U003', userName: 'Jane Smith HCM', checkoutDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), status: 'Overdue', tenantId: 'tenant-2' },
    { id: 'loan-overdue-2', bookId: 'book-2', bookTitle: 'Design Patterns (HCM)', userId: 'U002', userName: 'John Doe HCM', checkoutDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Overdue', tenantId: 'tenant-2', finePaid: false }
  ];

  app.get('/api/books', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    res.json(successResponse(mockBooks.filter(b => b.tenantId === tenantId)));
  });

  app.get('/api/books/search', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const q = (req.query.q || req.query.query)?.toString().toLowerCase() || '';
    
    const tenantBooks = mockBooks.filter(b => b.tenantId === tenantId);
    if (!q) {
      return res.json(successResponse(tenantBooks));
    }
    
    const filtered = tenantBooks.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) ||
      b.isbn.toString().toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
    res.json(successResponse(filtered));
  });

  app.post('/api/ai/search', (req, res) => {
    const { query } = req.body;
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';

    const tenantBooks = mockBooks.filter(b => b.tenantId === tenantId);
    
    setTimeout(() => {
      if (tenantBooks.length === 0) {
        return res.json(successResponse([]));
      }
      
      const q = (query || '').toLowerCase();
      let matchedBook = tenantBooks.find(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q) || 
        b.category.toLowerCase().includes(q)
      );
      
      if (!matchedBook) {
        matchedBook = tenantBooks[0];
      }

      res.json(successResponse([
        { 
          book: matchedBook,
          matchReason: `Tìm kiếm thông minh (Semantic) khớp cao với truy vấn "${query}". Sách giới thiệu các kiến thức nền tảng, bài học thực tế giúp tối ưu học tập và nghiên cứu.`,
          confidence: 0.95
        }
      ]));
    }, 1500);
  });

  app.get('/api/books/:id', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const book = mockBooks.find(b => b.id === req.params.id && b.tenantId === tenantId);
    if (!book) {
      return res.status(404).json(errorResponse('Không tìm thấy sách trong hệ thống'));
    }
    res.json(successResponse(book));
  });

  app.post('/api/books', (req, res) => {
    const book = req.body;
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    
    // Validate duplicate ISBN in same tenant
    const hasDuplicateIsbn = mockBooks.some(b => b.isbn === book.isbn && b.tenantId === tenantId);
    if (hasDuplicateIsbn) {
      return res.status(400).json(errorResponse('Mã ISBN đã tồn tại trong hệ thống'));
    }

    // Manage barcode auto-generation and check uniqueness
    const targetBarcode = book.barcode ? book.barcode.trim() : 'BOOK-' + Date.now();
    const hasDuplicateBarcode = mockBooks.some(b => b.barcode === targetBarcode && b.tenantId === tenantId);
    if (hasDuplicateBarcode && book.barcode) {
      return res.status(400).json(errorResponse('Mã barcode/QR đã tồn tại trong hệ thống của thư viện này'));
    }

    const totalCopies = book.copies !== undefined ? Number(book.copies) : (book.totalCopies !== undefined ? Number(book.totalCopies) : 0);
    const availableCopies = book.availableCopies !== undefined ? Number(book.availableCopies) : totalCopies;

    if (totalCopies < 0 || availableCopies < 0) {
      return res.status(400).json(errorResponse('Số lượng sách không được phép nhỏ hơn 0'));
    }

    if (availableCopies > totalCopies) {
      return res.status(400).json(errorResponse('Số bản khả dụng không được lớn hơn tổng số bản'));
    }

    const newBook = { 
      id: 'book-' + Date.now(), 
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      publisher: book.publisher || '',
      shelf: book.shelf || '',
      description: book.description || '',
      coverUrl: book.coverUrl || '',
      totalCopies, 
      availableCopies,
      barcode: targetBarcode,
      tenantId 
    };
    
    mockBooks = [newBook, ...mockBooks];
    res.status(201).json(successResponse(newBook));
  });

  app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const bookData = req.body;
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';

    const bookIndex = mockBooks.findIndex(b => b.id === id && b.tenantId === tenantId);
    if (bookIndex === -1) {
      return res.status(404).json(errorResponse('Không tìm thấy sách cần cập nhật'));
    }

    // Validate duplicate ISBN excluding itself
    const hasDuplicateIsbn = mockBooks.some(b => b.isbn === bookData.isbn && b.id !== id && b.tenantId === tenantId);
    if (hasDuplicateIsbn) {
      return res.status(400).json(errorResponse('Mã ISBN đã tồn tại trong hệ thống'));
    }

    // Validate duplicate barcode excluding itself if barcode is submitted
    if (bookData.barcode) {
      const targetBarcode = bookData.barcode.trim();
      const hasDuplicateBarcode = mockBooks.some(b => b.barcode === targetBarcode && b.id !== id && b.tenantId === tenantId);
      if (hasDuplicateBarcode) {
        return res.status(400).json(errorResponse('Mã barcode/QR đã tồn tại trong hệ thống của thư viện này'));
      }
    }

    const currentBook = mockBooks[bookIndex];
    const nextTotalCopies = bookData.copies !== undefined ? Number(bookData.copies) : (bookData.totalCopies !== undefined ? Number(bookData.totalCopies) : currentBook.totalCopies);
    const nextAvailableCopies = bookData.availableCopies !== undefined ? Number(bookData.availableCopies) : currentBook.availableCopies;

    if (nextTotalCopies < 0 || nextAvailableCopies < 0) {
      return res.status(400).json(errorResponse('Số lượng sách không được phép nhỏ hơn 0'));
    }

    if (nextAvailableCopies > nextTotalCopies) {
      return res.status(400).json(errorResponse('Số bản khả dụng không được lớn hơn tổng số bản'));
    }

    const updatedBook = {
      ...currentBook,
      isbn: bookData.isbn !== undefined ? bookData.isbn : currentBook.isbn,
      title: bookData.title !== undefined ? bookData.title : currentBook.title,
      author: bookData.author !== undefined ? bookData.author : currentBook.author,
      category: bookData.category !== undefined ? bookData.category : currentBook.category,
      publisher: bookData.publisher !== undefined ? bookData.publisher : currentBook.publisher,
      shelf: bookData.shelf !== undefined ? bookData.shelf : currentBook.shelf,
      description: bookData.description !== undefined ? bookData.description : currentBook.description,
      coverUrl: bookData.coverUrl !== undefined ? bookData.coverUrl : currentBook.coverUrl,
      barcode: bookData.barcode !== undefined ? bookData.barcode.trim() : currentBook.barcode,
      totalCopies: nextTotalCopies,
      availableCopies: nextAvailableCopies
    };

    mockBooks[bookIndex] = updatedBook;
    res.json(successResponse(updatedBook));
  });

  app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    const book = mockBooks.find(b => b.id === id && b.tenantId === tenantId);
    if (!book) {
      return res.status(404).json(errorResponse('Không tìm thấy sách để xóa'));
    }

    // Check if there are active or overdue loans
    const hasActiveLoans = mockLoans.some(
      l => l.bookId === id && 
      (l.status === 'Active' || l.status === 'Overdue') && 
      l.tenantId === tenantId
    );

    if (hasActiveLoans) {
      return res.status(400).json(errorResponse('Không thể xóa sách đang có phiếu mượn'));
    }

    mockBooks = mockBooks.filter(b => !(b.id === id && b.tenantId === tenantId));
    res.json(successResponse({ message: 'Xóa sách thành công' }));
  });

  app.post('/api/ai/enrich-book', (req, res) => {
    const { isbn, title } = req.body;
    setTimeout(() => {
      res.json(successResponse({
        description: `This is an AI-generated description for the book: ${title || isbn}. It is widely recognized as a foundational text in its field, providing deep insights and standardized practices.`,
        suggestedCategories: ['Computer Science', 'Best Practices'],
        tags: ['programming', 'classic', 'reference'],
        coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200&h=300'
      }));
    }, 1500);
  });

  // Circulation endpoints
  app.get('/api/loans/active', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    
    const activeLoans = mockLoans.filter(l => 
      l.tenantId === tenantId && 
      (l.status === 'Active' || l.status === 'Overdue')
    );

    const mappedLoans = activeLoans.map(l => {
      const { fineAmount, overdueDays } = calculateLoanFine(l, tenantId);
      const isOverdue = overdueDays > 0;
      return {
        ...l,
        status: isOverdue ? 'Overdue' : 'Active',
        overdueDays,
        fineAmount,
        finePaid: l.finePaid !== undefined ? l.finePaid : false
      };
    });

    res.json(successResponse(mappedLoans));
  });

  app.get('/api/loans/unpaid-fines', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    const unpaidFineLoans = mockLoans.filter(l => 
      l.tenantId === tenantId &&
      l.status === 'Returned' &&
      l.finePaid !== true
    );

    const result = unpaidFineLoans.map(l => {
      const { fineAmount } = calculateLoanFine(l, tenantId);
      return {
        id: l.id,
        bookId: l.bookId,
        bookTitle: l.bookTitle,
        userId: l.userId,
        userName: l.userName,
        returnDate: l.returnDate || l.finePaidAt || new Date().toISOString(),
        dueDate: l.dueDate,
        fineAmount: l.fineAmount || fineAmount,
        finePaid: l.finePaid || false
      };
    }).filter(item => item.fineAmount > 0);

    res.json(successResponse(result));
  });

  app.post('/api/loans/check-out', (req, res) => {
    const { userId, copyId } = req.body;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    
    // 1. Lookup member by ID, memberCode, username, cardNumber, or libraryCardNumber WITHIN current tenant only
    const member = mockMembers.find(m => 
      (m.id === userId || 
       m.memberCode === userId || 
       m.username === userId || 
       m.cardNumber === userId || 
       m.libraryCardNumber === userId) && 
      m.tenantId === tenantId
    );
    if (!member) {
      return res.status(404).json(errorResponse('Không tìm thấy độc giả'));
    }

    if (member.status === 'Suspended') {
      return res.status(400).json(errorResponse('Thẻ độc giả hiện đã bị đình chỉ. Không thể mượn sách mới.'));
    }

    if (member.status === 'Inactive') {
      return res.status(400).json(errorResponse('Thẻ độc giả hiện đang ngừng hoạt động. Không thể mượn sách mới.'));
    }
    
    const actualUserId = member.id;
    const actualUserName = member.fullName;

    // 2. Find book by copyId, ISBN, or barcode WITHIN current tenant only
    const book = mockBooks.find(b => 
      (b.id === copyId || 
       b.isbn === copyId || 
       b.barcode === copyId) && 
      b.tenantId === tenantId
    );
    if (!book) {
      return res.status(404).json(errorResponse('Không tìm thấy sách trong hệ thống'));
    }
    
    // 3. Check availability
    if (book.availableCopies === undefined || book.availableCopies === null || book.availableCopies <= 0) {
      return res.status(400).json(errorResponse('Sách này hiện không còn bản khả dụng'));
    }

    // Check duplicate borrowing in current tenant
    const hasActiveBorrow = mockLoans.some(l => 
      l.bookId === book.id && 
      l.userId === actualUserId && 
      l.tenantId === tenantId && 
      (l.status === 'Active' || l.status === 'Overdue')
    );
    if (hasActiveBorrow) {
      return res.status(400).json(errorResponse('Độc giả này đang mượn sách này, không thể mượn trùng'));
    }

    const policy = getPolicyByTenant(tenantId);
    const maxItemsPerMember = Number(policy.circulation?.maxItemsPerMember) !== undefined ? Number(policy.circulation.maxItemsPerMember) : 5;

    // Count Active or Overdue loans under the correct tenant for this user/member
    const activeLoansCount = mockLoans.filter(l => 
      l.userId === actualUserId && 
      l.tenantId === tenantId && 
      (l.status === 'Active' || l.status === 'Overdue')
    ).length;

    if (activeLoansCount >= maxItemsPerMember) {
      return res.status(400).json(errorResponse('Độc giả đã đạt số sách mượn tối đa theo chính sách'));
    }

    // 4. Decrease copies safely
    book.availableCopies -= 1;
    
    const maxDaysToBorrow = Number(policy.circulation?.maxDaysToBorrow) !== undefined ? Number(policy.circulation.maxDaysToBorrow) : 14;

    const newLoan = {
      id: 'loan-' + Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      userId: actualUserId,
      userName: actualUserName,
      checkoutDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + maxDaysToBorrow * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
      tenantId
    };
    
    mockLoans = [newLoan, ...mockLoans];
    res.status(201).json(successResponse(newLoan));
  });

  app.post('/api/loans/check-in', (req, res) => {
    const { copyId, userId } = req.body;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    
    // 1. If userId is provided, lookup member WITHIN current tenant only
    let resolvedMember = null;
    if (userId) {
      resolvedMember = mockMembers.find(m => 
        (m.id === userId || 
         m.memberCode === userId || 
         m.username === userId || 
         m.cardNumber === userId || 
         m.libraryCardNumber === userId) && 
        m.tenantId === tenantId
      );
      if (!resolvedMember) {
        return res.status(404).json(errorResponse('Không tìm thấy độc giả'));
      }
    }

    // Direct checkout ID check in current tenant:
    const directLoan = mockLoans.find(l => l.id === copyId);
    if (directLoan && directLoan.tenantId !== tenantId) {
      return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn'));
    }

    // Find the book, if check-in by ISBN/ID/barcode in current tenant:
    const book = mockBooks.find(b => 
      (b.id === copyId || 
       b.isbn === copyId || 
       b.barcode === copyId) && 
      b.tenantId === tenantId
    );

    if (!book && !directLoan) {
      return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn hoặc sách cần trả'));
    }

    // Case A: The user scanned or entered a Direct Loan ID (directLoan exists):
    if (directLoan) {
      // 1. If userId (resolvedMember) was provided, verify ownership
      if (resolvedMember && directLoan.userId !== resolvedMember.id) {
        return res.status(400).json(errorResponse('Phiếu mượn không thuộc độc giả này'));
      }

      // 2. Already returned?
      if (directLoan.status === 'Returned') {
        return res.status(400).json(errorResponse('Phiếu mượn này đã được trả trước đó'));
      }

      // 3. Confirm it's Active or Overdue
      if (directLoan.status !== 'Active' && directLoan.status !== 'Overdue') {
        return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn'));
      }

      const isOverdue = new Date(directLoan.dueDate) < new Date();
      let fineAmount = 0;
      let alertMessage = null;
      if (isOverdue) {
        const { fineAmount: computedFine, overdueDays } = calculateLoanFine(directLoan, tenantId);
        fineAmount = computedFine;
      }

      // Mark returned
      directLoan.status = 'Returned';
      (directLoan as any).returnDate = new Date().toISOString();

      const targetBook = mockBooks.find(b => b.id === directLoan.bookId && b.tenantId === tenantId);
      if (targetBook) {
        targetBook.availableCopies = Math.min(targetBook.totalCopies, (targetBook.availableCopies || 0) + 1);
      }

      if (isOverdue) {
        directLoan.fineAmount = fineAmount;
        if (directLoan.finePaid === undefined) {
          directLoan.finePaid = false;
        }
        if (!directLoan.finePaid) {
          alertMessage = 'Sách đã quá hạn, vui lòng thanh toán phạt';
        }
      }

      return res.json(successResponse({
        loan: directLoan,
        fine: fineAmount,
        message: alertMessage
      }));
    }

    // Case B: The user scanned/entered a bookId or ISBN (directLoan does not exist, but book exists):
    if (book) {
      // Find all active/overdue loans for this book in this tenant
      let activeBookLoans = mockLoans.filter(l => 
        l.bookId === book.id && 
        l.tenantId === tenantId && 
        (l.status === 'Active' || l.status === 'Overdue')
      );

      // If userId is provided, filter them
      if (resolvedMember) {
        activeBookLoans = activeBookLoans.filter(l => l.userId === resolvedMember.id);
      }

      // If there are no active loans
      if (activeBookLoans.length === 0) {
        // Let's check if there were historical loans to see if they're already returned
        let allBookLoans = mockLoans.filter(l => l.bookId === book.id && l.tenantId === tenantId);
        if (resolvedMember) {
          allBookLoans = allBookLoans.filter(l => l.userId === resolvedMember.id);
        }

        if (allBookLoans.length > 0 && allBookLoans.every(l => l.status === 'Returned')) {
          return res.status(400).json(errorResponse('Phiếu mượn này đã được trả trước đó'));
        }
        return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn đang hoạt động cho sách này'));
      }

      // If more than 1 active loan exists
      if (activeBookLoans.length > 1) {
        return res.status(400).json(errorResponse('Có nhiều phiếu mượn cho sách này, vui lòng nhập mã phiếu mượn hoặc nhập thêm mã độc giả'));
      }

      const selectedActiveLoan = activeBookLoans[0];
      const isOverdue = new Date(selectedActiveLoan.dueDate) < new Date();
      let fineAmount = 0;
      let alertMessage = null;
      if (isOverdue) {
        const { fineAmount: computedFine, overdueDays } = calculateLoanFine(selectedActiveLoan, tenantId);
        fineAmount = computedFine;
      }

      selectedActiveLoan.status = 'Returned';
      (selectedActiveLoan as any).returnDate = new Date().toISOString();

      book.availableCopies = Math.min(book.totalCopies, (book.availableCopies || 0) + 1);

      if (isOverdue) {
        selectedActiveLoan.fineAmount = fineAmount;
        if (selectedActiveLoan.finePaid === undefined) {
          selectedActiveLoan.finePaid = false;
        }
        if (!selectedActiveLoan.finePaid) {
          alertMessage = 'Sách đã quá hạn, vui lòng thanh toán phạt';
        }
      }

      return res.json(successResponse({
        loan: selectedActiveLoan,
        fine: fineAmount,
        message: alertMessage
      }));
    }

    return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn hoặc sách cần trả'));
  });

  // Renew loan
  app.post('/api/loans/renew', (req, res) => {
    const { loanId } = req.body;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    const targetLoan = mockLoans.find(l => l.id === loanId && l.tenantId === tenantId);
    
    if (!targetLoan) {
      return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn'));
    }

    if (targetLoan.status === 'Returned') {
      return res.status(400).json(errorResponse('Không thể gia hạn phiếu mượn đã trả'));
    }
    
    const policy = getPolicyByTenant(tenantId);
    const maxDaysToBorrow = Number(policy.circulation?.maxDaysToBorrow) !== undefined ? Number(policy.circulation.maxDaysToBorrow) : 14;
    const maxRenewals = Number(policy.circulation?.maxRenewals) !== undefined ? Number(policy.circulation.maxRenewals) : 1;

    const renewalCount = targetLoan.renewalCount !== undefined ? Number(targetLoan.renewalCount) : 0;
    if (renewalCount >= maxRenewals) {
      return res.status(400).json(errorResponse('Phiếu mượn đã đạt số lần gia hạn tối đa'));
    }

    // Add maxDaysToBorrow days
    const currentDueDate = new Date(targetLoan.dueDate);
    targetLoan.dueDate = new Date(currentDueDate.getTime() + maxDaysToBorrow * 24 * 60 * 60 * 1000).toISOString();
    targetLoan.renewalCount = renewalCount + 1;
    
    res.json(successResponse(targetLoan));
  });

  // Holds
  let mockHolds = [
    { id: 'hold-seed-1', userId: 'U002', bookId: 'book-2', bookTitle: 'Design Patterns', status: 'Pending', createdAt: new Date(Date.now() - 172800000).toISOString(), tenantId: 'tenant-1' }
  ];
  app.post('/api/holds', (req, res) => {
    const { userId, bookId } = req.body;
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';

    // Lookup member WITHIN CURRENT TENANT ONLY
    const member = mockMembers.find(m => 
      (m.id === userId || 
       m.memberCode === userId || 
       m.username === userId || 
       m.cardNumber === userId || 
       m.libraryCardNumber === userId) && 
      m.tenantId === tenantId
    );
    
    if (!member) {
      return res.status(404).json(errorResponse('Không tìm thấy thông tin độc giả trong hệ thống. Vui lòng kiểm tra lại mã thẻ.'));
    }

    if (member.status === 'Suspended') {
      return res.status(403).json(errorResponse('Độc giả không thể đặt giữ sách vì thẻ hiện đang bị đình chỉ.'));
    }

    if (member.status === 'Inactive') {
      return res.status(403).json(errorResponse('Độc giả không thể đặt giữ sách vì thẻ hiện đang ngừng hoạt động.'));
    }
    
    const actualUserId = member.id;

    // Lookup book WITHIN CURRENT TENANT ONLY
    const book = mockBooks.find(b => 
      (b.id === bookId || 
       b.isbn === bookId || 
       b.barcode === bookId) && 
      b.tenantId === tenantId
    );
    if (!book) {
      return res.status(404).json(errorResponse('Tài liệu/sách cần đặt giữ không tồn tại trong hệ thống. Vui lòng kiểm tra lại.'));
    }

    // Check if duplicate hold exists under current tenant
    const duplicateHold = mockHolds.find(h => h.userId === actualUserId && h.bookId === book.id && h.status === 'Pending' && h.tenantId === tenantId);
    if (duplicateHold) {
      return res.status(400).json(errorResponse('Độc giả này đã đặt giữ sách này rồi và yêu cầu hiện vẫn đang trong trạng thái chờ xử lý (Pending).'));
    }

    if (book.availableCopies > 0) {
      return res.status(400).json(errorResponse('Sách vẫn còn bản khả dụng trong kho, vui lòng mượn sách trực tiếp thay vì đặt giữ.'));
    }

    const newHold = {
      id: 'hold-' + Date.now(),
      userId: actualUserId,
      bookId: book.id,
      bookTitle: book.title,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      tenantId
    };
    
    mockHolds.push(newHold);
    res.status(201).json(successResponse(newHold));
  });

  app.get('/api/holds/active', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    res.json(successResponse(mockHolds.filter(h => h.tenantId === tenantId && h.status === 'Pending')));
  });

  app.post('/api/holds/fulfill', (req, res) => {
    const { holdId } = req.body;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    const hold = mockHolds.find(h => h.id === holdId && h.tenantId === tenantId && h.status === 'Pending');
    if (!hold) {
      return res.status(404).json(errorResponse('Không tìm thấy yêu cầu đặt giữ hợp lệ'));
    }

    const book = mockBooks.find(b => b.id === hold.bookId && b.tenantId === tenantId);
    if (!book) {
      return res.status(404).json(errorResponse('Không tìm thấy tài liệu trong hệ thống'));
    }

    const member = mockMembers.find(m => (m.id === hold.userId || m.memberCode === hold.userId) && m.tenantId === tenantId);
    if (!member) {
      return res.status(404).json(errorResponse('Không tìm thấy thông tin độc giả trong hệ thống'));
    }

    if (member.status === 'Suspended') {
      return res.status(403).json(errorResponse('Cảnh báo: Độc giả hiện đang bị khóa/đình chỉ thẻ.'));
    }

    if (member.status === 'Inactive') {
      return res.status(403).json(errorResponse('Cảnh báo: Độc giả hiện đang ngừng hoạt động.'));
    }

    const policy = getPolicyByTenant(tenantId);
    const maxItemsPerMember = Number(policy.circulation?.maxItemsPerMember) !== undefined ? Number(policy.circulation.maxItemsPerMember) : 5;
    
    const activeLoansCount = mockLoans.filter(l => 
      (l.userId === member.id || l.userId === member.memberCode) && 
      l.tenantId === tenantId && 
      (l.status === 'Active' || l.status === 'Overdue')
    ).length;

    if (activeLoansCount >= maxItemsPerMember) {
      return res.status(400).json(errorResponse('Độc giả đã đạt số sách mượn tối đa theo chính sách'));
    }

    const alreadyBorrowed = mockLoans.some(l => 
      (l.userId === member.id || l.userId === member.memberCode) && 
      l.bookId === book.id && 
      l.tenantId === tenantId && 
      (l.status === 'Active' || l.status === 'Overdue')
    );
    if (alreadyBorrowed) {
      return res.status(400).json(errorResponse('Độc giả này đang mượn sách này, không thể mượn trùng'));
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json(errorResponse('Sách hiện chưa có sẵn để giao.'));
    }

    book.availableCopies -= 1;
    hold.status = 'Fulfilled';

    const maxDaysToBorrow = Number(policy.circulation?.maxDaysToBorrow) !== undefined ? Number(policy.circulation.maxDaysToBorrow) : 14;

    const newLoan = {
      id: 'loan-' + Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      userId: member.id,
      userName: member.fullName,
      checkoutDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + maxDaysToBorrow * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
      tenantId: tenantId,
      renewalCount: 0
    };
    mockLoans = [newLoan, ...mockLoans];
    
    res.json(successResponse(newLoan));
  });

  app.post('/api/loans/:loanId/renew', (req, res) => {
    const { loanId } = req.params;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    const targetLoan = mockLoans.find(l => l.id === loanId && l.tenantId === tenantId);
    
    if (!targetLoan) {
      return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn'));
    }

    if (targetLoan.status === 'Returned') {
      return res.status(400).json(errorResponse('Không thể gia hạn phiếu mượn đã trả'));
    }
    
    const policy = getPolicyByTenant(tenantId);
    const maxDaysToBorrow = Number(policy.circulation?.maxDaysToBorrow) !== undefined ? Number(policy.circulation.maxDaysToBorrow) : 14;
    const maxRenewals = Number(policy.circulation?.maxRenewals) !== undefined ? Number(policy.circulation.maxRenewals) : 1;

    const renewalCount = targetLoan.renewalCount !== undefined ? Number(targetLoan.renewalCount) : 0;
    if (renewalCount >= maxRenewals) {
      return res.status(400).json(errorResponse('Phiếu mượn đã đạt số lần gia hạn tối đa'));
    }

    // Add maxDaysToBorrow days
    const currentDueDate = new Date(targetLoan.dueDate);
    targetLoan.dueDate = new Date(currentDueDate.getTime() + maxDaysToBorrow * 24 * 60 * 60 * 1000).toISOString();
    targetLoan.renewalCount = renewalCount + 1;
    
    res.json(successResponse(targetLoan));
  });

  app.get('/api/member/loans', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      return res.status(401).json(errorResponse('error.auth.unauthorized'));
    }

    const currentMemberId = currentUser.role === 'Member' 
      ? currentUser.username 
      : ((currentUser as any).memberId || currentUser.username || currentUser.id);

    // Lọc danh sách mockLoans thuộc tenantId và thuộc member này
    const memberLoans = mockLoans.filter(l => 
      l.tenantId === tenantId && 
      (l.userId === currentMemberId || l.userId === currentUser.id || (l.userId === 'U002' && currentUser.username === 'U002'))
    );

    const result = memberLoans.map(l => {
      const book = mockBooks.find(b => b.id === l.bookId && b.tenantId === tenantId);
      const isOverdue = l.status !== 'Returned' && new Date(l.dueDate) < new Date();
      const { fineAmount: computedFineAmount, overdueDays } = calculateLoanFine(l, tenantId);
      
      return {
        id: l.id,
        loanId: l.id,
        bookId: l.bookId,
        bookTitle: l.bookTitle || (book ? book.title : ''),
        author: book ? book.author : '',
        isbn: book ? book.isbn : '',
        checkoutDate: l.checkoutDate,
        borrowDate: l.checkoutDate,
        borrowedAt: l.checkoutDate,
        dueDate: l.dueDate,
        returnedAt: (l as any).returnDate,
        returnDate: (l as any).returnDate,
        status: isOverdue ? 'Overdue' : l.status,
        overdueDays,
        fineAmount: computedFineAmount,
        finePaid: l.finePaid === true,
        finePaidAt: l.finePaidAt || null,
        paymentMethod: l.paymentMethod || null,
        coverUrl: book ? book.coverUrl : null
      };
    });

    res.json(successResponse(result));
  });

  app.post('/api/member/fines/:loanId/pay', (req, res) => {
    const { loanId } = req.params;
    const { paymentMethod } = req.body;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json(errorResponse('error.auth.unauthorized'));
    }

    const targetLoan = mockLoans.find(l => l.id === loanId && l.tenantId === tenantId);
    if (!targetLoan) {
      return res.status(404).json(errorResponse('Không tìm thấy phiếu mượn'));
    }

    const currentMemberId = currentUser.role === 'Member' 
      ? currentUser.username 
      : ((currentUser as any).memberId || currentUser.username || currentUser.id);

    const isOwner = targetLoan.userId === currentMemberId || 
                    targetLoan.userId === currentUser.id || 
                    (targetLoan.userId === 'U002' && currentUser.username === 'U002');
    const isStaff = currentUser.role === 'TenantAdmin' || 
                    currentUser.role === 'Librarian' || 
                    currentUser.role === 'SuperAdmin';

    if (!isOwner && !isStaff) {
      return res.status(403).json(errorResponse('Bạn không có quyền thanh toán cho phiếu mượn này'));
    }

    // Tính toán số tiền phạt
    const isOverdue = targetLoan.status !== 'Returned' && new Date(targetLoan.dueDate) < new Date();
    const { fineAmount: currentFineAmount, overdueDays } = calculateLoanFine(targetLoan, tenantId);

    if (currentFineAmount <= 0) {
      return res.status(400).json(errorResponse('Phiếu mượn này không có tiền phạt'));
    }

    if (targetLoan.finePaid === true) {
      return res.status(400).json(errorResponse('Tiền phạt đã được thanh toán'));
    }

    // Đánh dấu thanh toán thành công
    targetLoan.finePaid = true;
    targetLoan.finePaidAt = new Date().toISOString();
    targetLoan.paymentMethod = paymentMethod || 'demo';
    targetLoan.fineAmount = currentFineAmount; // Chốt số tiền phạt đã trả

    res.json(successResponse({
      id: targetLoan.id,
      loanId: targetLoan.id,
      finePaid: true,
      finePaidAt: targetLoan.finePaidAt,
      paymentMethod: targetLoan.paymentMethod,
      fineAmount: targetLoan.fineAmount
    }));
  });

  app.get('/api/member/holds', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      return res.status(401).json(errorResponse('error.auth.unauthorized'));
    }

    const currentMemberId = currentUser.role === 'Member' 
      ? currentUser.username 
      : ((currentUser as any).memberId || currentUser.username || currentUser.id);

    const memberHolds = mockHolds.filter(h => 
      h.tenantId === tenantId && 
      (h.userId === currentMemberId || h.userId === currentUser.id || (h.userId === 'U002' && currentUser.username === 'U002'))
    );

    const result = memberHolds.map(h => {
      const book = mockBooks.find(b => b.id === h.bookId && b.tenantId === tenantId);
      const availableCopies = book ? book.availableCopies : 0;
      const isReadyForPickup = h.status === 'Pending' && availableCopies > 0;
      return {
        id: h.id,
        bookTitle: h.bookTitle || (book ? book.title : ''),
        author: book ? book.author : '',
        isbn: book ? book.isbn : '',
        coverUrl: book ? book.coverUrl : null,
        status: h.status,
        queuePosition: h.status === 'Pending' ? 1 : 0,
        holdDate: h.createdAt || new Date().toISOString(),
        expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        availableCopies,
        isReadyForPickup
      };
    });

    res.json(successResponse(result));
  });

  app.get('/api/member/profile', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const currentUser = getCurrentUser(req);
    if (!currentUser) return res.status(401).json(errorResponse('error.auth.unauthorized'));

    const currentMemberId = currentUser.role === 'Member' 
      ? currentUser.username 
      : ((currentUser as any).memberId || currentUser.username || currentUser.id);

    const member = mockMembers.find(m => (m.id === currentMemberId || m.memberCode === currentMemberId) && m.tenantId === tenantId);
    if (!member) return res.status(404).json(errorResponse('member.not_found'));
    res.json(successResponse(member));
  });

  app.post('/api/member/holds', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      return res.status(401).json(errorResponse('error.auth.unauthorized'));
    }

    if (currentUser.role !== 'Member') {
      return res.status(403).json(errorResponse('Chỉ độc giả (Member) được phép đặt giữ sách'));
    }

    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json(errorResponse('Thiếu thông tin bookId'));
    }

    const currentMemberId = currentUser.role === 'Member' 
      ? currentUser.username 
      : ((currentUser as any).memberId || currentUser.username || currentUser.id);

    const member = mockMembers.find(m => (m.id === currentMemberId || m.memberCode === currentMemberId) && m.tenantId === tenantId);
    if (!member) {
      return res.status(404).json(errorResponse('Không tìm thấy thông tin độc giả trong hệ thống.'));
    }

    if (member.status === 'Suspended') {
      return res.status(403).json(errorResponse('Bạn không thể đặt giữ sách vì tài khoản đang bị đình chỉ.'));
    }

    if (member.status === 'Inactive') {
      return res.status(403).json(errorResponse('Bạn không thể đặt giữ sách vì tài khoản đang ngừng hoạt động.'));
    }

    const book = mockBooks.find(b => (b.id === bookId || b.isbn === bookId || b.barcode === bookId) && b.tenantId === tenantId);
    if (!book) {
      return res.status(404).json(errorResponse('Sách không tồn tại trong hệ thống.'));
    }

    if (book.availableCopies > 0) {
      return res.status(400).json(errorResponse('Sách hiện còn bản khả dụng, vui lòng đến quầy thư viện để mượn trực tiếp'));
    }

    const duplicateHold = mockHolds.find(h => 
      (h.userId === member.id || h.userId === member.memberCode) && 
      (h.bookId === book.id || h.bookId === book.isbn) && 
      h.status === 'Pending' && 
      h.tenantId === tenantId
    );
    if (duplicateHold) {
      return res.status(400).json(errorResponse('Bạn đã đặt giữ sách này rồi'));
    }

    const policy = getPolicyByTenant(tenantId);
    const maxHolds = policy?.holds?.maxHoldsPerMember || 3;

    const activeMemberHoldsCount = mockHolds.filter(h => 
      h.tenantId === tenantId && 
      (h.userId === member.id || h.userId === member.memberCode) && 
      h.status === 'Pending'
    ).length;

    if (activeMemberHoldsCount >= maxHolds) {
      return res.status(400).json(errorResponse('Bạn đã đạt số lượt đặt giữ tối đa theo chính sách'));
    }

    const holdExpirationDays = policy?.holds?.holdExpirationDays || 3;
    const newHold = {
      id: 'hold-' + Date.now(),
      userId: member.id,
      bookId: book.id,
      bookTitle: book.title,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      tenantId,
      expiryDate: new Date(Date.now() + holdExpirationDays * 24 * 60 * 60 * 1000).toISOString()
    };

    mockHolds.push(newHold);
    res.status(201).json(successResponse(newHold));
  });

  // Members
  type MockMember = {
    id: string;
    memberCode: string;
    fullName: string;
    email: string;
    phone: string;
    memberType: string;
    status: string;
    joinDate: string;
    expiryDate: string;
    tenantId: string;
    username?: string;
    cardNumber?: string;
    libraryCardNumber?: string;
  };

  let mockMembers: MockMember[] = [
    { id: 'U001', memberCode: 'U001', fullName: 'System Admin', email: 'admin@system.local', phone: '0123456789', memberType: 'Staff', status: 'Active', joinDate: new Date('2025-01-01').toISOString(), expiryDate: new Date('2030-01-01').toISOString(), tenantId: 'tenant-1', username: 'U001', cardNumber: 'U001', libraryCardNumber: 'U001' },
    { id: 'librarian', memberCode: 'librarian', fullName: 'Librarian Staff', email: 'librarian@system.local', phone: '0987111222', memberType: 'Staff', status: 'Active', joinDate: new Date('2025-01-05').toISOString(), expiryDate: new Date('2030-01-05').toISOString(), tenantId: 'tenant-1', username: 'librarian', cardNumber: 'librarian', libraryCardNumber: 'librarian' },
    { id: 'U002', memberCode: 'U002', fullName: 'John Doe', email: 'john@example.com', phone: '0987654321', memberType: 'Student', status: 'Active', joinDate: new Date('2025-02-15').toISOString(), expiryDate: new Date('2026-02-15').toISOString(), tenantId: 'tenant-1', username: 'U002', cardNumber: 'U002', libraryCardNumber: 'U002' },
    { id: 'U003', memberCode: 'U003', fullName: 'Jane Smith', email: 'jane@example.com', phone: '0912345678', memberType: 'Teacher', status: 'Active', joinDate: new Date('2025-01-20').toISOString(), expiryDate: new Date('2027-01-20').toISOString(), tenantId: 'tenant-1', username: 'U003', cardNumber: 'U003', libraryCardNumber: 'U003' },
    
    // Seed Members for HCM (tenant-2)
    { id: 'U001', memberCode: 'U001', fullName: 'System Admin HCM', email: 'admin_hcm@system.local', phone: '0123456789', memberType: 'Staff', status: 'Active', joinDate: new Date('2025-01-01').toISOString(), expiryDate: new Date('2030-01-01').toISOString(), tenantId: 'tenant-2', username: 'U001', cardNumber: 'U001', libraryCardNumber: 'U001' },
    { id: 'librarian_hcm', memberCode: 'librarian_hcm', fullName: 'Librarian HCM', email: 'staff_hcm@system.local', phone: '0987111222', memberType: 'Staff', status: 'Active', joinDate: new Date('2025-01-05').toISOString(), expiryDate: new Date('2030-01-05').toISOString(), tenantId: 'tenant-2', username: 'librarian_hcm', cardNumber: 'librarian_hcm', libraryCardNumber: 'librarian_hcm' },
    { id: 'U002', memberCode: 'U002', fullName: 'John Doe HCM', email: 'john_hcm@example.com', phone: '0987654321', memberType: 'Student', status: 'Active', joinDate: new Date('2025-02-15').toISOString(), expiryDate: new Date('2026-02-15').toISOString(), tenantId: 'tenant-2', username: 'U002', cardNumber: 'U002', libraryCardNumber: 'U002' },
    { id: 'U003', memberCode: 'U003', fullName: 'Jane Smith HCM', email: 'jane_hcm@example.com', phone: '0912345678', memberType: 'Teacher', status: 'Active', joinDate: new Date('2025-01-20').toISOString(), expiryDate: new Date('2027-01-20').toISOString(), tenantId: 'tenant-2', username: 'U003', cardNumber: 'U003', libraryCardNumber: 'U003' }
  ];

  app.get('/api/members', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const search = req.query.search?.toString().toLowerCase() || '';

    let result = mockMembers.filter(m => m.tenantId === tenantId);
    if (search) {
      result = result.filter(m => m.fullName.toLowerCase().includes(search) || m.memberCode.toLowerCase().includes(search) || m.email.toLowerCase().includes(search));
    }
    res.json(successResponse(result));
  });

  app.post('/api/members', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const { memberCode, fullName, email, phone, memberType, status, expiryDate, cardNumber, libraryCardNumber, username } = req.body;
    
    if (mockMembers.some(m => m.memberCode === memberCode)) {
      return res.status(400).json(errorResponse('member.create.duplicate_code', [{field: 'memberCode', code: 'duplicate'}]));
    }

    const nextCardNumber = cardNumber || memberCode;
    const nextLibraryCardNumber = libraryCardNumber || memberCode;
    const nextUsername = username || memberCode;

    const newMember: MockMember = {
      id: 'member-' + Date.now(),
      memberCode,
      fullName,
      email,
      phone,
      memberType,
      status,
      joinDate: new Date().toISOString(),
      expiryDate,
      tenantId,
      cardNumber: nextCardNumber,
      libraryCardNumber: nextLibraryCardNumber,
      username: nextUsername
    };
    mockMembers.push(newMember);

    // Synchronize to Mock User Directory
    const newUser = {
      id: 'u-' + newMember.id,
      username: memberCode,
      email: email || `${memberCode.toLowerCase()}@lib.vn`,
      role: 'Member',
      status: status === 'Active' ? 'Active' : 'Inactive',
      tenantId
    };
    mockUsers.push(newUser);

    res.status(201).json(successResponse(newMember));
  });

  app.get('/api/members/:id', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const member = mockMembers.find(m => m.id === req.params.id && m.tenantId === tenantId);
    if (!member) return res.status(404).json(errorResponse('member.not_found'));
    res.json(successResponse(member));
  });

  app.put('/api/members/:id', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'];
    const tenantId = tenantCode === 'hq' ? 'tenant-1' : 'tenant-2';
    const index = mockMembers.findIndex(m => m.id === req.params.id && m.tenantId === tenantId);
    if (index === -1) return res.status(404).json(errorResponse('member.not_found'));
    
    const oldMember = mockMembers[index];
    mockMembers[index] = { ...mockMembers[index], ...req.body };
    const updatedMember = mockMembers[index];

    // Synchronize updates to Mock User Directory
    const userIndex = mockUsers.findIndex(u => 
      u.id === 'u-' + updatedMember.id || 
      u.username === oldMember.memberCode ||
      (oldMember.memberCode === 'U001' && u.username === 'admin')
    );
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        username: updatedMember.memberCode,
        email: updatedMember.email || mockUsers[userIndex].email,
        status: updatedMember.status === 'Active' ? 'Active' : 'Inactive'
      };
    } else {
      mockUsers.push({
        id: 'u-' + updatedMember.id,
        username: updatedMember.memberCode,
        email: updatedMember.email || `${updatedMember.memberCode.toLowerCase()}@lib.vn`,
        role: 'Member',
        status: updatedMember.status === 'Active' ? 'Active' : 'Inactive',
        tenantId: updatedMember.tenantId
      });
    }

    res.json(successResponse(mockMembers[index]));
  });

  app.get('/api/members/:id/history', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const memberLoans = mockLoans.filter(l => l.userId === req.params.id && l.tenantId === tenantId);
    const history: any[] = [];
    
    // For loans that were created, show checkout
    memberLoans.forEach(loan => {
      let currentStatus = loan.status;
      if (currentStatus === 'Active' && new Date(loan.dueDate) < new Date()) {
        currentStatus = 'Overdue';
      }

      history.push({
        id: `hist-out-${loan.id}`,
        memberId: req.params.id,
        action: 'checkout',
        bookTitle: loan.bookTitle,
        status: currentStatus, // Sending status: 'Active', 'Overdue', 'Returned'
        timestamp: loan.checkoutDate
      });
      // For loans that were returned, show return as a separate line if needed, but the prompt says 
      // "lịch sử mượn có hiện thị thêm tình hình sách, ví dụ: nếu mượn quá hạn chưa trả thì trong lịch sử mượn của độc giả đó có thêm thông tin 'quá hạn' thay vì chỉ có 'đang mượn' thôi."
      // Let's also include the return action as requested.
      if (loan.status === 'Returned' && (loan as any).returnDate) {
        history.push({
          id: `hist-in-${loan.id}`,
          memberId: req.params.id,
          action: 'return',
          bookTitle: loan.bookTitle,
          status: 'Returned',
          timestamp: (loan as any).returnDate
        });
      }
    });
    
    // Add default initial history if they have none, for flavor
    if (history.length === 0) {
      history.push({ id: 'hist-1', memberId: req.params.id, action: 'checkout', bookTitle: 'Clean Code', status: 'Returned', timestamp: new Date(Date.now() - 100000000).toISOString() });
      history.push({ id: 'hist-2', memberId: req.params.id, action: 'return', bookTitle: 'Clean Code', status: 'Returned', timestamp: new Date(Date.now() - 50000000).toISOString() });
    }

    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(successResponse(history));
  });

  app.get('/api/members/:id/insights', (req, res) => {
    const insights = {
      segment: 'Tích cực cập nhật kiến thức (Heavy Reader)',
      readingHabits: ['Thường mượn sách chuyên ngành Công nghệ', 'Luôn trả đúng hạn', 'Thời gian mượn trung bình: 7 ngày'],
      recommendedPolicies: 'Nên nâng cấp thành viên VIP, tăng hạn mức mượn lên 5 cuốn/lần.',
      suggestedBooks: ['book-1', 'book-2']
    };
    res.json(successResponse(insights));
  });

  app.post('/api/ai/circulation-insight', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.post('/api/ai/suggest-roles', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // Notifications
  let mockNotifications = [
    // Tenant Admin notifications
    { id: 'notif-admin-1', userId: 'u-1', title: 'Kiểm kê kho hoàn tất', message: 'Hệ thống đã tự động đối soát và hoàn tất chiến dịch kiểm kê kho Chi nhánh Trung Tâm. Phát hiện 2 trường hợp lệch sách.', type: 'Success', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-admin-2', userId: 'u-1', title: 'Cảnh báo Bảo mật AI', message: 'Hệ thống AI phát hiện một đăng nhập có dấu hiệu bất thường từ địa chỉ IP lạ. Nhật ký an ninh đã được ghi lại.', type: 'Warning', isRead: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'notif-admin-3', userId: 'u-1', title: 'Báo cáo Xuất khẩu Sẵn sàng', message: 'Báo cáo thống kê hiệu suất luân chuyển sách và tỷ lệ mượn trả tuần trước đã sẵn sàng tải về.', type: 'Info', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },

    // Librarian notifications
    { id: 'notif-lib-1', userId: 'u-librarian', title: 'Độc giả đặt chờ sách', message: 'Độc giả Jane Smith vừa đăng ký hàng đợi đặt chờ (Hold Queue) cho cuốn "The C Programming Language" hiện hết bản sao khả dụng.', type: 'Info', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-lib-2', userId: 'u-librarian', title: 'Yêu cầu luân chuyển mới', message: 'Có 1 yêu cầu luân chuyển 15 cuốn sách từ Chi nhánh Quận 1 sang Chi nhánh Thủ Đức đang chờ phê duyệt thanh lý.', type: 'Warning', isRead: false, createdAt: new Date(Date.now() - 1200000).toISOString() },

    // John Doe (u-member-U002) notifications - holds "Clean Code" (loan-1) approaching due
    { id: 'notif-member-U002-1', userId: 'u-member-U002', title: 'Sách sắp đến hạn', message: 'Thông báo thân thiện: Cuốn sách "Clean Code" của bạn sẽ đến hạn trả vào ngày mai. Hãy mang qua thư viện hoặc thực hiện gia hạn trực tuyến.', type: 'Warning', isRead: false, createdAt: new Date().toISOString() },

    // Jane Smith (u-member-U003) notifications - holds "Design Patterns" (loan-2) overdue
    { id: 'notif-member-U003-overdue', userId: 'u-member-U003', title: 'Nhắc trả sách quá hạn', message: 'Cảnh báo quá hạn: Cuốn sách "Design Patterns" của bạn đã quá hạn trả 6 ngày. Vui lòng hoàn trả sớm để tránh phát sinh chi phí phạt quá hạn.', type: 'Alert', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-member-U003-extension', userId: 'u-member-U003', title: 'Yêu cầu gia hạn được duyệt', message: 'Giao dịch gia hạn trực tuyến thành công cho cuốn sách "Design Patterns" thêm 7 ngày.', type: 'Success', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  let mockPreferences = { email: true, push: false, inApp: true, reminderDays: 2 };

  let mockTemplates = [
    { id: 'tpl-1', code: 'LOAN_DUE_WARNING', name: 'Nhắc trả sách sắp đến hạn', subjectTemplate: 'Sách sắp đến hạn: {{bookTitle}}', bodyTemplate: 'Chào {{userName}},\nCuốn sách {{bookTitle}} của bạn sẽ đến hạn trả vào ngày {{dueDate}}. Vui lòng sắp xếp trả sách đúng hạn.\nCảm ơn!', channels: ['Email', 'InApp'] }
  ];

  const getCurrentUser = (req: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === 'mock-jwt-token-admin') {
      return mockUsers.find(u => u.id === 'u-1') || null;
    }
    if (token.startsWith('mock-jwt-token-')) {
      const userId = token.replace('mock-jwt-token-', '');
      return mockUsers.find(u => u.id === userId) || null;
    }
    return null;
  };

  app.get('/api/notifications', (req, res) => {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return res.json(successResponse([]));
    }
    const filtered = mockNotifications.filter(n => n.userId === currentUser.id);
    res.json(successResponse(filtered));
  });

  app.put('/api/notifications/:id/read', (req, res) => {
    const notif = mockNotifications.find(n => n.id === req.params.id);
    if (notif) notif.isRead = true;
    res.json(successResponse(null));
  });

  app.put('/api/notifications/read-all', (req, res) => {
    const currentUser = getCurrentUser(req);
    if (currentUser) {
      mockNotifications.forEach(n => {
        if (n.userId === currentUser.id) {
          n.isRead = true;
        }
      });
    } else {
      mockNotifications.forEach(n => n.isRead = true);
    }
    res.json(successResponse(null));
  });

  app.get('/api/preferences/notifications', (req, res) => {
    res.json(successResponse(mockPreferences));
  });

  app.put('/api/preferences/notifications', (req, res) => {
    mockPreferences = { ...mockPreferences, ...req.body };
    res.json(successResponse(mockPreferences));
  });

  app.get('/api/notifications/templates', (req, res) => {
    res.json(successResponse(mockTemplates));
  });

  app.post('/api/notifications/templates', (req, res) => {
    const newTpl = { id: 'tpl-' + Date.now(), ...req.body };
    mockTemplates.push(newTpl);
    res.status(201).json(successResponse(newTpl));
  });

  app.put('/api/notifications/templates/:id', (req, res) => {
    const idx = mockTemplates.findIndex(t => t.id === req.params.id);
    if (idx !== -1) mockTemplates[idx] = { ...mockTemplates[idx], ...req.body };
    res.json(successResponse(mockTemplates[idx] || null));
  });

  app.post('/api/ai/generate-template', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // Scanner endpoints
  app.post('/api/scan/resolve', (req, res) => {
    const { code } = req.body;
    const isBook = code.startsWith('B-') || code.length === 13;
    const isMember = code.startsWith('M-');
    
    if (isBook || code.toLowerCase().includes('clean code')) {
      res.json(successResponse({
        code,
        type: 'Book',
        status: 'Success',
        data: { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin' }
      }));
    } else if (isMember || code.toLowerCase().includes('user')) {
      res.json(successResponse({
        code,
        type: 'Member',
        status: 'Success',
        data: { fullName: 'Nguyễn Văn A', email: 'a.nguyen@example.com', memberCode: code }
      }));
    } else {
      res.json(successResponse({
        code,
        type: 'Unknown',
        status: 'NotFound',
        data: null
      }));
    }
  });

  app.post('/api/ai/scan-image', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.post('/api/codes/generate', (req, res) => {
    const { itemIds, type } = req.body;
    const items = itemIds.map((id: string, idx: number) => ({
      id,
      code: `${type === 'Book' ? 'B-' : 'M-'}${Math.floor(Math.random() * 10000000)}`,
      label: type === 'Book' ? `Sách tiêu chuẩn ${idx + 1}` : `Thẻ độc giả ${idx + 1}`,
      type
    }));
    res.json(successResponse({
      id: 'print-job-' + Date.now(),
      items,
      status: 'Pending',
      createdAt: new Date().toISOString()
    }));
  });

  app.get('/api/me/card-qr', (req, res) => {
    res.json(successResponse({ code: 'M-123456789' }));
  });

  // DASHBOARD & REPORTS endpoints
  app.get('/api/dashboard/overview', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    const tenantBooks = mockBooks.filter(b => b.tenantId === tenantId);
    const tenantMembers = mockMembers.filter(m => m.tenantId === tenantId);
    const tenantLoans = mockLoans.filter(l => l.tenantId === tenantId);

    const activeLoansCount = tenantLoans.filter(l => l.status === 'Active' || l.status === 'Overdue').length;
    const overdueLoansCount = tenantLoans.filter(l => l.status === 'Overdue').length;
    const totalBooksCount = tenantBooks.reduce((acc, b) => acc + (b.totalCopies !== undefined ? Number(b.totalCopies) : (b.copies !== undefined ? Number(b.copies) : 0)), 0);
    const totalMembersCount = tenantMembers.length;

    // Tính tiền phạt thực tế
    const totalFineAmount = tenantLoans.reduce((acc, l) => {
      const { fineAmount: fine } = calculateLoanFine(l, tenantId);
      return acc + fine;
    }, 0);

    const { timeRange } = req.query;
    let days = 30;
    if (timeRange === '7d') days = 7;
    if (timeRange === '90d') days = 90;
    if (timeRange === 'ytd') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const diffTime = Math.abs(Date.now() - startOfYear.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Generate trend data from real mockLoans
    const circulationTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });

      const checkouts = tenantLoans.filter(l => l.checkoutDate && l.checkoutDate.startsWith(dateStr)).length;
      const returns = tenantLoans.filter(l => {
        const rDate = l.returnDate || l.returnedAt;
        return rDate && rDate.startsWith(dateStr);
      }).length;
      const newMembers = tenantMembers.filter(m => m.joinDate && m.joinDate.startsWith(dateStr)).length;

      circulationTrend.push({
        date: label,
        checkouts,
        returns,
        newMembers,
      });
    }

    // Dynamic top readers from tenantLoans
    const readerMap: Record<string, { id: string; name: string; borrowCount: number }> = {};
    tenantLoans.forEach(l => {
      if (!l.userId) return;
      const uId = l.userId;
      const uName = l.userName || 'Độc giả ẩn danh';
      if (!readerMap[uId]) {
        readerMap[uId] = { id: uId, name: uName, borrowCount: 0 };
      }
      readerMap[uId].borrowCount += 1;
    });

    const topReaders = Object.values(readerMap)
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5);

    res.json(successResponse({
      kpis: {
        totalBooks: totalBooksCount,
        totalMembers: totalMembersCount,
        activeLoans: activeLoansCount,
        overdueLoans: overdueLoansCount,
        revenue: totalFineAmount,
        trends: {
          books: 1.2,
          members: 5.4,
          loans: -2.1,
          revenue: 15.2
        }
      },
      circulationTrend,
      topReaders
    }));
  });

  app.get('/api/ai/dashboard-insights', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // AUDIT LOG endpoints
  app.get('/api/audit-logs', (req, res) => {
    const { search, entity, action } = req.query;
    
    let logs = [...mockAuditLogs];

    const searchLower = search?.toString().toLowerCase();
    
    if (searchLower) {
      logs = logs.filter(l => 
        l.actor.toLowerCase().includes(searchLower) || 
        l.details.toLowerCase().includes(searchLower) || 
        l.id.toLowerCase().includes(searchLower)
      );
    }
    if (entity && entity !== 'all') {
      logs = logs.filter(l => l.entity === entity);
    }
    if (action && action !== 'all') {
      logs = logs.filter(l => l.action === action);
    }

    res.json(successResponse(logs));
  });

  app.get('/api/audit-logs/:id', (req, res) => {
    const { id } = req.params;
    const log = mockAuditLogs.find(l => l.id === id);
    if (!log) {
      return res.status(404).json(errorResponse('Không tìm thấy nhật ký hoạt động'));
    }
    res.json(successResponse(log));
  });

  app.post('/api/audit-logs/export', (req, res) => {
    setTimeout(() => {
      res.json(successResponse({ url: 'https://example.com/audit_export_202x.csv' }));
    }, 1000);
  });

  app.get('/api/ai/audit-insight', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // TRANSFER endpoints
  let transfersData = [
    { id: 'TRF-1001', tenantId: 'tenant-1', sourceBranchId: 'branch-1', sourceBranchName: 'Thư viện Trung tâm', destinationBranchId: 'branch-2', destinationBranchName: 'Chi nhánh Quận 1', status: 'Pending', items: [{ id: '1', bookId: 'b1', bookTitle: 'Clean Code', copyBarcode: 'C-001' }], reason: 'Khách đặt chỗ', requestedBy: 'admin', createdDate: new Date().toISOString() },
    { id: 'TRF-1002', tenantId: 'tenant-1', sourceBranchId: 'branch-2', sourceBranchName: 'Chi nhánh Quận 1', destinationBranchId: 'branch-1', destinationBranchName: 'Thư viện Trung tâm', status: 'InTransit', items: [{ id: '2', bookId: 'b2', bookTitle: 'Design Patterns', copyBarcode: 'C-002' }], reason: 'Bổ sung sách', requestedBy: 'admin', createdDate: new Date(Date.now() - 86400000).toISOString() },
    { id: 'TRF-1003', tenantId: 'tenant-1', sourceBranchId: 'branch-1', sourceBranchName: 'Thư viện Trung tâm', destinationBranchId: 'branch-2', destinationBranchName: 'Chi nhánh Quận 1', status: 'Received', items: [{ id: '3', bookId: 'b3', bookTitle: 'Refactoring', copyBarcode: 'C-003' }], reason: 'Chuyển về kho', requestedBy: 'admin', createdDate: new Date(Date.now() - 172800000).toISOString() },
  ];

  app.get('/api/transfers', (req, res) => {
    const { status } = req.query;
    let filtered = transfersData;
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    res.json(successResponse(filtered));
  });

  app.post('/api/transfers', (req, res) => {
    const data = req.body;
    const branches = [
      { id: 'branch-1', name: 'Thư viện Trung tâm' },
      { id: 'branch-2', name: 'Chi nhánh Quận 1' },
      { id: 'branch-3', name: 'Chi nhánh Thủ Đức' }
    ];
    
    const sBranch = branches.find(b => b.id === data.sourceBranchId);
    const dBranch = branches.find(b => b.id === data.destinationBranchId);

    const newTransfer = {
      id: `TRF-${Math.floor(Math.random() * 9000) + 1000}`,
      tenantId: 'tenant-1',
      sourceBranchId: data.sourceBranchId,
      sourceBranchName: sBranch?.name || 'Unknown',
      destinationBranchId: data.destinationBranchId,
      destinationBranchName: dBranch?.name || 'Unknown',
      status: 'Pending',
      items: data.barcodeList.map((b: string, i: number) => ({ id: String(i), bookId: 'b-new', bookTitle: 'Unknown Book', copyBarcode: b })),
      reason: data.reason,
      requestedBy: 'admin',
      createdDate: new Date().toISOString()
    };
    
    transfersData.unshift(newTransfer);
    res.json(successResponse(newTransfer));
  });

  app.post('/api/transfers/:id/receive', (req, res) => {
    const { id } = req.params;
    const transferIndex = transfersData.findIndex(t => t.id === id);
    if (transferIndex !== -1) {
      transfersData[transferIndex].status = 'Received';
      res.json(successResponse(transfersData[transferIndex]));
    } else {
      res.status(404).json({ success: false, message: 'Transfer not found' });
    }
  });

  app.get('/api/ai/transfer-suggestions', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // INVENTORY endpoints
  let inventorySessions = [
    { id: 'INV-2606', name: 'Kiểm kê định kỳ T06/2026', branchId: 'b-1', branchName: 'Central Reading Room', status: 'Open', expectedCount: 15420, scannedCount: 14250, createdBy: 'admin', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), tenantId: 'tenant-1' },
    { id: 'INV-2605', name: 'Kiểm kê kho sách cũ', branchId: 'b-2', branchName: 'Children Section', status: 'Closed', expectedCount: 2150, scannedCount: 2145, createdBy: 'admin', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), closedAt: new Date(Date.now() - 25 * 86400000).toISOString(), tenantId: 'tenant-1' },
    { id: 'INV-3001', name: 'Kiểm kê HCM Kỳ I/2026', branchId: 'b-1', branchName: 'Central Reading Room (HCM)', status: 'Open', expectedCount: 5000, scannedCount: 3200, createdBy: 'admin_hcm', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), tenantId: 'tenant-2' }
  ];

  let inventoryDiscrepancies: Record<string, any[]>  = {
    'INV-2606': [
      { id: 'disc-1', sessionId: 'INV-2606', bookId: 'b-99', bookTitle: 'Cấu trúc dữ liệu và giải thuật', copyBarcode: 'C-099', expectedStatus: 'Available', actualStatus: 'Missing', condition: 'Unknown', resolution: 'Pending' },
      { id: 'disc-2', sessionId: 'INV-2606', bookId: 'b-42', bookTitle: 'Đắc Nhân Tâm', copyBarcode: 'C-042', expectedStatus: 'Available', actualStatus: 'Available', condition: 'Damaged', resolution: 'Pending', note: 'Bìa rách nặng' }
    ]
  };

  app.get('/api/inventory/sessions', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền sử dụng chức năng kiểm kho'));
    }

    // Tenant isolation
    const result = inventorySessions.filter(s => s.tenantId === tenantId);
    res.json(successResponse(result));
  });

  app.post('/api/inventory/sessions', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'librarian' || currentRole === 'inventory_staff' || currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền tạo đợt kiểm kê'));
    }

    const { name, branchId } = req.body;
    
    // Validate if branch belongs to current tenant
    const allowedBranches = mockBranches.filter(b => b.tenantId === tenantId);
    
    const matchedBranch = allowedBranches.find(b => b.id === branchId);
    if (!matchedBranch) {
      return res.status(400).json(errorResponse('Chi nhánh không thuộc thư viện hiện tại'));
    }

    const newSession = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      name,
      branchId: matchedBranch.id,
      branchName: matchedBranch.name,
      status: 'Open',
      expectedCount: 5000,
      scannedCount: 0,
      createdBy: currentRole === 'super_admin' ? 'superadmin' : 'admin',
      createdAt: new Date().toISOString(),
      tenantId: tenantId
    };

    inventorySessions.unshift(newSession);
    inventoryDiscrepancies[newSession.id] = [];
    res.json(successResponse(newSession));
  });

  app.get('/api/inventory/sessions/:id', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền sử dụng chức năng kiểm kho'));
    }

    const s = inventorySessions.find(s => s.id === req.params.id);
    if (!s) {
      return res.status(404).json(errorResponse('Phiên kiểm kê không tồn tại'));
    }

    if (currentRole !== 'super_admin' && s.tenantId !== tenantId) {
      return res.status(403).json(errorResponse('Phiên kiểm kê không thuộc thư viện này'));
    }

    res.json(successResponse(s));
  });

  app.post('/api/inventory/scan', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền quét mã sách'));
    }

    const { sessionId, barcode, condition } = req.body;
    const sessionIndex = inventorySessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json(errorResponse('Phiên kiểm kê không tồn tại'));
    }

    const session = inventorySessions[sessionIndex];

    if (currentRole !== 'super_admin' && session.tenantId !== tenantId) {
      return res.status(403).json(errorResponse('Phiên kiểm kê không thuộc thư viện này'));
    }

    if (session.status === 'Closed') {
      return res.status(400).json(errorResponse('Phiên kiểm kê đã đóng, không thể quét thêm'));
    }

    session.scannedCount++;

    if (condition === 'Damaged' || condition === 'Missing') {
      inventoryDiscrepancies[sessionId] = inventoryDiscrepancies[sessionId] || [];
      inventoryDiscrepancies[sessionId].push({
        id: `disc-${Math.floor(Math.random() * 10000)}`,
        sessionId,
        bookId: 'b-xxx',
        bookTitle: 'Unknown Book',
        copyBarcode: barcode,
        expectedStatus: 'Available',
        actualStatus: condition === 'Damaged' ? 'Scanned' : 'Missing',
        condition: condition,
        resolution: 'Pending'
      });
    }

    res.json(successResponse({ success: true, message: `Quét mã ${barcode} thành công.` }));
  });

  app.get('/api/inventory/:id/discrepancies', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền sử dụng chức năng kiểm kho'));
    }

    const s = inventorySessions.find(s => s.id === req.params.id);
    if (!s) {
      return res.status(404).json(errorResponse('Phiên kiểm kê không tồn tại'));
    }

    if (currentRole !== 'super_admin' && s.tenantId !== tenantId) {
      return res.status(403).json(errorResponse('Phiên kiểm kê không thuộc thư viện này'));
    }

    res.json(successResponse(inventoryDiscrepancies[req.params.id] || []));
  });

  app.post('/api/inventory/discrepancies/:id/resolve', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'librarian' || currentRole === 'inventory_staff' || currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền xử lý sai lệch kiểm kê'));
    }

    const { id } = req.params;
    const { resolution } = req.body;

    let foundItem = null;
    let foundSession = null;

    for (const sessionId of Object.keys(inventoryDiscrepancies)) {
      const item = inventoryDiscrepancies[sessionId].find(d => d.id === id);
      if (item) {
        foundItem = item;
        foundSession = inventorySessions.find(s => s.id === sessionId);
        break;
      }
    }

    if (!foundItem || !foundSession) {
      return res.status(404).json(errorResponse('Không tìm thấy bản ghi lệch'));
    }

    if (currentRole !== 'super_admin' && foundSession.tenantId !== tenantId) {
      return res.status(403).json(errorResponse('Phiên kiểm kê không thuộc thư viện này'));
    }

    foundItem.resolution = resolution;
    res.json(successResponse(foundItem));
  });

  app.post('/api/inventory/sessions/:id/close', (req, res) => {
    const currentRole = getCurrentRole(req);
    const tenantCode = req.headers['x-tenant-code']?.toString() || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    if (currentRole === 'librarian' || currentRole === 'inventory_staff' || currentRole === 'member') {
      return res.status(403).json(errorResponse('Bạn không có quyền chốt phiên kiểm kê'));
    }

    const sessionIndex = inventorySessions.findIndex(s => s.id === req.params.id);
    if (sessionIndex === -1) {
      return res.status(404).json(errorResponse('Không tìm thấy phiên kiểm kê'));
    }

    const session = inventorySessions[sessionIndex];

    if (currentRole !== 'super_admin' && session.tenantId !== tenantId) {
      return res.status(403).json(errorResponse('Phiên kiểm kê không thuộc thư viện này'));
    }

    session.status = 'Closed';
    session.closedAt = new Date().toISOString();
    res.json(successResponse(session));
  });

  app.get('/api/ai/inventory-insights', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // POLICIES endpoints
  app.get('/api/policies/current', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const policy = getPolicyByTenant(tenantId);
    res.json(successResponse(policy));
  });

  app.put('/api/policies/current', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const policy = getPolicyByTenant(tenantId);
    
    mockPoliciesByTenant[tenantId] = {
      ...policy,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(successResponse(mockPoliciesByTenant[tenantId]));
  });

  app.post('/api/ai/policies/impact-preview', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // REPORTS endpoints
  app.get('/api/reports/datasets', (req, res) => {
    res.json(successResponse([
      { id: 'ds-circulation', name: 'Báo cáo mượn trả', description: 'Thống kê tình hình mượn trả sách theo thời gian' },
      { id: 'ds-fines', name: 'Báo cáo tiền phạt', description: 'Thống kê tiền phạt trễ hạn và đền bù' },
      { id: 'ds-books', name: 'Báo cáo sách', description: 'Thống kê danh mục sách, tổng số lượng và còn lại' },
      { id: 'ds-members', name: 'Báo cáo độc giả', description: 'Thống kê lượt đăng ký và tương tác của thành viên' }
    ]));
  });

  app.post('/api/reports/run', (req, res) => {
    const { datasetId, filters } = req.body;
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);

    // Ghi log chạy báo cáo
    addAuditLog({
      actor: 'superadmin@system.local',
      action: 'Query',
      entity: 'Report',
      entityId: datasetId || 'all',
      details: `Chạy và kết xuất dữ liệu báo cáo "${datasetId}"`,
      tenantId: tenantId
    });

    // Filter mocks by active tenant
    const tenantLoans = mockLoans.filter(l => l.tenantId === tenantId);
    const tenantBooks = mockBooks.filter(b => b.tenantId === tenantId);
    const tenantMembers = mockMembers.filter(m => m.tenantId === tenantId);

    // Compute library overall summary
    const totalLoans = tenantLoans.length;
    const totalReturns = tenantLoans.filter(l => l.status === 'Returned').length;
    const overdueBooks = tenantLoans.filter(l => l.status === 'Overdue' || (l.status !== 'Returned' && new Date(l.dueDate) < new Date())).length;
    const totalFines = tenantLoans.reduce((sum, l) => {
      const { fineAmount: computedFine } = calculateLoanFine(l, tenantId);
      return sum + computedFine;
    }, 0);

    const summary = {
      totalLoans,
      totalReturns,
      overdueBooks,
      totalFines
    };

    let cols: string[] = [];
    let rows: any[] = [];
    
    if (datasetId === 'ds-circulation') {
      cols = ['Ngày', 'Lượt mượn', 'Lượt trả', 'Quá hạn'];
      
      // Generate last 7 days of dates
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      rows = dates.map(dateStr => {
        const checkoutCount = tenantLoans.filter(l => l.checkoutDate && l.checkoutDate.startsWith(dateStr)).length;
        const returnCount = tenantLoans.filter(l => (l.returnDate || l.returnedAt) && (l.returnDate || l.returnedAt).startsWith(dateStr)).length;
        const overdueOnDay = tenantLoans.filter(l => {
          const isLOverdue = l.status !== 'Returned' && new Date(l.dueDate) < new Date();
          return isLOverdue && l.dueDate && l.dueDate.startsWith(dateStr);
        }).length;

        return {
          'Ngày': dateStr,
          'Lượt mượn': checkoutCount,
          'Lượt trả': returnCount,
          'Quá hạn': overdueOnDay
        };
      });
    } else if (datasetId === 'ds-fines') {
      cols = ['Mã phiếu', 'Độc giả', 'Sách', 'Số ngày quá hạn', 'Tiền phạt', 'Trạng thái thanh toán'];
      
      const fineLoans = tenantLoans.filter(l => {
        const { fineAmount: computedFine } = calculateLoanFine(l, tenantId);
        return computedFine > 0;
      });

      rows = fineLoans.map(l => {
        const { fineAmount: computedFine, overdueDays } = calculateLoanFine(l, tenantId);
        const member = tenantMembers.find(m => m.id === l.userId || m.memberCode === l.userId);
        const memberName = member ? member.fullName : (l.userName || 'John Doe');
        return {
          'Mã phiếu': l.id,
          'Độc giả': memberName,
          'Sách': l.bookTitle || 'Sách chuyên ngành',
          'Số ngày quá hạn': overdueDays,
          'Tiền phạt': computedFine,
          'Trạng thái thanh toán': l.finePaid ? 'Đã thu' : 'Chưa thu'
        };
      });
    } else if (datasetId === 'ds-books') {
      cols = ['Tên sách', 'Tác giả', 'Thể loại', 'Tổng số', 'Còn lại', 'Trạng thái'];
      rows = tenantBooks.map(b => {
        const total = b.totalCopies || 5;
        const available = b.availableCopies !== undefined ? b.availableCopies : 3;
        return {
          'Tên sách': b.title,
          'Tác giả': b.author,
          'Thể loại': b.category,
          'Tổng số': total,
          'Còn lại': available,
          'Trạng thái': available > 0 ? 'Còn sách' : 'Hết sách'
        };
      });
    } else if (datasetId === 'ds-members') {
      cols = ['Mã độc giả', 'Họ tên', 'Email', 'Trạng thái', 'Số sách đang mượn'];
      rows = tenantMembers.map(m => {
        const activeLoansCount = tenantLoans.filter(l => 
          l.status !== 'Returned' && 
          (l.userId === m.id || l.userId === m.memberCode)
        ).length;

        return {
          'Mã độc giả': m.memberCode,
          'Họ tên': m.fullName,
          'Email': m.email,
          'Trạng thái': m.status === 'Active' ? 'Hoạt động' : 'Bị khóa',
          'Số sách đang mượn': activeLoansCount
        };
      });
    }

    res.json(successResponse({
      columns: cols,
      rows: rows,
      totalRows: rows.length,
      summary
    }));
  });

  app.post('/api/reports/export', (req, res) => {
    const { datasetId, type, format } = req.body;
    const resolvedId = datasetId || type || 'summary';
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';

    // Ghi log xuất báo cáo
    addAuditLog({
      actor: 'superadmin@system.local',
      action: 'Export',
      entity: 'Report',
      entityId: resolvedId,
      details: `Xuất báo cáo định dạng ${format ? format.toUpperCase() : 'EXCEL'} cho báo cáo "${resolvedId}"`,
      tenantId: tenantId
    });

    res.json(successResponse({
      jobId: 'export-' + Math.random().toString(36).substring(7),
      message: 'Đã xuất báo cáo thành công',
      url: `https://example.com/report-demo.${fileExtension}`
    }));
  });

  app.post('/api/ai/report-insights', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // Imports
  app.post('/api/imports', (req, res) => {
    // Actually we are not parsing multipart here to keep it simple, just sending success back
    setTimeout(() => {
       res.json(successResponse({
          id: `job-${Date.now()}`,
          tenantId: 'tenant-1',
          fileName: 'thong_tin_doc_gia_2026.xlsx',
          entityType: 'Members',
          status: 'Mapping',
          totalRows: 250,
          processedRows: 0,
          successRows: 0,
          errorRows: 0,
          createdAt: new Date().toISOString()
       }));
    }, 1200);
  });

  app.post('/api/ai/imports/:id/suggest-mapping', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.post('/api/imports/:id/map', (req, res) => {
     setTimeout(() => {
       res.json(successResponse({
          success: true,
          job: {
            id: req.params.id,
            tenantId: 'tenant-1',
            fileName: 'thong_tin_doc_gia_2026.xlsx',
            entityType: 'Members',
            status: 'Ready',
            totalRows: 250,
            processedRows: 0,
            successRows: 0,
            errorRows: 0,
            createdAt: new Date().toISOString()
          }
       }));
     }, 600);
  });

  app.post('/api/imports/:id/run', (req, res) => {
     setTimeout(() => {
       res.json(successResponse({ success: true }));
     }, 500);
  });

  app.get('/api/imports/:id/errors', (req, res) => {
     setTimeout(() => {
       res.json(successResponse([
         { rowNumber: 45, errorMessage: 'Email không đúng định dạng', data: { 'Họ và tên': 'Nguyễn Văn C', 'Địa chỉ Email': 'nguyenvanc-gmail.com' } },
         { rowNumber: 112, errorMessage: 'Bị trùng lặp CMND/CCCD với thành viên khác', data: { 'Họ và tên': 'Trần Thị B', 'CMND': '012345678912' } },
         { rowNumber: 189, errorMessage: 'Thiếu số điện thoại bắt buộc', data: { 'Họ và tên': 'Lê Đại D' } },
       ]));
     }, 800);
  });

  // AI Chat Assistant mock endpoints
  app.get('/api/ai/conversations', (req, res) => {
    res.json(successResponse([]));
  });

  app.post('/api/ai/chat', (req, res) => {
    // Generate valid message and conversation IDs to begin streaming
    res.json(successResponse({
      messageId: `msg-${Date.now()}`,
      conversationId: req.body.conversationId || `conv-${Date.now()}`
    }));
  });

  app.post('/api/ai/feedback', (req, res) => {
    res.json(successResponse(true));
  });

  let mockWorkflowRules: any[] = [
    {
      id: 'wf-1',
      name: 'Nhắc nhở trả sách trước 3 ngày',
      trigger: 'due_date',
      condition: '3_days_before',
      channels: ['email', 'push_noti'],
      templateBody: 'Kính gửi {UserName}, sách {BookTitle} sẽ hết hạn vào {DueDate}...',
      isActive: true,
      tenantId: 'tenant-1'
    },
    {
      id: 'wf-2',
      name: 'Cảnh báo sách quá hạn',
      trigger: 'overdue',
      condition: '1_day_after',
      channels: ['email'],
      templateBody: 'Thư viện thông báo: Sách {BookTitle} của bạn đã quá hạn...',
      isActive: false,
      tenantId: 'tenant-1'
    },
    {
      id: 'wf-3',
      name: 'Nhắc nhở trả sách trước 3 ngày (HCM)',
      trigger: 'due_date',
      condition: '3_days_before',
      channels: ['email', 'push_noti'],
      templateBody: 'Kính gửi {UserName}, sách {BookTitle} sẽ hết hạn vào {DueDate}...',
      isActive: true,
      tenantId: 'tenant-2'
    },
    {
      id: 'wf-4',
      name: 'Cảnh báo sách quá hạn (HCM)',
      trigger: 'overdue',
      condition: '1_day_after',
      channels: ['email'],
      templateBody: 'Thư viện thông báo: Sách {BookTitle} của bạn đã quá hạn...',
      isActive: false,
      tenantId: 'tenant-2'
    }
  ];

  let mockWorkflowLogs: any[] = [
    {
      id: 'log-uuid-1234',
      ruleId: 'wf-1',
      ruleName: 'Nhắc nhở trả sách trước 3 ngày',
      recipientCount: 45,
      status: 'Success',
      executedAt: new Date(Date.now() - 3600000).toISOString(),
      tenantId: 'tenant-1'
    },
    {
      id: 'log-uuid-5678',
      ruleId: 'wf-2',
      ruleName: 'Cảnh báo sách quá hạn',
      recipientCount: 12,
      status: 'Partial',
      errorMessage: '3 emails bị bounce',
      executedAt: new Date(Date.now() - 86450000).toISOString(),
      tenantId: 'tenant-1'
    },
    {
      id: 'log-uuid-9012',
      ruleId: 'wf-3',
      ruleName: 'Nhắc nhở trả sách trước 3 ngày (HCM)',
      recipientCount: 15,
      status: 'Success',
      executedAt: new Date(Date.now() - 3600000).toISOString(),
      tenantId: 'tenant-2'
    }
  ];

  // Workflows mock endpoints
  app.get('/api/workflows', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    res.json(successResponse(mockWorkflowRules.filter(r => r.tenantId === tenantId)));
  });

  app.post('/api/workflows', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const newRule = { 
      ...req.body, 
      id: `wf-${Date.now()}`,
      tenantId: tenantId
    };
    mockWorkflowRules.push(newRule);
    res.json(successResponse(newRule));
  });

  app.put('/api/workflows/:id', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const ruleIndex = mockWorkflowRules.findIndex(r => r.id === req.params.id && r.tenantId === tenantId);
    if (ruleIndex === -1) {
      return res.status(404).json(errorResponse('Không tìm thấy quy trình hợp lệ'));
    }
    mockWorkflowRules[ruleIndex] = {
      ...mockWorkflowRules[ruleIndex],
      ...req.body,
      id: req.params.id,
      tenantId: tenantId
    };
    res.json(successResponse(mockWorkflowRules[ruleIndex]));
  });

  app.post('/api/workflows/test', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const { ruleId } = req.body;
    
    const rule = mockWorkflowRules.find(r => r.id === ruleId && r.tenantId === tenantId);
    if (!rule) {
      return res.status(404).json(errorResponse('Quy trình không tồn tại hoặc không thuộc phân vùng hiện tại.'));
    }

    const newLog = {
      id: `log-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      recipientCount: 3,
      status: 'Success',
      executedAt: new Date().toISOString(),
      tenantId: tenantId
    };

    mockWorkflowLogs.unshift(newLog); // Put newest on top

    res.json(successResponse(newLog));
  });

  app.get('/api/workflows/logs', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const logs = mockWorkflowLogs.filter(l => l.tenantId === tenantId);
    res.json(successResponse(logs));
  });

  app.post('/api/ai/workflows/suggest', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // Predictions mock endpoints
  app.get('/api/ai/predictions/summary', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.get('/api/ai/predictions/alerts', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.get('/api/ai/predictions/forecast', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.post('/api/ai/predictions/run', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // --- RECOMMENDATION ENDPOINTS ---
  app.get('/api/recommendations/branches', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.get('/api/recommendations/books', (req, res) => {
    const tenantCode = req.headers['x-tenant-code'] || 'hq';
    const tenantId = getTenantIdFromCode(tenantCode);
    const currentUser = getCurrentUser(req);

    // Filter books belonging to the active tenant
    const tenantBooks = mockBooks.filter(b => b.tenantId === tenantId);

    let userLoanCategories: string[] = [];
    if (currentUser) {
      const activeMemberId = currentUser.role === 'Member'
        ? currentUser.username
        : ((currentUser as any).memberId || currentUser.username || currentUser.id);

      const userLoans = mockLoans.filter(l => l.userId === activeMemberId && l.tenantId === tenantId);
      userLoanCategories = userLoans.map(l => {
        const bk = mockBooks.find(b => b.id === l.bookId && b.tenantId === tenantId);
        return bk ? bk.category : '';
      }).filter(Boolean);
    }

    const recommendations = tenantBooks.map((book, idx) => {
      const score = 0.95 - idx * 0.05;
      const isInterestedCategory = userLoanCategories.includes(book.category);
      const matchScore = Math.max(0.6, Math.min(0.99, isInterestedCategory ? score + 0.1 : score));

      let reason = `Rất phù hợp để trực quan hóa các dự án thuộc chuyên ngành ${book.category} bạn đang theo dõi.`;
      if (book.category === 'Software Engineering') {
        reason = `Vì bạn quan tâm đến phát triển phần mềm, tác phẩm "${book.title}" cực kỳ hữu ích để xây dựng tư duy lập trình và tối ưu hóa hệ thống của bạn.`;
      } else if (book.category === 'Programming') {
        reason = `Được quan tâm đặc biệt bởi cộng đồng học viên cùng khoa, hỗ trợ rèn luyện tư duy thuật toán và viết code tối ưu qua sách "${book.title}".`;
      } else {
        reason = `Tác phẩm được đề xuất dựa trên sở thích nghiên cứu tài liệu thuộc phân mục khoa học ${book.category} của bạn.`;
      }

      return {
        id: `rec-${book.id}-${idx}`,
        bookId: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        isbn: book.isbn,
        coverUrl: book.coverUrl,
        reason,
        matchScore: parseFloat(matchScore.toFixed(2)),
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies
      };
    });

    // Take top 4 recommendations
    const sortedRecs = recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);

    res.json(successResponse(sortedRecs));
  });

  app.post('/api/recommendations/feedback', (req, res) => {
    res.json(successResponse(true));
  });

  // --- OCR / COMPUTER VISION ENDPOINTS ---
  app.post('/api/ai/ocr', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.get('/api/ai/ocr/:id', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.post('/api/books/from-ocr', (req, res) => {
    // Mock creating book
    res.json(successResponse(true));
  });

  // --- INTEGRATIONS / WEBHOOKS ENDPOINTS ---
  app.get('/api/integrations', (req, res) => {
    res.json(successResponse([
      { id: '1', name: 'Google Workspace', provider: 'google', type: 'SSO', status: 'Active', config: {} },
      { id: '2', name: 'Twilio SMS', provider: 'twilio', type: 'SMS', status: 'Inactive', config: {} },
      { id: '3', name: 'SendGrid Email', provider: 'sendgrid', type: 'Email', status: 'Error', config: {} }
    ]));
  });

  app.get('/api/api-keys', (req, res) => {
    res.json(successResponse([
      { id: 'k1', name: 'ERP System Sync', keyHint: 'sk_live_...a8f2', createdAt: new Date(Date.now() - 864000000).toISOString(), lastUsedAt: new Date().toISOString(), isActive: true }
    ]));
  });
  
  app.post('/api/api-keys', (req, res) => {
    const { name } = req.body;
    res.json(successResponse({
      key: `sk_live_${Math.random().toString(36).substring(2,15)}_${Math.random().toString(36).substring(2,15)}`,
      newKey: { id: `k${Date.now()}`, name, keyHint: 'sk_live_...new1', createdAt: new Date().toISOString(), isActive: true }
    }));
  });

  app.delete('/api/api-keys/:id', (req, res) => {
    res.json(successResponse(true));
  });

  app.get('/api/webhooks', (req, res) => {
    res.json(successResponse([
      { id: 'w1', name: 'Thống kê mượn trả HRM', endpoint: 'https://hrm.school.local/api/library-hook', events: ['loan.created', 'loan.returned'], isActive: true },
      { id: 'w2', name: 'ERP Inventory Sync', endpoint: 'https://erp.school.local/webhook/books', events: ['inventory.progress', 'bookCopy.availabilityChanged'], isActive: true }
    ]));
  });

  app.get('/api/webhooks/logs', (req, res) => {
    res.json(successResponse([
       { id: 'L1', webhookId: 'w1', url: 'https://hrm.school.local/api/library-hook', event: 'loan.created', httpStatus: 200, timestamp: new Date(Date.now() - 5000).toISOString(), responseBody: 'OK', requestPayload: '{}' },
       { id: 'L2', webhookId: 'w2', url: 'https://erp.school.local/webhook/books', event: 'bookCopy.availabilityChanged', httpStatus: 401, timestamp: new Date(Date.now() - 150000).toISOString(), responseBody: 'Unauthorized', requestPayload: '{}' },
       { id: 'L3', webhookId: 'w2', url: 'https://erp.school.local/webhook/books', event: 'inventory.progress', httpStatus: 504, timestamp: new Date(Date.now() - 550000).toISOString(), responseBody: 'Gateway Timeout', requestPayload: '{}' }
    ]));
  });

  app.post('/api/webhooks/:id/test', (req, res) => {
    res.json(successResponse(true));
  });

  app.post('/api/ai/integrations/analyze', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  // --- START BRANDING ENDPOINTS ---
  app.get('/api/branding', (req, res) => {
    res.json(successResponse({
      logoUrl: '',
      primaryColor: '#4f46e5',
      secondaryColor: '#64748b',
      fontFamily: 'Inter',
      themeStyle: 'light'
    }));
  });

  app.put('/api/branding', (req, res) => {
    res.json(successResponse(req.body));
  });

  app.get('/api/locales', (req, res) => {
    res.json(successResponse({
      defaultLocale: 'vi-VN',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
      timezone: 'Asia/Ho_Chi_Minh'
    }));
  });

  app.put('/api/locales', (req, res) => {
    res.json(successResponse(req.body));
  });

  app.post('/api/translations/overrides', (req, res) => {
    res.json(successResponse(true));
  });

  app.post('/api/ai/branding/suggest', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });
  // --- END BRANDING ENDPOINTS ---
  app.get('/api/admin/monitoring/health', (req, res) => {
    res.json(successResponse([
      { service: 'PostgreSQL Database', status: 'Healthy', latencyMs: 12, uptime: '99.99%' },
      { service: 'Redis Cache', status: 'Healthy', latencyMs: 2, uptime: '100%' },
      { service: 'Elasticsearch', status: 'Degraded', latencyMs: 345, uptime: '99.95%' },
      { service: 'SignalR Hub', status: 'Healthy', latencyMs: 45, uptime: '99.98%' }
    ]));
  });

  app.get('/api/ai/monitoring/insights', (req, res) => {
    res.status(410).json({ success: false, message: 'Chức năng AI này đã được ẩn khỏi bản demo' });
  });

  app.post('/api/sync', (req, res) => {
    // Delay 1s to mock sync
    setTimeout(() => {
       res.json(successResponse(true));
    }, 1000);
  });
  // --- END MONITORING & OFFLINE ENDPOINTS ---

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
