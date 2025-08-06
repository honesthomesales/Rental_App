import type { Property as BaseProperty, Tenant } from '@rental-app/api'

export interface Property extends BaseProperty {
  tenants?: Tenant[]
} 