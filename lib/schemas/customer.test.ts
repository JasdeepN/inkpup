import {
  CustomerSchema,
  CreateCustomerSchema,
  UpdateCustomerSchema,
  DepositSchema,
  CreateDepositSchema,
  UpdateDepositSchema,
  DepositMethodSchema,
  DepositStatusSchema,
  CustomerWithDepositsSchema,
  validateCustomer,
  validateDeposit,
} from './customer';

describe('CustomerSchema', () => {
  const validCustomer = {
    id: 1,
    email: 'john@example.com',
    name: 'John Doe',
    phone: '555-1234',
    notes: 'Good customer',
    total_deposits: 150.0,
    inquiry_count: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:00:00Z',
  };

  it('validates a complete customer', () => {
    const result = CustomerSchema.safeParse(validCustomer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@example.com');
      expect(result.data.total_deposits).toBe(150.0);
    }
  });

  it('validates customer with null optional fields', () => {
    const customer = {
      ...validCustomer,
      phone: null,
      notes: null,
      updated_at: null,
    };
    const result = CustomerSchema.safeParse(customer);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const customer = { ...validCustomer, email: 'not-an-email' };
    const result = CustomerSchema.safeParse(customer);
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const customer = { ...validCustomer, name: '' };
    const result = CustomerSchema.safeParse(customer);
    expect(result.success).toBe(false);
  });
});

describe('CreateCustomerSchema', () => {
  it('validates minimal create data', () => {
    const data = {
      email: 'jane@example.com',
      name: 'Jane Smith',
    };
    const result = CreateCustomerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates create data with all fields', () => {
    const data = {
      email: 'jane@example.com',
      name: 'Jane Smith',
      phone: '555-5678',
      notes: 'VIP customer',
    };
    const result = CreateCustomerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const data = { name: 'Jane Smith' };
    const result = CreateCustomerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('UpdateCustomerSchema', () => {
  it('validates partial update', () => {
    const data = { name: 'Updated Name' };
    const result = UpdateCustomerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates empty update (all optional)', () => {
    const result = UpdateCustomerSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('DepositMethodSchema', () => {
  it('accepts valid methods', () => {
    expect(DepositMethodSchema.safeParse('e-transfer').success).toBe(true);
    expect(DepositMethodSchema.safeParse('cash').success).toBe(true);
    expect(DepositMethodSchema.safeParse('credit').success).toBe(true);
    expect(DepositMethodSchema.safeParse('other').success).toBe(true);
  });

  it('rejects invalid method', () => {
    expect(DepositMethodSchema.safeParse('bitcoin').success).toBe(false);
  });
});

describe('DepositStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(DepositStatusSchema.safeParse('pending').success).toBe(true);
    expect(DepositStatusSchema.safeParse('received').success).toBe(true);
    expect(DepositStatusSchema.safeParse('refunded').success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(DepositStatusSchema.safeParse('cancelled').success).toBe(false);
  });
});

describe('DepositSchema', () => {
  const validDeposit = {
    id: 1,
    customer_id: 1,
    inquiry_id: 5,
    amount: 100.0,
    method: 'e-transfer',
    status: 'received',
    reference: 'ET-12345',
    notes: 'Received via Interac',
    received_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-14T08:00:00Z',
  };

  it('validates a complete deposit', () => {
    const result = DepositSchema.safeParse(validDeposit);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(100.0);
      expect(result.data.method).toBe('e-transfer');
    }
  });

  it('validates deposit with null optional fields', () => {
    const deposit = {
      ...validDeposit,
      inquiry_id: null,
      reference: null,
      notes: null,
      received_at: null,
    };
    const result = DepositSchema.safeParse(deposit);
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const deposit = { ...validDeposit, amount: 0 };
    const result = DepositSchema.safeParse(deposit);
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const deposit = { ...validDeposit, amount: -50 };
    const result = DepositSchema.safeParse(deposit);
    expect(result.success).toBe(false);
  });
});

describe('CreateDepositSchema', () => {
  it('validates minimal create data', () => {
    const data = {
      customer_id: 1,
      amount: 75.0,
    };
    const result = CreateDepositSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe('e-transfer'); // default
      expect(result.data.status).toBe('pending'); // default
    }
  });

  it('validates create data with all fields', () => {
    const data = {
      customer_id: 1,
      inquiry_id: 5,
      amount: 150.0,
      method: 'cash',
      status: 'received',
      reference: 'CASH-001',
      notes: 'Paid in person',
    };
    const result = CreateDepositSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('UpdateDepositSchema', () => {
  it('validates status update', () => {
    const data = { status: 'received', received_at: '2024-01-15T10:00:00Z' };
    const result = UpdateDepositSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const result = UpdateDepositSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CustomerWithDepositsSchema', () => {
  it('validates customer with deposits array', () => {
    const customer = {
      id: 1,
      email: 'john@example.com',
      name: 'John Doe',
      phone: null,
      notes: null,
      total_deposits: 250.0,
      inquiry_count: 2,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: null,
      deposits: [
        {
          id: 1,
          customer_id: 1,
          inquiry_id: null,
          amount: 100.0,
          method: 'e-transfer',
          status: 'received',
          reference: null,
          notes: null,
          received_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-14T08:00:00Z',
        },
        {
          id: 2,
          customer_id: 1,
          inquiry_id: 5,
          amount: 150.0,
          method: 'cash',
          status: 'received',
          reference: null,
          notes: null,
          received_at: '2024-01-20T14:00:00Z',
          created_at: '2024-01-19T12:00:00Z',
        },
      ],
    };
    const result = CustomerWithDepositsSchema.safeParse(customer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deposits).toHaveLength(2);
    }
  });
});

describe('validateCustomer helper', () => {
  it('returns customer for valid data', () => {
    const data = {
      id: 1,
      email: 'test@example.com',
      name: 'Test',
      phone: null,
      notes: null,
      total_deposits: 0,
      inquiry_count: 0,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: null,
    };
    const result = validateCustomer(data);
    expect(result).not.toBeNull();
    expect(result?.email).toBe('test@example.com');
  });

  it('returns null for invalid data', () => {
    const result = validateCustomer({ name: 'No email' });
    expect(result).toBeNull();
  });
});

describe('validateDeposit helper', () => {
  it('returns deposit for valid data', () => {
    const data = {
      id: 1,
      customer_id: 1,
      inquiry_id: null,
      amount: 50.0,
      method: 'cash',
      status: 'pending',
      reference: null,
      notes: null,
      received_at: null,
      created_at: '2024-01-15T10:00:00Z',
    };
    const result = validateDeposit(data);
    expect(result).not.toBeNull();
    expect(result?.amount).toBe(50.0);
  });

  it('returns null for invalid data', () => {
    const result = validateDeposit({ amount: -10 });
    expect(result).toBeNull();
  });
});
