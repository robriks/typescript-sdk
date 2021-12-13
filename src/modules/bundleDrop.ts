import {
  ERC20__factory,
  LazyMintERC1155 as BundleDrop,
  LazyMintERC1155__factory as BundleDrop__factory,
} from "@3rdweb/contracts";
import { hexZeroPad } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { ModuleType, Role, RolesMap } from "../common";
import { getTokenMetadata, NFTMetadata } from "../common/nft";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";
import ClaimConditionFactory from "../factories/ClaimConditionFactory";

/**
 * @beta
 */
export interface BundleDropCreateClaimCondition {
  startTimestamp?: BigNumberish;
  maxClaimableSupply: BigNumberish;
  quantityLimitPerTransaction?: BigNumberish;
  waitTimeInSecondsBetweenClaims?: BigNumberish;
  pricePerToken?: BigNumberish;
  currency?: string;
  merkleRoot?: BytesLike;
}

/**
 * @beta
 */
export interface BundleDropMetadata {
  supply: BigNumber;
  metadata: NFTMetadata;
}

/**
 * Access this module by calling {@link ThirdwebSDK.getBundleDropModule}
 * @beta
 */
export class BundleDropModule extends ModuleWithRoles<BundleDrop> {
  public static moduleType: ModuleType = ModuleType.BUNDLE_DROP;
  storage = this.sdk.getStorage();

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.transfer,
  ] as const;

  /**
   * @override
   * @internal
   */
  protected getModuleRoles(): readonly Role[] {
    return BundleDropModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): BundleDrop {
    return BundleDrop__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return BundleDropModule.moduleType;
  }

  private async getTokenMetadata(tokenId: string): Promise<NFTMetadata> {
    return await getTokenMetadata(
      this.readOnlyContract,
      tokenId,
      this.ipfsGatewayUrl,
    );
  }

  public async get(tokenId: string): Promise<BundleDropMetadata> {
    const [supply, metadata] = await Promise.all([
      this.readOnlyContract.totalSupply(tokenId).catch(() => BigNumber.from(0)),
      this.getTokenMetadata(tokenId),
    ]);

    return {
      supply,
      metadata,
    };
  }

  public async getAll(): Promise<BundleDropMetadata[]> {
    const maxId = (await this.readOnlyContract.nextTokenIdToMint()).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  /**
   * `getOwned` is a convenience method for getting all owned tokens
   * for a particular wallet.
   *
   * @param _address - The address to check for token ownership
   * @returns An array of BundleMetadata objects that are owned by the address
   */
  public async getOwned(_address?: string): Promise<BundleDropMetadata[]> {
    const address = _address ? _address : await this.getSignerAddress();
    const maxId = await this.readOnlyContract.nextTokenIdToMint();
    const balances = await this.readOnlyContract.balanceOfBatch(
      Array(maxId.toNumber()).fill(address),
      Array.from(Array(maxId.toNumber()).keys()),
    );

    const ownedBalances = balances
      .map((b, i) => {
        return {
          tokenId: i,
          balance: b,
        };
      })
      .filter((b) => b.balance.gt(0));
    return await Promise.all(
      ownedBalances.map(async (b) => await this.get(b.tokenId.toString())),
    );
  }

  public async getActiveClaimCondition(tokenId: BigNumberish): Promise<any> {
    const index = await this.readOnlyContract.getIndexOfActiveCondition(
      tokenId,
    );
    return await this.readOnlyContract.getClaimConditionAtIndex(tokenId, index);
  }

  public async getAllClaimConditions(tokenId: BigNumberish): Promise<any[]> {
    const claimCondition = await this.readOnlyContract.claimConditions(tokenId);
    const count = claimCondition.totalConditionCount.toNumber();
    const conditions = [];
    for (let i = 0; i < count; i++) {
      conditions.push(
        await this.readOnlyContract.getClaimConditionAtIndex(tokenId, i),
      );
    }
    return conditions;
  }

  public async getSaleRecipient(tokenId: BigNumberish): Promise<string> {
    const saleRecipient = await this.readOnlyContract.saleRecipient(tokenId);
    if (saleRecipient === AddressZero) {
      return this.readOnlyContract.defaultSaleRecipient();
    }
    return saleRecipient;
  }

  public async balanceOf(
    address: string,
    tokenId: BigNumberish,
  ): Promise<BigNumber> {
    return await this.readOnlyContract.balanceOf(address, tokenId);
  }

  public async balance(tokenId: BigNumberish): Promise<BigNumber> {
    return await this.balanceOf(await this.getSignerAddress(), tokenId);
  }
  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.readOnlyContract.isApprovedForAll(address, operator);
  }

  // write functions
  public async lazyMintBatch(metadatas: MetadataURIOrObject[]) {
    const startFileNumber = await this.readOnlyContract.nextTokenIdToMint();
    const baseUri = await this.storage.uploadMetadataBatch(
      metadatas,
      this.address,
      startFileNumber.toNumber(),
    );
    await this.sendTransaction("lazyMint", [metadatas.length, baseUri]);
  }

  public async setSaleRecipient(
    tokenId: BigNumberish,
    recipient: string,
  ): Promise<TransactionReceipt> {
    return this.sendTransaction("setSaleRecipient", [tokenId, recipient]);
  }

  public async setDefaultSaleRecipient(
    recipient: string,
  ): Promise<TransactionReceipt> {
    return this.sendTransaction("setDefaultSaleRecipient", [recipient]);
  }
  public async setApproval(
    operator: string,
    approved = true,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setApprovalForAll", [
      operator,
      approved,
    ]);
  }

  public async transfer(
    to: string,
    tokenId: BigNumberish,
    amount: BigNumberish,
    data: BytesLike = [0],
  ): Promise<TransactionReceipt> {
    const from = await this.getSignerAddress();
    return await this.sendTransaction(
      "safeTransferFrom(address,address,uint256)",
      [from, to, tokenId, amount, data],
    );
  }

  /**
   * Sets public claim conditions for the next minting using the
   * claim condition factory.
   *
   * @param factory - The claim condition factory.
   */
  public async setClaimCondition() {
    // factory: ClaimConditionFactory, //tokenId: BigNumberish,
    /*
    TODO
    const conditions = factory.buildConditions();

    const merkleInfo: { [key: string]: string } = {};
    factory.allSnapshots().forEach((s) => {
      merkleInfo[s.merkleRoot] = s.snapshotUri;
    });

    const { metadata } = await this.getMetadata();
    invariant(metadata, "Metadata is not set, this should never happen");
    metadata["merkle"] = merkleInfo;

    const metatdataUri = await this.storage.upload(JSON.stringify(metadata));

    const encoded = [
      this.contract.interface.encodeFunctionData("setContractURI", [
        metatdataUri,
      ]),
      this.contract.interface.encodeFunctionData("setClaimConditions", [
        tokenId,
        conditions,
      ]),
    ];
    return await this.sendTransaction("multicall", [encoded]);
    */
  }

  /**
   * Creates a claim condition factory
   *
   * @returns - A new claim condition factory
   */
  public getClaimConditionFactory(): ClaimConditionFactory {
    const createSnapshotFunc = this.sdk.createSnapshot.bind(this.sdk);
    const factory = new ClaimConditionFactory(createSnapshotFunc);
    return factory;
  }

  /**
   * @deprecated - Use the ClaimConditionFactory instead.
   */
  public async setPublicClaimConditions(
    tokenId: BigNumberish,
    conditions: BundleDropCreateClaimCondition[],
  ) {
    const _conditions = conditions.map((c) => ({
      startTimestamp: c.startTimestamp || 0,
      maxClaimableSupply: c.maxClaimableSupply,
      supplyClaimed: 0,
      quantityLimitPerTransaction:
        c.quantityLimitPerTransaction || c.maxClaimableSupply,
      waitTimeInSecondsBetweenClaims: c.waitTimeInSecondsBetweenClaims || 0,
      pricePerToken: c.pricePerToken || 0,
      currency: c.currency || AddressZero,
      merkleRoot: c.merkleRoot || hexZeroPad([0], 32),
    }));
    await this.sendTransaction("setClaimConditions", [tokenId, _conditions]);
  }

  public async claim(
    tokenId: BigNumberish,
    quantity: BigNumberish,
    proofs: BytesLike[] = [hexZeroPad([0], 32)],
  ) {
    const mintCondition = await this.getActiveClaimCondition(tokenId);
    const overrides = (await this.getCallOverrides()) || {};
    if (mintCondition.pricePerToken > 0) {
      if (mintCondition.currency === AddressZero) {
        overrides["value"] = BigNumber.from(mintCondition.pricePerToken).mul(
          quantity,
        );
      } else {
        const erc20 = ERC20__factory.connect(
          mintCondition.currency,
          this.providerOrSigner,
        );
        const owner = await this.getSignerAddress();
        const spender = this.address;
        const allowance = await erc20.allowance(owner, spender);
        const totalPrice = BigNumber.from(mintCondition.pricePerToken).mul(
          BigNumber.from(quantity),
        );

        if (allowance.lt(totalPrice)) {
          await this.sendContractTransaction(erc20, "approve", [
            spender,
            allowance.add(totalPrice),
          ]);
        }
      }
    }
    await this.sendTransaction("claim", [tokenId, quantity, proofs], overrides);
  }

  public async burn(
    tokenId: BigNumberish,
    amount: BigNumberish,
  ): Promise<TransactionReceipt> {
    const account = await this.getSignerAddress();
    return await this.sendTransaction("burn", [account, tokenId, amount]);
  }

  public async transferFrom(
    from: string,
    to: string,
    tokenId: BigNumberish,
    amount: BigNumberish,
    data: BytesLike = [0],
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("transferFrom", [
      from,
      to,
      tokenId,
      amount,
      data,
    ]);
  }

  // owner functions
  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await this.storage.uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async setRoyaltyBps(amount: number): Promise<TransactionReceipt> {
    // TODO: reduce this duplication and provide common functions around
    // royalties through an interface. Currently this function is
    // duplicated across 4 modules
    const { metadata } = await this.getMetadata();
    const encoded: string[] = [];
    if (!metadata) {
      throw new Error("No metadata found, this module might be invalid!");
    }

    metadata.seller_fee_basis_points = amount;
    const uri = await this.storage.uploadMetadata(
      {
        ...metadata,
      },
      this.address,
      await this.getSignerAddress(),
    );
    encoded.push(
      this.contract.interface.encodeFunctionData("setRoyaltyBps", [amount]),
    );
    encoded.push(
      this.contract.interface.encodeFunctionData("setContractURI", [uri]),
    );
    return await this.sendTransaction("multicall", [encoded]);
  }

  public async setRestrictedTransfer(
    restricted: boolean,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }

  /**
   * Gets the royalty BPS (basis points) of the contract
   *
   * @returns - The royalty BPS
   */
  public async getRoyaltyBps(): Promise<BigNumberish> {
    return await this.readOnlyContract.royaltyBps();
  }

  /**
   * Gets the address of the royalty recipient
   *
   * @returns - The royalty BPS
   */
  public async getRoyaltyRecipientAddress(): Promise<string> {
    const metadata = await this.getMetadata();
    if (metadata.metadata?.fee_recipient !== undefined) {
      return metadata.metadata.fee_recipient;
    }
    return "";
  }
}