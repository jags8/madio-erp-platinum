import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BusinessAreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stores: ''
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await axios.get(`${API}/business-areas`);
      setAreas(response.data);
    } catch (error) {
      toast.error('Failed to load business areas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/business-areas`, {
        name: formData.name,
        description: formData.description,
        stores: formData.stores.split(',').map(s => s.trim()).filter(Boolean)
      });
      toast.success('Business area created successfully');
      setDialogOpen(false);
      setFormData({ name: '', description: '', stores: '' });
      fetchAreas();
    } catch (error) {
      toast.error('Failed to create business area');
    }
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
      <div data-testid="business-areas-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Business Areas</h1>
            <p className="text-muted-foreground">Manage your business divisions and stores</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-business-area-button" className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Add Area
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">New Business Area</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    data-testid="area-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Furniture"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="area-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Describe this business area..."
                  />
                </div>
                <div>
                  <Label htmlFor="stores">Stores (comma-separated)</Label>
                  <Input
                    id="stores"
                    data-testid="area-stores-input"
                    value={formData.stores}
                    onChange={(e) => setFormData({ ...formData, stores: e.target.value })}
                    placeholder="Store 1, Store 2, Store 3"
                  />
                </div>
                <Button type="submit" data-testid="submit-area-button" className="w-full rounded-sm uppercase tracking-wider">
                  Create Area
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <Card key={area.id} className="overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold tracking-tight mb-2">{area.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{area.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{area.stores?.length || 0} Stores</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            </Card>
          ))}
          {areas.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No business areas found. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BusinessAreasPage;
