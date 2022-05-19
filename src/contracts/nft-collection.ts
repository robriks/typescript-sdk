import type {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResult,
  TransactionResultWithId,
} from "../core";
import {
  Erc721BatchMintable,
  Erc721Enumerable,
  Erc721Mintable,
  Erc721Supply,
} from "../core/classes";
import { TokenErc721ContractSchema } from "../schema/contracts/token-erc721";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { TokenERC721 } from "contracts";
import { SDKOptions } from "../schema/sdk-options";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { Erc721 } from "../core/classes/erc-721";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { Erc721SignatureMinting } from "../core/classes/erc-721-signature-minting";
import { ContractInterceptor } from "../core/classes/contract-interceptor";
import { ContractEvents } from "../core/classes/contract-events";
import { ContractPlatformFee } from "../core/classes/contract-platform-fee";
import { getRoleHash } from "../common";
import { BigNumber, BigNumberish, constants } from "ethers";
import { NFTMetadataOrUri, NFTMetadataOwner } from "../schema";
import { QueryAllParams } from "../types";
import { GasCostEstimator } from "../core/classes/gas-cost-estimator";
import { ContractAnalytics } from "../core/classes/contract-analytics";

/**
 * Create a collection of one-of-one NFTs.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const contract = sdk.getNFTCollection("{{contract_address}}");
 * ```
 *
 * @public
 */
export class NFTCollection extends Erc721<TokenERC721> {
  static contractType = "nft-collection" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractAbi = require("../../abis/TokenERC721.json");
  /**
   * @internal
   */
  static schema = TokenErc721ContractSchema;

  public metadata: ContractMetadata<TokenERC721, typeof NFTCollection.schema>;
  public roles: ContractRoles<
    TokenERC721,
    typeof NFTCollection.contractRoles[number]
  >;
  public encoder: ContractEncoder<TokenERC721>;
  public estimator: GasCostEstimator<TokenERC721>;
  public events: ContractEvents<TokenERC721>;
  public primarySale: ContractPrimarySale<TokenERC721>;
  public platformFee: ContractPlatformFee<TokenERC721>;
  /**
   * @internal
   */
  public analytics: ContractAnalytics<TokenERC721>;
  /**
   * Configure royalties
   * @remarks Set your own royalties for the entire contract or per token
   * @example
   * ```javascript
   * // royalties on the whole contract
   * contract.royalty.setDefaultRoyaltyInfo({
   *   seller_fee_basis_points: 100, // 1%
   *   fee_recipient: "0x..."
   * });
   * // override royalty for a particular token
   * contract.royalty.setTokenRoyaltyInfo(tokenId, {
   *   seller_fee_basis_points: 500, // 5%
   *   fee_recipient: "0x..."
   * });
   * ```
   */
  public royalty: ContractRoyalty<TokenERC721, typeof NFTCollection.schema>;
  /**
   * Signature Minting
   * @remarks Generate dynamic NFTs with your own signature, and let others mint them using that signature.
   * @example
   * ```javascript
   * // see how to craft a payload to sign in the `contract.signature.generate()` documentation
   * const signedPayload = contract.signature.generate(payload);
   *
   * // now anyone can mint the NFT
   * const tx = contract.signature.mint(signedPayload);
   * const receipt = tx.receipt; // the mint transaction receipt
   * const mintedId = tx.id; // the id of the NFT minted
   * ```
   */
  public signature: Erc721SignatureMinting;
  /**
   * @internal
   */
  public interceptor: ContractInterceptor<TokenERC721>;

