import { BigNumber, BigNumberish } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

export type ICyanSDKConstructor = {
    host: string;
    apiKey: string;
    provider: Web3Provider;
};

export const chains = ['mainnet', 'goerli', 'sepolia', 'polygon', 'mumbai', 'arbitrum', 'bsc', 'optimism'] as const;
export type IChain = typeof chains[keyof typeof chains];

export const PlanTypes = {
    bnpl: 0,
    pawn: 1,
} as const;
export type IPlanType = typeof PlanTypes[keyof typeof PlanTypes];

type IGetCollectionsMaxLtvsParams = {
    planType: IPlanType;
    chain: IChain;
};

type ICollectionsWithMaxLtvs = {
    address: string;
    maxLtvs: {
        currencyAddress: string;
        maxLtv: number;
    }[];
}[];

export type IGetCollectionsMaxLtvs = {
    params: IGetCollectionsMaxLtvsParams;
    result: ICollectionsWithMaxLtvs;
};

const statusType = {
    Pending: 0,
    Funded: 1,
    Activated: 2,
};
export type IPlanStatus = typeof statusType[keyof typeof statusType];

export enum AutoRepayStatus {
    Disabled = 0,
    FromCyanWallet = 1,
    FromMainWallet = 2,
}

export type IPricerMethod = number[];

export type ICurrency = {
    symbol: string;
    address: string;
    decimal: number;
};

export type IPlan = {
    planId: number;
    owner: string;
    totalNumOfPayments: number;
    currentNumOfPayments: number;
    status: IPlanStatus;
    type: 'bnpl' | 'pawn';
    wrapperAddress: string;
    paymentPlanContractAddress: string;
    collectionAddress: string;
    autoRepayStatus: AutoRepayStatus;
    tokenId: string;
    tokenAmount: number;
    currency: ICurrency;
    tokenType: ItemType;
};

export type FnGetExpectedPlanSync = {
    params: {
        amount: BigNumber;
        downpaymentRate: number;
        interestRate: number;
        serviceFeeRate: number;
        totalNumberOfPayments: number;
    };
    result: {
        downpaymentAmount: BigNumber;
        totalInterestFee: BigNumber;
        totalServiceFee: BigNumber;
        monthlyAmount: BigNumber;
        totalAmount: BigNumber;
    };
};

export enum ItemType {
    ERC721 = 1,
    ERC1155 = 2,
    CryptoPunks = 3,
}

export type IConfigs = {
    factoryContracts: {
        chainId: number;
        address: string;
    }[];
    paymentPlanContracts: {
        chainId: number;
        address: string;
        abiName: 'PaymentPlanV1' | 'PaymentPlanV2';
        isActive: boolean;
    }[];
    supportedCollections: {
        address: string;
        currencies: string[];
    }[];
    cyanConduitAddresses: {
        chainId: number;
        address: string;
    }[];
};

export type IOption = {
    term: number;
    loanRate: number;
    totalNumberOfPayments: number;
    interestRate: number;
    serviceFeeRate: number;
    downpaymentRate: number;
    counterPaidPayments: number;
    downpaymentAmount: BigNumber;
    monthlyAmount: BigNumber;
};

export type ICreatePlanParams = {
    item: {
        amount: number;
        tokenId: string;
        contractAddress: string;
        cyanVaultAddress: string;
        itemType: ItemType;
    };
    plan: {
        amount: BigNumber;
        downPaymentPercent: number;
        interestRate: number;
        serviceFeeRate: number;
        term: number;
        totalNumberOfPayments: number;
        counterPaidPayments: number;
        autoRepayStatus: AutoRepayStatus;
    };
    planId: number;
    blockNum: number;
    signature: string;
};

export type Errored<T> = T | { error: string };

export type ICreateAcceptance = {
    planIds: number[];
    signature: string;
};

export type IItem = {
    address: string;
    tokenId: string;
    itemType: ItemType;
    amount: number;
    isAutoLiquidated: boolean;
    existingPlanId?: number;
    privateSaleId?: number;
};
export type IItemWithPrice = IItem & {
    price: {
        amount: BigNumber;
        currency: string;
    };
};
export type IPricerStep1 = {
    request: {
        wallet?: string;
        chain: IChain;
        currencyAddress: string;
        items: Array<
            IItem & {
                price?: IItemWithPrice['price'];
            }
        >;
    };
    response: {
        items: {
            vaultId: number;
            interestRate: number;
            price: string;
            config: IPricerMethod[];
        }[];
    };
};

export type IPricerStep2 = {
    request: {
        items: Array<
            IItem & {
                option: number[];
            }
        >;
        chain: IChain;
        currencyAddress: string;
        autoRepayStatus: AutoRepayStatus;
        wallet: string;
    };
    response: {
        plans: Errored<{
            planId: number;
            signature: string;
            price: string;
            interestRate: number;
            vaultAddress: string;
            marketName?: string;
        }>[];
        blockNumber: number;
    };
};

export type ISdkPricerStep1 = {
    result: {
        items: Array<IItem & { price: BigNumber; interestRate: number; options: IOption[] }>;
    };
};

export type ISdkPricerStep2 = {
    params: {
        wallet: string;
        items: Array<IItem & { price: BigNumber; option: IOption; existingPlanId?: number; privateSaleId?: number }>;
        currencyAddress: string;
        autoRepayStatus: AutoRepayStatus;
    };
    result: Errored<ICreatePlanParams & { isChanged: boolean; marketName?: string }>[];
};

export type IOffer = {
    hash: string;
    contract: string;
    price: {
        currency: {
            contract: string;
            decimals: number;
            symbol: string;
            name: string;
        };
        amount: {
            raw: string;
            decimal: number;
        };
        netAmount: {
            raw: string;
            decimal: number;
        };
    };
    validUntil: number;
};

export type IGetCollectionTopBid = {
    request: { chain: IChain; tokenId?: string; collectionAddress: string };
    result: IOffer[];
};

enum OrderType {
    FULL_OPEN = 0, // No partial fills, anyone can execute
    PARTIAL_OPEN = 1, // Partial fills supported, anyone can execute
    FULL_RESTRICTED = 2, // No partial fills, only offerer or zone can execute
    PARTIAL_RESTRICTED = 3, // Partial fills supported, only offerer or zone can execute
}

type OfferItem = {
    itemType: ItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
};
type ConsiderationItem = {
    itemType: ItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
    recipient: string;
};

type OrderParameters = {
    offerer: string;
    zone: string;
    orderType: OrderType;
    startTime: BigNumberish;
    endTime: BigNumberish;
    zoneHash: string;
    salt: string;
    offer: OfferItem[];
    consideration: ConsiderationItem[];
    totalOriginalConsiderationItems: BigNumberish;
    conduitKey: string;
};
type MatchOrdersFulfillmentComponent = {
    orderIndex: number;
    itemIndex: number;
};

export type IFulfillOffer = {
    request: {
        chain: IChain;
        planId: number;
        offerHash: string;
    };
    result: {
        orders: {
            parameters: OrderParameters;
            signature: string;
            extraData: string;
            denominator: number;
            numerator: number;
        }[];
        fulfillments: {
            offerComponents: MatchOrdersFulfillmentComponent[];
            considerationComponents: MatchOrdersFulfillmentComponent[];
        }[];
        criteriaResolvers: {
            orderIndex: string;
            side: number;
            index: string;
            identifier: string;
            criteriaProof: string[];
        }[];
        recipient: string;
    };
};
