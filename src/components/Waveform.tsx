import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface WaveformProps {
    frequencyData: Uint8Array | null;
    isActive?: boolean;
    theme?: 'default' | 'success' | 'error' | 'processing';
    sensitivity?: number;
}

const Waveform: React.FC<WaveformProps> = ({
    frequencyData,
    isActive = true,
    theme = 'default',
    sensitivity = 1.2
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const [isAnimating, setIsAnimating] = useState(false);
    const [pulsePhase, setPulsePhase] = useState(0);
    const [avgAmplitude, setAvgAmplitude] = useState(0);

    const themeConfig = useMemo(() => {
        const themes = {
            default: {
                primary: 'rgba(34, 197, 94, 0.9)',
                secondary: 'rgba(34, 197, 94, 0.3)',
                glow: 'rgba(34, 197, 94, 0.6)',
                particles: 'rgba(255, 255, 255, 0.4)'
            },
            success: {
                primary: 'rgba(16, 185, 129, 0.9)',
                secondary: 'rgba(16, 185, 129, 0.3)',
                glow: 'rgba(16, 185, 129, 0.6)',
                particles: 'rgba(255, 255, 255, 0.4)'
            },
            error: {
                primary: 'rgba(239, 68, 68, 0.9)',
                secondary: 'rgba(239, 68, 68, 0.3)',
                glow: 'rgba(239, 68, 68, 0.6)',
                particles: 'rgba(255, 255, 255, 0.4)'
            },
            processing: {
                primary: 'rgba(59, 130, 246, 0.9)',
                secondary: 'rgba(59, 130, 246, 0.3)',
                glow: 'rgba(59, 130, 246, 0.6)',
                particles: 'rgba(255, 255, 255, 0.4)'
            }
        };
        return themes[theme];
    }, [theme]);

    const calculateAverage = useCallback((data: Uint8Array) => {
        const sum = data.reduce((acc, val) => acc + val, 0);
        return sum / data.length / 255;
    }, []);

    const generateFallbackBars = useCallback((time: number) => {
        const bars = [];
        const barCount = 32;

        for (let i = 0; i < barCount; i++) {
            const phase = (time * 0.003) + (i * 0.2);
            const amplitude = Math.sin(phase) * 0.3 + 0.1;
            const variation = Math.sin(phase * 2.1 + i * 0.1) * 0.2;
            bars.push((amplitude + variation) * 255);
        }

        return new Uint8Array(bars);
    }, []);

    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const { width, height } = canvas;
        const centerY = height / 2;
        const time = Date.now();

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        context.scale(dpr, dpr);

        context.clearRect(0, 0, width, height);

        const dataToUse = frequencyData || generateFallbackBars(time);
        const currentAvg = calculateAverage(dataToUse);
        setAvgAmplitude(currentAvg);

        const dynamicSensitivity = sensitivity * (1 + currentAvg * 2);

        if (isActive) {
            const glowIntensity = 0.3 + currentAvg * 0.7;
            const gradient = context.createRadialGradient(
                width / 2, centerY, 0,
                width / 2, centerY, width / 2
            );
            gradient.addColorStop(0, themeConfig.glow.replace('0.6', `${glowIntensity * 0.2}`));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);
        }

        const barCount = Math.min(dataToUse.length, 64);
        const barWidth = (width * 0.8) / barCount;
        const spacing = barWidth * 0.3;
        const actualBarWidth = barWidth - spacing;
        const startX = (width - (barCount * barWidth)) / 2;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * dataToUse.length);
            let amplitude = (dataToUse[dataIndex] / 255) * dynamicSensitivity;

            amplitude = Math.max(amplitude, 0.02);
            amplitude = Math.min(amplitude, 1);

            const maxBarHeight = height * 0.4;
            const barHeight = amplitude * maxBarHeight;

            const x = startX + (i * barWidth);
            const topY = centerY - barHeight / 2;
            const bottomY = centerY + barHeight / 2;

            const barGradient = context.createLinearGradient(x, topY, x, bottomY);
            barGradient.addColorStop(0, themeConfig.primary);
            barGradient.addColorStop(0.5, themeConfig.primary);
            barGradient.addColorStop(1, themeConfig.secondary);

            context.fillStyle = barGradient;
            context.beginPath();
            context.roundRect(x, topY, actualBarWidth, barHeight, actualBarWidth / 2);
            context.fill();

            if (isActive && amplitude > 0.1) {
                context.shadowColor = themeConfig.glow;
                context.shadowBlur = 10 + amplitude * 20;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;

                context.fillStyle = themeConfig.primary;
                context.beginPath();
                context.roundRect(x, topY, actualBarWidth, barHeight, actualBarWidth / 2);
                context.fill();

                context.shadowColor = 'transparent';
                context.shadowBlur = 0;
            }
        }

        if (isActive && currentAvg > 0.3) {
            const particleCount = Math.floor(currentAvg * 20);
            const maxBarHeight = height * 0.4;
            context.fillStyle = themeConfig.particles;

            for (let i = 0; i < particleCount; i++) {
                const particleX = Math.random() * width;
                const particleY = centerY + (Math.random() - 0.5) * maxBarHeight;
                const size = Math.random() * 3 + 1;
                const alpha = Math.random() * 0.5 + 0.2;

                context.globalAlpha = alpha;
                context.beginPath();
                context.arc(particleX, particleY, size, 0, Math.PI * 2);
                context.fill();
            }
            context.globalAlpha = 1;
        }

        if (!isActive || currentAvg < 0.05) {
            context.strokeStyle = themeConfig.secondary;
            context.lineWidth = 1;
            context.setLineDash([5, 5]);
            context.beginPath();
            context.moveTo(width * 0.1, centerY);
            context.lineTo(width * 0.9, centerY);
            context.stroke();
            context.setLineDash([]);
        }

        if (isAnimating) {
            animationRef.current = requestAnimationFrame(drawWaveform);
        }
    }, [
        frequencyData,
        isActive,
        themeConfig,
        sensitivity,
        isAnimating,
        generateFallbackBars,
        calculateAverage
    ]);

    useEffect(() => {
        if (isActive) {
            setIsAnimating(true);
            drawWaveform();
        } else {
            setIsAnimating(false);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, drawWaveform]);

    useEffect(() => {
        if (!isActive) {
            const pulseInterval = setInterval(() => {
                setPulsePhase(prev => (prev + 0.1) % (Math.PI * 2));
            }, 50);

            return () => clearInterval(pulseInterval);
        }
    }, [isActive]);

    const canvasStyle = useMemo(() => ({
        background: `radial-gradient(ellipse at center, ${themeConfig.secondary.replace('0.3', '0.1')} 0%, transparent 70%)`,
        borderRadius: '16px',
        border: `1px solid ${themeConfig.secondary}`,
        boxShadow: isActive ? `0 0 20px ${themeConfig.glow.replace('0.6', '0.3')}` : 'none',
        transition: 'all 0.3s ease',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        filter: isActive ? 'brightness(1.1)' : 'brightness(0.9)'
    }), [themeConfig, isActive]);

    return (
        <div className="flex flex-col items-center space-y-2">
            <canvas
                ref={canvasRef}
                width={350}
                height={120}
                style={canvasStyle}
                className="transition-all duration-300"
            />

            {/* Activity indicator */}
            <div className="flex items-center space-x-2">
                <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? 'animate-pulse' : ''
                        }`}
                    style={{
                        backgroundColor: themeConfig.primary,
                        boxShadow: isActive ? `0 0 10px ${themeConfig.glow}` : 'none'
                    }}
                />
                <span className="text-xs text-white/50 font-medium">
                    {isActive ? (
                        avgAmplitude > 0.1 ? 'Active' : 'Listening'
                    ) : 'Inactive'}
                </span>
                {isActive && (
                    <div className="text-xs text-white/30">
                        {Math.round(avgAmplitude * 100)}%
                    </div>
                )}
            </div>
        </div>
    );
};

export default Waveform;