import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '@/components/ui/button';
import {
  Building2, LayoutDashboard, Users, FolderKanban, Package,
  DollarSign, Wallet, Clock, CheckSquare, LogOut, Menu, X, Video, FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Building2, label: 'Enquiries', path: '/enquiries' },
    { icon: FolderKanban, label: 'Quotations', path: '/quotations' },
    { icon: CheckSquare, label: 'Orders', path: '/orders' },
    { icon: DollarSign, label: 'Payments', path: '/payments' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Wallet, label: 'Petty Cash', path: '/petty-cash' },
    { icon: Clock, label: 'Attendance', path: '/attendance' },
    { icon: Video, label: 'AI Videos', path: '/video-generation' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: LayoutDashboard, label: 'Executive', path: '/executive' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          bg-card/95 backdrop-blur-md border-r border-border
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg tracking-tight">BizFlow</h2>
                <p className="text-xs text-muted-foreground">Central CRM</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-sm
                      transition-all duration-300
                      ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary hover:-translate-y-0.5'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.roles?.[0]?.role || 'Staff'}
                </p>
              </div>
            </div>
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full rounded-sm"
            >
              <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-secondary"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="font-serif font-bold text-lg">BizFlow Central</h1>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
