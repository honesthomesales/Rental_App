interface PaymentAllocationParams {
    tenantId: string;
    paymentId: string;
    amount: number;
    paymentDate: string;
}
interface AllocationResult {
    periodId: string;
    toLateFee: number;
    toRent: number;
    periodDueDate: string;
    status: 'paid' | 'partial';
}
interface PaymentAllocationResponse {
    applied: AllocationResult[];
    remainder: number;
}
export declare function allocatePayment(params: PaymentAllocationParams): Promise<PaymentAllocationResponse>;
export {};
