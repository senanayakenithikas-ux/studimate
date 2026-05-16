export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
