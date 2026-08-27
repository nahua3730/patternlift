"use client";

type RingSegment = {
  label: string;
  done: number;
  total: number;
  color: string;
};

export function ProgressRing({
  segments,
  size = 92,
  strokeWidth = 10
}: {
  segments: RingSegment[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.total, 0);
  const done = segments.reduce((sum, segment) => sum + segment.done, 0);

  let cursor = 0;
  const arcs = segments.map((segment) => {
    const length = total > 0 ? (segment.done / total) * circumference : 0;
    const arc = { ...segment, length, offset: cursor };
    cursor += length;
    return arc;
  });

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5eaf1" strokeWidth={strokeWidth} />
        {arcs.map((arc) =>
          arc.length > 0 ? (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
            />
          ) : null
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{done}</span>
        <span className="text-[10px] font-semibold text-slate-400">of {total}</span>
      </div>
    </div>
  );
}
