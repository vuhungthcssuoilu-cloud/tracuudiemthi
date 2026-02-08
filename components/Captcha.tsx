
import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onRefresh: (code: string) => void;
}

export const Captcha: React.FC<CaptchaProps> = ({ onRefresh }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const generateRandomCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const code = generateRandomCode();
    onRefresh(code);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background - White with grid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines - Very light gray
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Text style
    ctx.font = 'italic bold 22px "Times New Roman", Times, serif';
    ctx.fillStyle = '#337ab7';
    ctx.textBaseline = 'middle';
    
    const startX = 12;
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = startX + i * 22;
      const y = canvas.height / 2;
      const offsetY = (Math.random() - 0.5) * 4;
      ctx.translate(x, y + offsetY);
      ctx.rotate((Math.random() - 0.5) * 0.1);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    // Noise lines
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
  };

  useEffect(() => {
    drawCaptcha();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <canvas 
        ref={canvasRef} 
        width={130} 
        height={38} 
        className="bg-white cursor-pointer"
        onClick={drawCaptcha}
      />
      <button 
        type="button" 
        onClick={drawCaptcha}
        className="text-[#337ab7] hover:text-[#286090] transition-colors"
      >
        <RefreshCw size={20} />
      </button>
    </div>
  );
};