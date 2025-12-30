export interface IRead {
    data: Record<string, any>;
    message?: string;
    lastUpdateTimestamp?: number;
    lastUpdateFormatted?: string;
    isUpdateRecommended?: boolean;
    recommendedUpdateDuration?: number;
}

export interface IUpdate {
    spent: {
        total: number;
        gasFee: number;
        platformFee: number;
        dataProviderFee: number;
    };
    data?: any;
    tx?: string;
    message?: string;
}

export type UpdateOptions = {
    force?: boolean;
};

export enum Networks {
    MANTLE = "mantle-mainnet",
    MANTLE_TESTNET = "mantle-testnet",
}
