/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export interface CyanFactoryInterface extends utils.Interface {
  functions: {
    "getOrDeployWallet(address)": FunctionFragment;
    "getOwnerWallet(address)": FunctionFragment;
    "getRouter()": FunctionFragment;
    "getWalletOwner(address)": FunctionFragment;
    "initialize(address)": FunctionFragment;
    "predictDeterministicAddress(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getOrDeployWallet"
      | "getOwnerWallet"
      | "getRouter"
      | "getWalletOwner"
      | "initialize"
      | "predictDeterministicAddress"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getOrDeployWallet",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getOwnerWallet",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "getRouter", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getWalletOwner",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "predictDeterministicAddress",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "getOrDeployWallet",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getOwnerWallet",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getRouter", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getWalletOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "predictDeterministicAddress",
    data: BytesLike
  ): Result;

  events: {
    "FactoryCreated(address)": EventFragment;
    "Initialized(uint8)": EventFragment;
    "WalletCreated(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FactoryCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "WalletCreated"): EventFragment;
}

export interface FactoryCreatedEventObject {
  router: string;
}
export type FactoryCreatedEvent = TypedEvent<
  [string],
  FactoryCreatedEventObject
>;

export type FactoryCreatedEventFilter = TypedEventFilter<FactoryCreatedEvent>;

export interface InitializedEventObject {
  version: number;
}
export type InitializedEvent = TypedEvent<[number], InitializedEventObject>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export interface WalletCreatedEventObject {
  owner: string;
  wallet: string;
}
export type WalletCreatedEvent = TypedEvent<
  [string, string],
  WalletCreatedEventObject
>;

export type WalletCreatedEventFilter = TypedEventFilter<WalletCreatedEvent>;

export interface CyanFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: CyanFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getOrDeployWallet(
      owner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getOwnerWallet(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getRouter(overrides?: CallOverrides): Promise<[string]>;

    getWalletOwner(
      wallet: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    initialize(
      router: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    predictDeterministicAddress(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string] & { predicted: string }>;
  };

  getOrDeployWallet(
    owner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getOwnerWallet(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  getRouter(overrides?: CallOverrides): Promise<string>;

  getWalletOwner(
    wallet: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  initialize(
    router: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  predictDeterministicAddress(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    getOrDeployWallet(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    getOwnerWallet(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    getRouter(overrides?: CallOverrides): Promise<string>;

    getWalletOwner(
      wallet: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    initialize(
      router: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    predictDeterministicAddress(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    "FactoryCreated(address)"(router?: null): FactoryCreatedEventFilter;
    FactoryCreated(router?: null): FactoryCreatedEventFilter;

    "Initialized(uint8)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;

    "WalletCreated(address,address)"(
      owner?: null,
      wallet?: null
    ): WalletCreatedEventFilter;
    WalletCreated(owner?: null, wallet?: null): WalletCreatedEventFilter;
  };

  estimateGas: {
    getOrDeployWallet(
      owner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getOwnerWallet(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRouter(overrides?: CallOverrides): Promise<BigNumber>;

    getWalletOwner(
      wallet: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      router: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    predictDeterministicAddress(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getOrDeployWallet(
      owner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getOwnerWallet(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRouter(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getWalletOwner(
      wallet: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(
      router: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    predictDeterministicAddress(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
