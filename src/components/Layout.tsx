import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Target, 
  Scroll, 
  Skull, 
  ShoppingCart, 
  Award,
  LogOut,
  Gift
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", icon: User, label: "Profile" },
    { path: "/stats", icon: Target, label: "Status" },
    { path: "/quests", icon: Scroll, label: "Quests" },
    { path: "/battles", icon: Skull, label: "Boss Battles" },
    { path: "/shop", icon: ShoppingCart, label: "Hunter Shop" },
    { path: "/rewards", icon: Gift, label: "Rewards" },
    { path: "/badges", icon: Award, label: "Badges" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold glow-text">Solo Leveling</h1>
          <p className="text-xs text-muted-foreground mt-1">Level up your life</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(link.path)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
