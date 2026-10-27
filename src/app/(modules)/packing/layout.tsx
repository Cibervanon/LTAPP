import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function PackingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
