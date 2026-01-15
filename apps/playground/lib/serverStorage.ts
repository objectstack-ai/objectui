/**
 * Server-side Design Storage
 * 
 * This module provides centralized storage for designs on the server.
 * Supports both Vercel KV (when available) and in-memory fallback.
 * 
 * Environment Variables Required for KV:
 * - KV_REST_API_URL
 * - KV_REST_API_TOKEN
 */

import { kv } from '@vercel/kv';
import type { Design } from './designStorage';

// Check if Vercel KV is available
const isKVAvailable = !!(
  process.env.KV_REST_API_URL && 
  process.env.KV_REST_API_TOKEN
);

// In-memory fallback storage
const memoryDesigns = new Map<string, Design>();
const memorySharedDesigns = new Map<string, Design>();

// Storage keys for KV
const DESIGNS_SET_KEY = 'designs:all';
const DESIGN_KEY_PREFIX = 'design:';
const SHARED_KEY_PREFIX = 'shared:';

export const serverStorage = {
  /**
   * Get all designs
   */
  async getAllDesigns(): Promise<Design[]> {
    if (isKVAvailable) {
      try {
        // Get all design IDs from the set
        const designIds = await kv.smembers(DESIGNS_SET_KEY) as string[];
        if (!designIds || designIds.length === 0) return [];

        // Fetch all designs
        const designs = await Promise.all(
          designIds.map(async (id) => {
            const design = await kv.get<Design>(`${DESIGN_KEY_PREFIX}${id}`);
            return design;
          })
        );

        return designs.filter((d): d is Design => d !== null);
      } catch (error) {
        console.error('KV getAllDesigns error:', error);
        // Fallback to memory
        return Array.from(memoryDesigns.values());
      }
    }
    
    return Array.from(memoryDesigns.values());
  },

  /**
   * Get a single design by ID
   */
  async getDesign(id: string): Promise<Design | null> {
    if (isKVAvailable) {
      try {
        const design = await kv.get<Design>(`${DESIGN_KEY_PREFIX}${id}`);
        return design;
      } catch (error) {
        console.error('KV getDesign error:', error);
        return memoryDesigns.get(id) || null;
      }
    }
    
    return memoryDesigns.get(id) || null;
  },

  /**
   * Create a new design
   */
  async createDesign(design: Design): Promise<Design> {
    if (isKVAvailable) {
      try {
        // Store the design
        await kv.set(`${DESIGN_KEY_PREFIX}${design.id}`, design);
        // Add ID to the set of all designs
        await kv.sadd(DESIGNS_SET_KEY, design.id);
        return design;
      } catch (error) {
        console.error('KV createDesign error:', error);
        // Fallback to memory
        memoryDesigns.set(design.id, design);
        return design;
      }
    }
    
    memoryDesigns.set(design.id, design);
    return design;
  },

  /**
   * Update an existing design
   */
  async updateDesign(id: string, updates: Partial<Design>): Promise<Design | null> {
    if (isKVAvailable) {
      try {
        const existing = await kv.get<Design>(`${DESIGN_KEY_PREFIX}${id}`);
        if (!existing) return null;

        const updated = {
          ...existing,
          ...updates,
          id: existing.id, // Preserve ID
          createdAt: existing.createdAt, // Preserve creation date
          updatedAt: new Date().toISOString(),
        };

        await kv.set(`${DESIGN_KEY_PREFIX}${id}`, updated);
        return updated;
      } catch (error) {
        console.error('KV updateDesign error:', error);
        // Fallback to memory
        const existing = memoryDesigns.get(id);
        if (!existing) return null;

        const updated = {
          ...existing,
          ...updates,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };

        memoryDesigns.set(id, updated);
        return updated;
      }
    }
    
    const existing = memoryDesigns.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    memoryDesigns.set(id, updated);
    return updated;
  },

  /**
   * Delete a design
   */
  async deleteDesign(id: string): Promise<boolean> {
    if (isKVAvailable) {
      try {
        // Remove from set
        await kv.srem(DESIGNS_SET_KEY, id);
        // Delete the design
        const deleted = await kv.del(`${DESIGN_KEY_PREFIX}${id}`);
        return deleted > 0;
      } catch (error) {
        console.error('KV deleteDesign error:', error);
        return memoryDesigns.delete(id);
      }
    }
    
    return memoryDesigns.delete(id);
  },

  /**
   * Share a design (create a shareable link)
   */
  async shareDesign(id: string, shareId: string): Promise<boolean> {
    if (isKVAvailable) {
      try {
        const design = await kv.get<Design>(`${DESIGN_KEY_PREFIX}${id}`);
        if (!design) return false;

        await kv.set(`${SHARED_KEY_PREFIX}${shareId}`, design);
        return true;
      } catch (error) {
        console.error('KV shareDesign error:', error);
        const design = memoryDesigns.get(id);
        if (!design) return false;
        memorySharedDesigns.set(shareId, design);
        return true;
      }
    }
    
    const design = memoryDesigns.get(id);
    if (!design) return false;

    memorySharedDesigns.set(shareId, design);
    return true;
  },

  /**
   * Get a shared design
   */
  async getSharedDesign(shareId: string): Promise<Design | null> {
    if (isKVAvailable) {
      try {
        const design = await kv.get<Design>(`${SHARED_KEY_PREFIX}${shareId}`);
        return design;
      } catch (error) {
        console.error('KV getSharedDesign error:', error);
        return memorySharedDesigns.get(shareId) || null;
      }
    }
    
    return memorySharedDesigns.get(shareId) || null;
  },

  /**
   * Clear all data (for testing/development)
   */
  async clearAll(): Promise<void> {
    if (isKVAvailable) {
      try {
        const designIds = await kv.smembers(DESIGNS_SET_KEY) as string[];
        if (designIds && designIds.length > 0) {
          // Delete all designs
          await Promise.all(
            designIds.map(id => kv.del(`${DESIGN_KEY_PREFIX}${id}`))
          );
        }
        // Clear the set
        await kv.del(DESIGNS_SET_KEY);
      } catch (error) {
        console.error('KV clearAll error:', error);
      }
    }
    
    memoryDesigns.clear();
    memorySharedDesigns.clear();
  },

  /**
   * Check if KV is available
   */
  isUsingKV(): boolean {
    return isKVAvailable;
  },
};
