/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColorField } from './widgets/ColorField';
import { SliderField } from './widgets/SliderField';
import { RatingField } from './widgets/RatingField';
import { CodeField } from './widgets/CodeField';
import { AvatarField } from './widgets/AvatarField';
import { AddressField } from './widgets/AddressField';
import { GeolocationField } from './widgets/GeolocationField';
import { SignatureField } from './widgets/SignatureField';
import { QRCodeField } from './widgets/QRCodeField';
import { MasterDetailField } from './widgets/MasterDetailField';

const mockField: any = {
  name: 'test_field',
  label: 'Test Field',
  type: 'text',
};

describe('New Field Widgets', () => {
  describe('ColorField', () => {
    it('should render in readonly mode', () => {
      const { container } = render(
        <ColorField
          value="#ff0000"
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container).toBeDefined();
      expect(container.textContent).toContain('#ff0000');
    });

    it('should render in edit mode', () => {
      const { container } = render(
        <ColorField
          value="#00ff00"
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
    });
  });

  describe('SliderField', () => {
    it('should render with value', () => {
      const { container } = render(
        <SliderField
          value={50}
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
      expect(container.textContent).toContain('50');
    });

    it('should render in readonly mode', () => {
      const { container } = render(
        <SliderField
          value={75}
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container.textContent).toContain('75');
    });
  });

  describe('RatingField', () => {
    it('should render stars', () => {
      const { container } = render(
        <RatingField
          value={3}
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
      expect(container.textContent).toContain('3 / 5');
    });

    it('should render in readonly mode', () => {
      const { container } = render(
        <RatingField
          value={4}
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container.textContent).toContain('4 / 5');
    });
  });

  describe('CodeField', () => {
    it('should render textarea', () => {
      const { container } = render(
        <CodeField
          value="console.log('hello');"
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
    });

    it('should render readonly code', () => {
      const { container } = render(
        <CodeField
          value="const x = 42;"
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container).toBeDefined();
      expect(container.textContent).toContain('const x = 42;');
    });
  });

  describe('AvatarField', () => {
    it('should render avatar', () => {
      const { container } = render(
        <AvatarField
          value=""
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
    });

    it('should render readonly avatar', () => {
      const { container } = render(
        <AvatarField
          value="https://example.com/avatar.jpg"
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container).toBeDefined();
    });
  });

  describe('AddressField', () => {
    it('should render address fields', () => {
      const { container } = render(
        <AddressField
          value={{ street: '123 Main St', city: 'San Francisco' }}
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
    });

    it('should render readonly address', () => {
      const { container } = render(
        <AddressField
          value={{ street: '456 Oak Ave', city: 'New York', state: 'NY' }}
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container.textContent).toContain('456 Oak Ave');
    });
  });

  describe('GeolocationField', () => {
    it('should render geolocation inputs', () => {
      const { container } = render(
        <GeolocationField
          value={{ latitude: 37.7749, longitude: -122.4194 }}
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
    });

    it('should render readonly geolocation', () => {
      const { container } = render(
        <GeolocationField
          value={{ latitude: 40.7128, longitude: -74.0060 }}
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container.textContent).toContain('40.712800');
    });
  });

  describe('SignatureField', () => {
    it('should render signature canvas', () => {
      const { container } = render(
        <SignatureField
          value=""
          field={mockField}
          onChange={() => {}}
        />
      );
      expect(container).toBeDefined();
      expect(container.querySelector('canvas')).toBeDefined();
    });

    it('should render readonly signature', () => {
      const { container } = render(
        <SignatureField
          value="data:image/png;base64,..."
          field={mockField}
          onChange={() => {}}
          readonly={true}
        />
      );
      expect(container).toBeDefined();
    });
  });

  describe('QRCodeField', () => {
    it('should render QR code input', () => {
      const { container } = render(
        <QRCodeField
          value="https://example.com"
          onChange={() => {}}
          field={mockField}
        />
      );
      expect(container).toBeDefined();
    });

    it('should render readonly QR code', () => {
      const { container } = render(
        <QRCodeField
          value="Test Data"
          onChange={() => {}}
          field={mockField}
          readonly={true}
        />
      );
      expect(container.textContent).toContain('Test Data');
    });
  });

  describe('MasterDetailField', () => {
    it('should render empty state', () => {
      const { container } = render(
        <MasterDetailField
          value={[]}
          field={mockField}
          onChange={() => {}}
        />
      );
      expect(container).toBeDefined();
    });

    it('should render with items', () => {
      const items = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
      ];
      const { container } = render(
        <MasterDetailField
          value={items}
          field={mockField}
          onChange={() => {}}
        />
      );
      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
    });

    it('should render readonly items', () => {
      const items = [
        { id: '1', label: 'Item A' },
      ];
      const { container } = render(
        <MasterDetailField
          value={items}
          field={mockField}
          onChange={() => {}}
          readonly={true}
        />
      );
      expect(container.textContent).toContain('Item A');
    });
  });
});
