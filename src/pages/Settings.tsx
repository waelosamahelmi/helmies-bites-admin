import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Plus, Edit, Trash2, Save, Clock, MapPin, CreditCard, Bell, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceHoursSection } from '@/components/service-hours-section';
import { RestaurantSiteConfig } from '@/components/restaurant-site-config';
import { PaymentMethodsModal } from '@/components/payment-methods-modal';
import { StripeSettingsModal } from '@/components/stripe-settings-modal';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface ServiceHours {
  weekdayHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  weekendHours: {
    open: string;
    close: string;
    isOpen: boolean;
  };
  specialHours?: Array<{
    date: string;
    open: string;
    close: string;
    isClosed: boolean;
    note?: string;
  }>;
}

interface DeliveryConfig {
  enabled: boolean;
  radius: number;
  fee: number;
  minimumOrder: number;
  zones: Array<{
    name: string;
    radius: number;
    fee: number;
  }>;
}

interface PaymentConfig {
  methods: Array<{
    id: string;
    name: string;
    enabled: boolean;
    icon?: string;
  }>;
  stripe: {
    connected: boolean;
    publicKey?: string;
    secretKey?: string;
  };
}

export function Settings() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'info' | 'hours' | 'delivery' | 'payments'>('info');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'default';

  // Fetch restaurant data
  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ['restaurant-config', tenantId],
    queryFn: () => api.get(`/api/restaurants/${tenantId}`),
  });

  // Fetch service hours
  const { data: hoursData } = useQuery({
    queryKey: ['service-hours', tenantId],
    queryFn: () => api.get(`/api/restaurants/${tenantId}/hours`),
  });

  // Fetch delivery config
  const { data: deliveryData } = useQuery({
    queryKey: ['delivery-config', tenantId],
    queryFn: () => api.get(`/api/restaurants/${tenantId}/delivery`),
  });

  // Fetch payment config
  const { data: paymentData } = useQuery({
    queryKey: ['payment-config', tenantId],
    queryFn: () => api.get(`/api/restaurants/${tenantId}/payments`),
  });

  const restaurant = restaurantData?.restaurant;
  const serviceHours = hoursData?.hours;
  const deliveryConfig = deliveryData?.config;
  const paymentConfig = paymentData?.config;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="text-gray-500">Configure your restaurant's information, hours, delivery, and payment settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Restaurant Info</TabsTrigger>
          <TabsTrigger value="hours">Service Hours</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Restaurant Information Tab */}
        <TabsContent value="info">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Restaurant Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                        <Input
                          value={restaurant?.name || ''}
                          onChange={(e) => console.log('Update name:', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={3}
                          value={restaurant?.description || ''}
                          onChange={(e) => console.log('Update description:', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <Input
                          value={restaurant?.phone || ''}
                          onChange={(e) => console.log('Update phone:', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <Input
                          type="email"
                          value={restaurant?.email || ''}
                          onChange={(e) => console.log('Update email:', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Address</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Street Address</label>
                        <Input
                          value={restaurant?.address || ''}
                          onChange={(e) => console.log('Update address:', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">City</label>
                          <Input
                            value={restaurant?.city || ''}
                            onChange={(e) => console.log('Update city:', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Postal Code</label>
                          <Input
                            value={restaurant?.postalCode || ''}
                            onChange={(e) => console.log('Update postal code:', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <Input
                          value={restaurant?.country || ''}
                          onChange={(e) => console.log('Update country:', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Website Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <RestaurantSiteConfig
                  tenantId={tenantId}
                  restaurant={restaurant}
                  onSave={() => console.log('Saved website config')}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Service Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceHoursSection
                tenantId={tenantId}
                hours={serviceHours}
                onSave={() => console.log('Saved hours')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Enable Delivery</h3>
                      <p className="text-sm text-gray-500">
                        Enable or disable delivery service for your restaurant
                      </p>
                    </div>
                    <Switch
                      checked={deliveryConfig?.enabled || false}
                      onCheckedChange={(checked) => console.log('Toggle delivery:', checked)}
                    />
                  </div>

                  {deliveryConfig?.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Delivery Radius (km)</label>
                          <Input
                            type="number"
                            value={deliveryConfig?.radius || 10}
                            onChange={(e) => console.log('Update radius:', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Delivery Fee (€)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={deliveryConfig?.fee || 2.50}
                            onChange={(e) => console.log('Update fee:', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Minimum Order (€)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={deliveryConfig?.minimumOrder || 15.00}
                            onChange={(e) => console.log('Update min order:', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {deliveryConfig?.enabled && deliveryConfig.zones && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Delivery Zones</CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Zone
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deliveryConfig.zones.map((zone, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">{zone.name}</h4>
                          <p className="text-sm text-gray-500">
                            {zone.radius} km radius • €{zone.fee} fee
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium">Stripe</h3>
                        <p className="text-sm text-gray-500">
                          Online payments via credit/debit cards
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={paymentConfig?.stripe.connected ? 'default' : 'outline'}
                      onClick={() => setShowStripeModal(true)}
                    >
                      {paymentConfig?.stripe.connected ? 'Connected' : 'Connect'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium">Cash on Delivery</h3>
                        <p className="text-sm text-gray-500">
                          Pay when the food is delivered
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentConfig?.methods?.find(m => m.id === 'cash')?.enabled || false}
                      onCheckedChange={(checked) => console.log('Toggle cash:', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Payment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentConfig?.methods?.filter(m => m.id !== 'stripe' && m.id !== 'cash').map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        {method.icon && (
                          <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">
                            {method.icon}
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{method.name}</h4>
                        </div>
                      </div>
                      <Switch
                        checked={method.enabled || false}
                        onCheckedChange={(checked) => console.log('Toggle method:', checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {(!paymentConfig?.stripe.connected && !paymentConfig?.methods?.filter(m => m.enabled).length) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">No payment methods enabled</h4>
                      <p className="text-sm text-orange-700">
                        You need to enable at least one payment method to accept orders.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Methods Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Methods</DialogTitle>
          </DialogHeader>
          <PaymentMethodsModal
            tenantId={tenantId}
            onSave={() => {
              setShowPaymentModal(false);
              // Refresh data
              window.location.reload();
            }}
            onClose={() => setShowPaymentModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Stripe Settings Modal */}
      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stripe Settings</DialogTitle>
          </DialogHeader>
          <StripeSettingsModal
            tenantId={tenantId}
            connected={paymentConfig?.stripe.connected || false}
            onSave={() => {
              setShowStripeModal(false);
              // Refresh data
              window.location.reload();
            }}
            onClose={() => setShowStripeModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}