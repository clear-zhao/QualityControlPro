import React from 'react';
import { Card } from '../components/Card';
import { ProcessType } from '../types';

interface SpecialProcessMenuProps {
  onNavigate: (process: ProcessType) => void;
  onBack: () => void;
}

export const SpecialProcessMenu: React.FC<SpecialProcessMenuProps> = ({ onNavigate, onBack }) => {
  
  // 定义三个独立的子模块
  const modules = [
    {
      id: 'crimping',
      title: '压接端子',
      description: '端子拉力测试与记录',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.702.127 1.5.876.983 2.823-.441 3.625M15.123 7.85c.345.05.699.033 1.05-.05l6.082-1.226a2.219 2.219 0 00-1.847-3.662L18.4 4.55c-.53.13-1.07.247-1.595.429M14.719 7.425l-3.328 6.656" />
        </svg>
      ),
      target: ProcessType.TERMINAL_CRIMPING, // 只有这个已经实现
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      id: 'soldering',
      title: '波峰焊',
      description: '焊接温度与质量控制',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
        </svg>
      ),
      target: ProcessType.WAVE_SOLDERING,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
    },
    {
      id: 'coating',
      title: '三防涂覆',
      description: '涂覆厚度与均匀性',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      ),
      target: ProcessType.COATING,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-gray-500">
         <button onClick={onBack} className="text-sm flex items-center hover:text-gray-800">
            &larr; 返回工作台
         </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <h2 className="text-xl font-bold text-gray-900">特殊过程</h2>
        <p className="text-gray-500 text-sm mt-1">请选择具体的特殊生产工艺</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {modules.map((module) => (
          <Card 
            key={module.id} 
            onClick={() => module.target === ProcessType.TERMINAL_CRIMPING ? onNavigate(module.target) : alert(`${module.title} 模块正在开发中`)}
            className={`flex items-center gap-5 p-5 border-l-4 hover:shadow-md transition-all ${module.color}`}
          >
            <div className={`p-3 rounded-full bg-white bg-opacity-60`}>
              {module.icon}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">{module.title}</h4>
              <p className="text-sm text-gray-600 opacity-80">{module.description}</p>
            </div>
            <div className="ml-auto text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};