import React from 'react';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryPage = () => {
  const [inventory, setInventory] = React.useState([]);
  const [insights, setInsights] = React.useState([]);
  const [businessAreas, setBusinessAreas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    business_area_id: '',
    store_location: '',
    item_name: '',
    item_code: '',
    category: '',
    quantity: 0,
    unit: 'pcs',
    reorder_level: 0,
    unit_price: 0,
    supplier: ''
  });

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, insightsRes, areasRes] = await Promise.all([
        axios.get(`${API}/inventory`),
        axios.get(`${API}/inventory/insights`),
        axios.get(`${API}/business-areas`)
      ]);
      setInventory(invRes.data);
      setInsights(insightsRes.data);
      setBusinessAreas(areasRes.data);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        reorder_level: parseInt(formData.reorder_level),
        unit_price: parseFloat(formData.unit_price)
      };
      await axios.post(`${API}/inventory`, payload);
      toast.success('Inventory item added successfully');
      setDialogOpen(false);
      setFormData({
        business_area_id: '',
        store_location: '',
        item_name: '',
        item_code: '',
        category: '',
        quantity: 0,
        unit: 'pcs',
        reorder_level: 0,
        unit_price: 0,
        supplier: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add inventory item');
    }
  };

  const insightIcons = {
    slow_moving: <TrendingDown className="w-5 h-5" />,
    overstock: <AlertTriangle className="w-5 h-5" />,
    reorder_needed: <AlertTriangle className="w-5 h-5" />,
    high_demand: <TrendingUp className="w-5 h-5" />
  };

  const insightColors = {
    slow_moving: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    overstock: 'bg-orange-50 border-orange-200 text-orange-800',
    reorder_needed: 'bg-red-50 border-red-200 text-red-800',
    high_demand: 'bg-green-50 border-green-200 text-green-800'
  };

  const priorityBadges = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
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
      <div data-testid="inventory-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Inventory Management</h1>
            <p className="text-muted-foreground">AI-powered stock insights and management</p>
          </div>
          <Button className="rounded-sm uppercase tracking-wider">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Add Item
          </Button>
        </div>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList>
            <TabsTrigger value="insights">AI Insights ({insights.length})</TabsTrigger>
            <TabsTrigger value="all">All Items ({inventory.length})</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4 mt-6">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <Card key={idx} className={`p-6 border-2 rounded-md ${insightColors[insight.insight_type]}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {insightIcons[insight.insight_type]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-serif font-bold text-lg">{insight.item_name}</h3>
                          <Badge className={priorityBadges[insight.priority]}>
                            {insight.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-3">{insight.recommendation}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Stock:</span>
                            <span className="font-mono ml-2 font-bold">{insight.current_quantity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reserved:</span>
                            <span className="font-mono ml-2 font-bold">{insight.reserved}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly Sales:</span>
                            <span className="font-mono ml-2 font-bold">{insight.avg_monthly_sales.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Days of Stock:</span>
                            <span className="font-mono ml-2 font-bold">{insight.days_of_stock}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No insights available. All inventory levels are optimal.
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <Card key={item.id} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg mb-1">{item.item_name}</h3>
                      <p className="text-xs text-muted-foreground">{item.item_code}</p>
                    </div>
                    <Package className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-mono font-bold">{item.quantity - (item.reserved || 0)} {item.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reserved:</span>
                      <span className="font-mono text-yellow-600">{item.reserved || 0} {item.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Stock:</span>
                      <span className="font-mono font-bold">{item.quantity} {item.unit}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Reorder at: {item.reorder_level}</span>
                      <span className="font-mono text-sm font-bold text-primary">₹{item.unit_price}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="low-stock" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.filter(item => (item.quantity - (item.reserved || 0)) <= item.reorder_level).map((item) => (
                <Card key={item.id} className="p-6 bg-card border-2 border-destructive/30 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg mb-1">{item.item_name}</h3>
                      <p className="text-xs text-muted-foreground">{item.item_code}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-destructive" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-mono font-bold text-destructive">{item.quantity - (item.reserved || 0)} {item.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reorder Level:</span>
                      <span className="font-mono">{item.reorder_level} {item.unit}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default InventoryPage;
