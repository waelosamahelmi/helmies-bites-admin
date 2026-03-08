import { useState } from "react";
import {
  useToppingGroups,
} from "@/hooks/use-topping-groups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { Plus, X, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface MenuItemToppingGroupAssignmentProps {
  menuItemId: number;
  menuItemName: string;
}

function useMenuItemToppingGroups(menuItemId: number) {
  return useQuery({
    queryKey: ['menu-item-topping-groups', menuItemId],
    queryFn: async () => {
      const data = await api.get(`/menu-items/${menuItemId}/topping-groups`);
      return data.topping_groups || data || [];
    },
    enabled: !!menuItemId,
  });
}

function useAssignToppingGroupToMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ menuItemId, toppingGroupId }: { menuItemId: number; toppingGroupId: number }) => {
      return api.post(`/menu-items/${menuItemId}/topping-groups`, { topping_group_id: toppingGroupId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-topping-groups', variables.menuItemId] });
    },
  });
}

function useRemoveToppingGroupFromMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ menuItemId, toppingGroupId }: { menuItemId: number; toppingGroupId: number }) => {
      return api.delete(`/menu-items/${menuItemId}/topping-groups/${toppingGroupId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-topping-groups', variables.menuItemId] });
    },
  });
}

export function MenuItemToppingGroupAssignment({ menuItemId, menuItemName }: MenuItemToppingGroupAssignmentProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: allToppingGroups } = useToppingGroups();
  const { data: assignedGroups, refetch } = useMenuItemToppingGroups(menuItemId);
  const assignGroup = useAssignToppingGroupToMenuItem();
  const removeGroup = useRemoveToppingGroupFromMenuItem();

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Get IDs of already assigned groups
  const assignedGroupIds = assignedGroups?.map((item: any) => item.toppingGroupId || item.topping_group_id || item.id) || [];

  // Filter out already assigned groups
  const availableGroups = allToppingGroups?.filter(
    (group: any) => !assignedGroupIds.includes(group.id)
  ) || [];

  const handleAssign = async () => {
    if (!selectedGroupId) return;

    try {
      await assignGroup.mutateAsync({
        menuItemId,
        toppingGroupId: parseInt(selectedGroupId),
      });

      toast({
        title: t("Onnistui", "Success"),
        description: t("Täydennysryhmä liitetty tuotteeseen", "Topping group assigned to menu item"),
      });

      setSelectedGroupId("");
      refetch();
    } catch (error) {
      console.error('Assign error:', error);
      toast({
        title: t("Virhe", "Error"),
        description: error instanceof Error ? error.message : t("Liittäminen epäonnistui", "Assignment failed"),
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (toppingGroupId: number) => {
    try {
      await removeGroup.mutateAsync({
        menuItemId,
        toppingGroupId,
      });

      toast({
        title: t("Onnistui", "Success"),
        description: t("Täydennysryhmä poistettu tuotteesta", "Topping group removed from menu item"),
      });

      refetch();
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: t("Virhe", "Error"),
        description: error instanceof Error ? error.message : t("Poistaminen epäonnistui", "Removal failed"),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {t("Täydennysryhmät", "Topping Groups")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Assigned Groups */}
        <div className="flex flex-wrap gap-2">
          {assignedGroups?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("Ei täydennysryhmiä", "No topping groups assigned")}
            </p>
          )}
          {assignedGroups?.map((group: any) => (
            <Badge 
              key={group.id || group.topping_group_id} 
              variant="secondary" 
              className="flex items-center gap-1"
            >
              {group.name}
              <button
                onClick={() => handleRemove(group.id || group.topping_group_id)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Add New Group */}
        {availableGroups.length > 0 && (
          <div className="flex gap-2">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t("Valitse täydennysryhmä", "Select topping group")} />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((group: any) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleAssign}
              disabled={!selectedGroupId || assignGroup.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
