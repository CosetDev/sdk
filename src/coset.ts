import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { IRead, IUpdate, Networks, PaymentToken, UpdateOptions } from "./types";

export * from "./types";

const paymentTokenMap = {
    [Networks.MANTLE]: {
        USDC: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
        CST: "0x77A90090C9bcc45940E18657fB82Fb70A2D494fd",
    },
    [Networks.MANTLE_TESTNET]: {
        USDC: "0x05856b07544044873616d390Cc50c785fe8a8885",
        CST: "0x77A90090C9bcc45940E18657fB82Fb70A2D494fd",
    },
    [Networks.CRONOS]: {
        USDC: "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C",
        CST: "0x6e0a0ba0e4e7433e65e6b4a12860baf43b0b8f06",
    },
    [Networks.CRONOS_TESTNET]: {
        USDC: "0xb1BF5CA11a4C4f95ab46B496757E1DBb1397eC0a",
        CST: "0x6e0a0ba0e4e7433e65e6b4a12860baf43b0b8f06",
    },
};

export class Coset {
    public spent: number = 0;

    public spendingLimit: number = Infinity;

    private node: string = "https://node1.coset.dev/";

    private call: string = `${this.node}call/`;

    private oracleAddress: `0x${string}`;

    private networkName: Networks;

    private paymentToken: `0x${string}`;

    private signer: PrivateKeyAccount;

    private client: x402Client;

    private fetchWithPayment: ReturnType<typeof wrapFetchWithPayment>;

