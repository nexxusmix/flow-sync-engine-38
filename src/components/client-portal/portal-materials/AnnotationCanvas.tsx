/**
 * AnnotationCanvas - Canvas overlay para anotações visuais
 * 
 * Features:
 * - Desenho livre (brush)
 * - Setas
 * - Formas básicas (retângulo, círculo)
 * - Cores predefinidas
 * - Captura screenshot com anotação
 */

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Portal } from "@/components/ui/Portal";
import {
  Pencil,
  ArrowRight,
  Square,
  Circle,
  Type,
  Trash2,
  Undo2,
  Download,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tool = 'brush' | 'arrow' | 'rectangle' | 'circle' | 'text';
type Color = 'red' | 'yellow' | 'blue' | 'green' | 'white';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  tool: Tool;
  color: string;
  points: Point[];
  width: number;
}

interface AnnotationCanvasProps {
  imageDataUrl: string;
  timestampMs: number;
  onSave?: (annotationData: { imageUrl: string; strokes: Stroke[] }) => void;
  onCancel?: () => void;
}

const COLORS: Record<Color, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
  white: '#ffffff',
};

const TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: 'brush', icon: Pencil, label: 'Pincel' },
  { id: 'arrow', icon: ArrowRight, label: 'Seta' },
  { id: 'rectangle', icon: Square, label: 'Retângulo' },
  { id: 'circle', icon: Circle, label: 'Círculo' },
];

function AnnotationCanvasComponent({
  imageDataUrl,
  timestampMs,
  onSave,
  onCancel,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState<Color>('red');
  const [brushWidth, setBrushWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Load background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      backgroundImageRef.current = img;
      
      // Calculate canvas size maintaining aspect ratio
      const maxWidth = Math.min(window.innerWidth - 80, 1200);
      const maxHeight = window.innerHeight - 200;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }
      
      setCanvasSize({ width, height });
      setImageLoaded(true);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = backgroundImageRef.current;
    if (!canvas || !ctx || !img) return;

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all strokes
    [...strokes, currentStroke].filter(Boolean).forEach((stroke) => {
      if (!stroke) return;
      drawStroke(ctx, stroke);
    });
  }, [strokes, currentStroke]);

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [imageLoaded, redrawCanvas]);

  // Draw a single stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = stroke.points;
    if (points.length < 2) return;

    switch (stroke.tool) {
      case 'brush':
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        break;

      case 'arrow':
        const start = points[0];
        const end = points[points.length - 1];
        const headLength = 15;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        break;

      case 'rectangle':
        const rectStart = points[0];
        const rectEnd = points[points.length - 1];
        ctx.strokeRect(
          rectStart.x,
          rectStart.y,
          rectEnd.x - rectStart.x,
          rectEnd.y - rectStart.y
        );
        break;

      case 'circle':
        const circleStart = points[0];
        const circleEnd = points[points.length - 1];
        const radius = Math.sqrt(
          Math.pow(circleEnd.x - circleStart.x, 2) +
          Math.pow(circleEnd.y - circleStart.y, 2)
        );
        ctx.beginPath();
        ctx.arc(circleStart.x, circleStart.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }
  };

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Handle touch position
  const getTouchPos = (e: React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (pos: Point) => {
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentStroke({
      tool,
      color: COLORS[color],
      points: [pos],
      width: brushWidth,
    });
  };

  const handlePointerMove = (pos: Point) => {
    if (!isDrawing || !currentStroke) return;

    if (tool === 'brush') {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, pos],
      });
    } else {
      // For shapes, only keep start and current point
      setCurrentStroke({
        ...currentStroke,
        points: [currentStroke.points[0], pos],
      });
    }
    redrawCanvas();
  };

  const handlePointerUp = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
    setIsDrawing(false);
    setStartPoint(null);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => handlePointerDown(getMousePos(e));
  const handleMouseMove = (e: React.MouseEvent) => handlePointerMove(getMousePos(e));
  const handleMouseUp = () => handlePointerUp();

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerDown(getTouchPos(e));
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerMove(getTouchPos(e));
  };
  const handleTouchEnd = () => handlePointerUp();

  // Undo last stroke
  const handleUndo = () => {
    setStrokes(strokes.slice(0, -1));
  };

  // Clear all
  const handleClear = () => {
    setStrokes([]);
  };

  // Export annotated image
  const exportImage = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Handle save
  const handleSave = () => {
    const imageUrl = exportImage();
    if (imageUrl) {
      onSave?.({
        imageUrl,
        strokes,
      });
    }
  };

  // Handle download
  const handleDownload = () => {
    const imageUrl = exportImage();
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `anotacao-${Date.now()}.jpg`;
      link.click();
    }
  };

  if (!imageLoaded) {
    return (
      <Portal>
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      </Portal>
    );
  }

  return (
    <Portal><motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-white font-medium">Anotação Visual</h2>
          <span className="text-xs text-gray-500 font-mono">
            {Math.floor(timestampMs / 60000)}:{String(Math.floor((timestampMs / 1000) % 60)).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          <Button
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={handleSave}
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-6 p-3 border-b border-[#2a2a2a]">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                tool === id
                  ? "bg-[#2a2a2a] text-white"
                  : "text-gray-400 hover:text-white"
              )}
              onClick={() => setTool(id)}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-2">
          {(Object.keys(COLORS) as Color[]).map((c) => (
            <button
              key={c}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform",
                color === c ? "scale-125 border-white" : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: COLORS[c] }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {/* Brush Width */}
        <div className="flex items-center gap-2">
          {[2, 4, 6].map((w) => (
            <button
              key={w}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center bg-[#1a1a1a] transition-colors",
                brushWidth === w ? "ring-2 ring-cyan-500" : "hover:bg-[#2a2a2a]"
              )}
              onClick={() => setBrushWidth(w)}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: w * 2, height: w * 2 }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={handleUndo}
            disabled={strokes.length === 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-400"
            onClick={handleClear}
            disabled={strokes.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="max-w-full max-h-full cursor-crosshair rounded-lg shadow-2xl"
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
    </motion.div></Portal>
  );
}

export const AnnotationCanvas = memo(AnnotationCanvasComponent);
