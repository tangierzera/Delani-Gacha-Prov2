import React, { useState, useEffect, useRef } from 'react';
import { X, Check, MessageSquare, Cloud, ArrowDownLeft, ArrowDown, ArrowDownRight } from 'lucide-react';
import { BubbleData } from '../types';

interface BubbleModalProps {
  initialData?: BubbleData;
  onSave: (imgSrc: string, data: BubbleData) => void;
  onClose: () => void;
}

const COLORS = ['#FF8FAB', '#6D597A', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#333333'];

const BubbleModal: React.FC<BubbleModalProps> = ({ initialData, onSave, onClose }) => {
  const [text, setText] = useState(initialData?.text || 'Olá! Como vai?');
  const [name, setName] = useState(initialData?.name || 'Nome');
  const [color, setColor] = useState(initialData?.color || '#FF8FAB');
  const [isThought, setIsThought] = useState(initialData?.isThought || false);
  const [tailPosition, setTailPosition] = useState<'left' | 'center' | 'right'>(initialData?.tailPosition || 'center');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- DRAWING ENGINE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Setup & Metrics
    const fontSize = 24;
    const nameFontSize = 16;
    const padding = 20;
    const lineHeight = 30;
    const maxWidth = 300;
    const tailHeight = 25;
    const borderThickness = 4;
    
    ctx.font = `600 ${fontSize}px Quicksand`; // Match app font
    
    // Word Wrap Logic
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const width = ctx.measureText(currentLine + " " + words[i]).width;
        if (width < maxWidth) {
            currentLine += " " + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);

    // Calculate Dimensions
    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    const bubbleWidth = Math.max(120, maxLineWidth + (padding * 2)); // Slightly wider min-width
    const bubbleHeight = (lines.length * lineHeight) + (padding * 2);
    
    // Resize Canvas
    const nameHeight = name ? 32 : 0;
    const totalWidth = bubbleWidth + 20; // Extra buffer
    const totalHeight = bubbleHeight + tailHeight + nameHeight + 20;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Reset settings after resize
    ctx.font = `600 ${fontSize}px Quicksand`;
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Clear
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    // Offsets
    const startX = 10;
    const startY = 10 + (name ? 16 : 0); 

    // 2. Draw Main Bubble
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = color;
    ctx.lineWidth = borderThickness;

    if (isThought) {
        // --- THOUGHT BUBBLE (Cloud Style) ---
        const radius = 30;
        drawRoundRect(ctx, startX, startY, bubbleWidth, bubbleHeight, radius);
        ctx.fill();
        ctx.stroke();

        // Circles
        let tailX = startX + (bubbleWidth / 2);
        if (tailPosition === 'left') tailX = startX + (bubbleWidth * 0.25);
        if (tailPosition === 'right') tailX = startX + (bubbleWidth * 0.75);

        const tailY = startY + bubbleHeight;
        
        ctx.beginPath();
        // Big circle
        ctx.arc(tailX, tailY + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Small circle
        ctx.beginPath();
        const directionOffset = tailPosition === 'left' ? -10 : tailPosition === 'right' ? 10 : 0;
        ctx.arc(tailX + (directionOffset), tailY + 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

    } else {
        // --- SPEECH BUBBLE (Continuous Path Style) ---
        // This creates a cleaner "Gacha Novel" look by drawing the box and tail as one shape.
        
        const r = 15; // Corner radius
        const w = bubbleWidth;
        const h = bubbleHeight;
        const x = startX;
        const y = startY;

        // Calculate Tail Coordinates
        let tailTipX = x + (w / 2);
        let tailBaseX = x + (w / 2); // Center of the base connection
        
        if (tailPosition === 'left') {
            tailBaseX = x + (w * 0.25);
            tailTipX = tailBaseX - 15; // Tip points slightly left
        } else if (tailPosition === 'right') {
            tailBaseX = x + (w * 0.75);
            tailTipX = tailBaseX + 15; // Tip points slightly right
        }

        // Clamp tail to be inside rounded corners
        tailBaseX = Math.max(x + r + 20, Math.min(x + w - r - 20, tailBaseX));

        const tailWidth = 30; 
        const tailLeft = tailBaseX - (tailWidth / 2);
        const tailRight = tailBaseX + (tailWidth / 2);
        const tailBottom = y + h + tailHeight;

        ctx.beginPath();
        
        // Top Left -> Top Right
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        
        // Right Edge -> Bottom Right
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

        // Bottom Edge -> Tail Start
        ctx.lineTo(tailRight, y + h);

        // Draw Tail (Curved "Thorn" style)
        // Curve out to tip
        ctx.quadraticCurveTo(tailRight - 5, y + h + (tailHeight * 0.6), tailTipX, tailBottom);
        // Curve back to base
        ctx.quadraticCurveTo(tailLeft + 5, y + h + (tailHeight * 0.6), tailLeft, y + h);

        // Tail End -> Bottom Left
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);

        // Left Edge -> Close
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        
        ctx.closePath();

        // Fill and Stroke the entire shape at once
        ctx.fill();
        ctx.stroke();
    }

    // 4. Draw Text
    ctx.fillStyle = '#374151'; // Gray-700
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
        ctx.fillText(line, startX + padding, startY + padding + (i * lineHeight));
    });

    // 5. Draw Name Tag (Floats on top border)
    if (name) {
        ctx.font = `bold ${nameFontSize}px Quicksand`;
        const nameW = ctx.measureText(name).width + 30;
        const nameH = 30;
        const nameX = startX + 15;
        const nameY = startY - (nameH / 2);

        // Badge Shape
        drawRoundRect(ctx, nameX, nameY, nameW, nameH, 10);
        
        ctx.fillStyle = color; // Match border color
        ctx.fill();
        
        // Subtle white border for the nametag to pop against background scenes
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Name text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Adjust Y slightly for visual centering
        ctx.fillText(name, nameX + (nameW/2), nameY + (nameH/2) + 1);
    }

  }, [text, name, color, isThought, tailPosition]);

  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const handleConfirm = () => {
      if (canvasRef.current) {
          onSave(canvasRef.current.toDataURL('image/png', 1.0), { text, name, color, isThought, tailPosition });
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-pink-50 border-b border-pink-100 flex justify-between items-center">
                <h3 className="font-bold text-pink-500 text-lg">Criar Balão</h3>
                <button onClick={onClose} className="bg-white text-pink-300 p-2 rounded-full hover:text-pink-500"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Preview Area */}
                <div className="bg-[url('https://media.istockphoto.com/id/1136365444/vector/transparent-background-seamless-pattern.jpg?s=612x612&w=0&k=20&c=2d6k2q9Z8g1Z8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8=')] rounded-xl border-2 border-dashed border-gray-200 p-4 flex justify-center items-center min-h-[200px]">
                    <canvas ref={canvasRef} className="max-w-full drop-shadow-lg" />
                </div>

                {/* Inputs */}
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Fala do Personagem</label>
                        <textarea 
                            value={text} 
                            onChange={(e) => setText(e.target.value)} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none resize-none h-24"
                            placeholder="Digite aqui..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome (Opcional)</label>
                        <input 
                            type="text"
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                            placeholder="Ex: Delani"
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Estilo & Posição</label>
                    <div className="flex gap-2">
                        {/* Type Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setIsThought(false)} className={`p-2 rounded-md transition-all ${!isThought ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'}`}><MessageSquare size={20}/></button>
                            <button onClick={() => setIsThought(true)} className={`p-2 rounded-md transition-all ${isThought ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'}`}><Cloud size={20}/></button>
                        </div>
                        
                        <div className="w-px bg-gray-200 my-1"></div>

                        {/* Tail Position Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg flex-1 justify-center">
                             <button onClick={() => setTailPosition('left')} className={`flex-1 flex justify-center p-2 rounded-md transition-all ${tailPosition === 'left' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}><ArrowDownLeft size={20}/></button>
                             <button onClick={() => setTailPosition('center')} className={`flex-1 flex justify-center p-2 rounded-md transition-all ${tailPosition === 'center' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}><ArrowDown size={20}/></button>
                             <button onClick={() => setTailPosition('right')} className={`flex-1 flex justify-center p-2 rounded-md transition-all ${tailPosition === 'right' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}><ArrowDownRight size={20}/></button>
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div>
                     <label className="text-xs font-bold text-gray-400 uppercase ml-1">Cor</label>
                     <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                        {COLORS.map(c => (
                            <button 
                                key={c} 
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-transform ${color === c ? 'scale-110 border-gray-400' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                     </div>
                </div>

            </div>

            <div className="p-4 border-t border-gray-100">
                <button onClick={handleConfirm} className="w-full py-3 bg-[#FF8FAB] text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center gap-2">
                    <Check size={20}/> Adicionar Balão
                </button>
            </div>
        </div>
    </div>
  );
};

export default BubbleModal;