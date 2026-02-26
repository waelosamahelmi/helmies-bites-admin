import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Plus, Edit, Trash2, Search, Filter, Mail, Phone, MapPin, Calendar, Crown, User } from 'lucide-react';
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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  registrationDate: string;
  totalOrders: number;
  totalSpent: number;
  favoriteItems: string[];
  lastOrderDate?: string;
  isVip: boolean;
  notes?: string;
}

interface OrderSummary {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function Customers() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'default';

  // Fetch customers data
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', tenantId, statusFilter],
    queryFn: () => api.get(`/api/customers?tenantId=${tenantId}&status=${statusFilter}`),
  });

  // Fetch customer orders (for detail view)
  const { data: ordersData } = useQuery({
    queryKey: ['customer-orders', selectedCustomer?.id],
    queryFn: () => selectedCustomer?.id ? api.get(`/api/orders?customerId=${selectedCustomer.id}`) : null,
    enabled: !!selectedCustomer?.id,
  });

  const customers = customersData?.customers || [];
  const customerOrders = ordersData?.orders || [];

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const getStatusBadgeColor = (totalOrders: number, totalSpent: number) => {
    if (totalSpent > 1000) return 'bg-purple-100 text-purple-700';
    if (totalOrders > 20) return 'bg-green-100 text-green-700';
    if (totalOrders > 10) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI');
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">Manage your restaurant's customer information and profiles</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="regular">Regular Customers</option>
                <option value="new">New Customers</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Customer List</CardTitle>
            <span className="text-sm text-gray-500">
              {filteredCustomers.length} customers found
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No customers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {customer.isVip && (
                            <Crown className="h-5 w-5 text-purple-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">Member since {formatDate(customer.registrationDate)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </div>
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadgeColor(customer.totalOrders, customer.totalSpent)}>
                          {customer.isVip ? 'VIP' :
                           customer.totalOrders > 20 ? 'Loyal' :
                           customer.totalOrders > 5 ? 'Regular' : 'New'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.totalOrders} orders
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {selectedCustomer.isVip && (
                      <Crown className="h-6 w-6 text-purple-500" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                      <p className="text-gray-500">Member since {formatDate(selectedCustomer.registrationDate)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {selectedCustomer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {selectedCustomer.phone}
                        </div>
                        {selectedCustomer.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {selectedCustomer.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Orders:</span>
                          <span className="font-medium">{selectedCustomer.totalOrders}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="font-medium">{formatCurrency(selectedCustomer.totalSpent)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Order:</span>
                          <span className="font-medium">
                            {selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate) : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Favorite Items */}
              {selectedCustomer.favoriteItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Favorite Items</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.favoriteItems.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Orders</h3>
                </CardHeader>
                <CardContent>
                  {customerOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No orders found</p>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.slice(0, 5).map((order: OrderSummary) => (
                        <div key={order.orderId} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">#{order.orderId}</span>
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>{formatDate(order.orderDate)}</span>
                            <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              {order.items.length} items{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedCustomer.notes && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Notes</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCustomerModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}