import { describe, it, expect } from 'vitest';
import { parseEmployee } from '../../../../src/infrastructure/adapters/driving/parse-employee.js';

const validEmployee = {
  id: 'e_001',
  firstName: 'Ada',
  lastName: 'Lovelace',
  costCenter: 'sales_team',
};

describe('parseEmployee', () => {
  it('accepts a well-formed employee', () => {
    expect(() => parseEmployee(validEmployee)).not.toThrow();
  });

  it('normalizes cost center: trims and lowercases', () => {
    const employee = parseEmployee({ ...validEmployee, costCenter: '  Sales_Team  ' });

    expect(employee.costCenter).toBe('sales_team');
  });

  it('rejects an empty id', () => {
    expect(() => parseEmployee({ ...validEmployee, id: '' })).toThrow();
  });

  it('rejects an empty first name', () => {
    expect(() => parseEmployee({ ...validEmployee, firstName: '' })).toThrow();
  });

  it('rejects an empty last name', () => {
    expect(() => parseEmployee({ ...validEmployee, lastName: '' })).toThrow();
  });

  it('rejects a cost center that is blank after trimming', () => {
    // A whitespace-only cost center trims to '', which would later match no
    // cost-center rule and silently bypass the policy.
    expect(() => parseEmployee({ ...validEmployee, costCenter: '   ' })).toThrow();
  });

  it('rejects a missing field', () => {
    const { lastName, ...withoutLastName } = validEmployee;
    void lastName;
    expect(() => parseEmployee(withoutLastName)).toThrow();
  });

  it('rejects a non-string field', () => {
    expect(() => parseEmployee({ ...validEmployee, id: 123 })).toThrow();
  });
});
