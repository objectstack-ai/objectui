import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ColorField } from './widgets/ColorField';
import { RatingField } from './widgets/RatingField';
import { SliderField } from './widgets/SliderField';
import { QRCodeField } from './widgets/QRCodeField'; // Intentionally simpler than Image/Avatar
import type { FieldWidgetProps } from './widgets/types';

const mockField = {
  name: 'test_field',
  label: 'Test Field',
} as any;

const baseProps: FieldWidgetProps<any> = {
  field: mockField,
  value: undefined,
  onChange: vi.fn(),
  readonly: false,
};

describe('Visual & Display Widgets', () => {
    describe('ColorField', () => {
        it('renders color picker + text input in edit mode', () => {
             const { container } = render(<ColorField {...baseProps} value="#00ff00" />);
             const colorInput = container.querySelector('input[type="color"]');
             const textInput = screen.getByRole('textbox');
             
             expect(colorInput).toBeInTheDocument();
             expect(textInput).toBeInTheDocument();
             expect(textInput).toHaveValue('#00ff00');
        });

        it('syncs change from color picker', () => {
            const { container } = render(<ColorField {...baseProps} />);
            const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
            fireEvent.change(colorInput, { target: { value: '#ff0000' } });
            expect(baseProps.onChange).toHaveBeenCalledWith('#ff0000');
        });

        it('shows preview box in readonly mode', () => {
            const { container } = render(<ColorField {...baseProps} readonly value="#0000ff" />);
            // Check for the style attribute on the div
            // We search for a div that has the style background-color
            // This is a bit fragile but standard for inline styles
            const preview = container.querySelector('div[style="background-color: #0000ff;"]');
            // Or looser check:
            const divs = container.querySelectorAll('div');
            const found = Array.from(divs).some(d => d.style.backgroundColor === 'rgb(0, 0, 255)' || d.style.backgroundColor === '#0000ff');
            expect(found).toBe(true);
            expect(screen.getByText('#0000ff')).toBeInTheDocument();
        });
    });

    describe('RatingField', () => {
        it('renders stars', () => {
            render(<RatingField {...baseProps} value={3} />);
            // Should see 5 buttons (default max)
            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(5);
        });

        it('highlights correct number of stars in readonly', () => {
             const { container } = render(<RatingField {...baseProps} readonly value={3} />);
             // Should have 3 filled stars, 2 empty. 
             // Logic: fill-yellow-400
             const filled = container.querySelectorAll('.fill-yellow-400');
             expect(filled).toHaveLength(3);
             expect(screen.getByText('3 / 5')).toBeInTheDocument();
        });

        it('calls onChange when clicking star', () => {
             render(<RatingField {...baseProps} />);
             const buttons = screen.getAllByRole('button');
             fireEvent.click(buttons[3]); // 4th star (index 3) -> value 4
             expect(baseProps.onChange).toHaveBeenCalledWith(4);
        });
    });

    describe('SliderField', () => {
        it('renders slider', () => {
            const { container } = render(<SliderField {...baseProps} value={50} />);
            // Radix slider usually has role="slider"
            const slider = screen.getByRole('slider');
            expect(slider).toBeInTheDocument();
            // Check text display
            expect(screen.getByText('50')).toBeInTheDocument();
        });

        it('renders readonly view', () => {
            render(<SliderField {...baseProps} readonly value={75} />);
            expect(screen.getByText('75')).toBeInTheDocument();
            expect(screen.getByText('/ 100')).toBeInTheDocument();
            expect(screen.queryByRole('slider')).not.toBeInTheDocument();
        });
    });
    
});
