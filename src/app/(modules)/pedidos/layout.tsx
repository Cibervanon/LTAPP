import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function PedidosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
