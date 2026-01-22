import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnquiriesPage = () => {
  const [kanban, setKanban] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    linked_customer_id: '',
    division: 'Furniture',
    product_category: '',
    requirement_summary: '',
    budget_range_min: '',
    budget_range_max: '',
    enquiry_source: 'Walk-in',
    priority: 'Medium'
  });

  useEffect(() => {
    fetchEnquiries();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const fetchEnquiries = async () => {
    try {
      const response = await axios.get(`${API}/enquiries/kanban`);
      setKanban(response.data);
    } catch (error) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null
      };
      await axios.post(`${API}/enquiries`, payload);
      toast.success('Enquiry created successfully');
      setDialogOpen(false);
      setFormData({
        linked_customer_id: '',
        division: 'Furniture',
        product_category: '',
        requirement_summary: '',
        budget_range_min: '',
        budget_range_max: '',
        enquiry_source: 'Walk-in',
        priority: 'Medium'
      });
      fetchEnquiries();
    } catch (error) {
      toast.error('Failed to create enquiry');
    }
  };

  const priorityColors = {
    Low: 'bg-gray-100 text-gray-800',
    Medium: 'bg-blue-100 text-blue-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    'New Enquiry': 'border-l-4 border-l-blue-500',
    'Contacted': 'border-l-4 border-l-yellow-500',
    'Site Visit Scheduled': 'border-l-4 border-l-purple-500',
    'Design/Estimation Ongoing': 'border-l-4 border-l-orange-500',
    'Quotation Shared': 'border-l-4 border-l-green-500',
    'Lost': 'border-l-4 border-l-red-500'
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
      <div data-testid="enquiries-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Enquiries</h1>
            <p className="text-muted-foreground">Kanban board for lead pipeline management</p>
          </div>
          <Button className="rounded-sm uppercase tracking-wider">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            New Enquiry
          </Button>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {Object.keys(kanban).map((status) => (
              <div key={status} className="w-80 flex-shrink-0">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg">{status}</h3>
                    <Badge variant="outline">{kanban[status].length}</Badge>
                  </div>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  {kanban[status].map((enquiry) => (
                    <Card
                      key={enquiry.id}
                      className={`p-4 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-md ${statusColors[status]}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{enquiry.enquiry_id}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {enquiry.division}
                          </p>
                        </div>
                        <Badge className={priorityColors[enquiry.priority]} variant="secondary">
                          {enquiry.priority}
                        </Badge>
                      </div>

                      <p className="text-sm mb-3 line-clamp-2">
                        {enquiry.requirement_summary}
                      </p>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        {enquiry.budget_range_min && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono">
                              ₹{enquiry.budget_range_min.toLocaleString()} - ₹{enquiry.budget_range_max?.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {enquiry.site_visit_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" strokeWidth={1.5} />
                            <span>{new Date(enquiry.site_visit_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {enquiry.assigned_staff && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" strokeWidth={1.5} />
                            <span>{enquiry.assigned_staff}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  {kanban[status].length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No enquiries
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnquiriesPage;