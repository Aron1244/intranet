export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[100dvh] w-full bg-[var(--background)]">{children}</div>;
}