import React from 'react';
import type { AppSchema } from '@object-ui/types';
import * as LucideIcons from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@object-ui/components';

interface LayoutRendererProps {
  app: AppSchema;
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

// Helper to resolve icon from string name (e.g. "bar-chart" -> "BarChart")
const getIcon = (name?: string) => {
  if (!name) return null;
  
  // 1. Try direct match (e.g. "Home")
  if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];

  // 2. Try PascalCase (e.g. "bar-chart" -> "BarChart")
  const pascalName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  if ((LucideIcons as any)[pascalName]) return (LucideIcons as any)[pascalName];

  return LucideIcons.Circle; // Fallback
};

export const LayoutRenderer = ({ app, children, currentPath, onNavigate }: LayoutRendererProps) => {
  const layout = app.layout || 'sidebar';
  const [isSidbarOpen, setSidebarOpen] = React.useState(true);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  if (layout === 'empty') {
    return <main className={app.className}>{children}</main>;
  }

  const LogoIcon = app.logo && !app.logo.includes('/') && !app.logo.includes('.') ? getIcon(app.logo) : null;

  return (
    <div className={`flex min-h-screen w-full bg-slate-50/50 ${app.className || ''}`}>
      {/* Sidebar - Only if configured */}
      {layout === 'sidebar' && (
        <aside 
            className={`
                flex-shrink-0 border-r bg-background hidden md:flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out
                ${isSidbarOpen ? 'w-64' : 'w-[70px]'}
            `}
        >
          <div className={`h-14 flex items-center border-b font-semibold text-lg tracking-tight transition-all ${isSidbarOpen ? 'px-6' : 'justify-center px-0'}`}>
            {LogoIcon ? (
              <LogoIcon className="h-6 w-6" />
            ) : app.logo ? (
              <img src={app.logo} alt={app.title} className="h-6 w-auto" />
            ) : <LucideIcons.Box className="h-6 w-6" />}
            
            <span className={`ml-2 whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidbarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                {app.title || app.name || 'Object UI'}
            </span>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
            {app.menu?.map((item, index) => {
              const isActive = currentPath === item.path;
              const Icon = getIcon(item.icon);
              return (
                <a 
                  key={index}
                  href={item.path || '#'}
                  onClick={(e) => item.path && handleNavClick(e, item.path)}
                  title={!isSidbarOpen ? item.label : undefined}
                  className={`flex items-center py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${isSidbarOpen ? 'px-3' : 'justify-center px-2'}`}
                >
                  {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${isSidbarOpen ? 'mr-3' : ''} ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />}
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidbarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>
          {app.version && isSidbarOpen && (
            <div className="p-4 border-t text-xs text-muted-foreground">
              v{app.version}
            </div>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Always shown in sidebar/header layouts */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-20 sticky top-0">
           <div className="flex items-center gap-4">
             {/* Toggle Sidebar Button */}
             <button 
                onClick={() => setSidebarOpen(!isSidbarOpen)}
                className="p-2 -ml-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
             >
                <LucideIcons.Menu className="h-5 w-5" />
             </button>

             {/* Breadcrumbs placeholder or Search */}
             <div className="relative hidden md:block w-96">
                <LucideIcons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
             </div>
           </div>
           <div className="flex items-center gap-4">
             {/* Global Actions */}
             <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
               <LucideIcons.Bell className="h-5 w-5" />
               <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-600 rounded-full border-2 border-background"></span>
             </button>
             
             {app.actions?.filter(a => a.type === 'user').map((userAction, i) => (
                 <DropdownMenu key={i}>
                    <DropdownMenuTrigger asChild>
                        <button className="relative h-8 w-8 rounded-full border bg-muted overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:opacity-90 transition-opacity">
                            <Avatar className="h-full w-full">
                                <AvatarImage 
                                    src={userAction.avatar} 
                                    alt={userAction.label || 'User'} 
                                />
                                <AvatarFallback>
                                    {userAction.label?.substring(0, 2).toUpperCase() || 'JD'}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userAction.label || 'User'}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {userAction.description || 'user@example.com'}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {userAction.items?.map((item, idx) => {
                                if (item.type === 'separator') {
                                    return <DropdownMenuSeparator key={idx} />;
                                }
                                return (
                                    <DropdownMenuItem key={idx} onSelect={() => {
                                        if ((item as any).onClick) {
                                            // Handle click logic
                                            console.log('Clicked', item.label);
                                        }
                                    }}>
                                        {item.label}
                                        {(item as any).shortcut && (
                                            <DropdownMenuShortcut>{(item as any).shortcut}</DropdownMenuShortcut>
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                 </DropdownMenu>
             ))}
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};
