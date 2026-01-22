import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Users, FolderKanban, DollarSign, Package, Wallet, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, title, value, color, testId }) => (
  <Card
    data-testid={testId}
    className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-serif font-bold tracking-tight">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-sm ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
      </div>
    </div>
  </Card>
);

const BusinessAreaCard = ({ area }) => (
  <Card
    data-testid={`business-area-${area.name.toLowerCase().replace(/\s+/g, '-')}`}
    className="overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md"
  >
    <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <h3 className="text-2xl font-serif font-bold tracking-tight text-foreground">
          {area.name}
        </h3>
      </div>
    </div>
    <div className="p-6">
      <p className="text-sm text-muted-foreground mb-3">{area.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{area.stores?.length || 0} Stores</span>
        <span className="px-2 py-1 bg-primary/10 text-primary rounded-sm font-medium">
          Active
        </span>
      </div>
    </div>
  </Card>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [businessAreas, setBusinessAreas] = useState([]);
  const [recentActivities, setRecentActivities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, areasRes, activitiesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/business-areas`),
        axios.get(`${API}/dashboard/recent-activities`)
      ]);

      setStats(statsRes.data);
      setBusinessAreas(areasRes.data);
      setRecentActivities(activitiesRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
      <div data-testid="dashboard-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back to BizFlow Central</p>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="bento-grid">
          <div className="bento-item-medium">
            <StatCard
              testId="stat-leads"
              icon={Users}
              title="Total Leads"
              value={stats?.total_leads || 0}
              color="bg-primary"
            />
          </div>
          <div className="bento-item-medium">
            <StatCard
              testId="stat-projects"
              icon={FolderKanban}
              title="Active Projects"
              value={stats?.active_projects || 0}
              color="bg-accent"
            />
          </div>
          <div className="bento-item-small">
            <StatCard
              testId="stat-payments"
              icon={DollarSign}
              title="Pending Payments"
              value={`₹${(stats?.pending_payments || 0).toLocaleString()}`}
              color="bg-primary"
            />
          </div>
          <div className="bento-item-small">
            <StatCard
              testId="stat-inventory"
              icon={Package}
              title="Low Stock Items"
              value={stats?.low_stock_items || 0}
              color="bg-destructive"
            />
          </div>
          <div className="bento-item-small">
            <StatCard
              testId="stat-petty-cash"
              icon={Wallet}
              title="Pending Petty Cash"
              value={stats?.pending_petty_cash || 0}
              color="bg-accent"
            />
          </div>
          <div className="bento-item-small">
            <StatCard
              testId="stat-attendance"
              icon={Clock}
              title="Today's Attendance"
              value={stats?.today_attendance || 0}
              color="bg-primary"
            />
          </div>
        </div>

        {/* Business Areas */}
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight mb-6">
            Business Areas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessAreas.map((area) => (
              <BusinessAreaCard key={area.id} area={area} />
            ))}
            {businessAreas.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No business areas found. Create one to get started.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        {recentActivities && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
              <h3 className="text-xl font-serif font-bold tracking-tight mb-4">Recent Leads</h3>
              <div className="space-y-3">
                {recentActivities.leads?.length > 0 ? (
                  recentActivities.leads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-sm">
                      <div>
                        <p className="font-medium">{lead.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.customer_phone}</p>
                      </div>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-sm text-xs font-medium">
                        {lead.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No recent leads</p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card border border-border/60 shadow-sm rounded-md">
              <h3 className="text-xl font-serif font-bold tracking-tight mb-4">Recent Projects</h3>
              <div className="space-y-3">
                {recentActivities.projects?.length > 0 ? (
                  recentActivities.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-sm">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.customer_name}</p>
                      </div>
                      <span className="px-2 py-1 bg-accent/10 text-accent rounded-sm text-xs font-medium">
                        {project.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No recent projects</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
