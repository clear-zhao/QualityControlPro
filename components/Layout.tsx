import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showBack, 
  onBack,
  user,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200">
      {/* Header */}
      {/* Added pt-safe to support top notch/status bar area specifically for native app feel */}
      <header className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 pt-safe">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={onBack} className="p-1 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px]">{title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900">{user.name}</p>
                <p className="text-[10px] text-gray-500">{user.role === UserRole.EMPLOYEE ? '员工' : '检验员'}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="退出登录"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
        {children}
      </main>
    </div>
  );
};