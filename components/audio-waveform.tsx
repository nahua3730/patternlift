"use client";

import { useEffect, useRef } from "react";

export function AudioWaveform({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const controller = new AbortController();
    let animationFrame: number | null = null;

    function resize() {
      if (!canvas || !context) return;
      const ratio = window.devicePixelRatio || 1;
      const bounds = canvas.getBoundingClientRect();
      canvas.width = bounds.width * ratio;
      canvas.height = bounds.height * ratio;
      context.resetTransform();
      context.scale(ratio, ratio);
    }

    window.addEventListener("resize", resize, { signal: controller.signal });
    resize();

    try {
      const AudioContextConstructor = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;

      const audioContext = new AudioContextConstructor();
      if (audioContext.state === "suspended") void audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.86;
      source.connect(analyser);

      const raw = new Uint8Array(analyser.fftSize);
      const smooth = new Float32Array(analyser.fftSize);
      const layers = [
        { alpha: 0.18, blur: 12, width: 3, colors: ["#4f46e5", "#6366f1", "#22d3ee"] },
        { alpha: 0.52, blur: 4, width: 2, colors: ["#6366f1", "#818cf8", "#67e8f9"] },
        { alpha: 1, blur: 0, width: 1.25, colors: ["#a5b4fc", "#c4b5fd", "#67e8f9"] }
      ];

      const draw = () => {
        if (controller.signal.aborted) return;
        animationFrame = window.requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(raw);
        const bounds = canvas.getBoundingClientRect();
        context.clearRect(0, 0, bounds.width, bounds.height);

        for (let index = 0; index < raw.length; index += 1) {
          const target = (raw[index] - 128) / 128;
          smooth[index] += (target - smooth[index]) * 0.14;
        }

        for (const layer of layers) {
          context.save();
          context.globalAlpha = layer.alpha;
          context.filter = layer.blur ? `blur(${layer.blur}px)` : "none";
          context.lineCap = "round";
          context.lineJoin = "round";
          context.lineWidth = layer.width;
          const gradient = context.createLinearGradient(0, 0, bounds.width, 0);
          gradient.addColorStop(0, layer.colors[0]);
          gradient.addColorStop(0.5, layer.colors[1]);
          gradient.addColorStop(1, layer.colors[2]);
          context.strokeStyle = gradient;
          context.beginPath();

          smooth.forEach((value, index) => {
            const x = (index / (smooth.length - 1)) * bounds.width;
            const y = bounds.height / 2 + Math.max(-1, Math.min(1, value * 3)) * bounds.height * 0.38;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          });
          context.stroke();
          context.restore();
        }
      };

      draw();
      controller.signal.addEventListener("abort", () => {
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        source.disconnect();
        analyser.disconnect();
        if (audioContext.state !== "closed") void audioContext.close();
      });
    } catch {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => controller.abort();
  }, [stream]);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
