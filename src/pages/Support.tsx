import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, MessageSquare, Plus, ExternalLink, Clock } from 'lucide-react';

export function Support() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter, priorityFilter],
    queryFn: () => api.get(`/api/support/tickets?status=${statusFilter}&priority=${priorityFilter}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: () => api.get('/api/support/stats'),
  });

  const tickets = ticketsData?.tickets || [];

  const filteredTickets = tickets.filter((ticket: any) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-gray-100 text-gray-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Tickets List */}
      <div className={`transition-all duration-300 ${selectedTicket ? 'w-1/2' : 'w-full'} border-r border-gray-200`}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-500">Manage support requests from restaurants</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">{stats.byStatus?.open || 0}</div>
                <div className="text-sm text-blue-600">Open</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-900">{stats.byStatus?.in_progress || 0}</div>
                <div className="text-sm text-yellow-600">In Progress</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">{stats.byStatus?.resolved || 0}</div>
                <div className="text-sm text-green-600">Resolved</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-900">{stats.byPriority?.urgent || 0}</div>
                <div className="text-sm text-red-600">Urgent</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tickets found</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        {ticket.tenant && (
                          <p className="text-sm text-gray-500">{ticket.tenant.name}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Detail */}
      {selectedTicket && (
        <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Tenant Info */}
            {selectedTicket.tenant && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Restaurant</div>
                <div className="font-medium text-gray-900">{selectedTicket.tenant.name}</div>
                <a
                  href={`https://${selectedTicket.tenant.slug}.helmiesbites.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 hover:underline flex items-center gap-1 mt-1"
                >
                  {selectedTicket.tenant.slug}.helmiesbites.com <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Customer Message</div>
                  <p className="text-gray-900">{selectedTicket.message}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <div className="flex gap-2">
                {['open', 'in_progress', 'waiting', 'resolved', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={async () => {
                      await api.put(`/api/support/tickets/${selectedTicket.id}`, { status });
                      setSelectedTicket({ ...selectedTicket, status });
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      selectedTicket.status === status
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reply
              </label>
              <textarea
                rows={4}
                placeholder="Type your reply..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-2">
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
