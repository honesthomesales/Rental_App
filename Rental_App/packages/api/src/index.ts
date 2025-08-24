// Export all services
export * from './services/properties';
export * from './services/tenants';
export * from './services/payments';
export * from './services/leases';
export * from './services/transactions';
export * from './services/rentPeriods';
export * from './services/other';

// Export types (excluding those already exported by services)
export type { 
  Property,
  Tenant, 
  Lease,
  Transaction,
  RentPeriod,
  OtherEntry,
  ApiResponse,
  PaginatedResponse,
  CreatePropertyData,
  UpdatePropertyData,
  CreateTenantData,
  UpdateTenantData,
  CreateTransactionData,
  UpdateTransactionData,
  LateTenant
} from './types';

// Export UI types
export * from './types/ui';

// Export client
export * from './client';

// Export utilities
export * from './utils'; 