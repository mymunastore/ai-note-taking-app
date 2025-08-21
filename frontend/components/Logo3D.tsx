import React, { useRef, useEffect } from "react";
import { Sparkles, Mic, FileText, Globe, Zap } from "lucide-react";

interface Logo3DProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showText?: boolean;
}

export default function Logo3D({ size = "md", animated = true, showText = true }: Logo3DProps) {
  const logoRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl"
  };

  useEffect(() => {
    if (!animated || !logoRef.current) return;

    const logo = logoRef.current;
    let animationId: number;

    const animate = () => {
      const time = Date.now() * 0.001;
      const rotation = Math.sin(time * 0.5) * 5;
      const scale = 1 + Math.sin(time * 2) * 0.05;
      
      logo.style.transform = `rotateY(${rotation}deg) scale(${scale})`;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animated]);

  return (
    <div className="flex items-center gap-3">
      <div
        ref={logoRef}
        className={`${sizeClasses[size]} relative flex items-center justify-center transition-all duration-300 transform-gpu`}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Main Logo Container */}
        <div className="relative w-full h-full">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
          
          {/* Main Logo Background */}
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-700 rounded-2xl shadow-2xl border border-white/20">
            {/* Inner Glow */}
            <div className="absolute inset-1 bg-gradient-to-br from-emerald-400/50 via-teal-500/50 to-blue-600/50 rounded-xl"></div>
            
            {/* Logo Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Central Icon */}
              <div className="relative">
                <Sparkles className={`${size === 'xl' ? 'w-16 h-16' : size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-8 h-8' : 'w-6 h-6'} text-white drop-shadow-lg`} />
                
                {/* Floating Elements */}
                <div className="absolute -top-1 -right-1 animate-bounce">
                  <Mic className={`${size === 'xl' ? 'w-4 h-4' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'} text-emerald-200`} />
                </div>
                <div className="absolute -bottom-1 -left-1 animate-bounce delay-300">
                  <FileText className={`${size === 'xl' ? 'w-4 h-4' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'} text-teal-200`} />
                </div>
                <div className="absolute top-0 -left-2 animate-bounce delay-500">
                  <Globe className={`${size === 'xl' ? 'w-3 h-3' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'} text-blue-200`} />
                </div>
                <div className="absolute -top-2 right-0 animate-bounce delay-700">
                  <Zap className={`${size === 'xl' ? 'w-3 h-3' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'} text-cyan-200`} />
                </div>
              </div>
            </div>
            
            {/* Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm`}>
            SCRIBE AI
          </h1>
          {size === 'xl' && (
            <p className="text-sm text-muted-foreground font-medium">
              AI-Powered Voice Intelligence
            </p>
          )}
        </div>
      )}
    </div>
  );
}
