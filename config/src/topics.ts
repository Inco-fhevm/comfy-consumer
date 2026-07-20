export const TOPIC0 = {
  // WrapperFactory
  WrapperCreated: "0xeca658fb45a042c9a15f37be8099dbc152e104331b942dc253680509f9727d07",

  // CToken — public plaintext amounts
  Unwrapped: "0x742cbb4a6bddd5e23aa0c14356065c236bdbc921cddb7f1f763161eb2030f3ef",
  Burn: "0xc6c4132f6250531f66c30d176444d900432e0ff7bb9e3e4ef8c8b33670218419",

  // CToken — confidential (amount is an euint256 handle)
  ConfidentialTransfer: "0x67500e8d0ed826d2194f514dd0d8124f35648ab6e3fb5e6ed867134cffe661e9",

  // CToken — metadata
  OperatorSet: "0x921a218a75d18e8ec5704851e6b234a85725b21a2521ce889622c35dedc1fa12",
  AmountDisclosed: "0xa6c96fecfa9a02a37fe3ea97f26fd2443f70bc3393be0489ee62bce1cc660ccd",
} as const;

export const FACTORY_TOPIC = TOPIC0.WrapperCreated;

export const CHILD_TOPICS = [
  TOPIC0.ConfidentialTransfer,
  TOPIC0.Unwrapped,
  TOPIC0.Burn,
  TOPIC0.OperatorSet,
  TOPIC0.AmountDisclosed,
] as const;

// Amount is public plaintext.
export const PUBLIC_AMOUNT_TOPICS = new Set<string>([TOPIC0.Unwrapped, TOPIC0.Burn]);

export const WATCHED_TOPICS = [FACTORY_TOPIC, ...CHILD_TOPICS] as const;
