import { BigNumber } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

export type ICyanSDKConstructor = {
    host: string;
    apiKey: string;
    provider: Web3Provider;
};

export const chains = ['mainnet', 'goerli', 'polygon', 'mumbai', 'arbitrum', 'bsc', 'optimism'] as const;
export type IChain = typeof chains[keyof typeof chains];

const statusType = {
    Pending: 0,
    Funded: 1,
    Activated: 2,
};
export type IPlanStatus = typeof statusType[keyof typeof statusType];

export enum AutoRepayStatus {
    Disabled = 0,
    Active = 1,
}

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
};
export type IItemWithPrice = IItem & {
    price: BigNumber;
};
export type IPricerStep1 = {
    request: {
        wallet?: string;
        chain: IChain;
        currencyAddress: string;
        items: IItem[];
    };
    response: {
        items: {
            interestRate: number;
            price: BigNumber;
        }[];
        config: number[][];
    };
};

export type IPricerStep2 = {
    request: {
        chain: IChain;
        items: IItem[];
        currencyAddress: string;
        option: number[];
        autoRepayStatus: 0 | 1;
        wallet: string;
    };
    response: {
        plans: Errored<{
            planId: number;
            signature: string;
            interestRate: number;
            price: BigNumber;
            vaultAddress: string;
            marketName: string;
        }>[];
        blockNumber: number;
    };
};

export type ISdkPricerStep1 = {
    result: {
        items: (IItemWithPrice & { interestRate: number })[];
        options: IOption[];
    };
};

export type ISdkPricerStep2 = {
    params: {
        wallet: string;
        items: IItemWithPrice[];
        option: IOption;
        currencyAddress: string;
        autoRepayStatus: AutoRepayStatus;
    };
    result: Errored<ICreatePlanParams & { isChanged: boolean; marketName: string }>[];
};
