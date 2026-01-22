import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    business_area_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    source: 'architect_referral',
    status: 'new',
    estimated_value: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, areasRes] = await Promise.all([
        axios.get(`${API}/leads`),
        axios.get(`${API}/business-areas`)
      ]);
      setLeads(leadsRes.data);
      setBusinessAreas(areasRes.data);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/leads`, {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null
      });
      toast.success('Lead created successfully');
      setDialogOpen(false);
      setFormData({
        business_area_id: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        source: 'architect_referral',
        status: 'new',
        estimated_value: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

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
      <div data-testid="leads-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Leads</h1>
            <p className="text-muted-foreground">Manage your customer leads and opportunities</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-lead-button" className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="business_area_id">Business Area</Label>
                  <Select
                    value={formData.business_area_id}
                    onValueChange={(value) => setFormData({ ...formData, business_area_id: value })}
                    required
                  >
                    <SelectTrigger data-testid="lead-business-area-select">
                      <SelectValue placeholder="Select business area" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    data-testid="lead-customer-name-input"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Phone Number</Label>
                  <Input
                    id="customer_phone"
                    data-testid="lead-customer-phone-input"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email (Optional)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="architect_referral">Architect Referral</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimated_value">Estimated Value (₹)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  />
                </div>
                <Button type="submit" data-testid="submit-lead-button" className="w-full rounded-sm uppercase tracking-wider">
                  Create Lead
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} data-testid={`lead-card-${lead.id}`} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold">{lead.customer_name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{lead.source.replace('_', ' ')}</p>
                </div>
                <span className={`px-2 py-1 rounded-sm text-xs font-medium ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" strokeWidth={1.5} />
                  <span>{lead.customer_phone}</span>
                </div>
                {lead.customer_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                    <span className="truncate">{lead.customer_email}</span>
                  </div>
                )}
              </div>
              {lead.estimated_value && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">Estimated Value</p>
                  <p className="text-lg font-serif font-bold">₹{lead.estimated_value.toLocaleString()}</p>
                </div>
              )}
            </Card>
          ))}
          {leads.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No leads found. Add your first lead to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeadsPage;
