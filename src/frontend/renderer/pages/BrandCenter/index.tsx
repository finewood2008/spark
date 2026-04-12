/**
 * BrandCenter/index.tsx - 品牌中心（重构版）
 * 
 * 三个 Tab：视觉资产 / 品牌字典 / VI 超市
 * 顶部：品牌切换器 + 品牌完整度
 */
import React, { useState } from 'react';
import { useBrandStore, Brand } from '../../store/brandStore';
import { BrandSwitcher } from './BrandSwitcher';
import { TabVisual } from './TabVisual';
import { TabDictionary } from './TabDictionary';
import { TabMarket } from './market';

type TabId = 'visual' | 'dictionary' | 'market';

const tabs: { id: TabId; label: string }[] = [
  { id: 'visual',     label: '视觉资产' },
  { id: 'dictionary', label: '品牌字典' },
  { id: 'market',     label: 'VI 超市' },
];

export function BrandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>('dictionary');
  const { brands, activeBrandId, getActiveBrand, switchBrand, createBrand, deleteBrand } = useBrandStore();
  const activeBrand = getActiveBrand();

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* 顶部：品牌切换器 + 完整度 */}
      <div className="px-8 pt-6 pb-0 shrink-0">
        <BrandSwitcher
          brands={brands}
          activeBrandId={activeBrandId}
          onSwitch={switchBrand}
          onCreate={createBrand}
          onDelete={deleteBrand}
        />

        {/* 品牌完整度指示器 */}
        {activeBrand && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-5">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: activeBrand.brandColor }}>
                {activeBrand.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{activeBrand.name}</div>
                <div className="text-[11px] text-gray-400">当前激活品牌</div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-500">品牌完整度</span>
                <span className="text-[11px] font-bold text-gray-700">{activeBrand.completeness}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${activeBrand.completeness}%`,
                    background: activeBrand.completeness < 30
                      ? 'linear-gradient(90deg, #FFB347, #FF9F1C)'
                      : activeBrand.completeness < 70
                        ? 'linear-gradient(90deg, #FF9F1C, #FF6B35)'
                        : 'linear-gradient(90deg, #FF6B35, #E85A20)',
                  }}
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-400 shrink-0 max-w-[180px]">
              {activeBrand.completeness < 30 && '火花正在了解你的品牌，先聊聊基本信息'}
              {activeBrand.completeness >= 30 && activeBrand.completeness < 70 && '不错，火花已经有了初步理解，继续完善'}
              {activeBrand.completeness >= 70 && activeBrand.completeness < 100 && '快好了，确认一下 AI 生成的内容'}
              {activeBrand.completeness === 100 && '火花已经完全理解你的品牌，开始创作吧'}
            </div>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="px-8 pt-5 shrink-0">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5
                ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeBrand ? (
          <>
            {activeTab === 'visual' && <TabVisual brand={activeBrand} />}
            {activeTab === 'dictionary' && <TabDictionary brand={activeBrand} />}
            {activeTab === 'market' && <TabMarket />}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-300"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <div className="text-lg font-medium mb-2">还没有品牌</div>
              <div className="text-sm">点击上方「新建品牌」开始创建你的第一个品牌</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
