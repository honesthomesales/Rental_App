export declare class TransactionsService {
    static getAll(): Promise<{
        data: never[];
        error: null;
        success: boolean;
    }>;
    static getById(): Promise<{
        data: null;
        error: string;
        success: boolean;
    }>;
    static create(): Promise<{
        data: null;
        error: string;
        success: boolean;
    }>;
    static update(): Promise<{
        data: null;
        error: string;
        success: boolean;
    }>;
    static delete(): Promise<{
        data: null;
        error: string;
        success: boolean;
    }>;
    static getByTenant(): Promise<{
        data: never[];
        error: null;
        success: boolean;
    }>;
    static getByProperty(): Promise<{
        data: never[];
        error: null;
        success: boolean;
    }>;
    static getTotalByTenant(): Promise<{
        data: number;
        error: null;
        success: boolean;
    }>;
    static getTotalByProperty(): Promise<{
        data: number;
        error: null;
        success: boolean;
    }>;
}
