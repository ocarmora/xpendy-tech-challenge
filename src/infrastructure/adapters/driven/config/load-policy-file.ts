import { readFile } from 'node:fs/promises';
import type { Policy } from '../../../../domain/models/policy.js';
import { parsePolicy } from './parse-policy.js';

/**
 * Reads a policy config file from disk and parses it into a valid Policy.
 * File I/O lives here; shape and invariant validation stay in parsePolicy;
 * the domain stays unaware of either.
 */
export async function loadPolicyFile(path: string): Promise<Policy> {
  const raw: unknown = JSON.parse(await readFile(path, 'utf-8'));
  return parsePolicy(raw);
}
