interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
}

const variants = {
  default: "bg-zinc-800 text-zinc-300",
  success: "bg-emerald-900/50 text-emerald-300",
  warning: "bg-amber-900/50 text-amber-300",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
