// Export types
export * from './types';
export * from './database.types';

// Export client
export { supabase, handleSupabaseError, createApiResponse } from './client';

// Export services
export { PropertiesService } from './services/properties';
export { TenantsService } from './services/tenants';
export { LeasesService } from './services/leases';
export { TransactionsService } from './services/transactions';
export { PaymentsService } from './services/payments';
export { OtherService, OtherEntry } from './services/other'; 