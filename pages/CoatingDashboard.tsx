import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

interface CoatingRecord {
  id: string;
  stationNo: string;
  batchNo: string;
  thickness: number;
  uniformity: number;
  inspector: string;
  createdAt: string;
}

const STORAGE_KEY = 'qc_coating_records';

export const CoatingDashboard: React.FC = () => {
  const [stationNo, setStationNo] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [thickness, setThickness] = useState('');
  const [uniformity, setUniformity] = useState('');
  const [inspector, setInspector] = useState('');
  const [records, setRecords] = useState<CoatingRecord[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setRecords(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveRecords = (next: CoatingRecord[]) => {
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = () => {
    if (!stationNo || !batchNo || !thickness || !uniformity || !inspector) {
      alert('请先填写完整信息');
      return;
    }

    const record: CoatingRecord = {
      id: crypto.randomUUID(),
      stationNo,
      batchNo,
      thickness: Number(thickness),
      uniformity: Number(uniformity),
      inspector,
      createdAt: new Date().toISOString(),
    };

    saveRecords([record, ...records]);
    setStationNo('');
    setBatchNo('');
    setThickness('');
    setUniformity('');
    setInspector('');
  };

  const qualifiedCount = useMemo(
    () => records.filter((r) => r.thickness >= 30 && r.thickness <= 60 && r.uniformity >= 90).length,
    [records],
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm mb-2">
        <h2 className="text-xl font-bold text-gray-900">三防涂覆检验</h2>
        <p className="text-gray-500 text-sm mt-1">追踪涂层厚度与均匀性，快速定位异常批次</p>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">新增记录</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="工位编号" value={stationNo} onChange={(e) => setStationNo(e.target.value)} placeholder="例如：CT-03" />
          <Input label="批次号" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="例如：BATCH-2407" />
          <Input label="涂层厚度 (μm)" type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="推荐 30~60" />
          <Input label="均匀性 (%)" type="number" value={uniformity} onChange={(e) => setUniformity(e.target.value)} placeholder="需 ≥ 90" />
          <Input label="检验员" value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder="请输入姓名" />
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
          <p className="text-xs text-gray-500">合格批次</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{qualifiedCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">参数规则</p>
          <p className="text-sm text-gray-700 mt-1">厚度 30~60μm，均匀性 ≥90%</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">最近记录</h3>
        {records.length === 0 ? (
          <p className="text-sm text-gray-500">暂无数据，请先新增一条记录。</p>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 8).map((item) => {
              const passed = item.thickness >= 30 && item.thickness <= 60 && item.uniformity >= 90;
              return (
                <div key={item.id} className="border border-gray-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.stationNo} · {item.batchNo}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()} · 检验员：{item.inspector}</p>
                  </div>
                  <div className="text-sm text-gray-700">厚度 {item.thickness}μm / 均匀性 {item.uniformity}%</div>
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
