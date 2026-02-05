import React, { useState } from 'react';
import { Home, Users, FileText, Package, DollarSign, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/useMediaQuery';

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: FileText, label: 'Enquiries', path: '/enquiries' },
    { icon: Package, label: 'Orders', path: '/orders' },
    { icon: DollarSign, label: 'Payments', path: '/payment-records' },
  ];

  const moreItems = [
    { label: 'Quotations', path: '/quotations' },
    { label: 'Projects', path: '/projects' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Petty Cash', path: '/petty-cash' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-emerald-800">Madio CRM</h1>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <nav className="fixed top-16 left-0 right-0 bg-white shadow-lg max-h-[80vh] overflow-y-auto z-50 lg:hidden">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Main Menu</h3>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                      location.pathname === item.path
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">More</h3>
                {moreItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-3 rounded-lg mb-2 ${
                      location.pathname === item.path
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] ${
                location.pathname === item.path
                  ? 'text-emerald-700'
                  : 'text-gray-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* Spacer for bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
};
