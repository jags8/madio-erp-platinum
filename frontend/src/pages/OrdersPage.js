import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Package, DollarSign, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [selectedDivision]);

  const fetchOrders = async () => {
    try {
      const params = selectedDivision !== 'all' ? { division: selectedDivision } : {};
      const response = await axios.get(`${API}/orders`, { params });
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    'Order Confirmed': 'bg-blue-100 text-blue-800',
    'Design Approved': 'bg-purple-100 text-purple-800',
    'In Production': 'bg-yellow-100 text-yellow-800',
    'Ready for Delivery': 'bg-green-100 text-green-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Installed': 'bg-green-100 text-green-800',
    'Completed': 'bg-green-100 text-green-800'
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
      <div data-testid="orders-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Orders</h1>
            <p className="text-muted-foreground">Track orders across all divisions</p>
          </div>
          <Button className="rounded-sm uppercase tracking-wider">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            New Order
          </Button>
        </div>

        <Tabs value={selectedDivision} onValueChange={setSelectedDivision}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="Furniture">Furniture</TabsTrigger>
            <TabsTrigger value="MAP Paints">MAP Paints</TabsTrigger>
            <TabsTrigger value="Doors & Windows">Doors & Windows</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl">{order.order_no}</h3>
                  <p className="text-sm text-muted-foreground">{order.division}</p>
                </div>
                <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                  {order.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                  <p className="text-sm font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                {order.expected_delivery_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected Delivery</p>
                    <p className="text-sm font-medium">{new Date(order.expected_delivery_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net Total</span>
                  <span className="font-mono font-bold">₹{order.net_total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Advance Paid</span>
                  <span className="font-mono text-green-600">₹{order.advance_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/60">
                  <span className="text-sm font-medium">Balance Pending</span>
                  <span className="font-mono font-bold text-destructive">₹{order.balance_pending.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-sm">
                  <Package className="w-4 h-4 mr-1" strokeWidth={1.5} />
                  Items ({order.order_items?.length || 0})
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-sm">
                  <Truck className="w-4 h-4 mr-1" strokeWidth={1.5} />
                  Track
                </Button>
              </div>
            </Card>
          ))}
          {orders.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No orders found. Create your first order.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;