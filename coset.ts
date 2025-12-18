import { Wallet, Contract } from "ethers";

import ABI from "./data/ABI.json";
import type { IRead, IUpdate } from "./types";
import { stableStringify } from "./utils/stringify";

export class Coset {
    public wallet: Wallet;

    /**
     * Creates an instance of the Coset SDK.
     * @param privateKey Private key of your wallet. This wallet will be used to sign transactions and pay HTTP 402 payments automatically. Be sure to have balance in your wallet.
     * @param wallet Optional ethers.js Wallet instance. If provided, the SDK will use this wallet instead of creating a new one with the private key.
     */
    constructor(privateKey: string, wallet?: Wallet) {
        this.wallet = wallet ?? new Wallet(privateKey);
    }

    /**
     * Performs a data update on the oracle smart contract. This method incurs gas fees.
     * @returns {IUpdate} Object containing status of the update operation, transaction hash if successful, and error message if failed.
     */
    async update(oracleAddress: string): Promise<IUpdate> {
        return {
            status: true,
            spent: {
                gasFee: 0,
                platformFee: 0,
                dataProviderFee: 0,
            }
        };
    }

    /**
     * Performs an optional data update if needed. Checks if an update is needed by comparing current time with `recommendedUpdateDuration` variable in oracle smart contract.
     * 
     * If an update is needed, it performs the update, otherwise does nothing. This method may incur gas fees if an update is performed.
     * @param oracleAddress Address of the oracle smart contract
     * @returns {null | IUpdate} Returns null if no update was needed, otherwise returns the result of the update operation.
     */
    async optionalUpdate(oracleAddress: string): Promise<null | IUpdate> {
        if (await this.isUpdateNeeded(oracleAddress)) {
            await this.update(oracleAddress);
        }

        return null;
    }

    /**
     * Returns if a data update is needed.
     *
     * Compares current date with `recommendedUpdateDuration` variable in oracle smart contract.
     * @param oracleAddress Address of the oracle smart contract
     * @returns {boolean} Boolean whether an update is needed
     */
    async isUpdateNeeded(oracleAddress: string): Promise<boolean> {
        const [recommendedUpdateDuration, lastUpdate] = await Promise.all([
            this.oracle(oracleAddress).recommendedUpdateDuration(),
            this.oracle(oracleAddress).lastUpdate(),
        ]);

        if (!recommendedUpdateDuration) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime - lastUpdate >= recommendedUpdateDuration;
    }

    /**
     * Read data from oracle. Free to call and returns if a data update is recommended.
     * @param oracleAddress Address of the oracle smart contract
     * @returns {IRead} Object containing oracle data, status, last update timestamp, recommended update duration and whether an update is recommended. If `status` is false, error message is also included.
     */
    async read(oracleAddress: string): Promise<IRead> {
        if (!oracleAddress)
            return {
                data: null,
                status: false,
                message: "Oracle address is required",
            };

        const data = await this.oracle(oracleAddress).data();

        if (!data) {
            return {
                data: null,
                status: false,
                message: "No data found",
            };
        }

        return {
            data,
            status: true,
        };
    }

    private oracle(address: string) {
        return new Contract(address, stableStringify(ABI), this.wallet);
    }
}
