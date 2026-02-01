import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextAreaField } from './widgets/TextAreaField';
import { RichTextField } from './widgets/RichTextField';
import { CodeField } from './widgets/CodeField';
import { PasswordField } from './widgets/PasswordField';
import type { FieldWidgetProps } from './widgets/types';

const mockField = {
  name: 'test_field',
  label: 'Test Field',
} as any;

const baseProps: FieldWidgetProps<string> = {
  field: mockField,
  value: '',
  onChange: vi.fn(),
  readonly: false,
};

describe('Text & Rich Content Widgets', () => {
    describe('TextAreaField', () => {
        it('renders textarea in edit mode', () => {
            render(<TextAreaField {...baseProps} />);
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('handles max length indicator', () => {
            const propsWithMax = {
                ...baseProps,
                field: { ...mockField, max_length: 100 }
            };
            render(<TextAreaField {...propsWithMax} value="testing" />);
            expect(screen.getByLabelText('Character count: 7 of 100')).toBeInTheDocument();
        });

        it('renders whitespace-pre-wrap in readonly mode', () => {
            const text = 'Line 1\nLine 2';
            render(<TextAreaField {...baseProps} readonly value={text} />);
            // Check existence logic
            const display = screen.getByText((content) => 
                content.includes('Line 1') && content.includes('Line 2')
            );
            expect(display).toHaveClass('whitespace-pre-wrap');
        });
    });

    describe('RichTextField', () => {
        // Current implementation is a simpler textarea wrapper
        it('renders textarea with format indicator', () => {
            render(<RichTextField {...baseProps} />);
            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByText((content) => content.includes('Format: markdown'))).toBeInTheDocument();
        });

        it('renders prose in readonly mode', () => {
            render(<RichTextField {...baseProps} readonly value="# Heading" />);
            const display = screen.getByText('# Heading');
            expect(display).toHaveClass('prose');
        });
    });

    describe('CodeField', () => {
        it('renders textarea with monospace font', () => {
            render(<CodeField {...baseProps} />);
            const input = screen.getByRole('textbox');
            expect(input).toHaveClass('font-mono');
        });

        it('renders code block in readonly mode', () => {
            render(<CodeField {...baseProps} readonly value="const x = 1;" />);
            // Check for pre > code structure
            const pre = document.querySelector('pre');
            expect(pre).toBeInTheDocument();
            expect(pre).toHaveTextContent('const x = 1;');
        });
    });

    describe('PasswordField', () => {
        it('renders password input by default', () => {
            const { container } = render(<PasswordField {...baseProps} />);
            const input = container.querySelector('input[type="password"]');
            expect(input).toBeInTheDocument();
        });

        it('toggles visibility', () => {
            const { container } = render(<PasswordField {...baseProps} />);
            const button = screen.getByRole('button'); // The eye icon button
            const input = container.querySelector('input') as HTMLInputElement;
            
            expect(input.type).toBe('password');
            fireEvent.click(button);
            expect(input.type).toBe('text');
            fireEvent.click(button);
            expect(input.type).toBe('password');
        });

        it('renders masked bullets in readonly mode', () => {
            render(<PasswordField {...baseProps} readonly value="secret" />);
            expect(screen.getByText('••••••••')).toBeInTheDocument();
            expect(screen.queryByText('secret')).not.toBeInTheDocument();
        });
    });
});
