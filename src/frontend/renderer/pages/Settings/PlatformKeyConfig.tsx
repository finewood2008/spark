import React, { useState, useEffect } from 'react';

export function PlatformKeyConfig() {
  const [token, setToken] = useState('');
  const [teamId, setTeamId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 组件挂载时尝试从 localStorage 还原之前的输入
    const storedToken = localStorage.getItem('QEECLAW_TOKEN') || '';
    const storedTeamId = localStorage.getItem('QEECLAW_TEAM_ID') || '';
    setToken(storedToken);
    setTeamId(storedTeamId);
  }, []);

  const handleSave = async () => {
    localStorage.setItem('QEECLAW_TOKEN', token);
    localStorage.setItem('QEECLAW_TEAM_ID', teamId);
    
    // 通知主进程重启 QeeClaw Bridge 实例并注入 Key
    if (window.spark?.agent?.updatePlatformConfig) {
      await window.spark.agent.updatePlatformConfig({ token, teamId });
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // 强制触发一次全部数据重载
    if (window.location) {
        setTimeout(() => window.location.reload(), 500);
    }
  };

  return (
    <div className="card mb-6 border-[#FF6B35]/20 shadow-sm">
      <div className="card-header border-b border-[#FF6B35]/10 bg-[#FF6B35]/[0.02]">
        <h3 className="card-title text-[#FF6B35] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
          绑定云端工作台 (QeeClaw)
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          连接到企业版平台，解锁品牌大脑库、账单以及团队协同能力。
        </p>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">平台 Access Token</label>
          <input 
            type="password" 
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            placeholder="qct_..."
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">所属 Team ID</label>
          <input 
            type="text" 
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            placeholder="数字ID，例如: 10001"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="btn bg-[#FF6B35] text-white hover:bg-[#e85a20] text-xs px-4"
          >
            {saved ? '正在重新连接...' : '保存并连接云端'}
          </button>
          <span className="text-xs text-gray-400">设置后系统会重载以生效</span>
        </div>
      </div>
    </div>
  );
}
