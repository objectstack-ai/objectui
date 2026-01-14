import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exampleCategories } from '../data/examples';
import { LayoutTemplate, ArrowRight, Component, Layers, Database, Shield, Box } from 'lucide-react';

const CategoryIcon = ({ name }: { name: string }) => {
  switch (name) {
    case 'Primitives': return <Component className="w-5 h-5" />;
    case 'Layouts': return <Layers className="w-5 h-5" />;
    case 'Data Display': return <Database className="w-5 h-5" />;
    case 'Forms': return <Shield className="w-5 h-5" />;
    case 'Complex': return <Box className="w-5 h-5" />;
    default: return <LayoutTemplate className="w-5 h-5" />;
  }
};

export const Home = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('Layouts');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Object UI Studio</span>
          </div>
          <a 
            href="https://github.com/objectql/objectui" 
            target="_blank"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Build Stunning Interfaces,<br />
            <span className="text-indigo-600">Purely from JSON.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            Object UI transforms JSON schemas into fully functional, accessible, and responsive React applications. 
            Select a template below to start building.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {Object.keys(exampleCategories).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${activeCategory === category 
                  ? 'bg-gray-900 text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
              `}
            >
              <CategoryIcon name={category} />
              {category}
            </button>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exampleCategories[activeCategory as keyof typeof exampleCategories].map((key) => {
             // Try to parse the example to get a description or just format the title
             const title = key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             
             return (
              <div 
                key={key}
                onClick={() => navigate(`/studio/${key}`)}
                className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-indigo-200 flex flex-col h-64"
              >
                {/* Mock Preview Window */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex-1 flex items-center justify-center overflow-hidden">
                    <div className="w-3/4 h-3/4 bg-white shadow-sm border border-gray-200 rounded-lg flex flex-col opacity-80 group-hover:scale-105 transition-transform duration-500">
                      <div className="h-4 border-b border-gray-100 bg-gray-50 flex items-center px-2 gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 p-2">
                        <div className="space-y-2">
                          <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                          <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-100 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="p-5 relative z-10 bg-white">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {title}
                  </h3>
                  <div className="flex items-center text-sm font-medium text-gray-400 mt-2 group-hover:text-indigo-500 transition-colors">
                    Launch Studio <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      </main>
    </div>
  );
};
