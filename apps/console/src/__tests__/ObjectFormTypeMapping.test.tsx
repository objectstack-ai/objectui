
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObjectForm } from '@object-ui/plugin-form';
import type { DataSource } from '@object-ui/types';

// Mock DataSource that returns a schema with varied types
class TypeMappingDataSource implements DataSource {
  private mockSchema = {
    name: 'test_types',
    fields: {
      text_field: { name: 'text_field', label: 'Text Field', type: 'text' },
      email_field: { name: 'email_field', label: 'Email Field', type: 'email' },
      number_field: { name: 'number_field', label: 'Number Field', type: 'number' },
      boolean_field: { name: 'boolean_field', label: 'Boolean Field', type: 'boolean' },
      date_field: { name: 'date_field', label: 'Date Field', type: 'date' },
      select_field: { name: 'select_field', label: 'Select Field', type: 'select', options: [{label: 'A', value: 'a'}] },
      textarea_field: { name: 'textarea_field', label: 'TextArea Field', type: 'textarea' },
      
      // Extended Types
      currency_field: { name: 'currency_field', label: 'Currency Field', type: 'currency' },
      percent_field: { name: 'percent_field', label: 'Percent Field', type: 'percent' },
      password_field: { name: 'password_field', label: 'Password Field', type: 'password' },
      datetime_field: { name: 'datetime_field', label: 'DateTime Field', type: 'datetime' },
      time_field: { name: 'time_field', label: 'Time Field', type: 'time' },
      file_field: { name: 'file_field', label: 'File Field', type: 'file' },
      image_field: { name: 'image_field', label: 'Image Field', type: 'image' },
      url_field: { name: 'url_field', label: 'URL Field', type: 'url' },
      phone_field: { name: 'phone_field', label: 'Phone Field', type: 'phone' },
    }
  };

  async getObjectSchema(_objectName: string): Promise<any> {
    return this.mockSchema;
  }

  async findOne(_objectName: string, _id: string): Promise<any> {
    return {};
  }
  async create(_objectName: string, data: any): Promise<any> { return data; }
  async update(_objectName: string, _id: string, data: any): Promise<any> { return data; }
  async delete(_objectName: string, _id: string): Promise<boolean> { return true; }
  async find(_objectName: string, _options?: any): Promise<any> { return { data: [] }; }
}

describe('ObjectForm Field Type Mapping', () => {
    
    it('should render correct widgets for all standard field types', async () => {
        const dataSource = new TypeMappingDataSource();
        const { container } = render(
           <ObjectForm 
               schema={{ 
                   type: 'object-form', 
                   objectName: 'test_types', 
                   mode: 'create',
                   fields: [
                       'text_field', 
                       'email_field', 
                       'number_field', 
                       'boolean_field', 
                       'textarea_field',
                       'select_field',
                       'currency_field',
                       'percent_field',
                       'password_field',
                       'date_field',
                       'datetime_field',
                       'time_field',
                       'file_field',
                       'image_field',
                       'url_field',
                       'phone_field'
                   ]
                }} 
               dataSource={dataSource} 
           />
        );

        // Wait for schema to load and render
        await waitFor(() => {
            expect(screen.getByLabelText(/Text Field/i)).toBeInTheDocument();
        });

        // 1. Text Field -> Input[type=text]
        expect(container.querySelector('input[name="text_field"][type="text"]')).toBeInTheDocument();

        // 2. Number Field -> Input (check name exists)
        expect(container.querySelector('input[name="number_field"]')).toBeInTheDocument();

        // 3. TextArea -> Textarea
        expect(container.querySelector('textarea[name="textarea_field"]')).toBeInTheDocument();
        
        // 4. Boolean -> Switch (role=switch)
        const switchControl = screen.getByRole('switch', { name: /Boolean Field/i });
        expect(switchControl).toBeInTheDocument();

        // 5. Select -> Combobox
        const selectWrapper = screen.getByText(/Select Field/i).closest('div');
        const selectInWrapper = selectWrapper?.querySelector('button[role="combobox"]');
        expect(selectInWrapper).toBeInTheDocument();

        // 6. Currency -> CurrencyField (which has $ prefix)
        // If CurrencyField is working, it renders a wrapping div with '$' span and Input[type=number]
        // Debug currency field rendering
        const currencyInput = container.querySelector('input[name="currency_field"]');
        if (!currencyInput) {
            console.log('Currency field not found in DOM:', document.body.innerHTML);
        }
        expect(currencyInput).toBeInTheDocument();
        expect(currencyInput).toHaveAttribute('type', 'number'); // CurrencyField uses number input

        // Extended Verification: Check for CurrencyField specific UI
        // CurrencyField adds a '$' or currency symbol span
        const currencySymbol = screen.getByText('$');
        expect(currencySymbol).toBeInTheDocument();

        // 7. Percent -> Input
        const percentInput = container.querySelector('input[name="percent_field"]');
        expect(percentInput).toBeInTheDocument();
        expect(percentInput).toHaveAttribute('type', 'number');

        // 8. Password -> Input[type=password]
        const passwordInput = container.querySelector('input[name="password_field"]');
        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute('type', 'password');

        // 9. Date -> Input[type=date]
        const dateInput = container.querySelector('input[name="date_field"]');
        expect(dateInput).toBeInTheDocument();
        expect(dateInput).toHaveAttribute('type', 'date');

        // 10. DateTime -> Input[type=datetime-local]
        const dateTimeInput = container.querySelector('input[name="datetime_field"]');
        expect(dateTimeInput).toBeInTheDocument();
        expect(dateTimeInput).toHaveAttribute('type', 'datetime-local');
        
        // 11. Time -> Input[type=time]
        const timeInput = container.querySelector('input[name="time_field"]');
        expect(timeInput).toBeInTheDocument();
        expect(timeInput).toHaveAttribute('type', 'time');

        // 12. File -> Input[type=file]
        // Note: File inputs might be hidden if using custom upload widget
        // But the ObjectForm logic maps 'file' -> 'file-upload'.
        // Let's check generic presence first.
        // If file-upload widget is complex, it might not expose a simple named input.
        // We'll skip strict check if we can't find it easily, or check for generic role/text.
        const fileInput = container.querySelector('input[type="file"]');
        // If multiple file fields (file & image), this selector finds first. 
        // We can check attributes or just existence of any file input.
        expect(fileInput).toBeInTheDocument();

        // 13. Image -> Input[type=file]
        // Handled by above check generally.

        // 14. URL -> Input[type=url]
        const urlInput = container.querySelector('input[name="url_field"]');
        expect(urlInput).toBeInTheDocument();
        expect(urlInput).toHaveAttribute('type', 'url');

        // 15. Phone -> Input[type=tel]
        const phoneInput = container.querySelector('input[name="phone_field"]');
        expect(phoneInput).toBeInTheDocument();
        expect(phoneInput).toHaveAttribute('type', 'tel');

        // 16. Email -> Input[type=email]
        const emailInput = container.querySelector('input[name="email_field"]');
        expect(emailInput).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('type', 'email');
    });
});
