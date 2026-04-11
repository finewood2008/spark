/**
 * TabDictionary.tsx - 品牌字典 Tab
 * 
 * 核心交互：
 * 1. 用户填写 5 个必填项
 * 2. 点击「AI 一键补齐」生成其余字段
 * 3. 每个字段可 确认 / 重新生成 / 手动编辑
 */
import React, { useState } from 'react';
import { Brand, BrandDictionary, DictField, FieldStatus, useBrandStore } from '../../store/brandStore';

interface Props {
  brand: Brand;
}

// 字段分组
const REQUIRED_FIELDS: (keyof BrandDictionary)[] = [
  'brandName', 'industry', 'mainBusiness', 'targetCustomer', 'differentiation',
];

const AI_FIELDS: (keyof BrandDictionary)[] = [
  'mission', 'vision', 'values', 'personality', 'brandStory',
  'toneOfVoice', 'slogans', 'customerProfile', 'sellingPoints', 'keywords', 'tabooWords',
];

function StatusBadge({ status }: { status: FieldStatus }) {
  const config: Record<FieldStatus, { label: string; cls: string }> = {
    empty:        { label: '待填写',    cls: 'bg-gray-100 text-gray-400' },
    user_filled:  { label: '已填写',    cls: 'bg-blue-50 text-blue-500' },
    ai_generated: { label: 'AI 生成',   cls: 'bg-amber-50 text-amber-600' },
    confirmed:    { label: '已确认',    cls: 'bg-green-50 text-green-600' },
  };
  const c = config[status];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>;
}

