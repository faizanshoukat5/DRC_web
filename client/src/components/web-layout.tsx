import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, History, Settings, ScanEye, LogOut, HelpCircle, Users, Activity, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WebLayoutProps {
  children: ReactNode;
  title?: string;
}

export function WebLayout({ children, title }: WebLayoutProps) {
  const [location] = useLocation();
  const { user, signOut, role } = useAuth();

  const getUserInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0][0]?.toUpperCase() ?? "U";
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getNavigationLinks = () => {
    if (role === "patient") {
      return [
        { href: "/", icon: Home, label: "Dashboard" },
        { href: "/results", icon: History, label: "History" },
        { href: "/faq", icon: HelpCircle, label: "FAQ" },
        { href: "/settings", icon: Settings, label: "Settings" },
      ];
    }
    if (role === "doctor") {
      return [
        { href: "/", icon: Home, label: "Dashboard" },
        { href: "/results", icon: History, label: "Scans" },
        { href: "/faq", icon: HelpCircle, label: "FAQ" },
        { href: "/settings", icon: Settings, label: "Settings" },
      ];
    }
    if (role === "admin") {
      return [
        { href: "/", icon: Activity, label: "Dashboard" },
        { href: "/results", icon: FileText, label: "All Scans" },
        { href: "/settings", icon: Settings, label: "Settings" },
      ];
    }
    return [];
  };

  const navigationLinks = getNavigationLinks();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-6">
          {/* Logo and Brand (clickable -> homepage) */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <ScanEye className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  RetinaAI
                </h1>
                <p className="text-xs text-muted-foreground">Diabetic Retinopathy Detection</p>
              </div>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "gap-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.email || "User"} />
                    <AvatarFallback className="bg-primary text-white">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name ?? "Account"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                      {role} Account
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <Link href="/faq">
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & FAQ
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {title && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white dark:bg-slate-950 py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 RetinaAI. All rights reserved.
            </p>

            <div className="ml-auto">
              <Link href="/faq">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  FAQ
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
