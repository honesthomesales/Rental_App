// Export types
export * from './types';
export * from './database.types';

// Export client
export { supabase, handleSupabaseError, createApiResponse } from './client';

// Export services
export { PropertiesService } from './services/properties';
export { TenantsService } from './services/tenants';
export { TransactionsService } from './services/transactions';
export { PaymentsService } from './services/payments'; 