export function TabDictionary({ brand }: Props) {
  const { updateDictField, confirmField, batchUpdateDict } = useBrandStore();
  const [editingField, setEditingField] = useState<keyof BrandDictionary | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const dict = brand.dictionary;

  // 检查必填项是否都已填写
  const requiredComplete = REQUIRED_FIELDS.every(f => dict[f].value.trim() !== '');

  // 统计 AI 字段状态
  const aiFieldsEmpty = AI_FIELDS.filter(f => dict[f].status === 'empty').length;
  const aiFieldsGenerated = AI_FIELDS.filter(f => dict[f].status === 'ai_generated').length;
  const aiFieldsConfirmed = AI_FIELDS.filter(f => dict[f].status === 'confirmed').length;

  // 开始编辑某个字段
  const startEdit = (field: keyof BrandDictionary) => {
    setEditingField(field);
    setEditValue(dict[field].value);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingField) {
      updateDictField(brand.id, editingField, editValue, 'user_filled');
      setEditingField(null);
      setEditValue('');
    }
  };

  // AI 一键补齐（模拟）
  const handleAIGenerate = async () => {
    if (!requiredComplete) return;
    setIsAIGenerating(true);

    // 模拟 AI 生成延迟
    await new Promise(r => setTimeout(r, 2000));

    const brandName = dict.brandName.value;
    const industry = dict.industry.value;
    const mainBiz = dict.mainBusiness.value;
    const target = dict.targetCustomer.value;
    const diff = dict.differentiation.value;

    const aiResults: Partial<Record<keyof BrandDictionary, { value: string; status: FieldStatus }>> = {
      mission: {
        value: `让${target}轻松获得专业的${industry}服务，用${diff}重新定义行业标准。`,
        status: 'ai_generated',
      },
      vision: {
        value: `成为${industry}领域最受信赖的品牌，让每一位客户都能感受到${brandName}带来的价值。`,
        status: 'ai_generated',
      },
      values: {
        value: `专业至上：以行业顶级标准要求自己\n客户第一：一切决策以客户价值为导向\n持续创新：不断探索更好的解决方案\n诚信透明：建立长期信任关系`,
        status: 'ai_generated',
      },
      personality: {
        value: `${brandName}像一位经验丰富又平易近人的行业顾问——专业但不高冷，热情但不浮夸。TA 说话直接、有条理，偶尔带点幽默感，让人感觉既可靠又亲切。`,
        status: 'ai_generated',
      },
      brandStory: {
        value: `${brandName}诞生于一个简单的洞察：${target}需要${mainBiz}，但市场上的选择要么太贵，要么不够专业。创始团队深耕${industry}多年，深知行业痛点，决心用${diff}的方式，为客户提供真正有价值的解决方案。从第一个客户开始，${brandName}就坚持"做对的事，做好的事"，一步步赢得了市场的认可。`,
        status: 'ai_generated',
      },
      toneOfVoice: {
        value: `正式度：中等偏轻松（4/10）\n专业度：较高（7/10）\n幽默度：适度（3/10）\n温暖度：较高（7/10）\n\n说话方式：像一个懂行的朋友在给你建议，不用行话堆砌，但关键处精准专业。`,
        status: 'ai_generated',
      },
      slogans: {
        value: `方案一：「${brandName}，让${industry}更简单」\n方案二：「${diff}，从${brandName}开始」\n方案三：「${brandName} — ${target}的专业伙伴」`,
        status: 'ai_generated',
      },
      customerProfile: {
        value: `核心人群：${target}\n年龄段：25-45 岁\n决策特征：注重性价比和专业度，倾向于口碑推荐\n痛点：缺乏专业资源、预算有限、需要快速见效\n触达渠道：微信生态、行业社群、搜索引擎`,
        status: 'ai_generated',
      },
      sellingPoints: {
        value: `核心卖点：${diff}\n支撑点 1：专业团队 + 行业经验\n支撑点 2：高性价比的解决方案\n支撑点 3：快速响应 + 持续服务`,
        status: 'ai_generated',
      },
      keywords: {
        value: `推荐用词：专业、高效、值得信赖、伙伴、赋能、${industry}专家、一站式、定制化`,
        status: 'ai_generated',
      },
      tabooWords: {
        value: `避免使用：最好的、第一、绝对、保证、永远、碾压、吊打、低价、便宜\n避免语气：过度承诺、贬低竞品、夸大其词`,
        status: 'ai_generated',
      },
    };

    // 只补齐空白或未确认的字段
    const filteredResults: typeof aiResults = {};
    for (const [key, val] of Object.entries(aiResults)) {
      const k = key as keyof BrandDictionary;
      if (dict[k].status === 'empty' || dict[k].status === 'ai_generated') {
        filteredResults[k] = val;
      }
    }

    batchUpdateDict(brand.id, filteredResults);
    setIsAIGenerating(false);
  };

  // 渲染单个字段卡片
  const renderField = (fieldKey: keyof BrandDictionary) => {
    const field = dict[fieldKey];
    const isEditing = editingField === fieldKey;
    const isRequired = field.required;

    return (
      <div
        key={fieldKey}
        className={`bg-white rounded-xl border p-4 transition-all
          ${isRequired ? 'border-gray-200' : 'border-gray-100'}
          ${field.status === 'ai_generated' ? 'border-amber-200 bg-amber-50/30' : ''}
          ${field.status === 'confirmed' ? 'border-green-200 bg-green-50/20' : ''}
          ${isEditing ? 'ring-2 ring-[#FF6B35]/30 border-[#FF6B35]' : ''}
        `}
      >
        {/* 字段头部 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-gray-700">{field.label}</span>
            {isRequired && <span className="text-[10px] text-red-400 font-bold">必填</span>}
            <StatusBadge status={field.status} />
          </div>
          <div className="flex items-center gap-1">
            {/* AI 生成的字段：确认 / 重新生成 */}
            {field.status === 'ai_generated' && !isEditing && (
              <>
                <button
                  onClick={() => confirmField(brand.id, fieldKey)}
                  className="text-[10px] font-medium text-green-600 hover:text-green-700 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                >
                  确认
                </button>
                <button
                  onClick={() => startEdit(fieldKey)}
                  className="text-[10px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  编辑
                </button>
              </>
            )}
            {/* 已确认或用户填写的：编辑 */}
            {(field.status === 'confirmed' || field.status === 'user_filled') && !isEditing && (
              <button
                onClick={() => startEdit(fieldKey)}
                className="text-[10px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                编辑
              </button>
            )}
            {/* 空白字段：点击填写 */}
            {field.status === 'empty' && !isEditing && (
              <button
                onClick={() => startEdit(fieldKey)}
                className="text-[10px] font-medium text-[#FF6B35] hover:text-[#e85a20] px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
              >
                + 填写
              </button>
            )}
          </div>
        </div>

        {/* 提示文字 */}
        {field.hint && field.status === 'empty' && !isEditing && (
          <div className="text-[11px] text-gray-400 mb-2">{field.hint}</div>
        )}

        {/* 内容区 */}
        {isEditing ? (
          <div className="space-y-2">
            {field.multiline ? (
              <textarea
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={field.placeholder}
                className="w-full min-h-[80px] p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none resize-none"
              />
            ) : (
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={field.placeholder}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
              />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingField(null)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">取消</button>
              <button onClick={saveEdit} className="text-xs font-bold text-white bg-[#FF6B35] hover:bg-[#e85a20] px-4 py-1.5 rounded-lg">保存</button>
            </div>
          </div>
        ) : field.value ? (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{field.value}</div>
        ) : (
          <div className="text-sm text-gray-300 italic">{field.placeholder}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
      {/* 必填区域 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#FF6B35] rounded-full"></span>
            <h3 className="text-sm font-bold text-gray-900">基本信息（必填）</h3>
            <span className="text-[10px] text-gray-400">
              {REQUIRED_FIELDS.filter(f => dict[f].value.trim()).length}/{REQUIRED_FIELDS.length} 已完成
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {REQUIRED_FIELDS.map(f => renderField(f))}
        </div>
      </section>

      {/* AI 补齐按钮 */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-gray-200"></div>
        <button
          onClick={handleAIGenerate}
          disabled={!requiredComplete || isAIGenerating}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
            ${requiredComplete && !isAIGenerating
              ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF9F1C] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          {isAIGenerating ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              火花正在理解你的品牌...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z" fill="currentColor" opacity="0.9"/></svg>
              火花一键补齐品牌字典
              {aiFieldsEmpty > 0 && <span className="text-[10px] opacity-80">（{aiFieldsEmpty} 项待生成）</span>}
            </>
          )}
        </button>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {!requiredComplete && (
        <div className="text-center text-[11px] text-gray-400 -mt-4">
          请先完成上方 5 个必填项，AI 才能为你生成品牌字典
        </div>
      )}

      {/* AI 补齐区域 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-400 rounded-full"></span>
            <h3 className="text-sm font-bold text-gray-900">品牌字典（AI 补齐）</h3>
            {aiFieldsGenerated > 0 && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {aiFieldsGenerated} 项待确认
              </span>
            )}
            {aiFieldsConfirmed > 0 && (
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {aiFieldsConfirmed} 项已确认
              </span>
            )}
          </div>
          {aiFieldsGenerated > 0 && (
            <button
              onClick={() => {
                AI_FIELDS.forEach(f => {
                  if (dict[f].status === 'ai_generated') confirmField(brand.id, f);
                });
              }}
              className="text-[11px] font-medium text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
            >
              全部确认
            </button>
          )}
        </div>
        <div className="space-y-3">
          {AI_FIELDS.map(f => renderField(f))}
        </div>
      </section>
    </div>
  );
}
