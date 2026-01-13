import { SchemaRenderer } from '@object-ui/renderer';

const schema = {
  type: 'page',
  body: [
    {
      type: 'div',
      className: 'mb-4',
      body: {
        type: 'tpl',
        tpl: 'Hello from Object UI Engine!'
      }
    },
    {
      type: 'button',
      label: 'Click Me',
      className: 'bg-blue-600 px-4 py-2 text-white rounded',
      onClick: () => alert('Clicked!')
    }
  ]
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8">Prototype</h1>
      <SchemaRenderer schema={schema} />
    </div>
  );
}

export default App;
