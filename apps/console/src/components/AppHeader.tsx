import { useLocation } from 'react-router-dom';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator,
} from '@object-ui/components';

import { ModeToggle } from './mode-toggle';

export function AppHeader({ appName, objects }: { appName: string, objects: any[] }) {
    const location = useLocation();

    
    // Find current object if we are on an object route
    // Note: This logic assumes simple paths for now.
    const isObjectPage = location.pathname.startsWith('/') && location.pathname.length > 1;
    const currentObject = isObjectPage ? objects.find((o: any) => o.name === location.pathname.substring(1)) : null;

    return (
        <div className="flex items-center justify-between w-full h-full px-4">
             <div className="flex items-center gap-2">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        {appName}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {currentObject && (
                        <>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                            <BreadcrumbPage>{currentObject.label}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
             </div>
             <div>
                <ModeToggle />
             </div>
        </div>
    );
}
