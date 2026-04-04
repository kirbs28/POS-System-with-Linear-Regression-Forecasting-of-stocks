import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-jollibee-cream">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
