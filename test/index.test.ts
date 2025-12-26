import dotenv from "dotenv";

import { Coset } from "../src/coset";

dotenv.config({ path: ".env.test" });

const TEST_ORACLE = "0xc131008d449b8ab375bba4bb139fe6ca81ecb2e6";
const USER_PRIVATE_KEY = (process.env.USER_PRIVATE_KEY as string).replace("0x", "");

describe("Coset SDK", () => {
    let coset: Coset;

    beforeAll(() => {
        coset = new Coset(USER_PRIVATE_KEY, TEST_ORACLE);
    });

    it("should create a Coset instance with the provided private key", () => {
        const receivedPrivateKey = coset.wallet.privateKey.replace("0x", "");
        expect(receivedPrivateKey).toBe(USER_PRIVATE_KEY);
    });
});
