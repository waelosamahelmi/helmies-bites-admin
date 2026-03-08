import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface RestaurantConfig {
  id?: string;
  tenant_id?: string;
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  logo_url?: string;
  logo_public_id?: string;
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
  operating_hours?: Record<string, string>;
  business_info?: {
    company_number?: string;
    tax_id?: string;
    vat_id?: string;
    industry?: string;
    founding_year?: number;
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
    payment_method?: string;
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
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useRestaurantConfig(tenantId?: string) {
  return useQuery({
    queryKey: ['restaurant-config', tenantId],
    queryFn: async () => {
      const url = tenantId 
        ? `/restaurant-config?tenant_id=${tenantId}`
        : '/restaurant-config';
      try {
        const data = await api.get(url);
        return (data.config || data) as RestaurantConfig | null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRestaurantConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Partial<RestaurantConfig>) => {
      return api.post('/restaurant-config', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-config'] });
    },
  });
}

export function useUpdateRestaurantConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RestaurantConfig> & { id: string }) => {
      return api.put(`/restaurant-config/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-config'] });
    },
  });
}

export function useActivateRestaurantConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/restaurant-config/${id}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-config'] });
    },
  });
}
