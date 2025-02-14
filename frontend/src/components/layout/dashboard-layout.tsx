import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ChartBar,
  Settings,
  Database,
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Usuários",
    href: "/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Grupos",
    href: "/groups",
    icon: <UsersRound className="h-5 w-5" />,
  },
  {
    title: "Quotas",
    href: "/quotas",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "Métricas",
    href: "/metrics",
    icon: <ChartBar className="h-5 w-5" />,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-900 text-white">
        <div className="flex h-16 items-center justify-center border-b border-zinc-800">
          <h1 className="text-xl font-bold">LLM Manager</h1>
        </div>
        <nav className="mt-6 px-3">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-16 items-center justify-between px-6">
            <h2 className="text-lg font-medium">
              {sidebarItems.find((item) => item.href === pathname)?.title ||
                "Dashboard"}
            </h2>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}