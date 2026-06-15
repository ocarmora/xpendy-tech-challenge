import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadPolicyFile } from '../../../../../src/infrastructure/adapters/driven/config/load-policy-file.js';

describe('loadPolicyFile', () => {
  it('reads and parses the project policy config', async () => {
    const policy = await loadPolicyFile(path.join(process.cwd(), 'config', 'policy.json'));

    expect(policy.baseCurrency).toBe('USD');
    expect(policy.ageLimits).toEqual({ pendingDays: 30, rejectedDays: 60 });
  });

  it('rejects when the file does not exist', async () => {
    await expect(
      loadPolicyFile(path.join(process.cwd(), 'config', 'missing.json')),
    ).rejects.toThrow();
  });
});
