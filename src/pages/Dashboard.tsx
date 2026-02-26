import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, ShoppingCart, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">{trend}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['platform-overview'],
    queryFn: () => api.get('/api/analytics/platform'),
  });

  const { data: recentTenants } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: () => api.get('/api/tenants?status=active&limit=6'),
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Helmies Bites Platform</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Tenants"
          value={overview?.activeTenants || 0}
          icon={<Users className="h-6 w-6" />}
          trend="+12% from last month"
        />
        <MetricCard
          label="Monthly Revenue"
          value={`€${overview?.monthlyRevenue || 0}`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="+8% from last month"
        />
        <MetricCard
          label="Total Orders"
          value={overview?.totalOrders || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          trend="+23% from last month"
        />
        <MetricCard
          label="Pending Onboarding"
          value={overview?.pendingOnboarding || 0}
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Restaurants</h2>
        </div>
        <div className="p-6">
          {recentTenants?.tenants?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No restaurants yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTenants?.tenants?.map((tenant: any) => (
                <div
                  key={tenant.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/tenants/${tenant.id}`)}
                >
                  <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                  <p className="text-sm text-gray-500">{tenant.slug}.helmiesbites.fi</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      {tenant.subscription_tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
