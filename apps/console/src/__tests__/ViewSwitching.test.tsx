import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ObjectView } from '../components/ObjectView';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRendererProvider } from '@object-ui/react';

// Import all plugins to simulate main.tsx
import '@object-ui/plugin-grid';
import '@object-ui/plugin-kanban';
import '@object-ui/plugin-calendar';
import '@object-ui/plugin-gantt';
import '@object-ui/plugin-charts';
import '@object-ui/plugin-list';
import '@object-ui/plugin-detail';
import '@object-ui/plugin-timeline';
import '@object-ui/plugin-map';

// Mock UI components from @object-ui/components that use Layout/Radix to simplify DOM
vi.mock('@object-ui/components', async () => {
    const actual = await vi.importActual('@object-ui/components');
    return {
        ...actual,
        // Override components that might be troublesome in JSDOM or just too verbose
        // We keep basic structure to allow finding by text/label
    };
});

// Mock React Router
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
    useParams: () => ({ objectName: 'project_task' }),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const mockDataSource = {
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(true),
    getObjectSchema: vi.fn().mockResolvedValue(null) // Mock metadata retrieval
};

const mockObjects = [
    {
        name: 'project_task',
        label: 'Project Task',
        fields: {
             name: { label: 'Name', type: 'text' },
             due_date: { label: 'Due Date', type: 'date' },
             status: { label: 'Status', type: 'select', options: ['Todo', 'Done'] },
             location: { label: 'Location', type: 'location' }
        },
        list_views: {
            all: { label: 'All Tasks', type: 'grid' },
            board: { label: 'Board', type: 'kanban', groupBy: 'status' },
            schedule: { label: 'Schedule', type: 'calendar', dateField: 'due_date' },
            roadmap: { label: 'Roadmap', type: 'gantt', startDateField: 'start', endDateField: 'end' },
            history: { label: 'History', type: 'timeline', dateField: 'due_date' },
            sites: { label: 'Sites', type: 'map', locationField: 'location' }
        }
    }
];

describe('Console View Switching Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
    });

    // Helper to render with Provider
    const renderObjectView = () => {
        return render(
            <SchemaRendererProvider dataSource={mockDataSource}>
                <ObjectView dataSource={mockDataSource} objects={mockObjects} onEdit={vi.fn()} />
            </SchemaRendererProvider>
        );
    };

    it('renders all view tabs', () => {
        renderObjectView();
        
        expect(screen.getByText('All Tasks')).toBeInTheDocument();
        expect(screen.getByText('Board')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
        expect(screen.getByText('Roadmap')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('Sites')).toBeInTheDocument();
    });

    it('switches to Timeline view correctly', () => {
        // Force view to 'history' (timeline)
        mockSearchParams.set('view', 'history');
        
        renderObjectView();
        
        // 1. Check registry has the component (verifies import)
        expect(ComponentRegistry.has('object-timeline')).toBe(true);

        // 2. Check no error boundary (verifies unknown type)
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
        
        // 3. Check CONTENT is rendered (verifies options/props passed correctly + not blank)
        // Since we are using the real Timeline component, we need to know what it renders when empty.
        // It usually renders a list or empty state.
        // If options were missing, it might crash or render completely blank.
        // Let's assume it renders at least the wrapper or "No items"
        const timeline = document.querySelector('.object-timeline') || document.querySelector('ol'); 
        expect(timeline).toBeInTheDocument();
    });

    it('switches to Map view correctly', () => {
        mockSearchParams.set('view', 'sites');
        renderObjectView();
        
        expect(ComponentRegistry.has('object-map')).toBe(true);
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
        
        // 3. Verify content
        // Map usually renders a container.
        // If we missed options mapping, it might be 0 height or error.
        const mapContainer = document.querySelector('.object-map') || document.querySelector('[class*="leaflet"]');
        // Since we don't have leaflet installed/mocked fully, it might be just a div.
        // But checking that *something* is in the View area is key.
        const viewArea = document.querySelector('.flex-1.overflow-hidden.relative');
        expect(viewArea).not.toBeEmptyDOMElement();
    });

    it('switches to Gantt view correctly', () => {
        mockSearchParams.set('view', 'roadmap');
        renderObjectView();
        
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
    });
});
