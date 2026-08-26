"use client";

import type { ReactNode } from "react";

export function ProductSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`product-surface ${className}`}>{children}</section>;
}

export function ProductList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`product-list ${className}`}>{children}</div>;
}

export function ProductRow({
  title,
  description,
  leading,
  meta,
  trailing,
  className = ""
}: {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`product-row ${className}`}>
      {leading ? <div className="product-row-leading">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-5 text-slate-900">{title}</div>
            {description ? <div className="mt-1 text-sm leading-6 text-slate-500">{description}</div> : null}
          </div>
          {meta ? <div className="shrink-0 text-xs font-medium text-slate-500">{meta}</div> : null}
        </div>
      </div>
      {trailing ? <div className="min-w-0 shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function StatStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="stat-strip" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-4 py-3 first:pl-0 last:pr-0">
          <dd className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{item.value}</dd>
          <dt className="mt-1 truncate text-xs text-slate-500">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "attention" | "info";
}) {
  return <span className={`status-badge status-badge-${tone}`}>{children}</span>;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = ""
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`segmented-control ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={value === option.value ? "segmented-control-active" : ""}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProductEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="product-empty-state">
      <div className="product-empty-icon" aria-hidden="true">⌁</div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
