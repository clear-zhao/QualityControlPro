import { ProductionOrder, User, InspectionRecord, UserRole, TerminalSample, CrimpingTool, TerminalSpec, WireSpec, PullForceStandard } from '../types';

// C# 后端地址
const API_BASE_URL = 'http://10.10.20.19:5000/api';

// 自定义事件名称
export const AUTH_LOGOUT_EVENT = 'auth:logout';

const handleResponse = async (response: Response) => {
  // 处理 401 未授权 (通常意味着 Token 过期或在其他设备登录)
  if (response.status === 401) {
    // 触发全局登出事件
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    throw new Error("会话已过期或账号在其他设备登录");
  }

  if (response.ok) {
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null; 
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  const errorText = await response.text();
  let errorMessage = `请求失败: ${response.status}`;

  if (errorText) {
    try {
        const jsonError = JSON.parse(errorText);
        const msg = jsonError.message || jsonError.title || jsonError.error;
        if (msg) errorMessage = msg;
    } catch (e) {
        if (errorText.length < 500 && !errorText.trim().startsWith('<')) {
            errorMessage = errorText;
        }
    }
  }
  throw new Error(errorMessage);
};

export const api = {
  // --- AuthController ---
  login: async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    
    const mappedRole = data.role === 1 ? UserRole.AUDITOR : UserRole.EMPLOYEE;
    
    return {
      username: data.employeeId,
      name: data.name,
      role: mappedRole,
      token: data.token // 保存后端返回的 Token
    };
  },

  // 新增：检查 Token 有效性 (用于自动登录)
  checkToken: async (employeeId: string, token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/Auth/check-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, token }),
    });
    // handleResponse 会自动处理 401 错误
    const data = await handleResponse(response);
    
    const mappedRole = data.role === 1 ? UserRole.AUDITOR : UserRole.EMPLOYEE;
    
    return {
        username: data.employeeId,
        name: data.name,
        role: mappedRole,
        token: data.token // 刷新 Token (如果后端有更新机制) 或保持原样
    };
  },

  getUsers: async (): Promise<{id: number, name: string, isDisabled?: boolean}[]> => {
    const response = await fetch(`${API_BASE_URL}/Auth/users`);
    return handleResponse(response);
  },

  // --- Config ---
  
  getCrimpingTools: async (): Promise<CrimpingTool[]> => {
    const response = await fetch(`${API_BASE_URL}/config/tools`);
    return handleResponse(response);
  },

  getTerminalSpecs: async (): Promise<TerminalSpec[]> => {
    const response = await fetch(`${API_BASE_URL}/config/terminals`);
    return handleResponse(response);
  },

  getWireSpecs: async (): Promise<WireSpec[]> => {
    const response = await fetch(`${API_BASE_URL}/config/wires`);
    return handleResponse(response);
  },

  getPullForceStandards: async (): Promise<PullForceStandard[]> => {
    const response = await fetch(`${API_BASE_URL}/config/standards`);
    return handleResponse(response);
  },

  // --- OrdersController ---

  getOrders: async (): Promise<ProductionOrder[]> => {
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/Orders?_t=${timestamp}`);
    return handleResponse(response);
  },

  getOrdersByEmployee: async (employeeId: string, includeClosed: boolean = true): Promise<ProductionOrder[]> => {
    const timestamp = new Date().getTime();
    const response = await fetch(
      `${API_BASE_URL}/Orders/orders/by-creator-employee?employeeId=${employeeId}&includeClosed=${includeClosed}&_t=${timestamp}`
    );
    return handleResponse(response);
  },

  createOrder: async (order: ProductionOrder): Promise<ProductionOrder> => {
    const response = await fetch(`${API_BASE_URL}/Orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return handleResponse(response);
  },

  updateOrderTool: async (orderId: string, toolNo: string): Promise<void> => {
    // 假设后端有一个 PATCH 接口来修改工具
    const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/tool`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolNo }),
    });
    return handleResponse(response);
  },

  addRecord: async (orderId: string, record: InspectionRecord): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return handleResponse(response);
  },

  deleteRecord: async (recordId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/Orders/records/${recordId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  auditRecord: async (recordId: string, samples: TerminalSample[], auditorName: string, status: number, auditNote?: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/Orders/records/${recordId}/audit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        samples,
        auditorName,
        status,
        auditNote
      }),
    });
    return handleResponse(response);
  },

  closeOrder: async (orderId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(true),
    });
    return handleResponse(response);
  }
};
