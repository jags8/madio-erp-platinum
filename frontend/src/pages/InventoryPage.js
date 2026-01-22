import React from 'react';
import Layout from '../components/Layout';

const InventoryPage = () => {
  return (
    <Layout>
      <div data-testid="inventory-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Inventory</h1>
          <p className="text-muted-foreground">Manage stock levels and supplies</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Inventory management interface - Coming soon
        </div>
      </div>
    </Layout>
  );
};

export default InventoryPage;
