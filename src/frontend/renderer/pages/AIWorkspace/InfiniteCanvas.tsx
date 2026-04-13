/**
 * InfiniteCanvas v2 - 品牌级无限画布
 * 
 * 更精致的点格背景、缩放控件
 * 去掉 emoji，统一视觉语言
 */
import React, { useRef, useState, useCallback } from 'react';
import { GenerationCard as CardType, ViewportState } from './types';
import { GenCard } from './GenCard';

interface InfiniteCanvasProps {
  cards: CardType[];
  viewport: ViewportState;
  onViewportChange: (v: ViewportState) => void;
  onCardClick?: (card: CardType) => void;
  onCardUpdate?: (id: string, updates: Partial<CardType>) => void;
}

export function InfiniteCanvas({ cards, viewport, onViewportChange, onCardClick }: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.min(3, Math.max(0.1, viewport.zoom * delta));
      const ratio = newZoom / viewport.zoom;
      onViewportChange({
        zoom: newZoom,
        x: mx - (mx - viewport.x) * ratio,
        y: my - (my - viewport.y) * ratio,
      });
    } else {
      onViewportChange({
        ...viewport,
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY,
      });
    }
  }, [viewport, onViewportChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).dataset.canvas === 'bg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  }, [viewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    onViewportChange({
      ...viewport,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }, [isPanning, panStart, viewport, onViewportChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const dotSize = 0.8;
  const dotGap = 24 * viewport.zoom;
  const offsetX = viewport.x % dotGap;
  const offsetY = viewport.y % dotGap;

  const zoomPct = Math.round(viewport.zoom * 100);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden relative bg-[#F5F5F5] ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 点格背景 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" data-canvas="bg">
        <defs>
          <pattern
            id="dotGrid"
            x={offsetX} y={offsetY}
            width={dotGap} height={dotGap}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={dotGap / 2} cy={dotGap / 2} r={dotSize} fill="#DCDCDC" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" data-canvas="bg" />
      </svg>

      {/* 画布内容层 */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0"
        data-canvas="bg"
      >
        {cards.map(card => (
          <GenCard
            key={card.id}
            card={card}
            onClick={() => onCardClick?.(card)}
            canvasZoom={viewport.zoom}
            onDragStop={(e, d) => {
              if (onCardUpdate) onCardUpdate(card.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              if (onCardUpdate) {
                onCardUpdate(card.id, {
                  width: parseInt(ref.style.width, 10),
                  height: parseInt(ref.style.height, 10),
                  x: position.x,
                  y: position.y
                });
              }
            }}
          />
        ))}
      </div>

      {/* 缩放控件 — 更精致 */}
      <div className="absolute bottom-4 left-4 flex items-center bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 z-10 overflow-hidden">
        <button
          onClick={() => onViewportChange({ ...viewport, zoom: Math.max(0.1, viewport.zoom * 0.8) })}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="6" x2="10" y2="6"/></svg>
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-[10px] text-gray-500 font-mono w-10 text-center tabular-nums">
          {zoomPct}%
        </span>
        <div className="w-px h-4 bg-gray-200" />
        <button
          onClick={() => onViewportChange({ ...viewport, zoom: Math.min(3, viewport.zoom * 1.25) })}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="6" x2="10" y2="6"/><line x1="6" y1="2" x2="6" y2="10"/></svg>
        </button>
      </div>
    </div>
  );
}
