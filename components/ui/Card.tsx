import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 ${className}`}
      {...props}
    >
      {title ? <h3 className="mb-3 text-sm font-medium text-zinc-400">{title}</h3> : null}
      {children}
    </div>
  );
}
