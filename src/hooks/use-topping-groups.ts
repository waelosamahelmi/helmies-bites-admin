import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ToppingGroup {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  min_selections?: number;
  max_selections?: number;
  is_required?: boolean;
  is_active: boolean;
  branch_id?: number;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryToppingGroup {
  id: number;
  category_id: number;
  topping_group_id: number;
  sort_order?: number;
  created_at?: string;
}

export function useToppingGroups(branchId?: number) {
  return useQuery({
    queryKey: ['topping-groups', branchId],
    queryFn: async () => {
      const url = branchId ? `/topping-groups?branch_id=${branchId}` : '/topping-groups';
      const data = await api.get(url);
      return (data.topping_groups || data.groups || data || []) as ToppingGroup[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategoryToppingGroups(categoryId: number) {
  return useQuery({
    queryKey: ['category-topping-groups', categoryId],
    queryFn: async () => {
      const data = await api.get(`/categories/${categoryId}/topping-groups`);
      return (data.topping_groups || data || []) as ToppingGroup[];
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateToppingGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: Partial<ToppingGroup>) => {
      return api.post('/topping-groups', group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topping-groups'] });
    },
  });
}

export function useUpdateToppingGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ToppingGroup> & { id: number }) => {
      return api.put(`/topping-groups/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topping-groups'] });
    },
  });
}

export function useDeleteToppingGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/topping-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topping-groups'] });
    },
  });
}

export function useAssignToppingGroupToCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ categoryId, toppingGroupId, sortOrder }: { 
      categoryId: number; 
      toppingGroupId: number;
      sortOrder?: number;
    }) => {
      return api.post(`/categories/${categoryId}/topping-groups`, { 
        topping_group_id: toppingGroupId,
        sort_order: sortOrder 
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['category-topping-groups', variables.categoryId] });
    },
  });
}

export function useRemoveToppingGroupFromCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ categoryId, toppingGroupId }: { 
      categoryId: number; 
      toppingGroupId: number;
    }) => {
      return api.delete(`/categories/${categoryId}/topping-groups/${toppingGroupId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['category-topping-groups', variables.categoryId] });
    },
  });
}
