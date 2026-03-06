import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  User,
  Building,
} from "lucide-react";

interface Ticket {
  id: string;
  tenant_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  sender: string;
  sender_type: string;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-300",
  normal: "bg-blue-100 text-blue-700 border-blue-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  urgent: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  waiting: "bg-purple-100 text-purple-700 border-purple-300",
  resolved: "bg-green-100 text-green-700 border-green-300",
  closed: "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_OPTIONS = ["open", "in_progress", "waiting", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Support() {
  const queryClient = useQueryClient();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [replyText, setReplyText] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [resolution, setResolution] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch tickets
  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.set("status", statusFilter);
  if (priorityFilter) queryParams.set("priority", priorityFilter);
  const queryString = queryParams.toString();

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["support-tickets", statusFilter, priorityFilter],
    queryFn: () =>
      api.get<{ tickets: Ticket[] }>(
        `/support/tickets${queryString ? `?${queryString}` : ""}`
      ),
  });

  const tickets = ticketsData?.tickets ?? [];

  // Filter by search locally
  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.tenant_id.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
  });

  // Fetch messages for selected ticket
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["support-messages", selectedTicketId],
    queryFn: () =>
      api.get<{ messages: TicketMessage[] }>(
        `/support/tickets/${selectedTicketId}/messages`
      ),
    enabled: !!selectedTicketId,
  });

  const messages = messagesData?.messages ?? [];
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  // Sync edit fields when ticket selection changes
  useEffect(() => {
    if (selectedTicket) {
      setEditStatus(selectedTicket.status);
      setEditPriority(selectedTicket.priority);
      setResolution("");
      setReplyText("");
    }
  }, [selectedTicketId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send reply mutation
  const sendReply = useMutation({
    mutationFn: (message: string) =>
      api.post(`/support/tickets/${selectedTicketId}/messages`, { message }),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({
        queryKey: ["support-messages", selectedTicketId],
      });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  // Update ticket mutation
  const updateTicket = useMutation({
    mutationFn: (data: { status?: string; priority?: string; resolution?: string }) =>
      api.put(`/support/tickets/${selectedTicketId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({
        queryKey: ["support-messages", selectedTicketId],
      });
    },
  });

  function handleSendReply() {
    if (!replyText.trim()) return;
    sendReply.mutate(replyText.trim());
  }

  function handleUpdateTicket() {
    const payload: Record<string, string> = {};
    if (editStatus && editStatus !== selectedTicket?.status) payload.status = editStatus;
    if (editPriority && editPriority !== selectedTicket?.priority) payload.priority = editPriority;
    if (resolution.trim()) payload.resolution = resolution.trim();
    if (Object.keys(payload).length > 0) {
      updateTicket.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            All tickets &middot; {filteredTickets.length} ticket
            {filteredTickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <MessageSquare className="h-8 w-8 text-orange-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {formatLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {formatLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ minHeight: "70vh" }}>
        {/* Left panel: Ticket list */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ticket List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto" style={{ maxHeight: "65vh" }}>
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Clock className="h-5 w-5 animate-spin mr-2" />
                Loading tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-sm">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-4 border-b last:border-b-0 transition-colors hover:bg-orange-50 ${
                    selectedTicketId === ticket.id
                      ? "bg-orange-50 border-l-4 border-l-orange-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm text-gray-900 truncate flex-1">
                      {ticket.subject}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${PRIORITY_COLORS[ticket.priority] ?? ""}`}
                    >
                      {formatLabel(ticket.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                    <Building className="h-3 w-3" />
                    <span className="truncate">{ticket.tenant_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STATUS_COLORS[ticket.status] ?? ""}`}
                    >
                      {formatLabel(ticket.status)}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                    {ticket.message}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right panel: Ticket detail */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          {!selectedTicketId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">Select a ticket</p>
              <p className="text-xs mt-1">
                Choose a ticket from the list to view its details
              </p>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <CardHeader className="border-b pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">
                      {selectedTicket?.subject}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {selectedTicket?.tenant_id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedTicket && formatDate(selectedTicket.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[selectedTicket?.status ?? ""] ?? ""}
                    >
                      {formatLabel(selectedTicket?.status ?? "")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={PRIORITY_COLORS[selectedTicket?.priority ?? ""] ?? ""}
                    >
                      {formatLabel(selectedTicket?.priority ?? "")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Messages thread */}
              <CardContent
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ maxHeight: "35vh" }}
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Clock className="h-5 w-5 animate-spin mr-2" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <AlertCircle className="h-6 w-6 mb-2" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_type === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            isAdmin
                              ? "bg-orange-50 border border-orange-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {isAdmin ? (
                              <CheckCircle className="h-3 w-3 text-orange-500" />
                            ) : (
                              <User className="h-3 w-3 text-gray-500" />
                            )}
                            <span className="text-xs font-medium text-gray-700">
                              {msg.sender}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Reply form */}
              <div className="border-t p-4 space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none focus-visible:ring-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendReply.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status / Priority / Resolution controls */}
                <div className="flex flex-wrap items-end gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {formatLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {formatLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Resolution
                    </label>
                    <Input
                      placeholder="Resolution note..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="h-9 focus-visible:ring-orange-500"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateTicket}
                    disabled={updateTicket.isPending}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    {updateTicket.isPending ? "Updating..." : "Update Ticket"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
