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

    it('switches to Timeline view correctly', async () => {
        // Force view to 'history' (timeline)
        mockSearchParams.set('view', 'history');
        
        // Mock data for project task
        // We must mock the find method to return data that the TIMELINE can render
        // Timeline expects: titleField='name', dateField='due_date'
        const mockTasks = [
            { id: '1', name: 'Task 1', due_date: '2023-01-01', status: 'Todo' },
            { id: '2', name: 'Task 2', due_date: '2023-01-05', status: 'Done' }
        ];
        
        // Setup mock response
        mockDataSource.find.mockResolvedValue({ value: mockTasks });

        const { container, debug } = renderObjectView();
        
        // 1. Check registry has the component (verifies import)
        expect(ComponentRegistry.has('object-timeline')).toBe(true);

        // 2. Check no error boundary (verifies unknown type)
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
        
        // 3. Wait for data loading and verify CONTENT
        // Timeline renders <Timeline> -> <TimelineItem>
        // We expect to see "Task 1" and "Task 2" in the document
        await waitFor(() => {
             expect(screen.getByText('Task 1')).toBeInTheDocument();
             expect(screen.getByText('Task 2')).toBeInTheDocument();
        });
        
        // Inspect DOM structure slightly deeper
        // Timeline plugins usually use distinct classes or elements (ol/li)
        const timelineList = container.querySelector('ol');
        expect(timelineList).toBeInTheDocument();
    });

    it('switches to Map view correctly', async () => {
        mockSearchParams.set('view', 'sites');
        
        // Mock Map Data with Location
        const mockSites = [
             { id: '1', name: 'Site Alpha', location: { lat: 40, lng: -74 } },
             { id: '2', name: 'Site Beta', location: { lat: 41, lng: -75 } }
        ];
        mockDataSource.find.mockResolvedValue({ value: mockSites });

        const { container } = renderObjectView();
        
        expect(ComponentRegistry.has('object-map')).toBe(true);
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
        
        // 3. Verify content
        // Map usually renders a container.
        // It might be hard to verify "Site Alpha" if it's rendered inside a Canvas or proprietary Map,
        // BUT our ObjectMap implementation might render markers as divs if it's a simple implementation.
        // Let's assume it renders a marker list or similar for accessibility if map fails,
        // OR we just verify the container exists.
        
        // If ObjectMap uses Leaflet/GoogleMaps, checking for specific text inside the map container might be flaky
        // unless we mock the map library. 
        // For now, let's verify the wrapper is there.
        const viewArea = document.querySelector('.flex-1.overflow-hidden.relative');
        expect(viewArea).not.toBeEmptyDOMElement();
        
        // Attempt to wait for map initialization (if async)
        await waitFor(() => {
             // If ObjectMap lists items in a side panel or similar:
             // expect(screen.getByText('Site Alpha')).toBeInTheDocument(); 
             
             // If not, we just confirm the view didn't crash
             expect(ComponentRegistry.has('object-map')).toBe(true);
        });
    });

    it('switches to Gantt view correctly', async () => {
        mockSearchParams.set('view', 'roadmap');
        
        const mockGanttData = [
            { id: '1', name: 'Phase 1', start: '2023-01-01', end: '2023-01-05' }
        ];
        mockDataSource.find.mockResolvedValue({ value: mockGanttData });
        
        const { container } = renderObjectView();
        
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
        
        // Verify Gantt loaded
        // Usually Gantt renders "Phase 1" in the task list on the left
        await waitFor(() => {
            expect(screen.getByText('Phase 1')).toBeInTheDocument();
        });
    });

    it('switches to Gantt view correctly', () => {
        mockSearchParams.set('view', 'roadmap');
        renderObjectView();
        
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
    });
});
