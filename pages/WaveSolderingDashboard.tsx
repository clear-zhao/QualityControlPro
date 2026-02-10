import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

interface WaveSolderingRecord {
  id: string;
  lineNo: string;
  boardModel: string;
  furnaceTemp: number;
  conveyorSpeed: number;
  operator: string;
  createdAt: string;
}

const STORAGE_KEY = 'qc_wave_soldering_records';

export const WaveSolderingDashboard: React.FC = () => {
  const [lineNo, setLineNo] = useState('');
  const [boardModel, setBoardModel] = useState('');
  const [furnaceTemp, setFurnaceTemp] = useState('');
  const [conveyorSpeed, setConveyorSpeed] = useState('');
  const [operator, setOperator] = useState('');
  const [records, setRecords] = useState<WaveSolderingRecord[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setRecords(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveRecords = (next: WaveSolderingRecord[]) => {
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = () => {
    if (!lineNo || !boardModel || !furnaceTemp || !conveyorSpeed || !operator) {
      alert('请先填写完整信息');
      return;
    }

    const record: WaveSolderingRecord = {
      id: crypto.randomUUID(),
      lineNo,
      boardModel,
      furnaceTemp: Number(furnaceTemp),
      conveyorSpeed: Number(conveyorSpeed),
      operator,
      createdAt: new Date().toISOString(),
    };

    saveRecords([record, ...records]);
    setLineNo('');
    setBoardModel('');
    setFurnaceTemp('');
    setConveyorSpeed('');
    setOperator('');
  };

  const passRate = useMemo(() => {
    if (!records.length) return '—';
    const passCount = records.filter((r) => r.furnaceTemp >= 240 && r.furnaceTemp <= 260 && r.conveyorSpeed >= 0.7 && r.conveyorSpeed <= 1.3).length;
    return `${Math.round((passCount / records.length) * 100)}%`;
  }, [records]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm mb-2">
        <h2 className="text-xl font-bold text-gray-900">波峰焊检验</h2>
        <p className="text-gray-500 text-sm mt-1">记录关键工艺参数并自动统计合格率</p>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">新增记录</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="线体编号" value={lineNo} onChange={(e) => setLineNo(e.target.value)} placeholder="例如：WS-01" />
          <Input label="板卡型号" value={boardModel} onChange={(e) => setBoardModel(e.target.value)} placeholder="例如：PCB-A12" />
          <Input label="炉温 (℃)" type="number" value={furnaceTemp} onChange={(e) => setFurnaceTemp(e.target.value)} placeholder="推荐 240~260" />
          <Input label="传送速度 (m/min)" type="number" step="0.1" value={conveyorSpeed} onChange={(e) => setConveyorSpeed(e.target.value)} placeholder="推荐 0.7~1.3" />
          <Input label="操作员" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="请输入姓名" />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 transition-colors">
            保存记录
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-gray-500">累计记录数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">当前合格率</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{passRate}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">参数规则</p>
          <p className="text-sm text-gray-700 mt-1">炉温 240~260℃，速度 0.7~1.3m/min</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">最近记录</h3>
        {records.length === 0 ? (
          <p className="text-sm text-gray-500">暂无数据，请先新增一条记录。</p>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 8).map((item) => {
              const passed = item.furnaceTemp >= 240 && item.furnaceTemp <= 260 && item.conveyorSpeed >= 0.7 && item.conveyorSpeed <= 1.3;
              return (
                <div key={item.id} className="border border-gray-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.lineNo} · {item.boardModel}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()} · 操作员：{item.operator}</p>
                  </div>
                  <div className="text-sm text-gray-700">炉温 {item.furnaceTemp}℃ / 速度 {item.conveyorSpeed}m/min</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {passed ? '参数合格' : '参数超限'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
