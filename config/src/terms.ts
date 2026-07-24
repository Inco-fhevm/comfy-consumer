// Shared ToS consent constants.
export const TERMS = {
  version: "1",
  statement: "I have read and agree to the Comfy Terms of Service and Privacy Policy.",
  // sha256 of statement.
  hash: "9c990fe576dd25343af632b73a5780da85786a227985a918dab683ca3105afb7",
} as const;

// Canonical message the wallet signs.
export function termsMessage(p: { address: string; signedAt: number }): string {
  return [
    "Comfy - Terms Acceptance",
    "",
    TERMS.statement,
    `Version: ${TERMS.version}`,
    `Terms Hash: ${TERMS.hash}`,
    `Address: ${p.address.toLowerCase()}`,
    `Signed At: ${p.signedAt}`,
  ].join("\n");
}
