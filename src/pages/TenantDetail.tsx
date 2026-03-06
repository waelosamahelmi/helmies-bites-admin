import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { api } from '@/lib/api';

export function TenantDetail() {
  const { id } = useParams();

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/api/tenants/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const tenant = tenantData?.tenant;
  const stats = tenantData?.statistics;
  const domains = tenantData?.domains;
  const tasks = tenantData?.onboardingTasks;

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  return (
    <div>
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Restaurants
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-gray-500">{tenant.slug}.helmiesbites.com</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              tenant.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {tenant.status}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
              {tenant.subscription_tier}
            </span>
          </div>
        </div>

        {tenant.description && (
          <p className="mt-4 text-gray-600">{tenant.description}</p>
        )}

        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
          <span>€{tenant.monthly_fee}/month</span>
          <span>{tenant.helmies_fee_percentage}% service fee</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">€{stats?.total_revenue || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Customers</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_customers || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Menu Items</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.menu_items_count || 0}</p>
        </div>
      </div>

      {/* Domains */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Domains</h2>
        {domains?.length === 0 ? (
          <p className="text-gray-500">No domains configured</p>
        ) : (
          <div className="space-y-2">
            {domains?.map((domain: any) => (
              <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{domain.domain}</span>
                  {domain.is_primary && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Primary</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded ${
                    domain.ssl_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    SSL: {domain.ssl_status}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    domain.dns_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    DNS: {domain.dns_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding Tasks */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h2>
        {tasks?.length === 0 ? (
          <p className="text-gray-500">No setup tasks</p>
        ) : (
          <div className="space-y-2">
            {tasks?.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{task.task_type.replace('_', ' ')}</p>
                  {task.error_message && (
                    <p className="text-sm text-red-600">{task.error_message}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : task.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
