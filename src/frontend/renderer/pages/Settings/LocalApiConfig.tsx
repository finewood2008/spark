import React, { useState, useEffect } from 'react';

export function LocalApiConfig() {
  const [proxyUrl, setProxyUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 组件挂载时从 localStorage 读取配置
    const storedProxy = localStorage.getItem('SPARK_PROXY_URL') || 'https://gemini-proxy.finewood2008.workers.dev/v1';
    const storedKey = localStorage.getItem('SPARK_API_KEY') || 'gemini-proxy-no-key-needed';
    const storedModel = localStorage.getItem('SPARK_MODEL') || 'gemini-3.1-pro-preview';
    
    setProxyUrl(storedProxy);
    setApiKey(storedKey);
    setModel(storedModel);
    
    // 初始化同步给主进程
    window.spark?.agent?.updateConfig?.({ 
      proxyUrl: storedProxy, 
      apiKey: storedKey, 
      model: storedModel 
    });
  }, []);

  const handleSave = async () => {
    localStorage.setItem('SPARK_PROXY_URL', proxyUrl);
    localStorage.setItem('SPARK_API_KEY', apiKey);
    localStorage.setItem('SPARK_MODEL', model);
    
    // 通知主进程更新
    if (window.spark?.agent?.updateConfig) {
      await window.spark.agent.updateConfig({ proxyUrl, apiKey, model });
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card mt-6">
      <div className="card-header border-b border-gray-100">
        <h3 className="card-title">本地大模型直连配置</h3>
        <p className="text-xs text-gray-500 mt-1">
          当云端平台离线时，应用将使用这里的配置直接请求大模型
        </p>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">API Base URL (代理地址)</label>
          <input 
            type="text" 
            value={proxyUrl}
            onChange={e => setProxyUrl(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            placeholder="https://gemini-proxy.finewood2008.workers.dev/v1"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            placeholder="如果不填默认为 gemini-proxy-no-key-needed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">默认模型名称</label>
          <input 
            type="text" 
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            placeholder="gemini-3.1-pro-preview"
          />
        </div>

        <div className="pt-2">
          <button 
            onClick={handleSave}
            className="btn btn-primary text-xs px-4"
          >
            {saved ? '已保存' : '保存本地配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
