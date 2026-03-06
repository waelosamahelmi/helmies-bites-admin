import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Globe,
  Loader2,
  Lock,
  Pencil,
  Play,
  Pause,
  ShieldCheck,
  ShieldAlert,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  DollarSign,
  ExternalLink,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

interface Domain {
  domain: string;
  domain_type: 'subdomain' | 'custom';
  is_primary: boolean;
  ssl_status: 'active' | 'pending' | 'error';
  dns_verified: boolean;
}

interface OnboardingTask {
  task_type: 'github_repo' | 'vercel_deploy' | 'domain_setup' | 'stripe_setup';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
}

interface TenantStatistics {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  menu_items_count: number;
}

interface TenantData {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  subscription_tier: 'starter' | 'pro' | 'enterprise';
  helmies_fee_percentage: number;
  monthly_fee: number;
  features: string[];
  created_at: string;
}

interface TenantDetailResponse {
  tenant: TenantData;
  statistics: TenantStatistics;
  domains: Domain[];
  onboardingTasks: OnboardingTask[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  suspended: 'bg-orange-100 text-orange-800 border-orange-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const TIER_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700 border-gray-300',
  pro: 'bg-blue-100 text-blue-700 border-blue-300',
  enterprise: 'bg-purple-100 text-purple-700 border-purple-300',
};

const TASK_LABELS: Record<string, string> = {
  github_repo: 'GitHub Repository',
  vercel_deploy: 'Vercel Deployment',
  domain_setup: 'Domain Configuration',
  stripe_setup: 'Stripe Integration',
};

const TASK_STATUS_ICONS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  pending: { icon: Circle, color: 'text-gray-400' },
  in_progress: { icon: Clock, color: 'text-yellow-500' },
  completed: { icon: CheckCircle2, color: 'text-green-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'activate' | 'suspend' | null>(null);

  const { data, isLoading, isError } = useQuery<TenantDetailResponse>({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/tenants/${id}`),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (action: 'activate' | 'suspend') =>
      api.put(`/tenants/${id}/status`, { status: action === 'activate' ? 'active' : 'suspended' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setActionDialogOpen(false);
      setPendingAction(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-3 text-gray-500">Loading restaurant details...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-24">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-3 text-red-500 font-medium">Failed to load restaurant details.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Restaurants
        </Button>
      </div>
    );
  }

  const { tenant, statistics, domains, onboardingTasks } = data;

  function handleActionClick(action: 'activate' | 'suspend') {
    setPendingAction(action);
    setActionDialogOpen(true);
  }

  function confirmAction() {
    if (pendingAction) {
      statusMutation.mutate(pendingAction);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <Badge variant="outline" className={STATUS_COLORS[tenant.status]}>
              {tenant.status}
            </Badge>
            <Badge variant="outline" className={TIER_COLORS[tenant.subscription_tier]}>
              {tenant.subscription_tier}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {tenant.slug}.helmiesbites.fi &middot; Created {formatDate(tenant.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tenant.status !== 'active' && tenant.status !== 'cancelled' && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleActionClick('activate')}
            >
              <Play className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          {tenant.status === 'active' && (
            <Button
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={() => handleActionClick('suspend')}
            >
              <Pause className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          )}
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'activate' ? 'Activate Restaurant' : 'Suspend Restaurant'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              {pendingAction === 'activate'
                ? `Are you sure you want to activate "${tenant.name}"? The restaurant will become publicly accessible.`
                : `Are you sure you want to suspend "${tenant.name}"? The restaurant website will be taken offline.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className={
                  pendingAction === 'activate'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }
                onClick={confirmAction}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {pendingAction === 'activate' ? 'Activate' : 'Suspend'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold">{statistics.total_orders.toLocaleString('fi-FI')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(statistics.total_revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <UtensilsCrossed className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Menu Items</p>
                    <p className="text-2xl font-bold">{statistics.menu_items_count.toLocaleString('fi-FI')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customers</p>
                    <p className="text-2xl font-bold">{statistics.total_customers.toLocaleString('fi-FI')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Restaurant Info and Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Restaurant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name (FI)</span>
                  <span className="font-medium">{tenant.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name (EN)</span>
                  <span className="font-medium">{tenant.name_en}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Slug</span>
                  <span className="font-medium">{tenant.slug}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subscription</span>
                  <Badge variant="outline" className={TIER_COLORS[tenant.subscription_tier]}>
                    {tenant.subscription_tier}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Fee</span>
                  <span className="font-medium">{formatCurrency(tenant.monthly_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="font-medium">{tenant.helmies_fee_percentage}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Features</CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.features.length === 0 ? (
                  <p className="text-sm text-gray-400">No features configured.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tenant.features.map((feature) => (
                      <Badge
                        key={feature}
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          {domains.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-gray-500">No domains configured yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => (
                <Card key={domain.domain}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{domain.domain}</span>
                            {domain.is_primary && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 capitalize">{domain.domain_type} domain</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* SSL Status */}
                        <div className="flex items-center gap-1.5 text-sm">
                          {domain.ssl_status === 'active' ? (
                            <Lock className="h-4 w-4 text-green-500" />
                          ) : domain.ssl_status === 'pending' ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={
                              domain.ssl_status === 'active'
                                ? 'text-green-600'
                                : domain.ssl_status === 'pending'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }
                          >
                            SSL {domain.ssl_status}
                          </span>
                        </div>
                        {/* DNS Verification */}
                        <div className="flex items-center gap-1.5 text-sm">
                          {domain.dns_verified ? (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={domain.dns_verified ? 'text-green-600' : 'text-yellow-600'}>
                            DNS {domain.dns_verified ? 'verified' : 'pending'}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onboarding Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {onboardingTasks.length === 0 ? (
                <p className="text-sm text-gray-400">No onboarding tasks found.</p>
              ) : (
                <div className="space-y-4">
                  {onboardingTasks.map((task) => {
                    const statusInfo = TASK_STATUS_ICONS[task.status] ?? TASK_STATUS_ICONS.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        key={task.task_type}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                          <div>
                            <p className="font-medium text-sm">
                              {TASK_LABELS[task.task_type] ?? task.task_type}
                            </p>
                            <p className="text-xs text-gray-400">
                              Created {formatDate(task.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : task.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : task.status === 'failed'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
