'use client';
import { useEffect, useRef } from 'react';

export default function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load snowflake image
    const snowImg = new Image();
    snowImg.src = '/snowflake.png';

    let processedCanvas: HTMLCanvasElement | null = null;
    let isProcessed = false;

    // Function to strip the black background from the snowflake PNG
    const processImage = () => {
      if (isProcessed) return;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = snowImg.width;
      tempCanvas.height = snowImg.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(snowImg, 0, 0);
        try {
          const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imgData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            // Calculate pixel brightness (crystal is white/gray, background is black)
            const brightness = Math.max(r, g, b);
            
            if (brightness < 18) {
              data[i+3] = 0; // Pure black background becomes fully transparent
            } else {
              // Map brightness to alpha, boosting slightly for nice visibility
              data[i+3] = Math.min(255, brightness * 1.3);
            }
          }
          tempCtx.putImageData(imgData, 0, 0);
          processedCanvas = tempCanvas;
          isProcessed = true;
        } catch (e) {
          console.error("Failed to strip black background from snowflake image:", e);
          processedCanvas = null;
        }
      }
    };

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    window.addEventListener('resize', handleResize);

    const flakeCount = 20; // Intricate, detailed flakes
    const flakes: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 26 + 18, // 18px to 44px for visible crystal details
        opacity: Math.random() * 0.50 + 0.20, // soft visibility
        speedY: Math.random() * 0.7 + 0.3, // slow gentle fall
        speedX: Math.random() * 0.4 - 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.012 - 0.006), // slow spin
      });
    }

    const draw = () => {
      if (snowImg.complete && !isProcessed) {
        processImage();
      }

      ctx.clearRect(0, 0, width, height);
      
      ctx.save();
      // Draw with standard composite operation since we stripped the black background!
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < flakeCount; i++) {
        const f = flakes[i];
        
        ctx.save();
        ctx.globalAlpha = f.opacity;
        
        // Translate to flake center for rotation
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        
        // Draw processed transparent snowflake or fallback to original image
        ctx.drawImage(
          processedCanvas || snowImg,
          -f.size / 2,
          -f.size / 2,
          f.size,
          f.size
        );
        
        ctx.restore();

        // Update positions
        f.y += f.speedY;
        f.x += f.speedX + Math.sin(f.y / 70) * 0.2; // gentle sway
        f.rotation += f.rotationSpeed;

        // Reset if flake goes off screen
        if (f.y > height + 30) {
          flakes[i] = {
            ...f,
            x: Math.random() * width,
            y: -30,
            size: Math.random() * 26 + 18,
            opacity: Math.random() * 0.50 + 0.20,
            speedY: Math.random() * 0.7 + 0.3,
            speedX: Math.random() * 0.4 - 0.2,
            rotation: Math.random() * Math.PI * 2,
          };
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(draw);
    };

    // Start loop once image is ready
    if (snowImg.complete) {
      draw();
    } else {
      snowImg.onload = draw;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 25,
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    />
  );
}
