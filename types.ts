export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  AUDITOR = 'AUDITOR',
}

export interface User {
  username: string;
  name: string;
  role: UserRole;
  token?: string;
}

export enum ProcessType {
  SPECIAL_PROCESS_MENU = 'SPECIAL_PROCESS_MENU',
  TERMINAL_CRIMPING = 'TERMINAL_CRIMPING',
  WAVE_SOLDERING = 'WAVE_SOLDERING',
  COATING = 'COATING',
}

export enum SubmissionType {
  FIRST_PIECE = '首件',
  LAST_PIECE = '末件',
}

export enum AuditStatus {
  PENDING = 0, // C# int default 0
  PASSED = 1,
  FAILED = 2,
}

// 对应 C# CrimpingTool
export interface CrimpingTool {
  id: number;
  model: string;
  type: string;
}

// 对应 C# TerminalSpec
export interface TerminalSpec {
  id: number;
  materialCode: string;
  name: string;
  description?: string;
  method: number; // 关键字段：用于匹配标准
}

// 对应 C# WireSpec
export interface WireSpec {
  id: string; 
  displayName: string;
  sectionArea: number; // 关键字段：用于匹配标准
}

// 对应 C# PullForceStandard
export interface PullForceStandard {
  id: number;
  method: number;
  sectionArea: number;
  standardValue: number;
}

// 对应 C# TerminalSample
export interface TerminalSample {
  id: number; // 对应 C# Id (Database PK)
  sampleIndex: number; // 1, 2, 3
  measuredForce?: number;
  isPassed?: boolean;
}

// 对应 C# InspectionRecord
export interface InspectionRecord {
  id: string;
  orderId: string;
  type: string; // "首件" / "末件"
  inspectionToolNo?: string; // 新增：记录此次检验使用的工具ID/编号
  submitterName: string;
  submittedAt: string;
  status: AuditStatus; // 0, 1, 2
  auditorName?: string;
  auditedAt?: string;
  auditNote?: string;
  samples: TerminalSample[];
}

// 对应 C# ProductionOrder
export interface ProductionOrder {
  id: string; 
  productionOrderNo: string; 
  productName: string;
  productModel: string; 
  toolNo: string; // 存储 Tool 的 ID string
  terminalSpecId: string; // 存储 ID string
  wireSpecId: string;     // 存储 ID string
  standardPullForce: number;
  creatorName: string;
  creatorEmployeeId: string; // 新增字段：用于记录创建者工号/ID
  createdAt: string;
  records: InspectionRecord[];
  isClosed?: boolean; // 新增：标识订单是否已结束
}