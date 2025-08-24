export type TxStatus = 'pending' | 'completed' | 'failed' | 'refunded' | string;
export type TransactionUI<TBase> = TBase & {
    status?: TxStatus;
};
export type PropertyUI<TBase> = TBase & {
    description?: string;
};
export type TenantUI<TBase> = TBase & {
    move_in_date?: string | Date;
};
