import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Plus, Edit, Trash2, MapPin, Clock, Phone, Mail, Users, Building, CheckCircle, AlertCircle } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  email: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending';
  manager?: {
    name: string;
    email: string;
    phone: string;
  };
  staffCount: number;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  deliveryRadius: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  specialHours?: Array<{
    date: string;
    note: string;
    isClosed: boolean;
  }>;
  createdDate: string;
}

interface CreateBranchForm {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  description?: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryRadius: number;
  manager?: {
    name: string;
    email: string;
    phone: string;
  };
}

export function Branches() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'default';

  // Fetch branches data
  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: () => api.get(`/api/branches?tenantId=${tenantId}`),
  });

  const branches = branchesData?.branches || [];

  const filteredBranches = branches.filter((branch: Branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBranchStatusBadge = (status: Branch['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setShowCreateModal(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <p className="text-gray-500">Manage your restaurant branches and locations</p>
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
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search branches by name, city, or address..."
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
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Branch List</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>

        {/* Branch List */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Branches</CardTitle>
                <Button onClick={handleAddBranch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading branches...</div>
              ) : filteredBranches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No branches found</div>
              ) : (
                <div className="grid gap-4">
                  {filteredBranches.map((branch: Branch) => (
                    <Card key={branch.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <Building className="h-5 w-5 text-orange-500" />
                              <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                              {getBranchStatusBadge(branch.status)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{branch.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBranch(branch)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">{branch.address}</p>
                              <p className="text-sm text-gray-600">{branch.city}, {branch.postalCode}</p>
                              <p className="text-sm text-gray-600">{branch.country}</p>
                              {branch.deliveryEnabled && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  Delivery up to {branch.deliveryRadius} km
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                {branch.phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                {branch.email}
                              </div>
                              {branch.manager && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-medium text-gray-900 mb-1">Branch Manager</p>
                                  <p className="text-sm text-gray-600">{branch.manager.name}</p>
                                  <p className="text-sm text-gray-600">{branch.manager.email}</p>
                                  <p className="text-sm text-gray-600">{branch.manager.phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{branch.staffCount}</span>
                            </div>
                            <p className="text-sm text-gray-500">Staff Members</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-gray-900">
                                {branch.pickupEnabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">Pickup Available</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              {branch.status === 'active' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              )}
                              <span className="font-medium text-gray-900">
                                {branch.status === 'active' ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">Current Status</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Created: {new Date(branch.createdDate).toLocaleDateString('fi-FI')}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navigate to branch management
                                window.location.href = `/branches/${branch.id}`;
                              }}
                            >
                              Manage Branch
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map View */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Branch Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Interactive map would be displayed here</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Showing {filteredBranches.length} branches on the map
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Branch Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
          </DialogHeader>
          <BranchForm
            tenantId={tenantId}
            branch={null}
            onSave={() => {
              setShowCreateModal(false);
              // Refresh data
              window.location.reload();
            }}
            onClose={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Branch Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          <BranchForm
            tenantId={tenantId}
            branch={selectedBranch}
            onSave={() => {
              setShowEditModal(false);
              // Refresh data
              window.location.reload();
            }}
            onClose={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BranchFormProps {
  tenantId: string;
  branch?: Branch | null;
  onSave: () => void;
  onClose: () => void;
}

function BranchForm({ tenantId, branch, onSave, onClose }: BranchFormProps) {
  const [formData, setFormData] = useState<CreateBranchForm>({
    name: branch?.name || '',
    address: branch?.address || '',
    city: branch?.city || '',
    postalCode: branch?.postalCode || '',
    country: branch?.country || 'Finland',
    phone: branch?.phone || '',
    email: branch?.email || '',
    description: branch?.description || '',
    deliveryEnabled: branch?.deliveryEnabled || false,
    pickupEnabled: branch?.pickupEnabled || true,
    deliveryRadius: branch?.deliveryRadius || 10,
    manager: branch?.manager || {
      name: '',
      email: '',
      phone: '',
    },
  });

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        tenantId,
        coordinates: {
          lat: 60.1699,
          lng: 24.9384,
        },
      };

      if (branch) {
        await api.put(`/api/branches/${branch.id}`, payload);
      } else {
        await api.post('/api/branches', payload);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save branch:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Branch Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
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
          <label className="block text-sm font-medium mb-1">Street Address *</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City *</label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Postal Code *</label>
          <Input
            value={formData.postalCode}
            onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number *</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email Address *</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Branch Manager</label>
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <Input
              value={formData.manager?.name || ''}
              onChange={(e) => setFormData({
                ...formData,
                manager: {
                  ...formData.manager,
                  name: e.target.value,
                }
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <Input
                type="email"
                value={formData.manager?.email || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  manager: {
                    ...formData.manager,
                    email: e.target.value,
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <Input
                value={formData.manager?.phone || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  manager: {
                    ...formData.manager,
                    phone: e.target.value,
                  }
                })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Service Options</h4>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Enable Delivery</label>
            <p className="text-xs text-gray-500">Allow customers to order delivery from this branch</p>
          </div>
          <Switch
            checked={formData.deliveryEnabled}
            onCheckedChange={(checked) => setFormData({...formData, deliveryEnabled: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Enable Pickup</label>
            <p className="text-xs text-gray-500">Allow customers to pick up orders from this branch</p>
          </div>
          <Switch
            checked={formData.pickupEnabled}
            onCheckedChange={(checked) => setFormData({...formData, pickupEnabled: checked})}
          />
        </div>
        {formData.deliveryEnabled && (
          <div>
            <label className="block text-sm font-medium mb-1">Delivery Radius (km)</label>
            <Input
              type="number"
              value={formData.deliveryRadius}
              onChange={(e) => setFormData({...formData, deliveryRadius: parseInt(e.target.value) || 0})}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Branch</Button>
      </div>
    </div>
  );
}