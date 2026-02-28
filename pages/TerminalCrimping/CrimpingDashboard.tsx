import React, { useState, useEffect } from 'react';
import { ProductionOrder, SubmissionType, AuditStatus, InspectionRecord, UserRole, TerminalSample, User, CrimpingTool, TerminalSpec, WireSpec, PullForceStandard } from '../../types';
import { CreateOrder } from './CreateOrder';
import { Card } from '../../components/Card';
import { Select } from '../../components/Select'; 
import { api } from '../../services/api'; 

interface CrimpingDashboardProps {
  currentUser: User;
}

export const CrimpingDashboard: React.FC<CrimpingDashboardProps> = ({ currentUser }) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [orders, setOrders] = useState<ProductionOrder[]>([]); 
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  const [tools, setTools] = useState<CrimpingTool[]>([]);
  const [terminals, setTerminals] = useState<TerminalSpec[]>([]);
  const [wires, setWires] = useState<WireSpec[]>([]);
  const [standards, setStandards] = useState<PullForceStandard[]>([]);

  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordersPromise = currentUser.role === UserRole.AUDITOR 
        ? api.getOrders() 
        : api.getOrdersByEmployee(currentUser.username);

      const [fetchedOrders, fetchedTools, fetchedTerminals, fetchedWires, fetchedStandards] = await Promise.all([
        ordersPromise,
        api.getCrimpingTools(),
        api.getTerminalSpecs(),
        api.getWireSpecs(),
        api.getPullForceStandards()
      ]);
      
      setOrders(fetchedOrders);
      setTools(fetchedTools);
      setTerminals(fetchedTerminals);
      setWires(fetchedWires);
      setStandards(fetchedStandards);
    } catch (error) {
      console.error("数据加载失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (newOrder: ProductionOrder) => {
    try {
        await api.createOrder(newOrder);
        await loadData();
        setView('LIST');
    } catch (e: any) {
        alert(`创建失败: ${e.message}`);
    }
  };

  const handleAddRecord = async (orderId: string, type: SubmissionType) => {
    // 查找当前订单以获取当前工具
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const initialSamples: TerminalSample[] = [
        { id: 0, sampleIndex: 1, measuredForce: 0, isPassed: false }, 
        { id: 0, sampleIndex: 2, measuredForce: 0, isPassed: false }, 
        { id: 0, sampleIndex: 3, measuredForce: 0, isPassed: false }
    ];

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const newRecord: InspectionRecord = {
      id: generateId(), 
      orderId,
      type: type === SubmissionType.FIRST_PIECE ? "首件" : "末件",
      inspectionToolNo: currentOrder.toolNo, // 关键：记录当前使用的工具ID
      submitterName: currentUser.name, 
      submittedAt: new Date().toISOString(),
      status: AuditStatus.PENDING,
      samples: initialSamples,
      auditNote: null
    };

    try {
        await api.addRecord(orderId, newRecord);
        await loadData();
        if (selectedOrder) {
            const ordersPromise = currentUser.role === UserRole.AUDITOR 
              ? api.getOrders() 
              : api.getOrdersByEmployee(currentUser.username);
            const latestOrders = await ordersPromise;
            const updated = latestOrders.find(o => o.id === selectedOrder.id);
            if (updated) setSelectedOrder(updated);
        }
    } catch (e: any) {
        alert(`提交失败: ${e.message}`);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
      if (!window.confirm("【检验员权限】确定要删除这条未判定的末件记录吗？")) return;
      
      try {
          await api.deleteRecord(recordId);
          await loadData();
          if (selectedOrder) {
              const ordersPromise = currentUser.role === UserRole.AUDITOR 
                ? api.getOrders() 
                : api.getOrdersByEmployee(currentUser.username);
              const latestOrders = await ordersPromise;
              const updated = latestOrders.find(o => o.id === selectedOrder.id);
              if (updated) setSelectedOrder(updated);
          }
      } catch (e: any) {
          alert(`删除失败: ${e.message}`);
      }
  };

  const handleAuditRecord = async (orderId: string, recordId: string, samples: TerminalSample[]) => {
    const allPassed = samples.every(s => s.isPassed);
    const newStatus = allPassed ? AuditStatus.PASSED : AuditStatus.FAILED;

    try {
        await api.auditRecord(recordId, samples, currentUser.name, newStatus, null);
        await loadData();
        if (selectedOrder) {
            const ordersPromise = currentUser.role === UserRole.AUDITOR 
              ? api.getOrders() 
              : api.getOrdersByEmployee(currentUser.username);
            const latestOrders = await ordersPromise;
            const updated = latestOrders.find(o => o.id === selectedOrder.id);
            if (updated) setSelectedOrder(updated);
        }
    } catch (e: any) {
        alert(`审核提交失败: ${e.message}`);
    }
  };

  const handleUpdateTool = async (orderId: string, newToolId: string) => {
    try {
        await api.updateOrderTool(orderId, newToolId);
        await loadData(); // 刷新数据以更新订单信息
        if (selectedOrder) {
            // 更新当前选中视图
            setSelectedOrder(prev => prev ? { ...prev, toolNo: newToolId } : null);
        }
        alert("压接工具已更新");
    } catch (e: any) {
        alert(`更新工具失败: ${e.message}`);
    }
  };

  const handleCloseOrder = async (orderId: string) => {
      const orderToClose = orders.find(o => String(o.id) === String(orderId));
      if (!orderToClose) return;

      const hasFirstPiecePassed = orderToClose.records.some(r => r.type === "首件" && r.status === AuditStatus.PASSED);
      const hasLastPiece = orderToClose.records.some(r => r.type === "末件");
      const hasPendingRecords = orderToClose.records.some(r => r.status === AuditStatus.PENDING);

      if (!hasFirstPiecePassed) { alert("【无法结束】必须至少有一个合格的首件记录。"); return; }
      if (!hasLastPiece) { alert("【无法结束】尚未提交末件测试记录。"); return; }
      if (hasPendingRecords) { alert("【无法结束】尚有记录待审核判定。"); return; }

      if (!window.confirm("确定要结束此订单吗？\n结束后订单将进入归档状态，不可再添加或修改记录。")) {
          return;
      }

      setIsClosing(true);
      try {
          await api.closeOrder(orderId);
          alert("订单已成功结束并归档。");
          await loadData();
          if (selectedOrder && selectedOrder.id === orderId) {
             const ordersPromise = currentUser.role === UserRole.AUDITOR 
               ? api.getOrders() 
               : api.getOrdersByEmployee(currentUser.username);
             const latestOrders = await ordersPromise;
             const updated = latestOrders.find(o => o.id === orderId);
             if (updated) setSelectedOrder(updated);
          }
      } catch (e: any) {
          alert(`关闭订单失败: ${e.message}`);
          await loadData();
      } finally {
          setIsClosing(false);
      }
  };

  // 判定逻辑更新：
  // 1. 至少一个首件合格
  // 2. 且 所有末件合格 (若有任意末件不合格，则不合格)
  const getOrderOverallStatus = (order: ProductionOrder) => {
    if (!order.isClosed) return null;
    
    const lastPieces = order.records.filter(r => r.type === "末件");
    const anyLastPieceFailed = lastPieces.some(r => r.status === AuditStatus.FAILED);
    
    if (anyLastPieceFailed) return "不合格";

    const hasPassedFirstPiece = order.records.some(r => r.type === "首件" && r.status === AuditStatus.PASSED);
    const hasLastPiece = lastPieces.length > 0;

    if (hasPassedFirstPiece && hasLastPiece) return "合格";
    
    return "不合格";
  };

  if (view === 'CREATE') {
    return (
      <>
        <div className="mb-4">
             <button onClick={() => setView('LIST')} className="text-sm text-gray-500 flex items-center gap-1">
                &larr; 返回列表
             </button>
        </div>
        <CreateOrder 
            onSubmit={handleCreateOrder} 
            dailyCounter={orders.length + 1} 
            creatorName={currentUser.name}
            creatorEmployeeId={currentUser.username} 
            tools={tools}
            terminals={terminals}
            wires={wires}
            standards={standards}
        />
      </>
    );
  }

  if (selectedOrder) {
    const liveOrder = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    return (
      <OrderDetailView 
        order={liveOrder} 
        onBack={() => setSelectedOrder(null)}
        onAddRecord={handleAddRecord}
        onDeleteRecord={handleDeleteRecord}
        onAuditRecord={handleAuditRecord}
        onCloseOrder={handleCloseOrder}
        onUpdateTool={handleUpdateTool}
        currentUser={currentUser}
        tools={tools}
        terminals={terminals}
        wires={wires}
        isClosing={isClosing}
      />
    );
  }

  return (
    <div className="space-y-4">
      {currentUser.role === UserRole.EMPLOYEE && (
        <button 
            onClick={() => setView('CREATE')}
            className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-500 py-4 rounded-xl font-medium hover:bg-gray-50 hover:border-brand-300 hover:text-brand-500 transition-colors"
        >
            + 新增生产订单
        </button>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            正在加载数据...
        </div>
      ) : (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {currentUser.role === UserRole.AUDITOR ? "所有订单列表" : "我的订单列表"}
                </span>
                <span className="text-xs text-gray-400">共 {orders.length} 项</span>
            </div>
            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">暂无订单数据</p>
                </div>
            ) : (
                orders.map(order => {
                    const finalStatus = getOrderOverallStatus(order);
                    const isFailed = finalStatus === "不合格";
                    
                    return (
                        <Card key={order.id} onClick={() => setSelectedOrder(order)} className={`border-l-4 transition-all ${order.isClosed ? 'border-l-gray-300 bg-gray-50' : 'border-l-brand-500 bg-white'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0 pr-2">
                                    <h3 className={`font-bold text-base truncate ${order.isClosed ? 'text-gray-600' : 'text-gray-900'}`}>
                                        {order.productName || '未命名产品'}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{order.productionOrderNo}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(order.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {order.isClosed ? (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isFailed ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                            已结束: {finalStatus}
                                        </span>
                                    ) : (
                                        <span className={`px-2 py-1 text-[10px] rounded font-medium ${
                                            order.records.length > 0 && order.records.some(r => r.status === AuditStatus.PENDING) 
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {order.records.length} 条记录
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[11px] border-t border-gray-100 pt-2 mt-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="bg-gray-100 px-1.5 rounded truncate max-w-[80px]">
                                        {terminals.find(t => String(t.id) === String(order.terminalSpecId))?.name || '未知端子'}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span>标准: {order.standardPullForce}N</span>
                                </div>
                                
                                <div className="flex items-center gap-1 text-gray-400">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span className="truncate max-w-[60px]">{order.creatorName}</span>
                                </div>
                            </div>
                        </Card>
                    );
                })
            )}
        </div>
      )}
    </div>
  );
};

const OrderDetailView: React.FC<{
  order: ProductionOrder;
  onBack: () => void;
  onAddRecord: (orderId: string, type: SubmissionType) => void;
  onDeleteRecord: (recordId: string) => void;
  onAuditRecord: (orderId: string, recordId: string, samples: TerminalSample[]) => void;
  onCloseOrder: (orderId: string) => void;
  onUpdateTool: (orderId: string, newToolId: string) => void;
  currentUser: User;
  tools: CrimpingTool[];
  terminals: TerminalSpec[];
  wires: WireSpec[];
  isClosing?: boolean;
}> = ({ order, onBack, onAddRecord, onDeleteRecord, onAuditRecord, onCloseOrder, onUpdateTool, currentUser, tools, terminals, wires, isClosing }) => {
  
  const firstPiecePassed = order.records.some(r => r.type === "首件" && r.status === AuditStatus.PASSED);
  const hasPendingFirstPiece = order.records.some(r => r.type === "首件" && r.status === AuditStatus.PENDING);
  
  // 是否允许修改工具：没有“合格”的首件，且订单未结束
  const canModifyTool = !firstPiecePassed && !order.isClosed && currentUser.role === UserRole.EMPLOYEE;
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [tempToolId, setTempToolId] = useState(order.toolNo);

  const getTerminalName = (id: string) => terminals.find(t => String(t.id) === id)?.name || id;
  const getToolName = (id: string) => {
      const tool = tools.find(t => String(t.id) === String(id));
      return tool ? `${tool.model} [${tool.type}]` : id;
  };

  const isOrderFailed = order.records.some(r => r.type === "末件" && r.status === AuditStatus.FAILED);

  return (
    <div className="space-y-4 pb-10">
      <button onClick={onBack} className="text-sm text-gray-500 mb-2 flex items-center">&larr; 返回列表</button>
      
      {order.isClosed && (
        <div className={`p-3 rounded-lg text-sm flex items-center justify-between shadow-sm border ${
            isOrderFailed 
            ? 'bg-red-600 text-white border-red-700' 
            : 'bg-green-600 text-white border-green-700'
        }`}>
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-bold uppercase">已归档 ({isOrderFailed ? '不合格' : '合格'})</span>
            </div>
            <span className="text-[10px] opacity-80">只读模式</span>
        </div>
      )}

      {/* 修改工具弹窗 */}
      {isEditingTool && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-lg text-gray-900">更改压接工具</h3>
                  <p className="text-sm text-gray-500">首件尚未合格，您可以修正工具信息。</p>
                  <Select 
                      label="选择新工具"
                      value={tempToolId}
                      onChange={(e) => setTempToolId(e.target.value)}
                      options={tools.filter(t => !t.isDisabled || String(t.id) === String(order.toolNo)).map(t => ({ 
                          value: String(t.id), 
                          label: `${t.model}  [${t.type}]${t.isDisabled ? ' (已禁用)' : ''}` 
                      }))}
                  />
                  <div className="flex gap-3 pt-2">
                      <button 
                          onClick={() => setIsEditingTool(false)}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                      >
                          取消
                      </button>
                      <button 
                          onClick={() => {
                              onUpdateTool(order.id, tempToolId);
                              setIsEditingTool(false);
                          }}
                          className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-medium"
                      >
                          确认更改
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden transition-all duration-500 ${order.isClosed ? 'grayscale opacity-90' : ''}`}>
        <div className="flex justify-between mb-2 relative z-10">
            <h2 className="font-bold text-lg text-gray-900">{order.productName}</h2>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 self-center">{order.productionOrderNo}</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 relative z-10 mt-3">
            <div className="flex flex-col">
                <span className="text-gray-400">压接工具</span>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{getToolName(order.toolNo)}</span>
                    {canModifyTool && (
                        <button 
                            onClick={() => { setTempToolId(order.toolNo); setIsEditingTool(true); }}
                            className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded text-[10px] font-medium border border-brand-100"
                        >
                            修改
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-gray-400">标准拉力</span>
                <span className="font-bold text-lg text-brand-600">{order.standardPullForce} N</span>
            </div>
            <div className="flex flex-col">
                <span className="text-gray-400">端子规格</span>
                <span className="font-medium text-gray-800">{getTerminalName(order.terminalSpecId)}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-gray-400">提交者</span>
                <span className="font-medium text-gray-800">{order.creatorName}</span>
            </div>
        </div>
      </div>

      {!order.isClosed && currentUser.role === UserRole.EMPLOYEE && (
        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={hasPendingFirstPiece || firstPiecePassed} 
            onClick={() => onAddRecord(order.id, SubmissionType.FIRST_PIECE)}
            className={`py-3 rounded-xl font-medium shadow-sm transition-all border flex flex-col items-center justify-center gap-1 h-20 ${
               firstPiecePassed 
                ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed opacity-60' 
                : hasPendingFirstPiece 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 cursor-not-allowed opacity-80'
                    : 'bg-white border-brand-200 text-brand-600 hover:bg-brand-50'
            }`}
          >
            <span className="font-bold">{firstPiecePassed ? '首件合格' : '提交首件'}</span>
            <span className="text-[10px] font-normal">{hasPendingFirstPiece ? '等待审核...' : firstPiecePassed ? '允许生产' : '需审核'}</span>
          </button>

          <button
            disabled={!firstPiecePassed}
            onClick={() => onAddRecord(order.id, SubmissionType.LAST_PIECE)}
            className={`py-3 rounded-xl font-medium shadow-sm transition-all border flex flex-col items-center justify-center gap-1 h-20 ${
              !firstPiecePassed 
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            <span className="font-bold">提交末件</span>
            <span className="text-[10px] font-normal">结束生产时提交</span>
          </button>
        </div>
      )}

      {!order.isClosed && currentUser.role === UserRole.AUDITOR && (
          <button 
            onClick={() => onCloseOrder(order.id)}
            disabled={isClosing}
            className={`w-full text-red-600 border border-red-200 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                isClosing ? 'bg-red-50 opacity-50 cursor-wait' : 'bg-red-50 hover:bg-red-100'
            }`}
          >
            {isClosing ? (
                 <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>正在结束并校验...</span>
                 </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>确认并结束订单 (归档)</span>
                </>
            )}
          </button>
      )}

      <div className="space-y-4">
        {order.records.map(record => (
          <InspectionCard 
            key={record.id} 
            record={record} 
            standardPullForce={order.standardPullForce}
            isAuditor={currentUser.role === UserRole.AUDITOR}
            isOrderClosed={!!order.isClosed}
            onAuditSubmit={(samples) => onAuditRecord(order.id, record.id, samples)}
            onDelete={() => onDeleteRecord(record.id)}
            tools={tools} 
          />
        ))}
      </div>
    </div>
  );
};

const InspectionCard: React.FC<{
    record: InspectionRecord;
    standardPullForce: number;
    isAuditor: boolean;
    isOrderClosed: boolean;
    onAuditSubmit: (samples: TerminalSample[]) => void;
    onDelete?: () => void;
    tools: CrimpingTool[];
}> = ({ record, standardPullForce, isAuditor, isOrderClosed, onAuditSubmit, onDelete, tools }) => {
    
    const isPending = record.status === AuditStatus.PENDING;
    const canAudit = isAuditor && isPending && !isOrderClosed;
    
    const canDelete = isAuditor && !isOrderClosed && record.type === "末件" && isPending;

    const [editSamples, setEditSamples] = useState<TerminalSample[]>(
        record.samples.map(s => ({ ...s }))
    );

    const handleValueChange = (index: number, valStr: string) => {
        const val = parseFloat(valStr);
        const newSamples = [...editSamples];
        newSamples[index] = {
            ...newSamples[index],
            measuredForce: isNaN(val) ? 0 : val,
            isPassed: !isNaN(val) ? val >= standardPullForce : false
        };
        setEditSamples(newSamples);
    };

    const handleSave = () => {
        if (editSamples.some(s => !s.measuredForce && s.measuredForce !== 0)) {
            alert("请填写所有端子的测试拉力值");
            return;
        }
        onAuditSubmit(editSamples);
    };

    const getToolName = (id?: string) => {
        if (!id) return '未知';
        const tool = tools.find(t => String(t.id) === String(id));
        return tool ? tool.model : id;
    };

    const displaySamples = canAudit ? editSamples : record.samples;

    return (
        <Card className={`overflow-hidden p-0 ${isPending ? 'border-yellow-200 ring-4 ring-yellow-50' : 'border-gray-200'} ${isOrderClosed ? 'opacity-80' : ''}`}>
            <div className={`px-3 py-3 border-b flex justify-between items-start gap-2 ${isPending ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <div className="flex items-start gap-2 min-w-0">
                    <span className={`shrink-0 px-2 py-1 rounded text-xs font-bold mt-0.5 ${
                        record.type === "首件" ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                        {record.type}
                    </span>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs text-gray-600 font-medium leading-tight truncate">提交: {record.submitterName}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                             <span className="text-[10px] text-gray-400 leading-tight whitespace-nowrap">{new Date(record.submittedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                             {/* 显示该条记录的工具 */}
                             {record.inspectionToolNo && (
                                <span className="text-[10px] text-gray-500 bg-gray-200/80 px-1.5 py-0.5 rounded leading-tight whitespace-nowrap">
                                    工具: {getToolName(record.inspectionToolNo)}
                                </span>
                             )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <StatusBadge status={record.status} />
                    {canDelete && onDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded-full transition-colors shrink-0"
                            title="检验员专用: 删除未判定末件记录"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                            <th className="pb-2 font-medium w-16">样件</th>
                            <th className="pb-2 font-medium">拉力(N)</th>
                            <th className="pb-2 font-medium text-center">结论</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displaySamples.map((sample, idx) => (
                            <tr key={idx}>
                                <td className="py-3 font-medium text-gray-700">#{sample.sampleIndex}</td>
                                <td className="py-3 pr-2">
                                    {canAudit ? (
                                        <input 
                                            type="number" 
                                            className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={sample.measuredForce || ''}
                                            onChange={(e) => handleValueChange(idx, e.target.value)}
                                        />
                                    ) : (
                                        <span className="font-mono text-gray-900">{sample.measuredForce}</span>
                                    )}
                                </td>
                                <td className="py-3 text-center">
                                    {sample.isPassed ? 
                                        <span className="text-green-600 text-xs font-bold">合格</span> : 
                                        <span className="text-red-500 text-xs font-bold">不合格</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {canAudit && (
                    <div className="mt-4 text-right">
                         <button onClick={handleSave} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform">提交判定结论</button>
                    </div>
                )}
            </div>
        </Card>
    );
};

const StatusBadge: React.FC<{status: AuditStatus}> = ({status}) => {
    if(status === AuditStatus.PENDING) return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded whitespace-nowrap">待审核</span>;
    if(status === AuditStatus.PASSED) return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">合格</span>;
    return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded whitespace-nowrap">不合格</span>;
}