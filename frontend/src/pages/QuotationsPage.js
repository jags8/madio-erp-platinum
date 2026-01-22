import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(`${API}/quotations`);
      setQuotations(response.data);
    } catch (error) {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const statusIcons = {
    Draft: <Clock className="w-4 h-4" />,
    Sent: <FileText className="w-4 h-4" />,
    Revised: <FileText className="w-4 h-4" />,
    Approved: <CheckCircle className="w-4 h-4" />,
    Rejected: <XCircle className="w-4 h-4" />,
    Expired: <Clock className="w-4 h-4" />
  };

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Sent: 'bg-blue-100 text-blue-800',
    Revised: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Expired: 'bg-orange-100 text-orange-800'
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
      <div data-testid="quotations-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Quotations</h1>
            <p className="text-muted-foreground">Manage quotes and proposals</p>
          </div>
          <Button className="rounded-sm uppercase tracking-wider">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            New Quotation
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotations.map((quot) => (
            <Card key={quot.id} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg">{quot.quotation_no}</h3>
                  <p className="text-xs text-muted-foreground">v{quot.version} • {quot.division}</p>
                </div>
                <Badge className={statusColors[quot.status]}>
                  <span className="flex items-center gap-1">
                    {statusIcons[quot.status]}
                    {quot.status}
                  </span>
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">₹{quot.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-mono text-red-600">-₹{quot.discount_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">+₹{quot.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border/60">
                  <span className="font-medium">Net Total</span>
                  <span className="font-serif font-bold text-lg text-primary">
                    ₹{quot.net_total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(quot.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valid Till:</span>
                  <span>{new Date(quot.valid_till).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{quot.line_items?.length || 0} items</span>
                </div>
              </div>
            </Card>
          ))}
          {quotations.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No quotations found. Create your first quotation.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QuotationsPage;