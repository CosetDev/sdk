import dotenv from "dotenv";

import { Coset, Networks, PaymentToken } from "../src/coset";

dotenv.config({ path: ".env.test" });

const TEST_ORACLE = "0xe8F71fE8bf0B11beF1C4179202c5c7c06E2eEcF6";
const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY as `0x${string}`;

describe("Coset SDK", () => {
    let coset: Coset;

    beforeAll(() => {
        coset = new Coset(Networks.MANTLE_TESTNET, PaymentToken.CST, TEST_ORACLE, USER_PRIVATE_KEY);
    });

    it("get data update cost", async () => {
        const cost = await coset.getUpdateCost();
        expect(cost.amount).toBe(10);
    });

    it("should read data from the oracle", async () => {
        const res = await coset.read();
        expect(res.data).toBeDefined();
    });

    it.concurrent(
        "should update data on the oracle",
        async () => {
            const res = await coset.update();
            expect(res.data).toBeDefined();
        },
        60_000
    );

    it("should reject update by spending limit", async () => {
        coset.setSpendingLimit(10);
        await expect(coset.update()).rejects.toMatchObject({
            message: "Spending limit exceeded",
        });
    });
});