  private _mint = this.mint as Erc721Mintable;
  private _batchMint = this._mint.batch as Erc721BatchMintable;
  private _query = this.query as Erc721Supply;
  private _owned = this._query.owned as Erc721Enumerable;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC721>(
      network,
      address,
      NFTCollection.contractAbi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      NFTCollection.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      NFTCollection.contractRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySale = new ContractPrimarySale(this.contractWrapper);
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.signature = new Erc721SignatureMinting(
      this.contractWrapper,
      this.roles,
      this.storage,
    );
    this.analytics = new ContractAnalytics(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.platformFee = new ContractPlatformFee(this.contractWrapper);
    this.interceptor = new ContractInterceptor(this.contractWrapper);
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * Get All Minted NFTs
   *
   * @remarks Get all the data associated with every NFT in this contract.
   *
   * By default, returns the first 100 NFTs, use queryParams to fetch more.
   *
   * @example
   * ```javascript
   * const nfts = await contract.getAll();
   * console.log(nfts);
   * ```
   * @param queryParams - optional filtering to only fetch a subset of results.
   * @returns The NFT metadata for all NFTs queried.
   */
  public async getAll(
    queryParams?: QueryAllParams,
  ): Promise<NFTMetadataOwner[]> {
    return this._query.all(queryParams);
  }

  /**
   * Get Owned NFTs
   *
   * @remarks Get all the data associated with the NFTs owned by a specific wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet to get the NFTs of
   * const address = "{{wallet_address}}";
   * const nfts = await contract.getOwned(address);
   * console.log(nfts);
   * ```
   * @param walletAddress - the wallet address to query, defaults to the connected wallet
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async getOwned(walletAddress?: string): Promise<NFTMetadataOwner[]> {
    return this._owned.all(walletAddress);
  }

  /**
   * Get all token ids of NFTs owned by a specific wallet.
   * @param walletAddress - the wallet address to query, defaults to the connected wallet
   */
  public async getOwnedTokenIds(walletAddress?: string): Promise<BigNumber[]> {
    return this._owned.tokenIds(walletAddress);
  }

  /**
   * Get the total count NFTs minted in this contract
   */
  public async totalSupply() {
    return this._query.totalCirculatingSupply();
  }

  /**
   * Get whether users can transfer NFTs from this contract
   */
  public async isTransferRestricted(): Promise<boolean> {
    const anyoneCanTransfer = await this.contractWrapper.readContract.hasRole(
      getRoleHash("transfer"),
      constants.AddressZero,
    );
    return !anyoneCanTransfer;
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Mint a unique NFT
   *
   * @remarks Mint a unique NFT to a specified wallet.
   *
   * @example
   * ```javascript*
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const tx = await contract.mintToSelf(metadata);
   * const receipt = tx.receipt; // the transaction receipt
   * const tokenId = tx.id; // the id of the NFT minted
   * const nft = await tx.data(); // (optional) fetch details of minted NFT
   * ```
   */
  public async mintToSelf(
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const signerAddress = await this.contractWrapper.getSignerAddress();
    return this._mint.to(signerAddress, metadata);
  }

  /**
   * Mint a unique NFT
   *
   * @remarks Mint a unique NFT to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const walletAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const tx = await contract.mintTo(walletAddress, metadata);
   * const receipt = tx.receipt; // the transaction receipt
   * const tokenId = tx.id; // the id of the NFT minted
   * const nft = await tx.data(); // (optional) fetch details of minted NFT
   * ```
   */
  public async mintTo(
    walletAddress: string,
    metadata: NFTMetadataOrUri,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    return this._mint.to(walletAddress, metadata);
  }
  /**
   * Mint Many unique NFTs
   *
   * @remarks Mint many unique NFTs at once to the connected wallet
   *
   * @example
   * ```javascript*
   * // Custom metadata of the NFTs you want to mint.
   * const metadatas = [{
   *   name: "Cool NFT #1",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }, {
   *   name: "Cool NFT #2",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/other/image.png"),
   * }];
   *
   * const tx = await contract.mintBatch(metadatas);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async mintBatch(
    metadata: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    const signerAddress = await this.contractWrapper.getSignerAddress();
    return this._batchMint.to(signerAddress, metadata);
  }
  /**
   * Mint Many unique NFTs
   *
   * @remarks Mint many unique NFTs at once to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const walletAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFTs you want to mint.
   * const metadatas = [{
   *   name: "Cool NFT #1",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }, {
   *   name: "Cool NFT #2",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/other/image.png"),
   * }];
   *
   * const tx = await contract.mintBatchTo(walletAddress, metadatas);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async mintBatchTo(
    walletAddress: string,
    metadata: NFTMetadataOrUri[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this._batchMint.to(walletAddress, metadata);
  }

  /**
   * Burn a single NFT
   * @param tokenId - the token Id to burn
   *
   * @example
   * ```javascript
   * const result = await contract.burn(tokenId);
   * ```
   */
  public async burn(tokenId: BigNumberish): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [tokenId]),
    };
  }
}
