import React, { useState, useRef, ReactNode } from 'react';

interface TiltWrapperProps {
    children: ReactNode;
    className?: string;
    intensity?: number;
}

export default function TiltWrapper({ 
    children, 
    className = '',
    intensity = 10 
}: TiltWrapperProps) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Calculate distance from center
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        
        // Apply smooth rotation formula with intensity control
        const rotateX = -(deltaY / intensity);
        const rotateY = deltaX / intensity;
        
        // Limit max rotation for better UX
        const maxRotation = 15;
        const clampedRotateX = Math.max(-maxRotation, Math.min(maxRotation, rotateX));
        const clampedRotateY = Math.max(-maxRotation, Math.min(maxRotation, rotateY));
        
        setTilt({ x: clampedRotateX, y: clampedRotateY });
    };

    const handleMouseLeave = () => {
        // Smooth reset to original position
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div
            ref={containerRef}
            className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d',
            }}
        >
            {children}
        </div>
    );
}
