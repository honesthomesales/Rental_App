import { Location, TimeEntry, Job } from './types';

/**
 * Calculate distance between two locations using Haversine formula
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate total duration from time entries
 */
export function calculateTotalDuration(timeEntries: TimeEntry[]): number {
  return timeEntries.reduce((total, entry) => {
    if (entry.endTime && entry.duration) {
      return total + entry.duration;
    }
    return total;
  }, 0);
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'time' = 'short'): string {
  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  }
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(prefix = 'INV', date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate job progress percentage
 */
export function calculateJobProgress(job: Job): number {
  switch (job.status) {
    case 'pending':
      return 0;
    case 'in-progress':
      return 50;
    case 'completed':
      return 100;
    case 'cancelled':
      return 0;
    case 'on-hold':
      return 25;
    default:
      return 0;
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#f59e0b'; // amber
    case 'in-progress':
      return '#3b82f6'; // blue
    case 'completed':
      return '#10b981'; // green
    case 'cancelled':
      return '#ef4444'; // red
    case 'on-hold':
      return '#8b5cf6'; // purple
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Check if location is within radius of target
 */
export function isWithinRadius(
  currentLocation: Location,
  targetLocation: Location,
  radiusKm: number
): boolean {
  const distance = calculateDistance(currentLocation, targetLocation);
  return distance <= radiusKm;
}

/**
 * Parse voice command text to extract job details
 */
export function parseVoiceCommand(text: string): {
  action: string;
  jobTitle?: string;
  customerName?: string;
  address?: string;
  materials?: string[];
} {
  const lowerText = text.toLowerCase();
  
  // Extract action
  let action = 'unknown';
  if (lowerText.includes('create job') || lowerText.includes('new job')) {
    action = 'create_job';
  } else if (lowerText.includes('start job') || lowerText.includes('begin job')) {
    action = 'start_job';
  } else if (lowerText.includes('end job') || lowerText.includes('finish job')) {
    action = 'end_job';
  } else if (lowerText.includes('add photo') || lowerText.includes('take photo')) {
    action = 'add_photo';
  } else if (lowerText.includes('create quote') || lowerText.includes('generate quote')) {
    action = 'create_quote';
  } else if (lowerText.includes('create invoice') || lowerText.includes('generate invoice')) {
    action = 'create_invoice';
  }

  // Extract job title (after "job" or "for")
  const jobMatch = text.match(/(?:job|for)\s+(.+?)(?:\s+at|\s+for|\s+with|$)/i);
  const jobTitle = jobMatch ? jobMatch[1].trim() : undefined;

  // Extract customer name (after "for" or "customer")
  const customerMatch = text.match(/(?:for|customer)\s+(.+?)(?:\s+at|\s+address|\s+$)/i);
  const customerName = customerMatch ? customerMatch[1].trim() : undefined;

  // Extract address (after "at" or "address")
  const addressMatch = text.match(/(?:at|address)\s+(.+?)(?:\s+with|\s+$)/i);
  const address = addressMatch ? addressMatch[1].trim() : undefined;

  // Extract materials (after "with" or "materials")
  const materialsMatch = text.match(/(?:with|materials?)\s+(.+?)$/i);
  const materials = materialsMatch 
    ? materialsMatch[1].split(',').map(m => m.trim())
    : undefined;

  return {
    action,
    jobTitle,
    customerName,
    address,
    materials,
  };
} 