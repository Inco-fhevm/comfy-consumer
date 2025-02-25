import { createInstance, initFhevm } from "fhevmjs";

let fhevmInstance = null;

export const createFhevmInstance = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!fhevmInstance) {
    await initFhevm();
    fhevmInstance = await createInstance({
      chainId: 21097,
      networkUrl: "https://validator.rivest.inco.org/",
      gatewayUrl: "https://gateway.rivest.inco.org/",
      aclAddress: "0x2Fb4341027eb1d2aD8B5D9708187df8633cAFA92",
    });
  }
  return fhevmInstance;
};

export const getFhevmInstance = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!fhevmInstance) {
    fhevmInstance = await createFhevmInstance();
  }
  return fhevmInstance;
};

export const toHexString = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
