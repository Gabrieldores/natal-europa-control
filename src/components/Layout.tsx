import { Link, useLocation } from "react-router-dom";
import { Home, Package, Users, ShoppingCart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/products", icon: Package, label: "Produtos" },
    { path: "/customers", icon: Users, label: "Clientes" },
    { path: "/orders", icon: ShoppingCart, label: "Pedidos" },
    { path: "/reports", icon: FileText, label: "Relatórios" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary border-b border-border/50 shadow-elegant">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">
                Casa de Carne Europa
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Sistema de Pedidos de Natal
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-lg border border-accent/30">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-primary-foreground text-sm font-medium">Temporada Natalina 2025</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 font-medium transition-all relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary rounded-t-lg" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2025 Casa de Carne Europa - Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};

export default Layout;
