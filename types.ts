export interface IRead {
    data: any;
    status: boolean;
    message?: string;
    lastUpdate?: number;
    recommendedUpdateDuration?: number;
    isUpdateRecommended?: boolean;
}

export interface IUpdate {
    status: boolean;
    spent: {
        total: number;
        gasFee: number;
        platformFee: number;
        dataProviderFee: number;
    };
    tx?: string;
    message?: string;
}

export type UpdateOptions = {
    force?: boolean;
}
