import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Award, Gift } from 'lucide-react';

interface LoyaltyReward {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  points_required: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
}

export function Loyalty() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LoyaltyReward | null>(null);
  const [form, setForm] = useState({
    name: '',
    name_en: '',
    description: '',
    points_required: 100,
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    is_active: true,
  });

  useEffect(() => {
    loadRewards();
  }, []);

  async function loadRewards() {
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/loyalty/rewards', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
      });
      if (res.ok) {
        setRewards(await res.json());
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const tenantId = localStorage.getItem('tenant_id');
    const token = localStorage.getItem('auth_token');
    const url = editing ? `/api/loyalty/rewards/${editing.id}` : '/api/loyalty/rewards';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId || '',
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', name_en: '', description: '', points_required: 100, discount_type: 'percentage', discount_value: 10, is_active: true });
      loadRewards();
    }
  }

  function openEdit(reward: LoyaltyReward) {
    setEditing(reward);
    setForm({
      name: reward.name,
      name_en: reward.name_en || '',
      description: reward.description || '',
      points_required: reward.points_required,
      discount_type: reward.discount_type,
      discount_value: reward.discount_value,
      is_active: reward.is_active,
    });
    setShowForm(true);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-sm text-gray-500">Manage rewards and loyalty points</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" /> Add Reward
        </button>
      </div>

      {/* Reward Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Reward' : 'New Reward'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name (FI)</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Name (EN)</label>
                <input type="text" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Points Required</label>
                  <input type="number" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: parseInt(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" min={1} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Discount Type</label>
                  <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Discount Value</label>
                <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" min={0} step={0.01} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-600">
                {editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : rewards.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No loyalty rewards created yet</p>
          <p className="text-sm text-gray-400">Create rewards to incentivize repeat orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map(reward => (
            <div key={reward.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reward.is_active ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                  <Award className={`w-5 h-5 ${reward.is_active ? 'text-yellow-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{reward.name}</p>
                  <p className="text-sm text-gray-500">
                    {reward.points_required} pts → {reward.discount_type === 'percentage' ? `${reward.discount_value}% off` : `${reward.discount_value} off`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${reward.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {reward.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => openEdit(reward)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
