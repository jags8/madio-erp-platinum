import React from 'react';
import Layout from '../components/Layout';

const ProjectsPage = () => {
  return (
    <Layout>
      <div data-testid="projects-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage project executions and milestones</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Project management interface - Coming soon
        </div>
      </div>
    </Layout>
  );
};

export default ProjectsPage;
