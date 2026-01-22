import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, FileText, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinanceManagerPage = () => {
  const [plData, setPlData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pettyCash, setPettyCash] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [plRes, paymentsRes, pettyCashRes, salesRes] = await Promise.all([
        axios.get(`${API}/reports/profit-loss`),
        axios.get(`${API}/payment-records`),
        axios.get(`${API}/petty-cash`, { params: { status: 'pending' } }),
        axios.get(`${API}/reports/sales`, { params: { period: 'monthly' } })
      ]);
      setPlData(plRes.data);
      setPayments(paymentsRes.data.slice(0, 10));
      setPettyCash(pettyCashRes.data);
      setSalesData(salesRes.data);
    } catch (error) {
      toast.error('Failed to load finance data');
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
      <div data-testid="finance-manager-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Finance Manager</h1>
          <p className="text-muted-foreground">Comprehensive financial overview and controls</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {plData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</p>
                        <p className="text-3xl font-serif font-bold text-green-600">
                          ₹{plData.revenue.total_revenue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" strokeWidth={1.5} />
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Net Profit</p>
                        <p className={`text-3xl font-serif font-bold ${plData.profit.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{plData.profit.net_profit.toLocaleString()}
                        </p>
                      </div>
                      {plData.profit.net_profit >= 0 ? (
                        <TrendingUp className="w-8 h-8 text-green-600" strokeWidth={1.5} />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-red-600" strokeWidth={1.5} />
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Profit Margin</p>
                        <p className="text-3xl font-serif font-bold">
                          {plData.profit.profit_margin}%
                        </p>
                      </div>
                      <FileText className="w-8 h-8 text-primary" strokeWidth={1.5} />
                    </div>
                  </Card>
                </div>

                <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                  <h3 className="font-serif font-bold text-xl mb-6">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="_id" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total_revenue" stroke="#2B5F4C" strokeWidth={3} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <h3 className="font-serif font-bold text-xl mb-4">Costs Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Cost of Goods Sold</span>
                        <span className="font-mono font-bold">₹{plData.costs.cogs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Operating Expenses</span>
                        <span className="font-mono font-bold">₹{plData.costs.operating_expenses.toLocaleString()}</span>
                      </div>
                      <div className="pt-3 border-t border-border/60 flex justify-between items-center">
                        <span className="font-medium">Total Costs</span>
                        <span className="font-serif font-bold text-lg">₹{(plData.costs.cogs + plData.costs.operating_expenses).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
                    <h3 className="font-serif font-bold text-xl mb-4">Pending Approvals</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" strokeWidth={1.5} />
                          <span className="font-medium">Petty Cash Requests</span>
                        </div>
                        <span className="font-bold text-yellow-600">{pettyCash.length}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
              <h3 className="font-serif font-bold text-xl mb-4">Recent Payments</h3>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-sm">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary" strokeWidth={1.5} />
                      <div>
                        <p className="font-medium">{payment.payment_id}</p>
                        <p className="text-xs text-muted-foreground capitalize">{payment.payment_type} • {payment.payment_mode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent payments
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6 mt-6">
            <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
              <h3 className="font-serif font-bold text-xl mb-4">Expense Breakdown</h3>
              {plData && plData.costs.expenses_breakdown.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {plData.costs.expenses_breakdown.map((expense, idx) => (
                    <Card key={idx} className="p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1 capitalize">{expense._id}</p>
                      <p className="font-mono font-bold text-lg">₹{expense.total.toLocaleString()}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No expense data available
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
              <h3 className="font-serif font-bold text-xl mb-6">Monthly Sales Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="_id" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                  />
                  <Legend />
                  <Bar dataKey="total_revenue" fill="#2B5F4C" name="Revenue" />
                  <Bar dataKey="total_orders" fill="#B8860B" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FinanceManagerPage;