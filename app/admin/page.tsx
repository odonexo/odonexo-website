import AdminShell from "@/components/admin/AdminShell";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { readAllProducts } from "@/lib/products-store";
import { countNewOrders, readAllOrders } from "@/lib/orders-store";
import { countUnreadContactMessages } from "@/lib/contact-messages-store";
import { formatPriceFromEur } from "@/lib/currency";
import { isOnSale } from "@/lib/admin-product-filters";

export default async function AdminDashboardPage() {
  const [products, orders, newOrders, unreadMessages] = await Promise.all([
    readAllProducts(),
    readAllOrders(),
    countNewOrders(),
    countUnreadContactMessages(),
  ]);

  const published = products.filter((p) => p.published).length;
  const outOfStock = products.filter((p) => !p.inStock).length;
  const onSale = products.filter(isOnSale).length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.price * (p.stockQuantity || 0),
    0
  );

  return (
    <AdminShell>
      <AdminDashboardClient
        stats={{
          newOrders,
          totalOrders: orders.length,
          unreadMessages,
          totalProducts: products.length,
          published,
          outOfStock,
          onSale,
          stockValueLabel: formatPriceFromEur(totalValue),
        }}
      />
    </AdminShell>
  );
}
