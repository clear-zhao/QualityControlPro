import React from 'react';
import { Card } from '../components/Card';
import { ProcessType } from '../types';

interface DashboardProps {
  onNavigate: (process: ProcessType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const menuItems = [
    {
      title: '常规过程检验',
      subtitle: '板卡装配 / 焊接 / 机柜',
      color: 'bg-blue-500',
      active: false,
    },
    {
      title: '高低温试验',
      subtitle: '试验通知单 / 记录',
      color: 'bg-indigo-500',
      active: false,
    },
    {
      title: '特殊过程类',
      subtitle: '压接端子 / 波峰焊 / 三防',
      color: 'bg-brand-600',
      // 这里修改为指向新的子菜单，而不是直接进压接端子
      type: ProcessType.SPECIAL_PROCESS_MENU, 
      active: true,
    },
    {
      title: '整机出厂测试',
      subtitle: '暂不考虑',
      color: 'bg-gray-400',
      active: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <h2 className="text-xl font-bold text-gray-900">工作台</h2>
        <p className="text-gray-500 text-sm mt-1">欢迎回来，请选择检验流程</p>
      </div>

      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider ml-1">检验分类</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {menuItems.map((item, idx) => (
          <Card 
            key={idx} 
            onClick={() => item.active && item.type ? onNavigate(item.type) : alert("此功能模块暂未开放")}
            className="flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm ${item.color}`}>
              <span className="font-bold text-lg">{idx + 1}</span>
            </div>
            <div>
              <h4 className={`font-semibold ${item.active ? 'text-gray-900' : 'text-gray-400'}`}>
                {item.title}
              </h4>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </div>
            {item.active && (
              <div className="ml-auto text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};