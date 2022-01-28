import { IStorage } from "./../../interfaces/IStorage";
import { TWFactory, TWFactory__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { TW_FACTORY_ADDRESS } from "../../constants/addresses";
import { NetworkOrSignerOrProvider, ValidModuleClass } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { z } from "zod";
import { MODULES_MAP } from "../../modules";

export class ModuleFactory extends ContractWrapper<TWFactory> {
  private storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    storage: IStorage,
    options?: SDKOptions,
  ) {
    super(network, TW_FACTORY_ADDRESS, TWFactory__factory.abi, options);
    this.storage = storage;
  }

  public async deploy<TModule extends ValidModuleClass>(
    moduleType: TModule["moduleType"],
    moduleMetadata: z.input<TModule["schema"]["deploy"]>,
  ) {
    const metadata =
      MODULES_MAP[moduleType].schema.deploy.parse(moduleMetadata);
    const contractURI = await this.storage.uploadMetadata(
      metadata,
      this.readContract.address,
      await this.getSigner()?.getAddress(),
    );
    console.debug("getModuleAddresses", moduleType, contractURI);
  }
}
