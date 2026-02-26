import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Plus, Edit, Trash2, Search, Clock, Calendar, Utensils } from 'lucide-react';
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

interface LunchOption {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  weekdays: string[];
  seasonal?: boolean;
  image?: string;
  allergens?: string[];
  calories?: number;
}

interface MenuDay {
  weekday: string;
  date: string;
  lunchOptions: LunchOption[];
}

interface LunchWeek {
  weekNumber: string;
  days: MenuDay[];
}

export function Lounas() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLunch, setSelectedLunch] = useState<any>(null);

  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'default';

  // Fetch lunch menu data
  const { data: lunchData, isLoading } = useQuery({
    queryKey: ['lunch-menu', tenantId],
    queryFn: () => api.get(`/api/lunch/menu?tenantId=${tenantId}`),
  });

  // Fetch available lunch options
  const { data: optionsData } = useQuery({
    queryKey: ['lunch-options', tenantId],
    queryFn: () => api.get(`/api/lunch/options?tenantId=${tenantId}`),
  });

  const lunchWeeks = lunchData?.weeks || [];
  const allLunchOptions = optionsData?.options || [];

  const filteredOptions = allLunchOptions.filter((option: LunchOption) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWeekDays = (weekdays: string[]) => {
    const dayMap: Record<string, string> = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday',
    };
    return weekdays.map(day => dayMap[day] || day).join(', ');
  };

  const getDayInWeek = (weekday: string) => {
    const dayMap: Record<string, number> = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7,
    };
    const date = new Date();
    const today = date.getDay() || 7; // Convert Sunday (0) to 7
    const targetDay = dayMap[weekday];
    const diff = targetDay - today;
    const nextDate = new Date(date.setDate(date.getDate() + diff + (diff < 0 ? 7 : 0)));
    return nextDate.toLocaleDateString('fi-FI');
  };

  const handleEditLunch = (lunch: LunchOption) => {
    setSelectedLunch(lunch);
    setShowCreateModal(true);
  };

  const handleCreateLunch = () => {
    setSelectedLunch(null);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lunch Menu</h1>
        <p className="text-gray-500">Manage your restaurant's lunch menu and daily specials</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="manage">Manage Options</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading lunch menu...</div>
          ) : lunchWeeks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No lunch menu configured</div>
          ) : (
            <div className="space-y-6">
              {lunchWeeks.map((week: LunchWeek) => (
                <div key={week.weekNumber}>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Week {week.weekNumber}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {week.days.map((day) => (
                      <Card key={`${week.weekNumber}-${day.weekday}`}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {day.weekday.charAt(0).toUpperCase() + day.weekday.slice(1)}
                            </CardTitle>
                            <Badge variant="outline">
                              {getDayInWeek(day.weekday)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {day.lunchOptions.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No lunch options</p>
                          ) : (
                            <div className="space-y-3">
                              {day.lunchOptions.map((option: LunchOption) => (
                                <div key={option.id} className="border border-gray-200 rounded-lg p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900">{option.name}</h4>
                                    <span className="text-sm font-medium text-orange-600">
                                      €{option.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={option.available ? 'default' : 'secondary'}>
                                      {option.available ? 'Available' : 'Hidden'}
                                    </Badge>
                                    {option.seasonal && (
                                      <Badge variant="outline">Seasonal</Badge>
                                    )}
                                    {option.calories && (
                                      <span className="text-xs text-gray-500">
                                        {option.calories} kcal
                                      </span>
                                    )}
                                    {option.allergens && option.allergens.length > 0 && (
                                      <span className="text-xs text-orange-600">
                                        Allergens: {option.allergens.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Manage Options */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lunch Options</CardTitle>
                <Button onClick={handleCreateLunch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lunch Option
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search lunch options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No lunch options found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOptions.map((option: LunchOption) => (
                    <div key={option.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{option.name}</h3>
                            <Badge variant={option.available ? 'default' : 'secondary'}>
                              {option.available ? 'Available' : 'Hidden'}
                            </Badge>
                            {option.seasonal && (
                              <Badge variant="outline">Seasonal</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <span className="font-medium">€{option.price.toFixed(2)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getWeekDays(option.weekdays)}
                            </span>
                          </div>
                          {option.allergens && option.allergens.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-orange-600">Allergens:</span>
                              {option.allergens.map((allergen) => (
                                <Badge key={allergen} variant="outline" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLunch(option)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLunch({...option, available: !option.available})}
                          >
                            {option.available ? 'Hide' : 'Show'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLunch ? 'Edit Lunch Option' : 'Create Lunch Option'}
            </DialogTitle>
          </DialogHeader>
          <LunchOptionForm
            tenantId={tenantId}
            option={selectedLunch}
            onSave={() => {
              setShowCreateModal(false);
              // Refresh data
              window.location.reload();
            }}
            onClose={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LunchOptionFormProps {
  tenantId: string;
  option?: any;
  onSave: () => void;
  onClose: () => void;
}

function LunchOptionForm({ tenantId, option, onSave, onClose }: LunchOptionFormProps) {
  const [formData, setFormData] = useState({
    name: option?.name || '',
    description: option?.description || '',
    price: option?.price || 0,
    weekdays: option?.weekdays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    seasonal: option?.seasonal || false,
    calories: option?.calories || '',
    allergens: option?.allergens || '',
    available: option?.available ?? true,
  });

  const handleSave = async () => {
    const payload = {
      ...formData,
      calories: formData.calories ? parseInt(formData.calories) : null,
      allergens: formData.allergens ? formData.allergens.split(',').map(s => s.trim()) : [],
    };

    try {
      if (option) {
        await api.put(`/api/lunch/options/${option.id}`, { ...payload, tenantId });
      } else {
        await api.post('/api/lunch/options', { ...payload, tenantId });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save lunch option:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price (€)</label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Calories (optional)</label>
          <Input
            type="number"
            value={formData.calories}
            onChange={(e) => setFormData({...formData, calories: e.target.value})}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Available Weekdays</label>
        <div className="flex flex-wrap gap-2">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
            <label key={day} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.weekdays.includes(day)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({...formData, weekdays: [...formData.weekdays, day]});
                  } else {
                    setFormData({...formData, weekdays: formData.weekdays.filter(d => d !== day)});
                  }
                }}
              />
              <span className="text-sm">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.seasonal}
            onChange={(e) => setFormData({...formData, seasonal: e.target.checked})}
          />
          <span className="text-sm font-medium">Seasonal Special</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.available}
            onChange={(e) => setFormData({...formData, available: e.target.checked})}
          />
          <span className="text-sm font-medium">Available</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Allergens (comma-separated)</label>
        <Input
          value={formData.allergens}
          onChange={(e) => setFormData({...formData, allergens: e.target.value})}
          placeholder="e.g., gluten, dairy, nuts"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}