import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Star, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#2B5F4C', '#B8860B', '#6B7280', '#DC2626'];

const ExecutiveDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/executive`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load executive dashboard');
    } finally {
      setLoading(false);
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

  if (!data) return null;

  return (
    <Layout>
      <div data-testid="executive-dashboard-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Executive Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive business intelligence and KPIs</p>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="customer">Customer Experience</TabsTrigger>
          </TabsList>

          {/* Sales Dashboard */}
          <TabsContent value="sales" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Customers</p>
                    <p className="text-3xl font-serif font-bold">{data.sales.total_customers}</p>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Enquiries</p>
                    <p className="text-3xl font-serif font-bold">{data.sales.total_enquiries}</p>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-accent" strokeWidth={1.5} />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Conversion Rate</p>
                    <p className="text-3xl font-serif font-bold">{data.sales.conversion_rate}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" strokeWidth={1.5} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-xl">Total Revenue</h3>
                    <p className="text-3xl font-mono font-bold text-primary mt-2">
                      ₹{data.sales.total_revenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" strokeWidth={1.5} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-medium">{data.sales.total_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Order Value</span>
                    <span className="font-mono">₹{Math.round(data.sales.avg_order_value).toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <h3 className="font-serif font-bold text-xl mb-4">Division Performance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.divisions}
                      dataKey="total_revenue"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry._id}: ₹${(entry.total_revenue / 1000).toFixed(0)}K`}
                    >
                      {data.divisions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Finance Dashboard */}
          <TabsContent value="finance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Collected</p>
                    <p className="text-3xl font-serif font-bold text-green-600">
                      ₹{data.finance.total_collected.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" strokeWidth={1.5} />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Aging Receivables</p>
                    <p className="text-3xl font-serif font-bold text-destructive">
                      ₹{data.finance.total_pending_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" strokeWidth={1.5} />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Operations Dashboard */}
          <TabsContent value="operations" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Pending Deliveries</p>
                    <p className="text-3xl font-serif font-bold">{data.operations.pending_deliveries}</p>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-orange-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Experience Dashboard */}
          <TabsContent value="customer" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Reviews</p>
                    <p className="text-3xl font-serif font-bold">{data.customer_experience.total_reviews}</p>
                  </div>
                  <Star className="w-6 h-6 text-accent" strokeWidth={1.5} />
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Avg Rating</p>
                    <p className="text-3xl font-serif font-bold">{data.customer_experience.avg_rating}/5</p>
                  </div>
                  <Star className="w-6 h-6 text-yellow-500" strokeWidth={1.5} fill="currentColor" />
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Open Complaints</p>
                    <p className="text-3xl font-serif font-bold text-destructive">{data.customer_experience.open_complaints}</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-destructive" strokeWidth={1.5} />
                </div>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Open Tickets</p>
                    <p className="text-3xl font-serif font-bold">{data.customer_experience.open_tickets}</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ExecutiveDashboardPage;