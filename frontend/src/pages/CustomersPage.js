import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, Mail, MapPin, Building, User, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    customer_type: 'Individual',
    full_name: '',
    company_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    gstin: '',
    source: 'Walk-in',
    linked_divisions: [],
    lifecycle_stage: 'Lead'
  });

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  const fetchCustomers = async () => {
    try {
      const params = filter !== 'all' ? { lifecycle_stage: filter } : {};
      const response = await axios.get(`${API}/customers`, { params });
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/customers`, formData);
      toast.success('Customer created successfully');
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_type: 'Individual',
      full_name: '',
      company_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      pincode: '',
      gstin: '',
      source: 'Walk-in',
      linked_divisions: [],
      lifecycle_stage: 'Lead'
    });
  };

  const stageColors = {
    Lead: 'bg-blue-100 text-blue-800',
    Prospect: 'bg-yellow-100 text-yellow-800',
    Customer: 'bg-green-100 text-green-800',
    VIP: 'bg-purple-100 text-purple-800',
    Inactive: 'bg-gray-100 text-gray-800'
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
      <div data-testid="customers-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Customer Hub</h1>
            <p className="text-muted-foreground">Unified customer management across all divisions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-customer-button" className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Type</Label>
                    <Select
                      value={formData.customer_type}
                      onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Architect">Architect</SelectItem>
                        <SelectItem value="Builder">Builder</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  {formData.customer_type !== 'Individual' && (
                    <div className="col-span-2">
                      <Label>Company Name</Label>
                      <Input
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                  {formData.customer_type !== 'Individual' && (
                    <div className="col-span-2">
                      <Label>GSTIN</Label>
                      <Input
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Architect Referral">Architect Referral</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Existing">Existing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lifecycle Stage</Label>
                    <Select
                      value={formData.lifecycle_stage}
                      onValueChange={(value) => setFormData({ ...formData, lifecycle_stage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                        <SelectItem value="Customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-sm uppercase tracking-wider">
                  Create Customer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full md:w-auto grid-cols-5 md:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Lead">Leads</TabsTrigger>
            <TabsTrigger value="Prospect">Prospects</TabsTrigger>
            <TabsTrigger value="Customer">Customers</TabsTrigger>
            <TabsTrigger value="VIP">VIP</TabsTrigger>
            <TabsTrigger value="Inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <Card key={customer.id} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                    {customer.customer_type === 'Architect' ? (
                      <Building className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    ) : (
                      <User className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">{customer.full_name}</h3>
                    {customer.company_name && (
                      <p className="text-xs text-muted-foreground">{customer.company_name}</p>
                    )}
                  </div>
                </div>
                <Badge className={stageColors[customer.lifecycle_stage]}>
                  {customer.lifecycle_stage}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" strokeWidth={1.5} />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    <span>{customer.city}</span>
                  </div>
                )}
              </div>

              {customer.linked_divisions && customer.linked_divisions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {customer.linked_divisions.map((div, idx) => (
                    <span key={idx} className="px-2 py-1 bg-accent/10 text-accent rounded-sm text-xs">
                      {div}
                    </span>
                  ))}
                </div>
              )}

              {customer.lifetime_value > 0 && (
                <div className="pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Lifetime Value</span>
                    <span className="font-mono font-bold text-primary">
                      ₹{customer.lifetime_value.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No customers found. Add your first customer to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CustomersPage;