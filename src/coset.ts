import { formatUnits, isHexString, Wallet } from "ethers";
import type { IRead, IUpdate, UpdateOptions } from "./types";
import { Oracle as OracleContract, factories } from "@coset-dev/contracts";

export class Coset {
    public wallet: Wallet;

    public spent: number = 0;

    public spendingLimit: number = Infinity;

    private oracle: OracleContract;

    /**
     * @param privateKey The private key string
     * @param oracleAddress Address of the oracle smart contract
     */
    constructor(privateKey: string, oracleAddress: string) {
        if (isHexString(oracleAddress) === false) {
            throw new Error("Invalid oracle address");
        }
        this.wallet = new Wallet(privateKey);
        this.oracle = factories.Oracle__factory.connect(oracleAddress, this.wallet);
    }

    /**
     * Performs a data update on the oracle smart contract. This method incurs gas fees.
     * @returns {IUpdate} Object containing status of the update operation, transaction hash if successful, and error message if failed.
     */
    async update(
        options: UpdateOptions = {
            force: false,
        }
    ): Promise<IUpdate> {
        const emptySpent = {
            total: 0,
            gasFee: 0,
            platformFee: 0,
            dataProviderFee: 0,
            data: null,
        };

        if (this.spent >= this.spendingLimit && !options.force) {
            return {
                status: false,
                message: "Spending limit exceeded",
                spent: emptySpent,
            };
        }

        const res = {
            status: true,
            spent: emptySpent,
            data: null,
        };

        // TODO: Send request to node with x402/fetch

        this.spent += res.spent.total;

        return res;
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

    /**
     * Returns if a data update is needed.
     *
     * Compares current date with `recommendedUpdateDuration` variable in oracle smart contract.
     * @returns {boolean} Boolean whether an update is needed
     */
    async isUpdateNeeded(): Promise<boolean> {
        const [recommendedUpdateDuration, lastUpdate] = await Promise.all([
            Number(await this.oracle.recommendedUpdateDuration()),
            Number(await this.oracle.lastUpdateTimestamp()),
        ]);

        if (!recommendedUpdateDuration) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime - lastUpdate >= recommendedUpdateDuration;
    }

    /**
     * Read data from oracle. Free to call and returns if a data update is recommended.
     * @returns {IRead} Object containing oracle data, status, last update timestamp, recommended update duration and whether an update is recommended. If `status` is false, error message is also included.
     */
    async read(): Promise<IRead> {
        const data = await this.oracle.getDataWithoutCheck();

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

    /**
     * Read data from oracle. If recommended update duration has passed, tries to perform an update before reading.
     * @returns {IRead} Object containing oracle data, status, last update timestamp, recommended update duration and whether an update is recommended. If `status` is false, error message is also included.
     */
    async strictRead(): Promise<IRead> {
        try {
            const data = await this.oracle.getData();
            return {
                data,
                status: true,
            }
        } catch {
            const { data } = await this.update();
            return {
                data,
                status: true,
            }
        }
    }

    /**
     * @returns Update cost in stable token units
     */
    async getUpdateCost(): Promise<number> {
        return +formatUnits(await this.oracle.dataUpdatePrice(), 6);
    }

    async setSpendingLimit(_spendingLimit: number): Promise<void> {
        this.spendingLimit = _spendingLimit;
        return;
    }
}
