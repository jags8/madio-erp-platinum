import React from 'react';
import Layout from '../components/Layout';

const FinancePage = () => {
  return (
    <Layout>
      <div data-testid="finance-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Finance</h1>
          <p className="text-muted-foreground">Track payments and invoices</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Finance management interface - Coming soon
        </div>
      </div>
    </Layout>
  );
};

export default FinancePage;
