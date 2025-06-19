import React, { useRef, useEffect } from "react";

interface WaveformProps {
    frequencyData: Uint8Array | null;
}

const Waveform: React.FC<WaveformProps> = ({ frequencyData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !frequencyData) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const { width, height } = canvas;
        context.clearRect(0, 0, width, height);
        context.lineWidth = 3;
        context.strokeStyle = "rgba(255, 255, 255, 0.8)";
        context.beginPath();

        const sliceWidth = (width * 1.0) / frequencyData.length;
        let x = 0;

        for (let i = 0; i < frequencyData.length; i++) {
            const v = frequencyData[i] / 128.0;
            const y = (v * height) / 2;

            const p = i / (frequencyData.length - 1);
            const ease = 1 - Math.pow(1 - 2 * Math.abs(p - 0.5), 4);

            if (i === 0) {
                context.moveTo(x, height / 2);
            } else {
                context.bezierCurveTo(x - sliceWidth / 2, height / 2 - y * ease, x - sliceWidth / 2, height / 2 + y * ease, x, height / 2);
            }

            x += sliceWidth;
        }

        context.stroke();
    }, [frequencyData]);

    return <canvas ref={canvasRef} width="300" height="100" />;
};

export default Waveform;