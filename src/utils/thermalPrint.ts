import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderItem {
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: { name: string } | null;
}

interface Order {
  id: string;
  order_date: string;
  pickup_date: string;
  status: string;
  notes: string | null;
  total_amount: number | null;
  customers: { name: string } | null;
  order_items: OrderItem[] | null;
}

const STATUS_MAP: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  ready: "Pronto",
  completed: "Concluído",
};

export function generateThermalPrintContent(order: Order): string {
  const divider = "================================";
  const doubleDivider = "================================";
  
  const lines: string[] = [];
  
  // Header
  lines.push("");
  lines.push("    CASA DE CARNE EUROPA");
  lines.push("      Pedidos de Natal");
  lines.push(doubleDivider);
  
  // Order info
  lines.push(`Pedido: ${order.id.slice(0, 8).toUpperCase()}`);
  lines.push(divider);
  
  // Customer
  lines.push(`Cliente: ${order.customers?.name || "N/A"}`);
  lines.push("");
  
  // Dates
  lines.push(`Data Pedido: ${format(new Date(order.order_date), "dd/MM/yyyy", { locale: ptBR })}`);
  lines.push(`Data Retirada: ${format(new Date(order.pickup_date), "dd/MM/yyyy", { locale: ptBR })}`);
  lines.push(`Status: ${STATUS_MAP[order.status] || order.status}`);
  lines.push(divider);
  
  // Items header
  lines.push("ITENS DO PEDIDO:");
  lines.push("");
  
  // Items
  if (order.order_items && order.order_items.length > 0) {
    order.order_items.forEach((item) => {
      const productName = item.products?.name || "Produto";
      const qty = Number(item.quantity).toFixed(2);
      const subtotal = Number(item.subtotal).toFixed(2);
      
      lines.push(`${productName}`);
      lines.push(`  ${qty} x R$ ${Number(item.unit_price).toFixed(2)}`);
      lines.push(`  Subtotal: R$ ${subtotal}`);
      lines.push("");
    });
  }
  
  lines.push(divider);
  
  // Total
  const total = Number(order.total_amount || 0).toFixed(2);
  lines.push(`TOTAL: R$ ${total}`);
  lines.push(doubleDivider);
  
  // Notes
  if (order.notes) {
    lines.push("");
    lines.push("OBSERVACOES:");
    lines.push(order.notes);
    lines.push(divider);
  }
  
  // Footer
  lines.push("");
  lines.push(`Impresso em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`);
  lines.push("");
  lines.push("    Obrigado pela preferencia!");
  lines.push("");
  
  return lines.join("\n");
}

export function printThermalOrder(order: Order): void {
  const content = generateThermalPrintContent(order);
  
  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=300,height=600");
  
  if (!printWindow) {
    alert("Por favor, permita pop-ups para imprimir o pedido.");
    return;
  }
  
  // Write the thermal print styled content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pedido ${order.id.slice(0, 8).toUpperCase()}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          width: 80mm;
          padding: 5mm;
          background: white;
          color: black;
        }
        
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
        
        @media print {
          body {
            width: 80mm;
            padding: 2mm;
          }
        }
      </style>
    </head>
    <body>
      <pre>${content}</pre>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  
  // Fallback for browsers that don't fire onload
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}
