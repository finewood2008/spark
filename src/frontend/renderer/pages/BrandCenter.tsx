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
  { id: 'vi_1', name: '极简咖啡馆', style: '日式冷淡 / 温暖木质', price: '¥99.00', color: '#8B5A2B', tags: ['餐饮', '咖啡', '原木风'], creator: 'Spark 官方', sales: 128 },
  { id: 'vi_2', name: '赛博电竞馆', style: '高饱和度 / 霓虹', price: '¥199.00', color: '#00FF00', tags: ['娱乐', '电竞', '科技'], creator: '设计师 @Neo', sales: 45 },
  { id: 'vi_3', name: '独立设计师服饰', style: '黑白灰 / 粗野主义', price: '¥149.00', color: '#333333', tags: ['零售', '服饰', '先锋'], creator: 'Spark 官方', sales: 312 },
  { id: 'vi_4', name: '亲子游乐园', style: '高明度 / 糖果色', price: '¥129.00', color: '#FFB6C1', tags: ['教育', '母婴', '活泼'], creator: '设计师 @Momo', sales: 89 },
  { id: 'vi_5', name: '新中式茶饮', style: '古典 / 禅意', price: '¥159.00', color: '#556B2F', tags: ['餐饮', '茶饮', '国风'], creator: 'Spark 官方', sales: 500 },
  { id: 'vi_6', name: '科技互联网', style: '扁平化 / 现代', price: '¥89.00', color: '#1E90FF', tags: ['科技', '软件', '现代'], creator: 'Spark 官方', sales: 210 },
];

export function BrandCenter() {
  const [activeTab, setActiveTab] = useState<'my_brands' | 'market'>('my_brands');
  const [brands, setBrands] = useState(mockBrands);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部'); // 市场分类筛选器
  const categories = ['全部', '餐饮', '零售', '娱乐', '科技', '教育'];

  // 过滤后的超市商品
  const filteredMarketItems = selectedCategory === '全部' 
    ? viMarketItems 
    : viMarketItems.filter(item => item.tags.includes(selectedCategory));

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
             {/* 顶部 Banner */}
             <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-10 mb-8 text-white flex justify-between items-center shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center space-x-2 mb-3">
                     <span className="px-2.5 py-1 bg-[#FF6B35] text-white text-xs font-bold rounded-lg tracking-wider">NEW</span>
                     <span className="text-gray-300 text-sm">火花官方商城</span>
                   </div>
                   <h2 className="text-3xl font-bold mb-3 text-white">一键注入<span className="text-[#FFB347]">大师级品牌灵魂</span></h2>
                   <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                     包含高清 Logo 源文件、标准中英文字体组合、品牌潘通色值表、排版规范模板。<br/>
                     购买后立即生成您的专属“AI 大脑”，让后续的所有海报、文案都能完美延续该设计美学。
                   </p>
                </div>
                <div className="text-8xl opacity-10 absolute right-10 -bottom-4 transform rotate-12">🛒</div>
                {/* 装饰性背景光晕 */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FF6B35] rounded-full filter blur-[100px] opacity-20"></div>
             </div>

             {/* 分类筛选器 */}
             <div className="flex items-center space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                     ${selectedCategory === cat 
                       ? 'bg-gray-900 text-white shadow-md' 
                       : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                     }`}
                 >
                   {cat}
                 </button>
               ))}
               <div className="w-px h-6 bg-gray-200 mx-2"></div>
               <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                 更多筛选
               </button>
             </div>

             {/* 商品网格 */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMarketItems.map(vi => (
                   <div key={vi.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col hover:-translate-y-1">
                      
                      {/* 商品首图占位区 */}
                      <div className="h-48 w-full relative flex flex-col items-center justify-center p-6" style={{ backgroundColor: `${vi.color}15` }}>
                         {/* 模拟的海报/Logo 排版效果 */}
                         <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-gray-700 flex items-center shadow-sm">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-[#FF6B35]" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                           {vi.sales} 人已购买
                         </div>
                         <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center font-serif text-2xl font-bold mb-3 transform group-hover:scale-110 transition-transform duration-500" style={{ color: vi.color }}>
                           {vi.name.charAt(0)}
                         </div>
                         <div className="flex space-x-1 mt-auto">
                           {/* 模拟的色卡 */}
                           <div className="w-6 h-6 rounded border border-white shadow-sm" style={{ backgroundColor: vi.color }}></div>
                           <div className="w-6 h-6 rounded border border-white shadow-sm" style={{ backgroundColor: `${vi.color}80` }}></div>
                           <div className="w-6 h-6 rounded border border-white shadow-sm" style={{ backgroundColor: '#ffffff' }}></div>
                           <div className="w-6 h-6 rounded border border-white shadow-sm" style={{ backgroundColor: '#111111' }}></div>
                         </div>
                      </div>
                      
                      {/* 商品信息区 */}
                      <div className="p-6 flex flex-col flex-1">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-1.5">
                              <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px]">👤</span>
                              <span className="text-[11px] text-gray-500 font-medium">{vi.creator}</span>
                           </div>
                           <div className="flex gap-1">
                              {vi.tags.slice(0, 2).map(tag => (
                                 <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded border border-gray-100">{tag}</span>
                              ))}
                           </div>
                         </div>
                         
                         <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight group-hover:text-[#FF6B35] transition-colors">{vi.name}</h3>
                         <p className="text-xs text-gray-500 mb-5">{vi.style}</p>
                         
                         <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 line-through mb-0.5">¥{Number(vi.price.replace('¥', '')) * 2}.00</span>
                              <span className="text-2xl font-bold text-[#FF6B35] leading-none">{vi.price}</span>
                            </div>
                            <button 
                              onClick={() => handleBuyVI(vi)}
                              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#FF6B35] hover:shadow-lg hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-orange-100"
                            >
                               一键导入
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             
             {filteredMarketItems.length === 0 && (
               <div className="py-20 text-center text-gray-400">
                 <div className="text-4xl mb-4">🔍</div>
                 <p>抱歉，没有找到该分类下的视觉方案，试试其他分类吧。</p>
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
}