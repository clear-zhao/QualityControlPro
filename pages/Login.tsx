import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api'; 
import { Input } from '../components/Input';
import { Select } from '../components/Select';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userList, setUserList] = useState<{id: number, name: string}[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await api.getUsers();
        setUserList(users);
      } catch (err: any) {
        setError("无法加载员工名单，请检查服务器连接");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = async () => {
    if(!selectedUserId || !password) {
        setError("请选择员工姓名并输入密码");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await api.login(selectedUserId, password);
      if (autoLogin) {
        localStorage.setItem('qc_user_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('qc_user_session');
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || '登录失败，密码可能错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">成通检验</h1>
          <p className="text-sm text-gray-500 mt-2">请选择员工姓名并输入密码</p>
        </div>

        <div className="space-y-4">
            <Select 
                label="员工姓名"
                name="selectedUserId"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                disabled={isLoadingUsers || isLoading}
                options={userList.map(u => ({ 
                    value: String(u.id), 
                    label: u.name 
                }))}
                placeholder={isLoadingUsers ? "正在加载员工列表..." : "请选择您的姓名"}
            />
            
            <Input 
                label="登录密码" 
                type={showPassword ? "text" : "password"}
                placeholder="请输入您的密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                }
            />
            
            <div className="flex items-center gap-2 px-1">
                <input 
                    type="checkbox" 
                    id="autoLogin" 
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="autoLogin" className="text-sm text-gray-600 select-none">下次自动登录</label>
            </div>
        </div>

        {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center font-medium animate-pulse">{error}</div>}

        <button 
            onClick={handleLogin}
            disabled={isLoading || isLoadingUsers}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95
                ${isLoading || isLoadingUsers ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'}`}
        >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>正在验证...</span>
              </div>
            ) : '进入系统'}
        </button>
      </div>
    </div>
  );
};