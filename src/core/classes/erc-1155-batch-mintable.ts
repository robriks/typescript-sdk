import { ContractWrapper } from "./contract-wrapper";
import { IMintableERC1155, IMulticall } from "contracts";
import { TransactionResultWithId } from "../types";
import { BaseERC1155 } from "../../types/eips";
import { Erc1155 } from "./erc-1155";
import { EditionMetadata, EditionMetadataOrUri } from "../../schema";
import { uploadOrExtractURIs } from "../../common/nft";
import { ethers } from "ethers";
import { TokensMintedEvent } from "contracts/TokenERC1155";
import { IStorage } from "../interfaces";

export class Erc1155BatchMintable {
  private contractWrapper: ContractWrapper<IMintableERC1155 & IMulticall>;
  private erc1155: Erc1155<BaseERC1155>;
  private storage: IStorage;

  constructor(
    erc1155: Erc1155<BaseERC1155>,
    contractWrapper: ContractWrapper<IMintableERC1155 & IMulticall>,
    storage: IStorage,
  ) {
    this.erc1155 = erc1155;
    this.contractWrapper = contractWrapper;
    this.storage = storage;
  }

  /**
   * Mint Many NFTs with limited supplies
   *
   * @remarks Mint many different NFTs with limited supplies to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}"
   *
   * // Custom metadata and supplies of your NFTs
   * const metadataWithSupply = [{
   *   supply: 50, // The number of this NFT you want to mint
   *   metadata: {
   *     name: "Cool NFT #1",
   *     description: "This is a cool NFT",
   *     image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   *   },
   * }, {
   *   supply: 100,
   *   metadata: {
   *     name: "Cool NFT #2",
   *     description: "This is a cool NFT",
   *     image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   *   },
   * }];
   *
   * const tx = await contract.mintBatchTo(toAddress, metadataWithSupply);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async to(
    to: string,
    metadataWithSupply: EditionMetadataOrUri[],
  ): Promise<TransactionResultWithId<EditionMetadata>[]> {
    const metadatas = metadataWithSupply.map((a) => a.metadata);
    const supplies = metadataWithSupply.map((a) => a.supply);
    const uris = await uploadOrExtractURIs(metadatas, this.storage);
    const encoded = uris.map((uri, index) =>
      this.contractWrapper.readContract.interface.encodeFunctionData("mintTo", [
        to,
        ethers.constants.MaxUint256,
        uri,
        supplies[index],
      ]),
    );
    const receipt = await this.contractWrapper.multiCall(encoded);
    const events = this.contractWrapper.parseLogs<TokensMintedEvent>(
      "TokensMinted",
      receipt.logs,
    );
    if (events.length === 0 || events.length < metadatas.length) {
      throw new Error("TokenMinted event not found, minting failed");
    }
    return events.map((e) => {
      const id = e.args.tokenIdMinted;
      return {
        id,
        receipt,
        data: () => this.erc1155.get(id),
      };
    });
  }
}