/**
 * ChatBubble — 对话气泡组件
 * 
 * 支持：文本消息、选择卡片、确认卡片、进度卡片、摘要卡片
 * 火花消息靠左，用户消息靠右
 * 支持自定义主题色和头像
 */
import React from 'react';
import {
  ChatMessage, SelectionCardData, ConfirmCardData,
  ProgressCardData, SummaryCardData, InputRequestData,
  SelectionOption,
} from './types';

// ========== 子组件 ==========

/** 选择卡片 */
function SelectionCard({
  data, answered, onSelect, accentColor = '#FF6B35',
}: {
  data: SelectionCardData;
  answered?: boolean;
  onSelect: (selected: string[]) => void;
  accentColor?: string;
}) {
  const [chosen, setChosen] = React.useState<string[]>(
    data.options.filter(o => o.selected).map(o => o.id)
  );

  const toggle = (id: string) => {
    if (answered) return;
    if (data.multiple) {
      const next = chosen.includes(id) ? chosen.filter(x => x !== id) : [...chosen, id];
      setChosen(next);
    } else {
      setChosen([id]);
      onSelect([id]);
    }
  };

  const cols = data.columns || (data.options.length <= 3 ? 1 : 2);

  return (
    <div className="mt-2">
      {data.title && (
        <div className="text-[11px] text-gray-400 mb-2">{data.title}</div>
      )}
      <div className={`grid gap-1.5 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {data.options.map(opt => {
          const active = chosen.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              disabled={answered}
              className={`text-left px-3 py-2 rounded-xl transition-all border ${
                answered && !active ? 'bg-gray-50 border-gray-100 text-gray-300' :
                !active ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' : ''
              }`}
              style={active ? {
                background: `${accentColor}10`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              } : undefined}
            >
              <div className="flex items-center gap-2">
                {opt.icon && <span className="text-sm">{opt.icon}</span>}
                <span className="text-[12px] font-medium">{opt.label}</span>
              </div>
              {opt.desc && (
                <div className="text-[10px] text-gray-400 mt-0.5 ml-6">{opt.desc}</div>
              )}
            </button>
          );
        })}
      </div>
      {data.multiple && !answered && chosen.length > 0 && (
        <button
          onClick={() => onSelect(chosen)}
          className="mt-2 w-full py-2 text-white text-[12px] font-bold rounded-xl transition-colors"
          style={{ background: accentColor }}
        >
          确定（已选 {chosen.length} 项）
        </button>
      )}
    </div>
  );
}

/** 确认卡片 */
function ConfirmCard({
  data, answered, onConfirm, accentColor = '#FF6B35',
}: {
  data: ConfirmCardData;
  answered?: boolean;
  onConfirm: (confirmed: boolean) => void;
  accentColor?: string;
}) {
  return (
    <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
      {data.title && (
        <div className="text-[12px] font-bold text-gray-700 mb-2">{data.title}</div>
      )}
      <div className="space-y-1.5 mb-3">
        {data.summary.map((item, i) => (
          <div key={i} className="flex justify-between text-[11px]">
            <span className="text-gray-400">{item.label}</span>
            <span className="text-gray-700 font-medium max-w-[160px] truncate">{item.value}</span>
          </div>
        ))}
      </div>
      {!answered && (
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 py-2 text-white text-[12px] font-bold rounded-xl transition-colors"
            style={{ background: accentColor }}
          >
            {data.confirmText || '✨ 开始生成'}
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 bg-white text-gray-500 text-[12px] rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {data.cancelText || '改一改'}
          </button>
        </div>
      )}
      {answered && (
        <div className="text-[11px] text-green-600 font-medium">✓ 已确认</div>
      )}
    </div>
  );
}

/** 进度卡片 */
function ProgressCard({ data, accentColor = '#FF6B35' }: { data: ProgressCardData; accentColor?: string }) {
  return (
    <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="text-[12px] font-bold text-gray-700 mb-2">{data.title}</div>
      <div className="space-y-1.5">
        {data.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            {step.status === 'done' && <span className="text-green-500">✓</span>}
            {step.status === 'running' && (
              <span
                className="w-3 h-3 rounded-full animate-spin"
                style={{ border: `2px solid ${accentColor}30`, borderTopColor: accentColor }}
              />
            )}
            {step.status === 'pending' && <span className="w-3 h-3 rounded-full bg-gray-200" />}
            {step.status === 'error' && <span className="text-red-500">✗</span>}
            <span style={step.status === 'running' ? { color: accentColor, fontWeight: 500 } : undefined}
              className={step.status === 'done' ? 'text-gray-500' : step.status === 'running' ? '' : 'text-gray-400'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      {data.progress !== undefined && (
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${data.progress}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}CC)`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/** 摘要卡片 */
function SummaryCard({
  data, onAction, accentColor = '#FF6B35',
}: {
  data: SummaryCardData;
  onAction?: (actionId: string) => void;
  accentColor?: string;
}) {
  return (
    <div
      className="mt-2 rounded-xl p-3 border"
      style={{
        background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}04)`,
        borderColor: `${accentColor}15`,
      }}
    >
      <div className="text-[12px] font-bold text-gray-700 mb-2">{data.title}</div>
      <div className="space-y-1.5">
        {data.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            {item.icon && <span>{item.icon}</span>}
            <span className="text-gray-400">{item.label}</span>
            <span className="text-gray-700 font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
      {data.action && onAction && (
        <button
          onClick={() => onAction(data.action!.actionId)}
          className="mt-3 w-full py-2 text-white text-[12px] font-bold rounded-xl transition-colors"
          style={{ background: accentColor }}
        >
          {data.action.label}
        </button>
      )}
    </div>
  );
}

// ========== 主组件 ==========

interface ChatBubbleProps {
  message: ChatMessage;
  onSelect?: (messageId: string, selected: string[]) => void;
  onConfirm?: (messageId: string, confirmed: boolean) => void;
  onAction?: (messageId: string, actionId: string) => void;
  accentColor?: string;
  avatarIcon?: string;
}

export function ChatBubble({ message, onSelect, onConfirm, onAction, accentColor = '#FF6B35', avatarIcon = '火' }: ChatBubbleProps) {
  const isSpark = message.role === 'spark';
  const gradientFrom = accentColor;
  const gradientTo = accentColor === '#FF6B35' ? '#FF9F1C' : accentColor + 'CC';

  return (
    <div className={`flex ${isSpark ? 'justify-start' : 'justify-end'} mb-3`}>
      {/* 火花头像 */}
      {isSpark && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 mr-2"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          {avatarIcon}
        </div>
      )}

      {/* 消息体 */}
      <div className="max-w-[85%]">
        {/* 文本消息 */}
        {message.type === 'text' && message.text && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
              isSpark ? 'bg-gray-100 text-gray-700 rounded-tl-md' : 'text-white rounded-tr-md'
            }`}
            style={!isSpark ? { background: accentColor } : undefined}
          >
            {message.text}
          </div>
        )}

        {/* 选择卡片 */}
        {message.type === 'selection_card' && message.data && (
          <>
            {message.text && (
              <div className="px-3.5 py-2.5 bg-gray-100 text-gray-700 rounded-2xl rounded-tl-md text-[13px] leading-relaxed">
                {message.text}
              </div>
            )}
            <SelectionCard
              data={message.data as SelectionCardData}
              answered={message.answered}
              onSelect={(selected) => onSelect?.(message.id, selected)}
              accentColor={accentColor}
            />
          </>
        )}

        {/* 确认卡片 */}
        {message.type === 'confirm_card' && message.data && (
          <>
            {message.text && (
              <div className="px-3.5 py-2.5 bg-gray-100 text-gray-700 rounded-2xl rounded-tl-md text-[13px] leading-relaxed mb-1">
                {message.text}
              </div>
            )}
            <ConfirmCard
              data={message.data as ConfirmCardData}
              answered={message.answered}
              onConfirm={(confirmed) => onConfirm?.(message.id, confirmed)}
              accentColor={accentColor}
            />
          </>
        )}

        {/* 进度卡片 */}
        {message.type === 'progress_card' && message.data && (
          <ProgressCard data={message.data as ProgressCardData} accentColor={accentColor} />
        )}

        {/* 摘要卡片 */}
        {message.type === 'summary_card' && message.data && (
          <SummaryCard
            data={message.data as SummaryCardData}
            onAction={(actionId) => onAction?.(message.id, actionId)}
            accentColor={accentColor}
          />
        )}

        {/* 输入请求 */}
        {message.type === 'input_request' && message.text && (
          <div className="px-3.5 py-2.5 bg-gray-100 text-gray-700 rounded-2xl rounded-tl-md text-[13px] leading-relaxed">
            {message.text}
          </div>
        )}
      </div>

      {/* 用户头像 */}
      {!isSpark && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold shrink-0 mt-0.5 ml-2">
          我
        </div>
      )}
    </div>
  );
}
