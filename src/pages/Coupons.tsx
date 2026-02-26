import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Plus, Edit, Trash2, Search, Percent, Gift, Calendar, Users, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  validFrom: string;
  validTo: string;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  limitPerCustomer?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  applicableTo: {
    products?: string[];
    categories?: string[];
    orderTypes?: 'delivery' | 'pickup' | 'all';
  };
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
}

interface CouponUsage {
  id: string;
  couponCode: string;
  orderId: string;
  customerId: string;
  customerName: string;
  originalAmount: number;
  discountAmount: number;
  orderDate: string;
  orderStatus: string;
}

export function Coupons() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'default';

  // Fetch coupons data
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['coupons', tenantId, typeFilter, statusFilter],
    queryFn: () => api.get(`/api/coupons?tenantId=${tenantId}&type=${typeFilter}&status=${statusFilter}`),
  });

  // Fetch coupon usage history
  const { data: usageData } = useQuery({
    queryKey: ['coupon-usage', selectedCoupon?.id],
    queryFn: () => selectedCoupon?.id ? api.get(`/api/coupons/${selectedCoupon.id}/usage`) : null,
    enabled: !!selectedCoupon?.id,
  });

  const coupons = couponsData?.coupons || [];
  const usageHistory = usageData?.history || [];

  const filteredCoupons = coupons.filter((coupon: Coupon) =>
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCouponTypeBadge = (type: Coupon['type']) => {
    return type === 'percentage' ?
      <Badge className="bg-blue-100 text-blue-700">Percentage</Badge> :
      <Badge variant="secondary">Fixed Amount</Badge>;
  };

  const getUsageBadgeColor = (coupon: Coupon) => {
    const usageRate = coupon.usedCount / (coupon.maxUses || Infinity);
    if (usageRate >= 0.9) return 'bg-red-100 text-red-700';
    if (usageRate >= 0.7) return 'bg-orange-100 text-orange-700';
    if (usageRate >= 0.5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const isCouponExpired = (coupon: Coupon) => {
    return new Date(coupon.validTo) < new Date();
  };

  const isCouponActive = (coupon: Coupon) => {
    return coupon.isActive && !isCouponExpired(coupon);
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    }
    return formatCurrency(coupon.value);
  };

  const handleCreateCoupon = () => {
    setSelectedCoupon(null);
    setShowCreateModal(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowCreateModal(true);
  };

  const handleViewUsage = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowUsageModal(true);
  };

  const handleToggleCoupon = (coupon: Coupon) => {
    console.log(`Toggle coupon ${coupon.id} active status`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <p className="text-gray-500">Manage your restaurant's coupon codes and promotional offers</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search coupons by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-32">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div className="w-32">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Coupons</CardTitle>
            <Button onClick={handleCreateCoupon}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading coupons...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No coupons found</div>
          ) : (
            <div className="grid gap-4">
              {filteredCoupons.map((coupon: Coupon) => (
                <Card key={coupon.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-orange-500" />
                            <h3 className="font-semibold text-gray-900">{coupon.name}</h3>
                            <Badge variant="outline">{coupon.code}</Badge>
                            {getCouponTypeBadge(coupon.type)}
                          </div>
                          {isCouponExpired(coupon) && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                        {coupon.description && (
                          <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUsage(coupon)}
                        >
                          Usage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleCoupon(coupon)}
                        >
                          {coupon.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Discount</p>
                        <p className="font-semibold text-lg text-gray-900">
                          {formatDiscount(coupon)}
                          {coupon.maxDiscount && (
                            <span className="text-sm text-gray-500 ml-2">
                              (max {formatCurrency(coupon.maxDiscount)})
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valid Period</p>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(coupon.validFrom).toLocaleDateString('fi-FI')} - {new Date(coupon.validTo).toLocaleDateString('fi-FI')}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Usage</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">
                            {coupon.usedCount} / {coupon.maxUses || '∞'}
                          </span>
                          <Badge className={getUsageBadgeColor(coupon)}>
                            {coupon.usedCount / (coupon.maxUses || 1) * 100}% used
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Minimum Order</p>
                        <p className="font-medium text-gray-900">
                          {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : 'No minimum'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Per customer: {coupon.limitPerCustomer || 'Unlimited'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Created: {new Date(coupon.createdAt).toLocaleDateString('fi-FI')}
                      </div>
                      <div className="flex items-center gap-4">
                        {coupon.isRecurring && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <RotateCcw className="h-4 w-4" />
                            Recurring
                          </div>
                        )}
                        {coupon.lastUsed && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            Last used: {new Date(coupon.lastUsed).toLocaleDateString('fi-FI')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
          </DialogHeader>
          <CouponForm
            tenantId={tenantId}
            coupon={selectedCoupon}
            onSave={() => {
              setShowCreateModal(false);
              // Refresh data
              window.location.reload();
            }}
            onClose={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Usage Modal */}
      <Dialog open={showUsageModal} onOpenChange={setShowUsageModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coupon Usage History</DialogTitle>
          </DialogHeader>
          {selectedCoupon && (
            <div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedCoupon.name}</h3>
                <p className="text-sm text-gray-600">{selectedCoupon.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="font-medium">Code: {selectedCoupon.code}</span>
                  <span>Discount: {formatDiscount(selectedCoupon)}</span>
                  <span>Used: {selectedCoupon.usedCount} / {selectedCoupon.maxUses || '∞'}</span>
                </div>
              </div>

              {usageHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No usage history found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usageHistory.map((usage: CouponUsage) => (
                        <tr key={usage.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{usage.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {usage.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(usage.orderDate).toLocaleDateString('fi-FI')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(usage.originalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            -{formatCurrency(usage.discountAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={usage.orderStatus === 'delivered' ? 'default' : 'secondary'}>
                              {usage.orderStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CouponFormProps {
  tenantId: string;
  coupon?: Coupon | null;
  onSave: () => void;
  onClose: () => void;
}

function CouponForm({ tenantId, coupon, onSave, onClose }: CouponFormProps) {
  const [formData, setFormData] = useState({
    name: coupon?.name || '',
    code: coupon?.code || '',
    description: coupon?.description || '',
    type: coupon?.type || 'percentage',
    value: coupon?.value || 0,
    maxDiscount: coupon?.maxDiscount || null,
    minOrderAmount: coupon?.minOrderAmount || null,
    validFrom: coupon?.validFrom || new Date().toISOString().split('T')[0],
    validTo: coupon?.validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isRecurring: coupon?.isRecurring || false,
    recurringInterval: coupon?.recurringInterval || 'weekly',
    limitPerCustomer: coupon?.limitPerCustomer || null,
    maxUses: coupon?.maxUses || null,
    isActive: coupon?.isActive ?? true,
    applicableTo: coupon?.applicableTo || {
      orderTypes: 'all'
    }
  });

  const [customCode, setCustomCode] = useState(coupon?.code || '');
  const [generateRandomCode, setGenerateRandomCode] = useState(!coupon?.code);

  const generateRandomCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'HELMS';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      code: generateRandomCode ? generateRandomCouponCode() : customCode,
      tenantId,
    };

    try {
      if (coupon) {
        await api.put(`/api/coupons/${coupon.id}`, payload);
      } else {
        await api.post('/api/coupons', payload);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save coupon:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Coupon Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Coupon Code *</label>
        <div className="flex gap-2 items-center">
          <Input
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            className="flex-1"
            disabled={generateRandomCode}
          />
          <Switch
            checked={generateRandomCode}
            onCheckedChange={(checked) => {
              setGenerateRandomCode(checked);
              if (checked) {
                setCustomCode(generateRandomCouponCode());
              }
            }}
          />
          <span className="text-sm text-gray-500">Auto-generate</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Coupon Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (€)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Value {formData.type === 'percentage' ? '(%)' : '(€)'} *
          </label>
          <Input
            type="number"
            min={formData.type === 'percentage' ? 1 : 0.01}
            max={formData.type === 'percentage' ? 100 : 999}
            step={formData.type === 'percentage' ? 1 : 0.01}
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Valid From *</label>
          <Input
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Valid To *</label>
          <Input
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData({...formData, validTo: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Order Amount (€)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.minOrderAmount || ''}
            onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : null})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Discount (€)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.maxDiscount || ''}
            onChange={(e) => setFormData({...formData, maxDiscount: e.target.value ? parseFloat(e.target.value) : null})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Limit Per Customer</label>
          <Input
            type="number"
            min="1"
            value={formData.limitPerCustomer || ''}
            onChange={(e) => setFormData({...formData, limitPerCustomer: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Max Uses Total</label>
        <Input
          type="number"
          min="1"
          value={formData.maxUses || ''}
          onChange={(e) => setFormData({...formData, maxUses: e.target.value ? parseInt(e.target.value) : null})}
          placeholder="Leave empty for unlimited"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Is Active</label>
            <p className="text-xs text-gray-500">Enable or disable this coupon</p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Recurring Coupon</label>
            <p className="text-xs text-gray-500">Apply coupon repeatedly on a schedule</p>
          </div>
          <Switch
            checked={formData.isRecurring}
            onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
          />
        </div>
      </div>

      {formData.isRecurring && (
        <div>
          <label className="block text-sm font-medium mb-1">Recurring Interval</label>
          <select
            value={formData.recurringInterval}
            onChange={(e) => setFormData({...formData, recurringInterval: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Applicable To</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="orderTypes"
              value="all"
              checked={formData.applicableTo.orderTypes === 'all'}
              onChange={(e) => setFormData({
                ...formData,
                applicableTo: {...formData.applicableTo, orderTypes: e.target.value as any}
              })}
            />
            <span>All Order Types</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="orderTypes"
              value="delivery"
              checked={formData.applicableTo.orderTypes === 'delivery'}
              onChange={(e) => setFormData({
                ...formData,
                applicableTo: {...formData.applicableTo, orderTypes: e.target.value as any}
              })}
            />
            <span>Delivery Orders Only</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="orderTypes"
              value="pickup"
              checked={formData.applicableTo.orderTypes === 'pickup'}
              onChange={(e) => setFormData({
                ...formData,
                applicableTo: {...formData.applicableTo, orderTypes: e.target.value as any}
              })}
            />
            <span>Pickup Orders Only</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>
          {coupon ? 'Update Coupon' : 'Create Coupon'}
        </Button>
      </div>
    </div>
  );
}