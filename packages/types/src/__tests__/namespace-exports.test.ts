/**
 * Test to verify ObjectStack Spec v0.6.1 namespace exports
 */
import { describe, it, expect } from 'vitest';
import type { Data, UI, System, AI, API, Auth, Hub, Automation, Permission, Shared } from '../index';

describe('ObjectStack Spec v0.6.1 Namespace Exports', () => {
  it('should export Data namespace', () => {
    // Type check only - this verifies the namespace is exported
    const field: Data.Field = {
      name: 'test',
      type: 'text',
      label: 'Test Field',
    };
    expect(field.name).toBe('test');
  });

  it('should export UI namespace', () => {
    // Type check only - verify UI namespace exists
    type UITest = UI.Component | undefined;
    const uiComponent: UITest = undefined;
    expect(uiComponent).toBeUndefined();
  });

  it('should export System namespace', () => {
    // Type check only - verify System namespace exists
    type SystemTest = System.Environment | undefined;
    const systemEnv: SystemTest = undefined;
    expect(systemEnv).toBeUndefined();
  });

  it('should export AI namespace', () => {
    // Type check only - verify AI namespace exists
    type AITest = AI.Model | undefined;
    const aiModel: AITest = undefined;
    expect(aiModel).toBeUndefined();
  });

  it('should export API namespace', () => {
    // Type check only - verify API namespace exists
    type APITest = API.Endpoint | undefined;
    const apiEndpoint: APITest = undefined;
    expect(apiEndpoint).toBeUndefined();
  });

  it('should export Auth namespace', () => {
    // Type check only - verify Auth namespace exists
    type AuthTest = Auth.User | undefined;
    const authUser: AuthTest = undefined;
    expect(authUser).toBeUndefined();
  });

  it('should export Hub namespace', () => {
    // Type check only - verify Hub namespace exists
    type HubTest = Hub.Tenant | undefined;
    const hubTenant: HubTest = undefined;
    expect(hubTenant).toBeUndefined();
  });

  it('should export Automation namespace', () => {
    // Type check only - verify Automation namespace exists
    type AutomationTest = Automation.Workflow | undefined;
    const workflow: AutomationTest = undefined;
    expect(workflow).toBeUndefined();
  });

  it('should export Permission namespace', () => {
    // Type check only - verify Permission namespace exists
    type PermissionTest = Permission.PermissionSet | undefined;
    const permissionSet: PermissionTest = undefined;
    expect(permissionSet).toBeUndefined();
  });

  it('should export Shared namespace', () => {
    // Type check only - verify Shared namespace exists
    type SharedTest = Shared.ObjectId | undefined;
    const objectId: SharedTest = undefined;
    expect(objectId).toBeUndefined();
  });
});
