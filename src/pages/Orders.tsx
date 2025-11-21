import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Orders = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [pickupDate, setPickupDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    customerId: "",
    status: "pending",
    notes: "",
  });
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: string }>>([
    { productId: "", quantity: "" },
  ]);

  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name), order_items(quantity, unit_price, subtotal, products(name))")
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof customerForm) => {
      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return newCustomer;
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente cadastrado!");
      setCustomerForm({ name: "", phone: "", email: "" });
      setFormData({ ...formData, customerId: newCustomer.id });
      setIsCustomerDialogOpen(false);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const items = orderItems.filter(item => item.productId && item.quantity);
      if (items.length === 0) throw new Error("Adicione pelo menos um produto");

      let totalAmount = 0;
      const itemsData = [];

      for (const item of items) {
        const product = products?.find(p => p.id === item.productId);
        if (!product?.price) continue;
        
        const quantity = parseFloat(item.quantity);
        const subtotal = quantity * product.price;
        totalAmount += subtotal;

        itemsData.push({
          product_id: item.productId,
          quantity,
          unit_price: product.price,
          subtotal,
        });
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: formData.customerId,
          order_date: format(orderDate, "yyyy-MM-dd"),
          pickup_date: format(pickupDate, "yyyy-MM-dd"),
          status: formData.status,
          notes: formData.notes || null,
          total_amount: totalAmount,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsWithOrderId = itemsData.map(item => ({ ...item, order_id: order.id }));
      const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
      
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido criado com sucesso!");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar pedido");
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido excluído!");
    },
  });

  const resetForm = () => {
    setFormData({ customerId: "", status: "pending", notes: "" });
    setOrderItems([{ productId: "", quantity: "" }]);
    setOrderDate(new Date());
    setPickupDate(new Date());
    setIsDialogOpen(false);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: "" }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: "productId" | "quantity", value: string) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os pedidos de Natal</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-elegant">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Pedido</DialogTitle>
              <DialogDescription>Cadastre um novo pedido de Natal</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createOrderMutation.mutate(); }} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Cliente *</Label>
                  <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" className="mt-auto" onClick={() => setIsCustomerDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Pedido</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderDate ? format(orderDate, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={orderDate} onSelect={(date) => date && setOrderDate(date)} locale={ptBR} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Data de Retirada *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {pickupDate ? format(pickupDate, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={pickupDate} onSelect={(date) => date && setPickupDate(date)} locale={ptBR} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="ready">Pronto</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Produtos *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Select value={item.productId} onValueChange={(value) => updateOrderItem(index, "productId", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - R$ {product.price?.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                        className="w-24"
                      />
                      {orderItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOrderItem(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">Criar Pedido</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createCustomerMutation.mutate(customerForm); }} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} required />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.id} className="border-border/50 shadow-elegant hover:shadow-gold transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{order.customers?.name}</CardTitle>
                  <CardDescription>
                    Pedido: {format(new Date(order.order_date), "dd/MM/yyyy")} • Retirada: {format(new Date(order.pickup_date), "dd/MM/yyyy")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge>{order.status === "pending" ? "Pendente" : order.status === "confirmed" ? "Confirmado" : order.status === "ready" ? "Pronto" : "Concluído"}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => deleteOrderMutation.mutate(order.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.products?.name} x {item.quantity}</span>
                    <span className="font-medium">R$ {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold text-primary">
                  <span>Total</span>
                  <span>R$ {Number(order.total_amount || 0).toFixed(2)}</span>
                </div>
                {order.notes && <p className="text-sm text-muted-foreground mt-2">{order.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders;
