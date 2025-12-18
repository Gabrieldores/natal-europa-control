import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const { data: orders } = useQuery({
    queryKey: ["orders-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name, phone), order_items(quantity, unit_price, subtotal, products(name, unit))")
        .order("pickup_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
  const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
  const confirmedOrders = orders?.filter(o => o.status === "confirmed").length || 0;

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1 text-sm lg:text-base">Visualização completa dos pedidos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="pb-2 lg:pb-3 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-primary">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="pb-2 lg:pb-3 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-primary">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="pb-2 lg:pb-3 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-accent">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="pb-2 lg:pb-3 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Confirmados</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-secondary">{confirmedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders - Desktop Table / Mobile Cards */}
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Todos os Pedidos</CardTitle>
          <CardDescription className="text-sm">Lista completa de pedidos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Data Retirada</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.customers?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{order.customers?.phone || "-"}</TableCell>
                    <TableCell>{format(new Date(order.order_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{format(new Date(order.pickup_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            {item.products?.name} ({item.quantity} {item.products?.unit})
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === "pending" ? "secondary" :
                        order.status === "confirmed" ? "default" :
                        order.status === "ready" ? "default" : "outline"
                      }>
                        {order.status === "pending" ? "Pendente" :
                         order.status === "confirmed" ? "Confirmado" :
                         order.status === "ready" ? "Pronto" : "Concluído"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      R$ {Number(order.total_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {orders?.map((order) => (
              <div key={order.id} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{order.customers?.name}</p>
                    {order.customers?.phone && (
                      <p className="text-sm text-muted-foreground">{order.customers?.phone}</p>
                    )}
                  </div>
                  <Badge variant={
                    order.status === "pending" ? "secondary" :
                    order.status === "confirmed" ? "default" :
                    order.status === "ready" ? "default" : "outline"
                  }>
                    {order.status === "pending" ? "Pendente" :
                     order.status === "confirmed" ? "Confirmado" :
                     order.status === "ready" ? "Pronto" : "Concluído"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Pedido: {format(new Date(order.order_date), "dd/MM/yyyy")}</p>
                  <p>Retirada: {format(new Date(order.pickup_date), "dd/MM/yyyy")}</p>
                </div>
                <div className="space-y-1 text-sm">
                  {order.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-muted-foreground">
                      {item.products?.name} ({item.quantity} {item.products?.unit})
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">
                    R$ {Number(order.total_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {(!orders || orders.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pedido cadastrado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
