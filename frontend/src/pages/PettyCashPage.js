import React from 'react';
import Layout from '../components/Layout';

const PettyCashPage = () => {
  return (
    <Layout>
      <div data-testid="petty-cash-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Petty Cash</h1>
          <p className="text-muted-foreground">Manage petty cash requests and approvals</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Petty cash management interface - Coming soon
        </div>
      </div>
    </Layout>
  );
};

export default PettyCashPage;
