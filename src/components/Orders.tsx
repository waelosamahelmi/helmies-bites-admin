import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  ChefHat,
  RefreshCw,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Euro,
  Calendar,
  Hash,
  Store,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
}

interface Order {
  id: number;
  order_number: string;
  tenant_id: string;
  tenant_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: string;
  payment_status: string;
  delivery_type: string;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface OrdersResponse {
  orders: Order[];
  count: number;
}

interface TenantsResponse {
  tenants: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; icon: React.ElementType; label: string }
> = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle, label: "Confirmed" },
  preparing: { color: "bg-orange-100 text-orange-800 border-orange-300", icon: ChefHat, label: "Preparing" },
  ready: { color: "bg-green-100 text-green-800 border-green-300", icon: Package, label: "Ready" },
  delivered: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: Truck, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle, label: "Cancelled" },
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

const STATUS_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function Orders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    if (tenantFilter !== "all") params.set("tenant_id", tenantFilter);
    params.set("limit", String(pageSize));
    params.set("offset", String(page * pageSize));
    return params.toString();
  }, [statusFilter, search, tenantFilter, page]);

  const { data, isLoading, isError, error } = useQuery<OrdersResponse>({
    queryKey: ["platform-orders", queryParams],
    queryFn: () => api.get(`/orders?${queryParams}`),
    refetchInterval: 30000,
  });

  const { data: tenantsData } = useQuery<TenantsResponse>({
    queryKey: ["tenants-list"],
    queryFn: () => api.get("/tenants"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.put(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-orders"] });
      if (selectedOrder) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: updateStatusMutation.variables?.status ?? prev.status } : null
        );
      }
    },
  });

  const orders = data?.orders ?? [];
  const totalCount = data?.count ?? 0;
  const tenants = tenantsData?.tenants ?? [];
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const getItemsCount = (items: OrderItem[] | string | undefined): number => {
    if (!items) return 0;
    const parsed = typeof items === "string" ? JSON.parse(items) : items;
    return Array.isArray(parsed) ? parsed.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0;
  };

  const parseItems = (items: OrderItem[] | string | undefined): OrderItem[] => {
    if (!items) return [];
    const parsed = typeof items === "string" ? JSON.parse(items) : items;
    return Array.isArray(parsed) ? parsed : [];
  };

  const getTenantName = (tenantId: string): string => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name ?? tenantId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage orders across all restaurants ({totalCount} total)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["platform-orders"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
              <select
                value={tenantFilter}
                onChange={(e) => {
                  setTenantFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Restaurants</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Orders
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="ml-2 font-normal">
                <Filter className="h-3 w-3 mr-1" />
                {STATUS_CONFIG[statusFilter as OrderStatus]?.label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading orders...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>Failed to load orders</p>
              <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-1">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers place them"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Order #</th>
                      <th className="pb-3 pr-4 font-medium">Restaurant</th>
                      <th className="pb-3 pr-4 font-medium">Customer</th>
                      <th className="pb-3 pr-4 font-medium text-center">Items</th>
                      <th className="pb-3 pr-4 font-medium text-right">Total</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Payment</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const statusCfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.pending;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <tr
                          key={order.id}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="py-3 pr-4 font-mono font-medium">
                            {order.order_number}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5">
                              <Store className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="truncate max-w-[140px]">
                                {order.tenant_name ?? getTenantName(order.tenant_id)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="truncate max-w-[120px] block">
                              {order.customer_name || "Guest"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center">{getItemsCount(order.items)}</td>
                          <td className="py-3 pr-4 text-right font-medium">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant="outline"
                              className={`${statusCfg.color} border text-xs gap-1`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${PAYMENT_STATUS_COLORS[order.payment_status] ?? ""}`}
                            >
                              {order.payment_status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground text-xs whitespace-nowrap">
                            {formatDateShort(order.created_at)}
                          </td>
                          <td className="py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} of{" "}
                    {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Hash className="h-5 w-5" />
                  Order {selectedOrder.order_number}
                  <Badge
                    variant="outline"
                    className={`${STATUS_CONFIG[selectedOrder.status as OrderStatus]?.color ?? ""} border ml-2`}
                  >
                    {STATUS_CONFIG[selectedOrder.status as OrderStatus]?.label ?? selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* Restaurant Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {selectedOrder.tenant_name ?? getTenantName(selectedOrder.tenant_id)}
                  </span>
                  <span className="mx-2">|</span>
                  <Calendar className="h-4 w-4" />
                  {formatDate(selectedOrder.created_at)}
                </div>

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedOrder.customer_name || "Guest"}
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedOrder.customer_phone}
                      </div>
                    )}
                    {selectedOrder.customer_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedOrder.customer_email}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedOrder.delivery_type === "delivery" ? "Delivery" : "Pickup"}
                    </div>
                    {selectedOrder.delivery_address && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        {selectedOrder.delivery_address}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {parseItems(selectedOrder.items).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {item.quantity}x
                              </span>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            {item.toppings && item.toppings.length > 0 && (
                              <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                                + {item.toppings.join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-3 pt-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery fee</span>
                          <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-1 border-t">
                        <span>Total</span>
                        <span className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Timeline */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Status Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 flex-wrap">
                      {STATUS_OPTIONS.filter((s) => s !== "cancelled").map((status, idx) => {
                        const cfg = STATUS_CONFIG[status];
                        const StatusIcon = cfg.icon;
                        const currentIdx = STATUS_OPTIONS.indexOf(
                          selectedOrder.status as OrderStatus
                        );
                        const stepIdx = STATUS_OPTIONS.filter((s) => s !== "cancelled").indexOf(status);
                        const isActive = stepIdx <= currentIdx && selectedOrder.status !== "cancelled";
                        return (
                          <div key={status} className="flex items-center gap-1">
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                isActive
                                  ? cfg.color
                                  : "bg-gray-50 text-gray-400"
                              }`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </div>
                            {idx < 4 && (
                              <div
                                className={`w-4 h-0.5 ${
                                  isActive && stepIdx < currentIdx
                                    ? "bg-green-400"
                                    : "bg-gray-200"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                      {selectedOrder.status === "cancelled" && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 ml-2">
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelled
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground italic">
                        Note: {selectedOrder.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Status Actions */}
                {STATUS_FLOW[selectedOrder.status]?.length > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-sm text-muted-foreground">Update status:</span>
                    {STATUS_FLOW[selectedOrder.status].map((nextStatus) => {
                      const cfg = STATUS_CONFIG[nextStatus as OrderStatus];
                      const NextIcon = cfg.icon;
                      const isCancelling = nextStatus === "cancelled";
                      return (
                        <Button
                          key={nextStatus}
                          size="sm"
                          variant={isCancelling ? "destructive" : "default"}
                          disabled={updateStatusMutation.isPending}
                          onClick={() => handleStatusUpdate(selectedOrder.id, nextStatus)}
                          className={
                            !isCancelling
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : ""
                          }
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <NextIcon className="h-4 w-4 mr-1" />
                          )}
                          {cfg.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
