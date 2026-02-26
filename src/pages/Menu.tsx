import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
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
import { ProductManagementModal } from '@/components/product-management-modal';
import { CategoryManagementModal } from '@/components/category-management-modal';
import { ToppingsManagementModal } from '@/components/toppings-management-modal-supabase';
import { CategoryToppingGroupAssignment } from '@/components/category-topping-group-assignment';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description?: string;
  image?: string;
  calories?: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  position: number;
  available: boolean;
}

interface ToppingGroup {
  id: string;
  name: string;
  description?: string;
  position: number;
  toppings: Array<{
    id: string;
    name: string;
    price: number;
    available: boolean;
  }>;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

export function Menu() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showToppingsModal, setShowToppingsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'toppings'>('products');

  // Get tenant info from URL or context
  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'default';

  // Fetch menu products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['menu-products', tenantId, searchTerm, selectedCategory],
    queryFn: () => api.get(`/api/menu/products?tenantId=${tenantId}&search=${searchTerm}&category=${selectedCategory}`),
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories', tenantId],
    queryFn: () => api.get(`/api/menu/categories?tenantId=${tenantId}`),
  });

  // Fetch topping groups
  const { data: toppingsData, isLoading: toppingsLoading } = useQuery({
    queryKey: ['topping-groups', tenantId],
    queryFn: () => api.get(`/api/toppings/groups?tenantId=${tenantId}`),
  });

  // Fetch tenant info
  const { data: tenantData } = useQuery({
    queryKey: ['tenant-info', tenantId],
    queryFn: () => api.get(`/api/tenants/${tenantId}`),
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const toppingGroups = toppingsData?.groups || [];

  const filteredProducts = products.filter((product: MenuItem) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleEditCategory = (category: any) => {
    setSelectedCategoryForEdit(category);
    setShowCategoryModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tenantData?.tenant?.name || 'Menu Management'}
          </h1>
          <p className="text-gray-500">Manage your restaurant's menu items, categories, and toppings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('toppings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'toppings'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Toppings
          </button>
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Menu Items</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category: MenuCategory) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table */}
              {productsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading menu items...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No menu items found</div>
              ) : (
                <div className="grid gap-4">
                  {filteredProducts.map((product: MenuItem) => (
                    <div key={product.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <Badge variant={product.available ? 'default' : 'secondary'}>
                              {product.available ? 'Available' : 'Hidden'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>€{product.price.toFixed(2)}</span>
                            <span>{getCategoryName(product.category)}</span>
                            {product.calories && <span>{product.calories} kcal</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct({...product, available: !product.available})}
                          >
                            {product.available ? 'Hide' : 'Show'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Menu Categories</CardTitle>
                <Button onClick={() => { setSelectedCategoryForEdit(null); setShowCategoryModal(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No categories found</div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category: MenuCategory) => (
                    <div key={category.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Position: {category.position}</span>
                            <Badge variant={category.available ? 'default' : 'secondary'}>
                              {category.available ? 'Active' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory({...category, available: !category.available})}
                          >
                            {category.available ? 'Hide' : 'Show'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toppings Tab */}
      {activeTab === 'toppings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Topping Groups</CardTitle>
                <Button onClick={() => setShowToppingsModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topping Group
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {toppingsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading toppings...</div>
              ) : toppingGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No topping groups found</div>
              ) : (
                <div className="space-y-6">
                  {toppingGroups.map((group: ToppingGroup) => (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <Badge variant="secondary">Position: {group.position}</Badge>
                        </div>
                        {group.description && (
                          <p className="text-sm text-gray-600">{group.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {group.toppings.map((topping) => (
                            <div key={topping.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                              <div>
                                <span className="font-medium">{topping.name}</span>
                                {topping.price > 0 && (
                                  <span className="ml-2 text-sm text-gray-600">+€{topping.price.toFixed(2)}</span>
                                )}
                                <Badge variant={topping.available ? 'default' : 'secondary'} className="ml-2">
                                  {topping.available ? 'Available' : 'Hidden'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl">
          <ProductManagementModal
            tenantId={tenantId}
            product={selectedProduct}
            categories={categories}
            onSave={() => {
              // Refresh products
              window.location.reload();
            }}
            onClose={() => setShowProductModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <CategoryManagementModal
            tenantId={tenantId}
            category={selectedCategoryForEdit}
            onSave={() => {
              // Refresh categories
              window.location.reload();
            }}
            onClose={() => setShowCategoryModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Toppings Modal */}
      <Dialog open={showToppingsModal} onOpenChange={setShowToppingsModal}>
        <DialogContent className="max-w-2xl">
          <ToppingsManagementModal
            tenantId={tenantId}
            onSave={() => {
              // Refresh toppings
              window.location.reload();
            }}
            onClose={() => setShowToppingsModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}