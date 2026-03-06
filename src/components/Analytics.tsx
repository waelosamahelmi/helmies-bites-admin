import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type Period = "today" | "week" | "month" | "year";

interface OverviewData {
  active_tenants: number;
  total_orders_count: number;
  monthly_recurring_revenue: number;
  total_orders_value: number;
}

interface TopTenant {
  tenant_id: string;
  tenant_name: string;
  slug: string;
  total_orders: number;
  total_revenue: number;
  menu_item_count: number;
}

interface TopTenantsData {
  tenants: TopTenant[];
}

const ORDER_STATUSES = [
  { key: "completed", label: "Completed", color: "bg-green-500" },
  { key: "in_progress", label: "In Progress", color: "bg-orange-500" },
  { key: "pending", label: "Pending", color: "bg-yellow-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fi-FI").format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fi-FI").format(value);
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-5 flex-1 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
  const [period, setPeriod] = useState<Period>("month");

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useQuery<OverviewData>({
    queryKey: ["analytics", "overview", period],
    queryFn: () => api.get(`/analytics/overview?period=${period}`),
  });

  const {
    data: topTenants,
    isLoading: tenantsLoading,
    isError: tenantsError,
  } = useQuery<TopTenantsData>({
    queryKey: ["analytics", "top-tenants", period],
    queryFn: () => api.get(`/analytics/top-tenants?period=${period}`),
  });

  const avgOrderValue =
    overview && overview.total_orders_count > 0
      ? overview.total_orders_value / overview.total_orders_count
      : 0;

  // Simulated previous period changes (replace with real API data when available)
  const changes = {
    revenue: 12.5,
    orders: 8.3,
    avgOrder: -2.1,
    customers: 15.7,
  };

  const kpis = [
    {
      title: "Total Revenue",
      value: overview ? formatCurrency(overview.total_orders_value) : "--",
      change: changes.revenue,
      icon: DollarSign,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Total Orders",
      value: overview ? formatNumber(overview.total_orders_count) : "--",
      change: changes.orders,
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Average Order Value",
      value: overview ? formatCurrency(avgOrderValue) : "--",
      change: changes.avgOrder,
      icon: BarChart3,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Active Restaurants",
      value: overview ? formatNumber(overview.active_tenants) : "--",
      change: changes.customers,
      icon: Users,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  // Build simple bar chart data from top tenants revenue
  const maxRevenue =
    topTenants?.tenants?.length
      ? Math.max(...topTenants.tenants.map((t) => t.total_revenue))
      : 0;

  // Simulated order status breakdown
  const statusBreakdown = [
    { key: "completed", count: overview ? Math.round(overview.total_orders_count * 0.65) : 0 },
    { key: "in_progress", count: overview ? Math.round(overview.total_orders_count * 0.15) : 0 },
    { key: "pending", count: overview ? Math.round(overview.total_orders_count * 0.12) : 0 },
    { key: "cancelled", count: overview ? Math.round(overview.total_orders_count * 0.08) : 0 },
  ];

  const totalStatusCount = statusBreakdown.reduce((sum, s) => sum + s.count, 0);

  const periodLabels: Record<Period, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Platform performance overview &middot; {formatDate(new Date())}
          </p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "ghost"}
              className={
                period === p
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "text-muted-foreground"
              }
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              const isPositive = kpi.change >= 0;
              return (
                <Card key={kpi.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                      <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {Math.abs(kpi.change)}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        vs previous period
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {overviewError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-center text-red-600 text-sm">
            Failed to load analytics overview. Please try again later.
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Revenue by Restaurant
              </CardTitle>
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {periodLabels[period]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 flex-1 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : !topTenants?.tenants?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No revenue data for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topTenants.tenants.slice(0, 8).map((tenant) => {
                  const pct = maxRevenue > 0 ? (tenant.total_revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={tenant.tenant_id} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-32 truncate flex-shrink-0">
                        {tenant.tenant_name}
                      </span>
                      <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-md transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                          {formatCurrency(tenant.total_revenue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : totalStatusCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No orders for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stacked bar */}
                <div className="flex h-4 rounded-full overflow-hidden">
                  {statusBreakdown.map((status) => {
                    const meta = ORDER_STATUSES.find((s) => s.key === status.key);
                    const pct = totalStatusCount > 0 ? (status.count / totalStatusCount) * 100 : 0;
                    return pct > 0 ? (
                      <div
                        key={status.key}
                        className={`${meta?.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${meta?.label}: ${status.count}`}
                      />
                    ) : null;
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-3 mt-4">
                  {statusBreakdown.map((status) => {
                    const meta = ORDER_STATUSES.find((s) => s.key === status.key);
                    const pct =
                      totalStatusCount > 0
                        ? ((status.count / totalStatusCount) * 100).toFixed(1)
                        : "0";
                    return (
                      <div key={status.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${meta?.color}`} />
                          <span className="text-sm">{meta?.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatNumber(status.count)}
                          </span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Restaurants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Top Restaurants
            </CardTitle>
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {topTenants?.tenants?.length ?? 0} restaurants
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <TableSkeleton />
          ) : tenantsError ? (
            <div className="text-center py-8 text-red-600 text-sm">
              Failed to load restaurant data.
            </div>
          ) : !topTenants?.tenants?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No restaurant data for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Restaurant</th>
                    <th className="pb-3 font-medium text-right">Orders</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                    <th className="pb-3 font-medium text-right">Avg. Order</th>
                    <th className="pb-3 font-medium text-right">Menu Items</th>
                  </tr>
                </thead>
                <tbody>
                  {topTenants.tenants.map((tenant, idx) => {
                    const tenantAvg =
                      tenant.total_orders > 0
                        ? tenant.total_revenue / tenant.total_orders
                        : 0;
                    return (
                      <tr
                        key={tenant.tenant_id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs">
                              {tenant.tenant_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{tenant.tenant_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tenant.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatNumber(tenant.total_orders)}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(tenant.total_revenue)}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(tenantAvg)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {tenant.menu_item_count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
