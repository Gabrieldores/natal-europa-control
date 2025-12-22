import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name), order_items(quantity, subtotal)")
        .order("order_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  const totalOrders = orders?.length || 0;
  const totalProducts = products?.length || 0;
  const totalCustomers = customers?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

  // Chart data - orders per day for last 7 days
  const chartData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayOrders = orders?.filter((order) => order.order_date === dayStr) || [];
      
      const pending = dayOrders.filter((o) => o.status === "pending").length;
      const confirmed = dayOrders.filter((o) => o.status === "confirmed" || o.status === "ready" || o.status === "completed").length;

      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        pendentes: pending,
        confirmados: confirmed,
      };
    });
  }, [orders]);

  const chartConfig = {
    pendentes: {
      label: "Pendentes",
      color: "hsl(var(--secondary))",
    },
    confirmados: {
      label: "Confirmados",
      color: "hsl(var(--primary))",
    },
  };

  const upcomingPickups = orders
    ?.filter(order => new Date(order.pickup_date) >= new Date())
    ?.sort((a, b) => new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime())
    ?.slice(0, 5);

  const recentOrders = orders?.slice(0, 5);

  return (
    <div className="space-y-4 lg:space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card 
          className="border-border/50 shadow-elegant hover:shadow-gold transition-all duration-300 cursor-pointer"
          onClick={() => navigate("/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-primary">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Pedidos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card 
          className="border-border/50 shadow-elegant hover:shadow-gold transition-all duration-300 cursor-pointer"
          onClick={() => navigate("/products")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Produtos
            </CardTitle>
            <Package className="w-4 h-4 lg:w-5 lg:h-5 text-secondary" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-secondary">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Produtos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card 
          className="border-border/50 shadow-elegant hover:shadow-gold transition-all duration-300 cursor-pointer"
          onClick={() => navigate("/customers")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-accent">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-elegant hover:shadow-gold transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-xl lg:text-3xl font-bold text-primary">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Valor total dos pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Chart */}
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-xl">Pedidos por Dia</CardTitle>
          <CardDescription>Últimos 7 dias - divididos por status</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar 
                  dataKey="pendentes" 
                  name="Pendentes" 
                  fill="hsl(var(--secondary))" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="confirmados" 
                  name="Confirmados" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Calendar and Pickups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl">Calendário de Pedidos</CardTitle>
            <CardDescription>Visualize os dias de retirada dos pedidos</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-lg border border-border pointer-events-auto"
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl">Próximas Retiradas</CardTitle>
            <CardDescription>Pedidos com retirada agendada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPickups?.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{order.customers?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.pickup_date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={
                    order.status === "pending" ? "secondary" :
                    order.status === "confirmed" ? "default" :
                    order.status === "ready" ? "default" : "outline"
                  }>
                    {order.status === "pending" ? "Pendente" :
                     order.status === "confirmed" ? "Confirmado" :
                     order.status === "ready" ? "Pronto" : order.status}
                  </Badge>
                </div>
              ))}
              {(!upcomingPickups || upcomingPickups.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma retirada agendada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-xl">Pedidos Recentes</CardTitle>
          <CardDescription>Últimos pedidos cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders?.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium">{order.customers?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Pedido: {format(new Date(order.order_date), "dd/MM/yyyy")} • 
                    Retirada: {format(new Date(order.pickup_date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-primary">
                    R$ {Number(order.total_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant={
                    order.status === "pending" ? "secondary" :
                    order.status === "confirmed" ? "default" : "outline"
                  }>
                    {order.status === "pending" ? "Pendente" :
                     order.status === "confirmed" ? "Confirmado" :
                     order.status === "ready" ? "Pronto" : order.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum pedido cadastrado ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
