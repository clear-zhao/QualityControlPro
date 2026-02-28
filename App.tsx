import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { CrimpingDashboard } from './pages/TerminalCrimping/CrimpingDashboard';
import { SpecialProcessMenu } from './pages/SpecialProcessMenu'; 
import { ProcessType, User } from './types';
import { AUTH_LOGOUT_EVENT, api } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentProcess, setCurrentProcess] = useState<ProcessType | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 检查自动登录状态 (App启动时验证 Token)
  useEffect(() => {
    const checkAutoLogin = async () => {
        const savedSession = localStorage.getItem('qc_user_session') || sessionStorage.getItem('qc_user_session');
        
        if (savedSession) {
            try {
                const localUser = JSON.parse(savedSession) as User;
                
                // 只有当本地存储包含 token 时才去验证
                if (localUser.username && localUser.token) {
                    try {
                        // 调用后端验证 Token 是否过期或被顶号
                        const verifiedUser = await api.checkToken(localUser.username, localUser.token);
                        setUser(verifiedUser);
                        // 更新本地存储（保持最新信息）
                        if (localStorage.getItem('qc_user_session')) {
                            localStorage.setItem('qc_user_session', JSON.stringify(verifiedUser));
                        } else {
                            sessionStorage.setItem('qc_user_session', JSON.stringify(verifiedUser));
                        }
                    } catch (e) {
                        // 验证失败 (后端返回 401 或其他错误)
                        console.warn("自动登录验证失败:", e);
                        
                        // 移除这里的 alert，因为：
                        // 1. 如果是 401 (过期/顶号)，api.ts 会触发全局事件，下方监听器会弹窗提示。
                        // 2. 如果是网络错误，静默失败跳转登录页体验更好。
                        
                        // 清除失效的会话
                        localStorage.removeItem('qc_user_session');
                        sessionStorage.removeItem('qc_user_session');
                    }
                } else {
                    // 旧版本数据没有 token，清除并要求重新登录
                    localStorage.removeItem('qc_user_session');
                    sessionStorage.removeItem('qc_user_session');
                }
            } catch (e) {
                console.error("解析本地会话失败", e);
                localStorage.removeItem('qc_user_session');
                sessionStorage.removeItem('qc_user_session');
            }
        }
        setIsInitializing(false);
    };

    checkAutoLogin();
  }, []);

  // 监听全局登出事件 (处理异地登录/Token过期 - 运行时)
  useEffect(() => {
    const handleForcedLogout = (e: Event) => {
        const customEvent = e as CustomEvent;
        const msg = customEvent.detail || "您的账号已在其他设备登录或会话已过期，请重新登录。";
        // 如果当前有用户登录(或本地有缓存)，才提示
        if (localStorage.getItem('qc_user_session') || sessionStorage.getItem('qc_user_session') || user) {
            alert(msg);
        }
        localStorage.removeItem('qc_user_session');
        sessionStorage.removeItem('qc_user_session');
        setUser(null);
        setCurrentProcess(null);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);

    return () => {
        window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    };
  }, [user]);

  // 如果正在初始化，显示一个简单的加载页，避免登录页闪烁
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-3">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        <p className="text-gray-400 text-sm">正在验证身份...</p>
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
      return "未知模块";
  };

  const handleLogout = () => {
    // 退出时清除自动登录信息
    localStorage.removeItem('qc_user_session');
    sessionStorage.removeItem('qc_user_session');
    setUser(null);
    setCurrentProcess(null);
  };

  return (
    <Layout 
      title={getTitle()}
      showBack={!!currentProcess}
      onBack={() => {
          if (currentProcess === ProcessType.TERMINAL_CRIMPING) {
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