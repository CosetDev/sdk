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
    MANTLE = "mantle",
    MANTLE_TESTNET = "mantle-testnet",
    CRONOS = "cronos",
    CRONOS_TESTNET = "cronos-testnet",
}

export enum PaymentToken {
    USDC = "USDC",
    CST = "CST",
}

export type NetworkTokenMap = {
    [Networks.MANTLE]: PaymentToken.USDC | PaymentToken.CST;
    [Networks.MANTLE_TESTNET]: PaymentToken.USDC | PaymentToken.CST;
    [Networks.CRONOS]: PaymentToken.CST;
    [Networks.CRONOS_TESTNET]: PaymentToken.USDC | PaymentToken.CST;
};
