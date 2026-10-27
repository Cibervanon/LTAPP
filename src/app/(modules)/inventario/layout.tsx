import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function InventarioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
