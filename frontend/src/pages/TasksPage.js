import React from 'react';
import Layout from '../components/Layout';

const TasksPage = () => {
  return (
    <Layout>
      <div data-testid="tasks-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage tasks and assignments</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Task management interface - Coming soon
        </div>
      </div>
    </Layout>
  );
};

export default TasksPage;
