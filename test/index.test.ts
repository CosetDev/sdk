import dotenv from "dotenv";

import { Coset, Networks } from "../src/coset";

dotenv.config({ path: ".env.test" });

const TEST_ORACLE = "0xfa44948f4FE39C888cC70540054E7Ab50f48a2C5";
const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY as `0x${string}`;

describe("Coset SDK", () => {
    let coset: Coset;

    beforeAll(() => {
        coset = new Coset(Networks.MANTLE_TESTNET, TEST_ORACLE, USER_PRIVATE_KEY);
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
