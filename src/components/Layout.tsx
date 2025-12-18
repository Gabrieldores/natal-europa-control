import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, Users, ShoppingCart, FileText, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/products", icon: Package, label: "Produtos" },
    { path: "/customers", icon: Users, label: "Clientes" },
    { path: "/orders", icon: ShoppingCart, label: "Pedidos" },
    { path: "/reports", icon: FileText, label: "Relatórios" },
  ];

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => mobile && setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 font-medium transition-all relative",
              mobile 
                ? "px-4 py-3 rounded-lg" 
                : "px-4 lg:px-6 py-4",
              isActive
                ? mobile 
                  ? "text-primary bg-primary/10" 
                  : "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
            {isActive && !mobile && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary rounded-t-lg" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-primary border-b border-border/50 shadow-elegant">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-border">
                      <h2 className="text-lg font-bold text-primary">Casa de Carne Europa</h2>
                      <p className="text-sm text-muted-foreground">Sistema de Pedidos de Natal</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                      <NavLinks mobile />
                    </nav>
                    {user && (
                      <div className="p-4 border-t border-border">
                        <p className="text-sm text-muted-foreground truncate mb-2">{user.email}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { signOut(); setIsOpen(false); }}
                          className="w-full"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <div>
                <h1 className="text-xl lg:text-3xl font-bold text-primary-foreground">
                  Casa de Carne Europa
                </h1>
                <p className="text-primary-foreground/80 text-xs lg:text-sm mt-0.5 lg:mt-1 hidden sm:block">
                  Sistema de Pedidos de Natal
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-lg border border-accent/30">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-primary-foreground text-sm font-medium">Temporada Natalina 2025</span>
              </div>
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-primary-foreground/80 text-sm">{user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-primary-foreground hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
            {/* Mobile user indicator */}
            <div className="lg:hidden">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-primary-foreground hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95 hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <NavLinks />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 lg:py-8 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-4 lg:py-6 text-center text-xs lg:text-sm text-muted-foreground">
          © 2025 Casa de Carne Europa - Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};

export default Layout;