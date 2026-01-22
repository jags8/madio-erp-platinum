import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Phone, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
    name: '',
    email: '',
    role: 'staff',
    business_area_id: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // For now, using mock data - in production this would be an API call
      const mockUsers = [
        { id: '1', name: 'Admin User', phone: '+919876543210', email: 'admin@bizflow.com', roles: [{ role: 'admin' }] },
        { id: '2', name: 'Promoter User', phone: '+919876543211', email: 'promoter@bizflow.com', roles: [{ role: 'promoter' }] },
        { id: '3', name: 'Finance Manager', phone: '+919876543212', email: 'finance@bizflow.com', roles: [{ role: 'finance' }] },
        { id: '4', name: 'Furniture Team Lead', phone: '+919876543213', email: 'furniture@bizflow.com', roles: [{ role: 'team_lead' }] },
        { id: '5', name: 'MAP Paints Manager', phone: '+919876543214', email: 'paints@bizflow.com', roles: [{ role: 'team_lead' }] },
        { id: '6', name: 'Doors & Windows Lead', phone: '+919876543215', email: 'doors@bizflow.com', roles: [{ role: 'team_lead' }] },
        { id: '7', name: 'Sales Staff', phone: '+919876543216', email: 'sales@bizflow.com', roles: [{ role: 'staff' }] }
      ];
      setUsers(mockUsers);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        phone: formData.phone,
        pin: formData.pin,
        name: formData.name,
        email: formData.email,
        roles: [{
          role: formData.role,
          business_area_id: formData.business_area_id || null
        }]
      };
      await axios.post(`${API}/auth/register`, payload);
      toast.success('Team member added successfully');
      setDialogOpen(false);
      setFormData({
        phone: '',
        pin: '',
        name: '',
        email: '',
        role: 'staff',
        business_area_id: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add team member');
    }
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    promoter: 'bg-blue-100 text-blue-800',
    finance: 'bg-green-100 text-green-800',
    team_lead: 'bg-orange-100 text-orange-800',
    staff: 'bg-gray-100 text-gray-800'
  };

  const roleLabels = {
    admin: 'Admin',
    promoter: 'Promoter',
    finance: 'Finance',
    team_lead: 'Team Lead',
    staff: 'Staff'
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
      <div data-testid="team-management-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Team Management</h1>
            <p className="text-muted-foreground">Manage users and their access permissions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-team-member-button" className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Add Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+919876543210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pin">PIN (6 digits) *</Label>
                    <Input
                      id="pin"
                      type="password"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      required
                      maxLength={6}
                      placeholder="123456"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@bizflow.com"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="promoter">Promoter</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="team_lead">Team Lead</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.role === 'team_lead' || formData.role === 'staff') && (
                  <div>
                    <Label htmlFor="business_area">Business Area</Label>
                    <Select
                      value={formData.business_area_id}
                      onValueChange={(value) => setFormData({ ...formData, business_area_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business area (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="map_paints">MAP Paints</SelectItem>
                        <SelectItem value="doors_windows">Doors & Windows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-md text-sm">
                  <p className="font-medium mb-2">Role Permissions:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Admin:</strong> Full system access</li>
                    <li><strong>Promoter:</strong> Business overview and reports</li>
                    <li><strong>Finance:</strong> Financial data and approvals</li>
                    <li><strong>Team Lead:</strong> Division-specific management</li>
                    <li><strong>Staff:</strong> Basic operations access</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full rounded-sm uppercase tracking-wider">
                  Add Team Member
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="p-6 bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">{user.name}</h3>
                    <Badge className={roleColors[user.roles[0].role]}>
                      <Shield className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      {roleLabels[user.roles[0].role]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" strokeWidth={1.5} />
                  <span>{user.phone}</span>
                </div>
                {user.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-muted/30 border border-border/60 rounded-md">
          <h3 className="font-serif font-bold text-xl mb-4">Login Credentials</h3>
          <div className="space-y-2 text-sm font-mono">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 bg-card rounded-sm">
                <span className="font-medium">{user.name}</span>
                <span className="text-muted-foreground">{user.phone} | PIN: 123456</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TeamManagementPage;