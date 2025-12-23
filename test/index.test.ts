import dotenv from "dotenv";

import { Coset } from "../src/coset";

dotenv.config({ path: ".env.test" });

const TEST_ORACLE = "0xdfbEB698BB887e1Ed9b0405157d9125BDBc479bA";
const OWNER_PRIVATE_KEY = (process.env.OWNER_PRIVATE_KEY as string).replace("0x", "");
const PROVIDER_PRIVATE_KEY = (process.env.PROVIDER_PRIVATE_KEY as string).replace("0x", "");

describe("Coset SDK", () => {
    let ownerCoset: Coset;

    let providerCoset: Coset;

    beforeAll(() => {
        ownerCoset = new Coset(TEST_ORACLE, OWNER_PRIVATE_KEY);
        providerCoset = new Coset(TEST_ORACLE, PROVIDER_PRIVATE_KEY);
    });

    it("should create a Coset instance with the provided private key", () => {
        const receivedPrivateKey = providerCoset.wallet.privateKey.replace("0x", "");
        expect(receivedPrivateKey).toBe(PROVIDER_PRIVATE_KEY);
    });
});
