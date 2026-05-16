import { RequireAuth } from "@/components/auth/RequireAuth";
import { Sidebar } from "@/components/layout/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </div>
    </RequireAuth>
  );
}
