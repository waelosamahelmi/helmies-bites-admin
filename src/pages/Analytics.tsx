import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, change, icon }: MetricCardProps) {
  const isPositive = change && change > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-orange-50 rounded-lg">{icon}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

export function Analytics() {
  const [timeRange, setTimeRange] = useState('30');

  const { data: platformData, isLoading: platformLoading } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: () => api.get('/api/analytics/platform'),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => api.get(`/api/analytics/revenue?startDate=${getStartDate(timeRange)}`),
  });

  function getStartDate(range: string): string {
    const days = parseInt(range);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  if (platformLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  const platform = platformData;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Platform-wide performance metrics and revenue reports</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
          {['7', '30', '90', '365'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === '365' ? '1 Year' : `${range} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Active Tenants"
          value={platform?.activeTenants || 0}
          icon={<Users className="h-5 w-5 text-orange-600" />}
        />
        <MetricCard
          label="Monthly Recurring Revenue"
          value={`€${(platform?.monthlyRecurringRevenue || 0).toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          label="Total Orders"
          value={platform?.totalOrders || 0}
          icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          label="Service Fee Revenue"
          value={`€${(platform?.serviceFeeRevenue || 0).toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Tenant */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Tenant</h2>
          {revenueData?.revenueByTenant?.length > 0 ? (
            <div className="space-y-4">
              {revenueData.revenueByTenant.slice(0, 10).map((tenant: any) => (
                <div key={tenant.slug} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.orderCount} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">€{tenant.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-green-600">+€{tenant.helmiesFee.toFixed(2)} fee</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No revenue data</div>
          )}
        </div>

        {/* Revenue by Payment Method */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h2>
          {revenueData?.revenueByPaymentMethod?.length > 0 ? (
            <div className="space-y-4">
              {revenueData.revenueByPaymentMethod.map((method: any) => (
                <div key={method.paymentMethod} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {method.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
                    </div>
                    <div className="text-sm text-gray-500">{method.orderCount} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">€{method.totalRevenue.toFixed(2)}</div>
                    {method.paymentMethod !== 'cash' && (
                      <div className="text-sm text-green-600">+€{method.helmiesFee.toFixed(2)} fee</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No payment method data</div>
          )}
        </div>
      </div>

      {/* AI Credits Revenue */}
      {revenueData?.aiCreditsRevenue?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Services Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revenueData.aiCreditsRevenue.map((credit: any) => (
              <div key={credit.creditType} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 capitalize">{credit.creditType.replace(/_/g, ' ')}</div>
                <div className="text-xl font-bold text-gray-900">{credit.count} uses</div>
                <div className="text-sm font-medium text-green-600">€{credit.totalCost.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tenants */}
      {platform?.recentTenants?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sign-ups</h2>
          <div className="space-y-3">
            {platform.recentTenants.map((tenant: any) => (
              <div key={tenant.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-sm text-gray-500">{tenant.slug}.helmiesbites.com</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
