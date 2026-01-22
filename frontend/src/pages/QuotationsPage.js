import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lineItems, setLineItems] = useState([
    { item_no: 1, description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0, tax_percent: 18 }
  ]);
  const [formData, setFormData] = useState({
    linked_customer_id: '',
    division: 'Furniture',
    valid_days: 30,
    terms_conditions: 'Payment terms: 50% advance, 50% on completion',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotationsRes, customersRes] = await Promise.all([
        axios.get(`${API}/quotations`),
        axios.get(`${API}/customers`)
      ]);
      setQuotations(quotationsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLineTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const afterDiscount = subtotal - (subtotal * item.discount_percent / 100);
    const total = afterDiscount + (afterDiscount * item.tax_percent / 100);
    return total;
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      item_no: lineItems.length + 1,
      description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 18
    }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = field === 'description' || field === 'unit' ? value : parseFloat(value) || 0;
    setLineItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validTillDate = new Date();
      validTillDate.setDate(validTillDate.getDate() + parseInt(formData.valid_days));

      const processedItems = lineItems.map(item => ({
        ...item,
        line_total: calculateLineTotal(item)
      }));

      const subtotal = processedItems.reduce((sum, item) => sum + item.line_total, 0);
      const totalDiscount = processedItems.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        return sum + (itemSubtotal * item.discount_percent / 100);
      }, 0);
      const totalTax = processedItems.reduce((sum, item) => {
        const afterDiscount = (item.quantity * item.unit_price) - ((item.quantity * item.unit_price) * item.discount_percent / 100);
        return sum + (afterDiscount * item.tax_percent / 100);
      }, 0);

      const payload = {
        linked_customer_id: formData.linked_customer_id,
        division: formData.division,
        valid_till: validTillDate.toISOString(),
        line_items: processedItems,
        terms_conditions: formData.terms_conditions,
        notes: formData.notes,
        discount_amount: totalDiscount,
        tax_amount: totalTax
      };

      await axios.post(`${API}/quotations`, payload);
      toast.success('Quotation created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create quotation');
    }
  };

  const resetForm = () => {
    setFormData({
      linked_customer_id: '',
      division: 'Furniture',
      valid_days: 30,
      terms_conditions: 'Payment terms: 50% advance, 50% on completion',
      notes: ''
    });
    setLineItems([{
      item_no: 1,
      description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 18
    }]);
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-quotation-button" className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                New Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md max-h-[90vh] overflow-y-auto max-w-4xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Create Quotation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <Select
                      value={formData.linked_customer_id}
                      onValueChange={(value) => setFormData({ ...formData, linked_customer_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="division">Division *</Label>
                    <Select
                      value={formData.division}
                      onValueChange={(value) => setFormData({ ...formData, division: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="MAP Paints">MAP Paints</SelectItem>
                        <SelectItem value="Doors & Windows">Doors & Windows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Line Items *</Label>
                    <Button type="button" size="sm" onClick={addLineItem} variant="outline" className="rounded-sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-3 border border-border rounded-md p-4 max-h-64 overflow-y-auto">
                    {lineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-7 gap-2 items-end p-3 bg-muted/30 rounded-sm">
                        <div className="col-span-2">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            required
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                            min="1"
                            required
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                            placeholder="pcs"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price (₹)</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                            min="0"
                            step="0.01"
                            required
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Disc %</Label>
                          <Input
                            type="number"
                            value={item.discount_percent}
                            onChange={(e) => updateLineItem(index, 'discount_percent', e.target.value)}
                            min="0"
                            max="100"
                            className="h-9"
                          />
                        </div>
                        <div className="flex items-end gap-1">
                          <div className="flex-1">
                            <Label className="text-xs">Total</Label>
                            <div className="h-9 flex items-center text-sm font-mono font-bold">
                              ₹{calculateLineTotal(item).toFixed(2)}
                            </div>
                          </div>
                          {lineItems.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeLineItem(index)}
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-primary/5 rounded-sm">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">
                        ₹{lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valid_days">Valid For (Days)</Label>
                    <Input
                      id="valid_days"
                      type="number"
                      value={formData.valid_days}
                      onChange={(e) => setFormData({ ...formData, valid_days: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>

                <Button type="submit" className="w-full rounded-sm uppercase tracking-wider">
                  Create Quotation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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