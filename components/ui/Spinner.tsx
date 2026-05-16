export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
