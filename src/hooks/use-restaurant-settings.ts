import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface RestaurantSettings {
  id?: string;
  tenant_id?: string;
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  logo_url?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  operating_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  business_info?: {
    company_number?: string;
    tax_id?: string;
    vat_id?: string;
  };
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    text_color?: string;
    accent_color?: string;
  };
  features?: {
    cash_on_delivery?: boolean;
    card_on_delivery?: boolean;
    online_payment?: boolean;
    reservations?: boolean;
    takeaway?: boolean;
    delivery?: boolean;
    lunch_service?: boolean;
    ai_menu_images?: boolean;
    loyalty_program?: boolean;
  };
  default_order_settings?: {
    payment_method?: 'stripe' | 'card_on_delivery' | 'cash';
    delivery_fee?: number;
    free_delivery_threshold?: number;
    tip_percentage?: number;
    include_vat?: boolean;
  };
  settings?: {
    currency?: string;
    language?: string;
    timezone?: string;
  };
  stripe_settings?: {
    enabled?: boolean;
    publishable_key?: string;
    secret_key?: string;
    webhook_secret?: string;
    test_mode?: boolean;
    apple_pay_enabled?: boolean;
    google_pay_enabled?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

async function fetchRestaurantSettings(tenantId?: string): Promise<RestaurantSettings | null> {
  try {
    const url = tenantId 
      ? `/restaurant-config?tenant_id=${tenantId}`
      : `/restaurant-config`;
    const data = await api.get(url);
    return data.config || data;
  } catch (error) {
    console.error('Failed to fetch restaurant settings:', error);
    return null;
  }
}

async function updateRestaurantSettings(settings: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
  if (settings.id) {
    return api.put(`/restaurant-config/${settings.id}`, settings);
  }
  return api.post('/restaurant-config', settings);
}

export function useRestaurantSettings(tenantId?: string) {
  return useQuery({
    queryKey: ['restaurant-settings', tenantId],
    queryFn: () => fetchRestaurantSettings(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<RestaurantSettings>) => 
      updateRestaurantSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
    },
  });
}
