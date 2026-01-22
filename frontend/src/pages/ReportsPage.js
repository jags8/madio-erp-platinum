import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Target, PieChart as PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#2B5F4C', '#B8860B', '#6B7280', '#DC2626', '#F59E0B', '#10B981'];

const ReportsPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [plData, setPlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState('weekly');

  useEffect(() => {
    fetchReports();
  }, [salesPeriod]);

  const fetchReports = async () => {
    try {
      const [salesRes, projectRes, plRes] = await Promise.all([
        axios.get(`${API}/reports/sales`, { params: { period: salesPeriod } }),
        axios.get(`${API}/reports/project-status`),
        axios.get(`${API}/reports/profit-loss`)
      ]);
      setSalesData(salesRes.data);
      setProjectData(projectRes.data);
      setPlData(plRes.data);
    } catch (error) {
      toast.error('Failed to load reports');
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

  return (
    <Layout>
      <div data-testid="reports-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
            <TabsTrigger value="projects">Project Status</TabsTrigger>
            <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          </TabsList>

          {/* Sales Reports */}
          <TabsContent value="sales" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Sales Performance</h2>
              <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
              <h3 className="font-serif font-bold text-xl mb-6">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="_id" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total_revenue" stroke="#2B5F4C" strokeWidth={3} name="Revenue" />
                  <Line type="monotone" dataKey="total_orders" stroke="#B8860B" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {salesData.length > 0 && (
                <>
                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</p>
                        <p className="text-3xl font-serif font-bold">
                          ₹{salesData.reduce((sum, item) => sum + item.total_revenue, 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                  </Card>
                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Orders</p>
                        <p className="text-3xl font-serif font-bold">
                          {salesData.reduce((sum, item) => sum + item.total_orders, 0)}
                        </p>
                      </div>
                      <Target className="w-6 h-6 text-accent" strokeWidth={1.5} />
                    </div>
                  </Card>
                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Avg Order Value</p>
                        <p className="text-3xl font-serif font-bold">
                          ₹{Math.round(salesData.reduce((sum, item) => sum + item.avg_order_value, 0) / salesData.length).toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-green-600" strokeWidth={1.5} />
                    </div>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Project Status */}
          <TabsContent value="projects" className="space-y-6 mt-6">
            <h2 className="text-2xl font-serif font-bold">Project Status Overview</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <h3 className="font-serif font-bold text-xl mb-6">Projects by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectData}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry._id}: ${entry.count}`}
                    >
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                <h3 className="font-serif font-bold text-xl mb-6">Budget vs Spent</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="_id" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                    />
                    <Legend />
                    <Bar dataKey="total_budget" fill="#2B5F4C" name="Budget" />
                    <Bar dataKey="total_spent" fill="#B8860B" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* P&L Report */}
          <TabsContent value="pl" className="space-y-6 mt-6">
            <h2 className="text-2xl font-serif font-bold">Profit & Loss Statement</h2>

            {plData && (
              <>
                <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif font-bold text-xl">Period: {new Date(plData.period.start_date).toLocaleDateString()} - {new Date(plData.period.end_date).toLocaleDateString()}</h3>
                    <Badge className={plData.profit.net_profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {plData.profit.profit_margin}% Margin
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    {/* Revenue */}
                    <div>
                      <h4 className="font-medium text-lg mb-3 text-primary">Revenue</h4>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Revenue</span>
                          <span className="font-mono font-bold">₹{plData.revenue.total_revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Orders: {plData.revenue.total_orders}</span>
                          <span className="text-muted-foreground">Avg: ₹{Math.round(plData.revenue.avg_order_value).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Costs */}
                    <div>
                      <h4 className="font-medium text-lg mb-3 text-orange-600">Costs</h4>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>
                          <span className="font-mono">₹{plData.costs.cogs.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operating Expenses</span>
                          <span className="font-mono">₹{plData.costs.operating_expenses.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Profit */}
                    <div className="pt-4 border-t-2 border-border">
                      <h4 className="font-medium text-lg mb-3 text-green-600">Profit</h4>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Profit</span>
                          <span className="font-mono font-bold">₹{plData.profit.gross_profit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xl">
                          <span className="font-medium">Net Profit</span>
                          <span className={`font-serif font-bold ${plData.profit.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{plData.profit.net_profit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Expenses Breakdown */}
                {plData.costs.expenses_breakdown.length > 0 && (
                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <h3 className="font-serif font-bold text-xl mb-6">Expenses Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {plData.costs.expenses_breakdown.map((expense, idx) => (
                        <Card key={idx} className="p-4 bg-muted/30">
                          <p className="text-sm text-muted-foreground mb-1 capitalize">{expense._id}</p>
                          <p className="font-mono font-bold text-lg">₹{expense.total.toLocaleString()}</p>
                        </Card>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;