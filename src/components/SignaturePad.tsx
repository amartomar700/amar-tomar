import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, CheckCircle2, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  initialSignature?: string;
  onSignatureChange: (dataUrl: string | undefined) => void;
  title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  initialSignature,
  onSignatureChange,
  title = 'Authorized Contractor / Technician Signature',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialSignature));
  const strokeHistoryRef = useRef<ImageData[]>([]);

  // Initialize canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * ratio || canvas.height !== rect.height * ratio) {
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
    }

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If initial signature exists and canvas is empty
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot for undo
    strokeHistoryRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    if (strokeHistoryRef.current.length > 10) {
      strokeHistoryRef.current.shift();
    }

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas has strokes
    const dataUrl = canvas.toDataURL('image/png');
    setHasSignature(true);
    onSignatureChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeHistoryRef.current = [];
    setHasSignature(false);
    onSignatureChange(undefined);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistoryRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevSnapshot = strokeHistoryRef.current.pop();
    if (prevSnapshot) {
      ctx.putImageData(prevSnapshot, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {title}
          </label>
          {hasSignature ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Captured
            </span>
          ) : (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Sign with finger / stylus
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {strokeHistoryRef.current.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 flex items-center gap-1"
              title="Undo last stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 flex items-center gap-1 border border-rose-200 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="relative w-full h-32 sm:h-36 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 overflow-hidden touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-full block"
        />

        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <span className="text-sm font-medium">Draw signature here</span>
            <span className="text-xs text-slate-400 mt-0.5">Touches are captured smoothly</span>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
          Sign here ✕
        </div>
      </div>
    </div>
  );
};
