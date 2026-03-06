import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Store,
  ShoppingCart,
  Euro,
  Clock,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Loader2,
  PackageOpen,
} from 'lucide-react';

interface OverviewData {
  active_tenants: number;
  total_orders_count: number;
  monthly_recurring_revenue: number;
  total_orders_value: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  tenant_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface PendingTenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  created_at: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

function MetricSkeleton() {
  return (
    <Card className="bg-white shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewData>({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview'),
  });

  const { data: recentOrdersData, isLoading: ordersLoading } = useQuery<{ orders: RecentOrder[] }>({
    queryKey: ['analytics', 'recent-orders'],
    queryFn: () => api.get('/analytics/recent-orders'),
  });

  const { data: pendingTenantsData, isLoading: tenantsLoading } = useQuery<{
    tenants: PendingTenant[];
    count: number;
  }>({
    queryKey: ['tenants', 'pending'],
    queryFn: () => api.get('/tenants?status=pending'),
  });

  const recentOrders = recentOrdersData?.orders ?? [];
  const pendingTenants = pendingTenantsData?.tenants ?? [];

  const metrics = [
    {
      title: 'Active Restaurants',
      value: overview?.active_tenants ?? 0,
      icon: Store,
      color: 'text-orange-600',
    },
    {
      title: 'Total Orders (30d)',
      value: overview?.total_orders_count ?? 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(overview?.monthly_recurring_revenue ?? 0),
      icon: Euro,
      color: 'text-green-600',
    },
    {
      title: 'Pending Orders',
      value: overview?.total_orders_value
        ? formatCurrency(overview.total_orders_value)
        : '0',
      icon: Clock,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : metrics.map((m) => (
              <Card key={m.title} className="bg-white shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {m.title}
                  </CardTitle>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-sm font-medium text-gray-500">Orders Today</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-orange-600">
                {overview?.total_orders_count ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CalendarDays className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sm font-medium text-gray-500">Revenue Today</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(overview?.total_orders_value ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <PackageOpen className="h-10 w-10 mb-2" />
                <p className="text-sm">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        #{order.order_number}
                        <span className="ml-2 text-gray-400 font-normal">
                          {order.tenant_name}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge
                        className={`${statusColor[order.status] ?? 'bg-gray-100 text-gray-800'} text-xs`}
                      >
                        {order.status}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tenant Signups */}
        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Pending Restaurant Signups</CardTitle>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {pendingTenantsData?.count ?? 0}
            </Badge>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : pendingTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Store className="h-10 w-10 mb-2" />
                <p className="text-sm">No pending signups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTenants.slice(0, 5).map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tenant.name}</p>
                      <p className="text-xs text-gray-400">{tenant.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className="text-xs text-gray-400">
                        {formatDate(tenant.created_at)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50 text-xs"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
