import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Store,
  Calendar,
  ShoppingCart,
  CreditCard,
  Globe,
  Loader2,
} from 'lucide-react';

interface Tenant {
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
  order_count?: number;
}

interface TenantsResponse {
  tenants: Tenant[];
  count: number;
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
  }).format(new Date(dateString));
}

export function Tenants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const queryParams = new URLSearchParams();
  if (statusFilter && statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (search) queryParams.set('search', search);

  const { data, isLoading, isError } = useQuery<TenantsResponse>({
    queryKey: ['tenants', statusFilter, search],
    queryFn: () => api.get(`/tenants?${queryParams.toString()}`),
  });

  const filteredTenants = (data?.tenants ?? []).filter((tenant) => {
    if (tierFilter && tierFilter !== 'all' && tenant.subscription_tier !== tierFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.count ?? 0} restaurant{(data?.count ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Restaurant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-500">
                Restaurant onboarding form will be available here.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <span className="ml-3 text-gray-500">Loading restaurants...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-16">
          <p className="text-red-500 font-medium">Failed to load restaurants.</p>
          <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredTenants.length === 0 && (
        <div className="text-center py-16">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500 font-medium">No restaurants found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters or add a new restaurant.
          </p>
        </div>
      )}

      {/* Restaurant cards grid */}
      {!isLoading && !isError && filteredTenants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all duration-200"
              onClick={() => navigate(`/tenants/${tenant.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Globe className="h-3.5 w-3.5" />
                      <span>{tenant.slug}.helmiesbites.fi</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="outline" className={STATUS_COLORS[tenant.status]}>
                      {tenant.status}
                    </Badge>
                    <Badge variant="outline" className={TIER_COLORS[tenant.subscription_tier]}>
                      {tenant.subscription_tier}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span>{formatCurrency(tenant.monthly_fee)}/mo</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                    <span>{tenant.order_count ?? 0} orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created {formatDate(tenant.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
