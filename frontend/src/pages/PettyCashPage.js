import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Wallet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PettyCashPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    business_area_id: '',
    amount: '',
    purpose: '',
    category: 'supplies',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const [requestsRes, areasRes] = await Promise.all([
        axios.get(`${API}/petty-cash`, { params }),
        axios.get(`${API}/business-areas`)
      ]);
      setRequests(requestsRes.data);
      setBusinessAreas(areasRes.data);
    } catch (error) {
      toast.error('Failed to load petty cash data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      await axios.post(`${API}/petty-cash`, payload);
      toast.success('Petty cash request submitted');
      setDialogOpen(false);
      setFormData({
        business_area_id: '',
        amount: '',
        purpose: '',
        category: 'supplies',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.patch(`${API}/petty-cash/${requestId}/approve`);
      toast.success('Request approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const notes = prompt('Reason for rejection:');
      if (notes) {
        await axios.patch(`${API}/petty-cash/${requestId}/reject`, {}, {
          params: { notes }
        });
        toast.success('Request rejected');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    disbursed: 'bg-blue-100 text-blue-800'
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    approved: <CheckCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
    disbursed: <Wallet className="w-4 h-4" />
  };

  const isFinanceUser = user?.roles?.some(r => r.role === 'finance' || r.role === 'admin');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl font-serif">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="petty-cash-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Petty Cash Management</h1>
            <p className="text-muted-foreground">Track and approve expense requests</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-petty-cash-button" className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">New Petty Cash Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="business_area_id">Business Area *</Label>
                  <Select
                    value={formData.business_area_id}
                    onValueChange={(value) => setFormData({ ...formData, business_area_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business area" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                    placeholder="e.g., Office supplies purchase"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>

                <Button type="submit" className="w-full rounded-sm uppercase tracking-wider">
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full md:w-auto grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="disbursed">Disbursed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} data-testid={`petty-cash-card-${request.id}`} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h3 className="font-serif font-bold text-lg">₹{request.amount.toLocaleString()}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{request.category}</p>
                </div>
                <Badge className={`flex items-center gap-1 ${statusColors[request.status]}`}>
                  {statusIcons[request.status]}
                  {request.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium">{request.purpose}</p>
                {request.notes && (
                  <p className="text-sm text-muted-foreground">{request.notes}</p>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Requested:</span>
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                {request.approval_date && (
                  <div className="flex justify-between">
                    <span>Processed:</span>
                    <span>{new Date(request.approval_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {isFinanceUser && request.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-border/60">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                    className="flex-1 rounded-sm bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" strokeWidth={1.5} />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="flex-1 rounded-sm border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" strokeWidth={1.5} />
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
          {requests.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No petty cash requests found.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PettyCashPage;