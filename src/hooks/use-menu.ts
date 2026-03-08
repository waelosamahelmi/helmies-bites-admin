import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  branch_id?: number;
  tenant_id?: string;
}

interface MenuItem {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price: number;
  image_url?: string;
  category_id: number;
  is_active: boolean;
  is_popular?: boolean;
  branch_id?: number;
  tenant_id?: string;
}

export function useCategories(branchId?: number) {
  return useQuery({
    queryKey: ['categories', branchId],
    queryFn: async () => {
      const url = branchId ? `/categories?branch_id=${branchId}` : '/categories';
      const data = await api.get(url);
      return (data.categories || data || []) as Category[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useMenuItems(categoryId?: number, branchId?: number) {
  return useQuery({
    queryKey: ['menu-items', categoryId, branchId],
    queryFn: async () => {
      let url = '/menu-items';
      const params = new URLSearchParams();
      if (categoryId) params.set('category_id', String(categoryId));
      if (branchId) params.set('branch_id', String(branchId));
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await api.get(url);
      return (data.items || data.menu_items || data || []) as MenuItem[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      return api.post('/categories', category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Category> & { id: number }) => {
      return api.put(`/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<MenuItem>) => {
      return api.post('/menu-items', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MenuItem> & { id: number }) => {
      return api.put(`/menu-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}