    /**
     * @param networkName Name of the blockchain network (e.g., "mantle-testnet")
     * @param paymentToken Payment token to be used for updates
     * @param oracleAddress Address of the oracle smart contract
     * @param privateKey The private key string
     * @param nodeEndpoint The node endpoint
     */
    constructor(
        networkName: Networks,
        paymentToken: PaymentToken,
        oracleAddress: `0x${string}`,
        privateKey: `0x${string}`,
        nodeEndpoint?: string,
    ) {
        if (this.isHexString(oracleAddress) === false) {
            throw new Error("Invalid oracle address");
        }
        if (nodeEndpoint) {
            try {
                // eslint-disable-next-line no-new
                new URL(nodeEndpoint);
            } catch {
                throw new Error("Invalid node endpoint");
            }
            this.node = nodeEndpoint;
        }

        if (!this.node.endsWith("/")) {
            this.node = `${this.node}/`;
        }

        this.call = `${this.node}call/${oracleAddress}/`;
        if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
            privateKey = `0x${privateKey}`;
        }
        this.networkName = networkName;
        this.oracleAddress = oracleAddress;
        this.client = new x402Client();
        this.signer = privateKeyToAccount(privateKey);
        registerExactEvmScheme(this.client, { signer: this.signer });
        this.fetchWithPayment = wrapFetchWithPayment(fetch, this.client);
        this.paymentToken = paymentTokenMap[this.networkName][paymentToken] as `0x${string}`;
        if (!this.paymentToken) {
            throw new Error(`Payment token ${paymentToken} is not supported on network ${networkName}`);
        }
    }

    private isHexString(value: string): boolean {
        return /^0x[0-9a-fA-F]+$/.test(value);
    }

    private async apiCall(
        path: string,
        options = {
            method: "GET",
            headers: {},
        },
    ) {
        try {
            const res = await fetch(`${this.call}${path}`, {
                method: options.method,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });

            if (!res.ok) {
                return Promise.reject({
                    data: await res.json(),
                    message: `API request failed with status ${res.status}`,
                });
            }

            try {
                return await res.json();
            } catch (error) {
                return Promise.reject({
                    message: "Failed to parse JSON response",
                });
            }
        } catch (error) {
            return Promise.reject({
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Performs a data update on the oracle smart contract. This method incurs gas fees.
     * @returns {IUpdate} Object containing status of the update operation, transaction hash if successful, and error message if failed.
     */
    async update(
        options: UpdateOptions = {
            force: false,
        },
    ): Promise<IUpdate> {
        const emptySpent = {
            total: 0,
            gasFee: 0,
            platformFee: 0,
            dataProviderFee: 0,
        };

        if (this.spent >= this.spendingLimit && !options.force) {
            return Promise.reject({
                message: "Spending limit exceeded",
                spent: emptySpent,
            });
        }

        try {
            this.client.onBeforePaymentCreation(async context => {
                const balance = await this.getBalance(this.paymentToken);
                if (Number(balance.units) < Number(context.selectedRequirements.amount)) {
                    return {
                        abort: true,
                        reason: "Insufficient token balance for payment",
                    };
                }
            });

            const response = await this.fetchWithPayment(`${this.node}update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    networkName: this.networkName,
                    paymentToken: this.paymentToken,
                    oracleAddress: this.oracleAddress,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return Promise.reject({
                    message: `Update failed with status ${response.status}`,
                    spent: emptySpent,
                    data,
                });
            }

            const priceDetails = data.priceDetails;

            emptySpent.total = Number(priceDetails.totalCost || 0);
            emptySpent.gasFee = Number(priceDetails.methodGasFee?.token || 0);
            emptySpent.dataProviderFee = Number(priceDetails.providerAmount || 0);
            emptySpent.platformFee = Number(priceDetails.updatePrice) - emptySpent.dataProviderFee;

            this.spent += emptySpent.total;

            return Promise.resolve({
                spent: emptySpent,
                data: data.data,
                tx: data.transactionHash,
            });
        } catch (error: any) {
            return Promise.reject({
                message: error.message || "Update failed",
                spent: emptySpent,
            });
        }
    }

    /**
     * Performs an optional data update if needed. Checks if an update is needed by comparing current time with `recommendedUpdateDuration` variable in oracle smart contract.
     *
     * If an update is needed, it performs the update, otherwise does nothing. This method may incur gas fees if an update is performed.
     * @returns {null | IUpdate} Returns null if no update was needed, otherwise returns the result of the update operation.
     */
    async optionalUpdate(): Promise<null | IUpdate> {
        if (await this.isUpdateNeeded()) {
            await this.update();
        }

        return null;
    }

    private async getUpdateMetadata(): Promise<{
        recommendedUpdateDuration: number;
        lastUpdateTimestamp: number;
    }> {
        return await this.apiCall("get-update-metadata");
    }

    private async getBalance(currency: string): Promise<{
        units: string;
        amount: number;
    }> {
        return await this.apiCall("get-balance?sender=" + this.signer.address + `&currency=${currency}`);
    }

    /**
     * Returns if a data update is needed.
     *
     * Compares current date with `recommendedUpdateDuration` variable in oracle smart contract.
     * @returns {boolean} Boolean whether an update is needed
     */
    async isUpdateNeeded(): Promise<boolean> {
        const { recommendedUpdateDuration, lastUpdateTimestamp } = await this.getUpdateMetadata();
        return Math.floor(Date.now() / 1000) - lastUpdateTimestamp >= recommendedUpdateDuration;
    }

    /**
     * Read data from oracle. Free to call and returns if a data update is recommended.
     * @param strict If true, tries to perform an update before reading if recommended update duration has passed.
     * @returns {IRead} Object containing oracle data, status, last update timestamp, recommended update duration and whether an update is recommended. If `status` is false, error message is also included.
     */
    async read(strict = false): Promise<IRead> {
        try {
            const [data, { recommendedUpdateDuration, lastUpdateTimestamp }] = await Promise.all([
                this.apiCall(strict ? "get-data" : "get-data-without-check"),
                this.getUpdateMetadata(),
            ]);

            const currentTime = Math.floor(Date.now() / 1000);
            const isUpdateRecommended = recommendedUpdateDuration
                ? currentTime - lastUpdateTimestamp >= recommendedUpdateDuration
                : false;

            return {
                data,
                lastUpdateTimestamp,
                isUpdateRecommended,
                recommendedUpdateDuration,
                lastUpdateFormatted: new Date(lastUpdateTimestamp * 1000).toISOString(),
            };
        } catch (error: any) {
            return error;
        }
    }

    /**
     * Read data from oracle. If recommended update duration has passed, tries to perform an update before reading.
     * @returns {IRead} Object containing oracle data, status, last update timestamp, recommended update duration and whether an update is recommended. If `status` is false, error message is also included.
     */
    async strictRead(
        options: UpdateOptions = {
            force: false,
        },
    ): Promise<IRead> {
        try {
            return await this.read(true);
        } catch {
            const { data } = await this.update(options);
            return {
                data,
            };
        }
    }

    /**
     * @returns Update cost in stable token units
     */
    async getUpdateCost(): Promise<{
        units: string;
        amount: number;
    }> {
        return await this.apiCall("get-data-update-price");
    }

    async setSpendingLimit(_spendingLimit: number): Promise<void> {
        this.spendingLimit = _spendingLimit;
        return;
    }
}
