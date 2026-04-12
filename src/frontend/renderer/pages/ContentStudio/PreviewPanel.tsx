/**
 * PreviewPanel - 多平台预览面板
 * 
 * 右侧实时预览各平台的展示效果
 * 可切换平台查看适配后的内容
 */
import React, { useState } from 'react';
import { ArticleDraft, TargetPlatform, PLATFORM_LIST } from './types';

interface PreviewPanelProps {
  draft: ArticleDraft | null;
  onPushToPublish: (platform: TargetPlatform) => void;
  onPushAllToPublish: () => void;
}

function getPlainText(draft: ArticleDraft): string {
  return draft.blocks
    .filter(b => b.type === 'text')
    .map(b => b.content)
    .join('\n\n');
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

/** 公众号预览 */
function WechatPreview({ draft }: { draft: ArticleDraft }) {
  const body = getPlainText(draft);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[9px] font-bold">公</div>
        <span className="text-[11px] text-gray-500">微信公众号</span>
      </div>
      {draft.coverImage && (
        <img src={draft.coverImage} alt="" className="w-full aspect-[2.35/1] object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-gray-800 leading-snug mb-2">{truncate(draft.title, 64)}</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-4">{truncate(body, 120)}</p>
      </div>
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">阅读原文</span>
        <div className="flex gap-3 text-[10px] text-gray-400">
          <span>❤️ 0</span>
          <span>👁 0</span>
        </div>
      </div>
    </div>
  );
}

/** 小红书预览 */
function XhsPreview({ draft }: { draft: ArticleDraft }) {
  const body = getPlainText(draft);
  const images = draft.blocks.filter(b => b.type === 'image' && b.content);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold">红</div>
        <span className="text-[11px] text-gray-500">小红书</span>
      </div>
      {/* 图片区 */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center">
        {images.length > 0 && images[0].content ? (
          <img src={images[0].content} alt="" className="w-full h-full object-cover" />
        ) : draft.coverImage ? (
          <img src={draft.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] text-gray-300">封面图</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-[13px] font-bold text-gray-800 mb-1">{truncate(draft.title, 100)}</h3>
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{truncate(body, 200)}</p>
      </div>
      <div className="px-3 pb-3 flex gap-2">
        <span className="text-[10px] text-gray-400">❤️ 0</span>
        <span className="text-[10px] text-gray-400">⭐ 0</span>
        <span className="text-[10px] text-gray-400">💬 0</span>
      </div>
    </div>
  );
}

/** 微博预览 */
function WeiboPreview({ draft }: { draft: ArticleDraft }) {
  const body = getPlainText(draft);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-bold">博</div>
        <span className="text-[11px] text-gray-500">微博</span>
      </div>
      <div className="p-4">
        <p className="text-[13px] text-gray-700 leading-relaxed">{truncate(body, 140)}</p>
        {draft.coverImage && (
          <img src={draft.coverImage} alt="" className="w-full rounded-lg mt-3 aspect-[16/9] object-cover" />
        )}
      </div>
      <div className="px-4 pb-3 flex gap-4 text-[10px] text-gray-400">
        <span>转发</span><span>评论</span><span>赞</span>
      </div>
    </div>
  );
}

/** 通用预览 */
function GenericPreview({ draft, platform }: { draft: ArticleDraft; platform: typeof PLATFORM_LIST[number] }) {
  const body = getPlainText(draft);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-white text-[9px] font-bold">{platform.icon}</div>
        <span className="text-[11px] text-gray-500">{platform.name}</span>
      </div>
      <div className="p-4">
        <h3 className="text-[13px] font-bold text-gray-800 mb-2">{truncate(draft.title, platform.maxTitle || 100)}</h3>
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-4">{truncate(body, Math.min(platform.maxBody, 300))}</p>
      </div>
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {platform.features.map(f => (
            <span key={f} className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PreviewPanel({ draft, onPushToPublish, onPushAllToPublish }: PreviewPanelProps) {
  const [activePlatform, setActivePlatform] = useState<TargetPlatform | 'all'>('all');

  if (!draft) {
    return (
      <div className="w-[280px] border-l border-gray-100 bg-white flex items-center justify-center shrink-0">
        <div className="text-center px-6">
          <p className="text-[12px] text-gray-400">生成内容后</p>
          <p className="text-[12px] text-gray-400">这里会显示各平台预览</p>
        </div>
      </div>
    );
  }

  const selectedPlatforms = PLATFORM_LIST.filter(p => draft.platforms.includes(p.platform));

  const renderPreview = (platform: typeof PLATFORM_LIST[number]) => {
    switch (platform.platform) {
      case 'wechat': return <WechatPreview draft={draft} />;
      case 'xiaohongshu': return <XhsPreview draft={draft} />;
      case 'weibo': return <WeiboPreview draft={draft} />;
      default: return <GenericPreview draft={draft} platform={platform} />;
    }
  };

  return (
    <div className="w-[280px] border-l border-gray-100 bg-white flex flex-col shrink-0">
      {/* 标题 */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-gray-700">平台预览</span>
        <button
          onClick={onPushAllToPublish}
          className="text-[11px] text-[#FF6B35] hover:text-[#E55A2B] font-medium transition-colors"
        >
          全部推送 →
        </button>
      </div>

      {/* 平台切换 */}
      <div className="px-4 pb-3 flex gap-1 flex-wrap">
        <button
          onClick={() => setActivePlatform('all')}
          className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all
            ${activePlatform === 'all' ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          全部
        </button>
        {selectedPlatforms.map(p => (
          <button
            key={p.platform}
            onClick={() => setActivePlatform(p.platform)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all
              ${activePlatform === p.platform ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 预览卡片 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {selectedPlatforms
          .filter(p => activePlatform === 'all' || activePlatform === p.platform)
          .map(p => (
            <div key={p.platform}>
              {renderPreview(p)}
              <button
                onClick={() => onPushToPublish(p.platform)}
                className="w-full mt-2 py-1.5 text-[11px] text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50 rounded-lg transition-all border border-gray-100 hover:border-[#FF6B35]/20"
              >
                推送到发布 →
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
