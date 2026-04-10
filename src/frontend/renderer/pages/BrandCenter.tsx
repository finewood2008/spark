/**
 * BrandCenter.tsx - 品牌资产中心 & VI 超市
 * 允许用户管理多个品牌实体，并在 VI 超市中购买/导入成套预设方案
 */
import React, { useState } from 'react';

// 模拟的本地多品牌数据结构
const mockBrands = [
  { id: 'brand_coffee', name: 'Manner Coffee (示例)', active: true, color: '#F18F01', logo: '☕️', type: 'coffee' },
  { id: 'brand_tech', name: 'Spark Tech', active: false, color: '#FF6B35', logo: '⚡', type: 'tech' },
];

// 模拟的 VI 超市商品列表
const viMarketItems = [
  { id: 'vi_1', name: '极简咖啡馆', style: '日式冷淡 / 温暖木质', price: '¥99.00', color: '#8B5A2B', tags: ['餐饮', '咖啡', '原木风'] },
  { id: 'vi_2', name: '赛博电竞馆', style: '高饱和度 / 霓虹', price: '¥199.00', color: '#00FF00', tags: ['娱乐', '电竞', '科技'] },
  { id: 'vi_3', name: '独立设计师服饰', style: '黑白灰 / 粗野主义', price: '¥149.00', color: '#333333', tags: ['零售', '服饰', '先锋'] },
  { id: 'vi_4', name: '亲子游乐园', style: '高明度 / 糖果色', price: '¥129.00', color: '#FFB6C1', tags: ['教育', '母婴', '活泼'] },
];

export function BrandCenter() {
  const [activeTab, setActiveTab] = useState<'my_brands' | 'market'>('my_brands');
  const [brands, setBrands] = useState(mockBrands);

  // 切换激活的品牌
  const handleActivateBrand = (id: string) => {
    setBrands(brands.map(b => ({ ...b, active: b.id === id })));
  };

  // 模拟购买并导入 VI
  const handleBuyVI = (vi: typeof viMarketItems[0]) => {
    if (window.confirm(`确认使用微信/支付宝支付 ${vi.price} 购买【${vi.name}】全套视觉方案吗？`)) {
      setBrands(prev => [
        { 
          id: `brand_${Date.now()}`, 
          name: `${vi.name} (导入)`, 
          active: false, 
          color: vi.color, 
          logo: '📦', 
          type: 'imported' 
        },
        ...prev
      ]);
      alert('购买成功！已添加到您的品牌列表中。您现在可以激活它并交由 AI 二次创作了。');
      setActiveTab('my_brands');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon bg-orange-100 text-[#FF6B35] border-orange-200">💎</span>
          <div>
            <div className="page-title">品牌矩阵与 VI 超市</div>
            <div className="page-subtitle">管理多个商业实体，或购买即插即用的全套视觉方案</div>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'my_brands' && <button className="btn btn-primary">+ 新建空白品牌</button>}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'my_brands' ? 'active' : ''}`} 
          onClick={() => setActiveTab('my_brands')}
        >
          我的品牌实体
        </button>
        <button 
          className={`tab-btn ${activeTab === 'market' ? 'active font-bold text-[#FF6B35]' : ''}`} 
          onClick={() => setActiveTab('market')}
        >
          🛍️ VI 方案超市
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl">
        
        {/* 我的品牌列表视图 */}
        {activeTab === 'my_brands' && (
          <div className="animate-fade-in grid grid-cols-2 gap-6">
            {brands.map(brand => (
              <div 
                key={brand.id} 
                className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
                  brand.active 
                    ? 'border-[#FF6B35] shadow-[0_8px_30px_rgba(255,107,53,0.12)]' 
                    : 'border-gray-100 hover:border-gray-300 shadow-sm'
                }`}
              >
                {brand.active && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[#FF6B35] text-white text-xs font-bold rounded-full">
                    当前激活
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-gray-100" style={{ backgroundColor: `${brand.color}15` }}>
                    {brand.logo}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: brand.color }}></span>
                      主品牌色
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">已沉淀 RAG 知识</p>
                      <p className="text-sm font-bold text-gray-700">12 份文档</p>
                   </div>
                   <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">视觉资产文件</p>
                      <p className="text-sm font-bold text-gray-700">38 个</p>
                   </div>
                </div>

                <div className="flex space-x-3">
                  {!brand.active && (
                    <button 
                      onClick={() => handleActivateBrand(brand.id)}
                      className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      切换到此品牌
                    </button>
                  )}
                  {brand.active && (
                    <button className="flex-1 py-2.5 bg-orange-50 text-[#FF6B35] text-sm font-bold rounded-xl cursor-default">
                      Agent 正在为此品牌服务中
                    </button>
                  )}
                  <button className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    设置
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VI 超市视图 */}
        {activeTab === 'market' && (
          <div className="animate-fade-in">
             <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 mb-8 text-white flex justify-between items-center shadow-xl">
                <div>
                   <h2 className="text-2xl font-bold mb-2 text-[#FFB347]">火花视觉灵感超市</h2>
                   <p className="text-gray-400 text-sm max-w-md">购买即拿走。包含高清 Logo、标准字、标准色、名片/海报排版模板文件，买完即刻导入当前 AI 大脑，随意更改二次创作。</p>
                </div>
                <div className="text-6xl opacity-50">🛒</div>
             </div>

             <div className="grid grid-cols-3 gap-6">
                {viMarketItems.map(vi => (
                   <div key={vi.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                      {/* 占位：如果是真实项目，这里应该是一张展示整体VI质感的海报图 */}
                      <div className="h-40 w-full relative flex items-center justify-center" style={{ backgroundColor: `${vi.color}20` }}>
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90"></div>
                         <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center font-serif text-xl font-bold" style={{ color: vi.color }}>
                           Logo
                         </div>
                      </div>
                      
                      <div className="p-5">
                         <div className="flex flex-wrap gap-1 mb-3">
                            {vi.tags.map(tag => (
                               <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">{tag}</span>
                            ))}
                         </div>
                         <h3 className="text-lg font-bold text-gray-900 mb-1">{vi.name}</h3>
                         <p className="text-xs text-gray-500 mb-4">{vi.style}</p>
                         
                         <div className="flex items-center justify-between mt-auto">
                            <span className="text-xl font-bold text-[#FF6B35]">{vi.price}</span>
                            <button 
                              onClick={() => handleBuyVI(vi)}
                              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                               购买并导入
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}