import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { CrimpingDashboard } from './pages/TerminalCrimping/CrimpingDashboard';
import { SpecialProcessMenu } from './pages/SpecialProcessMenu'; 
import { WaveSolderingDashboard } from './pages/WaveSolderingDashboard';
import { CoatingDashboard } from './pages/CoatingDashboard';
import { ProcessType, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentProcess, setCurrentProcess] = useState<ProcessType | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 检查自动登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('qc_user_session');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("解析本地会话失败", e);
        localStorage.removeItem('qc_user_session');
      }
    }
    setIsInitializing(false);
  }, []);

  // 如果正在初始化，显示一个简单的加载页，避免登录页闪烁
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderContent = () => {
    if (!currentProcess) {
      return <Dashboard onNavigate={setCurrentProcess} />;
    }

    switch (currentProcess) {
      case ProcessType.SPECIAL_PROCESS_MENU:
        return (
            <SpecialProcessMenu 
                onNavigate={setCurrentProcess} 
                onBack={() => setCurrentProcess(null)} 
            />
        );
      
      case ProcessType.TERMINAL_CRIMPING:
        return <CrimpingDashboard currentUser={user} />;

      case ProcessType.WAVE_SOLDERING:
        return <WaveSolderingDashboard />;

      case ProcessType.COATING:
        return <CoatingDashboard />;
      
      default:
        return (
          <div className="text-center py-10">
            <p className="text-gray-500">该模块正在开发中...</p>
            <button 
                onClick={() => setCurrentProcess(null)}
                className="mt-4 text-brand-600 underline"
            >
                返回首页
            </button>
          </div>
        );
    }
  };

  const getTitle = () => {
      if (!currentProcess) return "检验过程记录";
      if (currentProcess === ProcessType.SPECIAL_PROCESS_MENU) return "特殊过程";
      if (currentProcess === ProcessType.TERMINAL_CRIMPING) return "压接端子检验";
      if (currentProcess === ProcessType.WAVE_SOLDERING) return "波峰焊检验";
      if (currentProcess === ProcessType.COATING) return "三防涂覆检验";
      return "未知模块";
  };

  const handleLogout = () => {
    // 退出时清除自动登录信息
    localStorage.removeItem('qc_user_session');
    setUser(null);
    setCurrentProcess(null);
  };

  return (
    <Layout 
      title={getTitle()}
      showBack={!!currentProcess}
      onBack={() => {
          if (
            currentProcess === ProcessType.TERMINAL_CRIMPING ||
            currentProcess === ProcessType.WAVE_SOLDERING ||
            currentProcess === ProcessType.COATING
          ) {
              setCurrentProcess(ProcessType.SPECIAL_PROCESS_MENU);
          } else {
              setCurrentProcess(null);
          }
      }}
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
