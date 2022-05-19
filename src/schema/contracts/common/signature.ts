import {
  BasisPointsSchema,
  BigNumberishSchema,
  BigNumberSchema,
  EndDateSchema,
  PriceSchema,
  StartDateSchema,
} from "../../shared";
import { z } from "zod";
import { NFTInputOrUriSchema } from "../../tokens/common";
import { NATIVE_TOKEN_ADDRESS } from "../../../constants/currency";
import { ethers, constants } from "ethers";
import { resolveOrGenerateId } from "../../../common/signature-minting";

/**
 * @internal
 */
export const BaseSignaturePayloadInput = z.object({
  to: z.string().default(constants.AddressZero),
  price: PriceSchema.default(0),
  currencyAddress: z.string().default(NATIVE_TOKEN_ADDRESS),
  mintStartTime: StartDateSchema,
  mintEndTime: EndDateSchema,
  uid: z
    .string()
    .optional()
    .transform((arg) => resolveOrGenerateId(arg)),
  primarySaleRecipient: z.string().default(constants.AddressZero),
});

/**
 * @internal
 */
export const Signature20PayloadInput = BaseSignaturePayloadInput.extend({
  quantity: PriceSchema,
});

/**
 * @internal
 */
export const Signature20PayloadOutput = Signature20PayloadInput.extend({
  mintStartTime: BigNumberSchema,
  mintEndTime: BigNumberSchema,
});

/**
 * @internal
 */
export const Signature721PayloadInput = BaseSignaturePayloadInput.extend({
  metadata: NFTInputOrUriSchema,
  royaltyRecipient: z.string().default(constants.AddressZero),
  royaltyBps: BasisPointsSchema.default(0),
});

/**
 * @internal
 */
export const Signature721PayloadOutput = Signature721PayloadInput.extend({
  uri: z.string(),
  royaltyBps: BigNumberSchema,
  mintStartTime: BigNumberSchema,
  mintEndTime: BigNumberSchema,
});

/**
 * @internal
 */
export const Signature1155PayloadInput = Signature721PayloadInput.extend({
  metadata: NFTInputOrUriSchema.default(""),
  tokenId: BigNumberishSchema.default(ethers.constants.MaxUint256),
  quantity: BigNumberishSchema,
});

/**
 * @internal
 */
export const Signature1155PayloadOutput = Signature721PayloadOutput.extend({
  tokenId: BigNumberSchema,
  quantity: BigNumberSchema,
});

/**
 * @public
 */
export type FilledSignaturePayload20 = z.output<typeof Signature20PayloadInput>;
/**
 * @public
 */
export type PayloadWithUri20 = z.output<typeof Signature20PayloadOutput>;
/**
 * @public
 */
export type PayloadToSign20 = z.input<typeof Signature20PayloadInput>;
/**
 * @public
 */
export type SignedPayload20 = {
  payload: PayloadWithUri20;
  signature: string;
};

/**
 * @public
 */
export type FilledSignaturePayload721 = z.output<
  typeof Signature721PayloadInput
>;
/**
 * @public
 */
export type PayloadWithUri721 = z.output<typeof Signature721PayloadOutput>;
/**
 * @public
 */
export type PayloadToSign721 = z.input<typeof Signature721PayloadInput>;
/**
 * @public
 */
export type SignedPayload721 = {
  payload: PayloadWithUri721;
  signature: string;
};

/**
 * @public
 */
export type FilledSignaturePayload1155 = z.output<
  typeof Signature1155PayloadInput
>;
/**
 * @public
 */
export type PayloadWithUri1155 = z.output<typeof Signature1155PayloadOutput>;
/**
 * @public
 */
export type PayloadWithUri721withQuantity = z.output<typeof Signature1155PayloadOutput>;
/**
 * @public
 */
export type PayloadToSign1155 = z.input<typeof Signature1155PayloadInput>;
/**
 * @public
 */
export type PayloadToSign721withQuantity = z.input<typeof Signature1155PayloadInput>;
/**
 * @public
 */
export type SignedPayload1155 = {
  payload: PayloadWithUri1155;
  signature: string;
};

/**
 * @public
 */
export type SignedPayload721WithQuantitySignature = {
  payload: PayloadWithUri721withQuantity;
  signature: string;
};

export const MintRequest20 = [
  { name: "to", type: "address" },
  { name: "primarySaleRecipient", type: "address" },
  { name: "quantity", type: "uint256" },
  { name: "price", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];

export const MintRequest721 = [
  { name: "to", type: "address" },
  { name: "royaltyRecipient", type: "address" },
  { name: "royaltyBps", type: "uint256" },
  { name: "primarySaleRecipient", type: "address" },
  { name: "uri", type: "string" },
  { name: "price", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];

export const MintRequest1155 = [
  { name: "to", type: "address" },
  { name: "royaltyRecipient", type: "address" },
  { name: "royaltyBps", type: "uint256" },
  { name: "primarySaleRecipient", type: "address" },
  { name: "tokenId", type: "uint256" },
  { name: "uri", type: "string" },
  { name: "quantity", type: "uint256" },
  { name: "pricePerToken", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];

export const MintRequest721withQuantity = [
  { name: "to", type: "address" },
  { name: "royaltyRecipient", type: "address" },
  { name: "royaltyBps", type: "uint256" },
  { name: "primarySaleRecipient", type: "address" },
  { name: "uri", type: "string" },
  { name: "quantity", type: "uint256" },
  { name: "pricePerToken", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];
