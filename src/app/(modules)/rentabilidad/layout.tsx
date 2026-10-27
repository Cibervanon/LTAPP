import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function RentabilidadLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
