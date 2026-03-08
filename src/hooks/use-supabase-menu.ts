import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
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
  created_at?: string;
  updated_at?: string;
}

interface Topping {
  id: number;
  name: string;
  name_en?: string;
  price: number;
  is_active: boolean;
  topping_group_id?: number;
  branch_id?: number;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Branch {
  id: number;
  name: string;
  name_en?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Categories
export function useSupabaseCategories(branchId?: number) {
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

export function useSupabaseCreateCategory() {
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

export function useSupabaseUpdateCategory() {
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

export function useSupabaseDeleteCategory() {
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

// Toppings
export function useSupabaseToppings(branchId?: number) {
  return useQuery({
    queryKey: ['toppings', branchId],
    queryFn: async () => {
      const url = branchId ? `/toppings?branch_id=${branchId}` : '/toppings';
      const data = await api.get(url);
      return (data.toppings || data || []) as Topping[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSupabaseCreateTopping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (topping: Partial<Topping>) => {
      return api.post('/toppings', topping);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toppings'] });
    },
  });
}

export function useSupabaseUpdateTopping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Topping> & { id: number }) => {
      return api.put(`/toppings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toppings'] });
    },
  });
}

export function useSupabaseDeleteTopping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/toppings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toppings'] });
    },
  });
}

// Branches
export function useSupabaseBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const data = await api.get('/branches');
      return (data.branches || data || []) as Branch[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
