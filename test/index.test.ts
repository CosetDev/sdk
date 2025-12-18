import dotenv from "dotenv";

import { Coset } from "../coset";

dotenv.config({ path: '.env.test' });

const PRIVATE_KEY = (process.env.PRIVATE_KEY as string).replace("0x", "");
const TEST_ORACLE = "0x0000000000000000000000000000000000000001";

describe("Coset SDK", () => {
    let coset: Coset;

    beforeEach(() => {
        coset = new Coset(PRIVATE_KEY);
    });

    it("should create a Coset instance with the provided private key", () => {
        const receivedPrivateKey = coset.wallet.privateKey.replace("0x", "");
        expect(receivedPrivateKey).toBe(PRIVATE_KEY);
    });
});
