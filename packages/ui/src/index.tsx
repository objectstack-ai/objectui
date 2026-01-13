/* eslint-disable @typescript-eslint/no-unused-vars */
// React import is not needed for JSX in new transform, but we might keep it if needed for compatibility or hooks.
// But the error says it's unused.
export const Button = ({ className, children, ...props }: any) => {
  return (
    <button 
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Box = ({ className, children, ...props }: any) => {
  return (
    <div className={`p-4 border border-gray-200 rounded ${className || ''}`} {...props}>
      {children}
    </div>
  );
};
