// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): void {
    this.metrics.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.metrics.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.delete(name);
      
      // Log performance metrics
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      
      // Send to analytics if needed
      this.sendMetric(name, duration);
      
      return duration;
    }
    return 0;
  }

  private sendMetric(name: string, duration: number): void {
    // Send to analytics service if configured
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance', {
        event_category: 'performance',
        event_label: name,
        value: Math.round(duration)
      });
    }
  }

  measurePageLoad(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
          this.sendMetric('page_load', loadTime);
        }
      });
    }
  }

  measureApiCall(apiName: string, startTime: number): void {
    const duration = performance.now() - startTime;
    console.log(`API Call: ${apiName} took ${duration.toFixed(2)}ms`);
    this.sendMetric(`api_${apiName}`, duration);
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance hooks for React components
export const usePerformanceMonitor = (componentName: string) => {
  const startTimer = () => {
    performanceMonitor.startTimer(componentName);
  };

  const endTimer = () => {
    performanceMonitor.endTimer(componentName);
  };

  return { startTimer, endTimer };
};

// Declare global gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
} 