import React, { useState, useEffect } from 'react';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { ProductionOrder, CrimpingTool, TerminalSpec, WireSpec, PullForceStandard } from '../../types';

interface CreateOrderProps {
  onSubmit: (order: ProductionOrder) => void;
  dailyCounter: number;
  creatorName: string;
  creatorEmployeeId: string; // 新增：工号
  tools: CrimpingTool[];
  terminals: TerminalSpec[];
  wires: WireSpec[];
  standards: PullForceStandard[]; 
}

export const CreateOrder: React.FC<CreateOrderProps> = ({ 
    onSubmit, dailyCounter, creatorName, creatorEmployeeId, tools, terminals, wires, standards 
}) => {
  const [formData, setFormData] = useState({
    productName: '',
    productModel: '',
    productionOrderNo: '',
    toolNo: '', 
    terminalSpecId: '',
    wireSpecId: '',
  });

  const [generatedId, setGeneratedId] = useState('');
  const [standardPullForce, setStandardPullForce] = useState<number | ''>('');
  
  const activeTools = tools.filter(t => !t.isDisabled);
  const activeTerminals = terminals.filter(t => !t.isDisabled);
  const activeWires = wires.filter(w => !w.isDisabled);
  const activeStandards = standards.filter(s => !s.isDisabled);

  const selectedTerminal = activeTerminals.find(t => String(t.id) === formData.terminalSpecId);
  const selectedWire = activeWires.find(w => String(w.id) === formData.wireSpecId);

  useEffect(() => {
    if (formData.productionOrderNo) {
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                      (today.getMonth() + 1).toString().padStart(2, '0') + 
                      today.getDate().toString().padStart(2, '0');
      const counterStr = dailyCounter.toString().padStart(3, '0');
      setGeneratedId(`${formData.productionOrderNo}-${dateStr}-${counterStr}`);
    } else {
      setGeneratedId('等待输入生产工单号...');
    }
  }, [formData.productionOrderNo, dailyCounter]);

  useEffect(() => {
    if (formData.terminalSpecId && formData.wireSpecId && selectedTerminal && selectedWire) {
        const match = activeStandards.find(s => 
            s.method === selectedTerminal.method && 
            s.sectionArea === selectedWire.sectionArea
        );

        if (match) {
            setStandardPullForce(match.standardValue);
        } else {
            setStandardPullForce(0); 
        }
    } else {
        setStandardPullForce('');
    }
  }, [formData.terminalSpecId, formData.wireSpecId, selectedTerminal, selectedWire, activeStandards]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!formData.productionOrderNo || !formData.terminalSpecId || !formData.toolNo || !formData.wireSpecId) {
      alert("请填写完整信息");
      return;
    }

    const newOrder: ProductionOrder = {
      id: generatedId,
      productName: formData.productName,
      productModel: formData.productModel,
      productionOrderNo: formData.productionOrderNo,
      toolNo: formData.toolNo, 
      terminalSpecId: formData.terminalSpecId,
      wireSpecId: formData.wireSpecId,
      standardPullForce: Number(standardPullForce),
      creatorName: creatorName,
      creatorEmployeeId: creatorEmployeeId, // 关键：传入创建者ID
      createdAt: new Date().toISOString(),
      records: []
    };

    onSubmit(newOrder);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-5">
        
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium uppercase">系统生成编号</span>
            <span className="font-mono text-gray-700 font-semibold">{generatedId}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Input 
                label="产品名称" 
                name="productName" 
                placeholder="输入产品名称" 
                value={formData.productName} 
                onChange={handleChange}
            />
            <Input 
                label="产品型号" 
                name="productModel" 
                placeholder="输入产品型号" 
                value={formData.productModel} 
                onChange={handleChange}
            />
        </div>

        <div className="grid grid-cols-1 gap-4">
            <Input 
                label="生产工单号" 
                name="productionOrderNo" 
                placeholder="输入生产工单号" 
                value={formData.productionOrderNo} 
                onChange={handleChange}
            />
            <Select 
                label="压接工具" 
                name="toolNo" 
                value={formData.toolNo} 
                onChange={handleChange}
                options={activeTools.map(t => ({ 
                    value: String(t.id), 
                    label: `${t.model}  [${t.type}]` 
                }))}
            />
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        <div>
            <Select 
                label="端子规格 (物料)" 
                name="terminalSpecId"
                options={activeTerminals.map(t => ({ 
                    value: String(t.id), 
                    label: t.description ? t.description : t.name
                }))}
                value={formData.terminalSpecId}
                onChange={handleChange}
            />
            {selectedTerminal && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-1">
                    <div className="flex justify-between items-start border-b border-blue-200 pb-1 mb-1">
                        <span className="font-bold text-blue-900">{selectedTerminal.name}</span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-600">
                           {selectedTerminal.method === 1 ? '模压' : '坑压'}
                        </span>
                    </div>
                    <p className="text-xs text-blue-600 mb-0.5">编码: {selectedTerminal.materialCode}</p>
                    <p className="font-medium">{selectedTerminal.description || '暂无详细描述'}</p>
                </div>
            )}
        </div>

        <div>
            <Select 
                label="导线规格" 
                name="wireSpecId"
                options={activeWires.map(w => ({ value: String(w.id), label: w.displayName }))}
                value={formData.wireSpecId}
                onChange={handleChange}
            />
            {selectedWire && (
                 <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 px-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>截面积: <b>{selectedWire.sectionArea} mm²</b></span>
                 </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Input 
            label="标准拉力值 (N)" 
            value={standardPullForce} 
            disabled 
            placeholder="自动计算"
            className={`font-bold text-lg ${standardPullForce ? 'text-brand-600 bg-brand-50 border-brand-200' : 'bg-gray-50 text-gray-500'}`}
          />
           <Input 
            label="工作者" 
            value={creatorName} 
            disabled 
            className="bg-gray-50"
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 active:scale-95 transition-all fixed bottom-6 left-4 right-4 max-w-[calc(100%-2rem)] md:max-w-[416px] mx-auto z-20"
      >
        新增订单
      </button>
      <div className="h-12"></div> 
    </div>
  );
};