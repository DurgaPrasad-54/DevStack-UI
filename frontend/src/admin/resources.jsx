import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import External from './Resources/externalresources';
import Videos from './Resources/video';
import Notes from './Resources/notes';

const { Content } = Layout;

const BlogManager = () => {
  const [activeComponent, setActiveComponent] = useState('NotesResource');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'ExternalResource':
        return <External />;
      case 'VideoResource':
        return <Videos />;
      case 'NotesResource':
        return <Notes />;
      default:
        return null;
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Resource Manager</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Button
              type={activeComponent === 'VideoResource' ? 'primary' : 'default'}
              onClick={() => setActiveComponent('VideoResource')}
              className="min-w-24"
            >
              Videos
            </Button>
            <Button
              type={activeComponent === 'NotesResource' ? 'primary' : 'default'}
              onClick={() => setActiveComponent('NotesResource')}
              className="min-w-24"
            >
              Notes
            </Button>
            <Button
              type={activeComponent === 'ExternalResource' ? 'primary' : 'default'}
              onClick={() => setActiveComponent('ExternalResource')}
              className="min-w-24"
            >
              External
            </Button>
          </div>
          
          <div className="border-t pt-6 overflow-x-auto">
            <div className="min-w-full w-full">
              {renderComponent()}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default BlogManager;