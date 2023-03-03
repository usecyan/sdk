import { BigNumber } from 'ethers';

type typeEnum = 'address' | 'uint256' | 'uint8' | 'bytes';

const statusType = {
    Pending: 0,
    Funded: 1,
    Activated: 2,
};
export type IPlanStatus = typeof statusType[keyof typeof statusType];

interface IAbiFnInput {
    internalType: typeEnum;
    name: string;
    type: typeEnum;
}

interface IAbiFn {
    inputs: Array<IAbiFnInput>;
    name: string;
    outputs?: Array<IAbiFnInput>;
    stateMutability: 'payable' | 'view' | 'nonpayable';
    type: 'function';
}

export interface IAbi {
    sampleERC721: {
        approve: IAbiFn;
        getApproved: IAbiFn;
    };
    createBNPLPaymentPlan: IAbiFn;
    createPAWNPaymentPlan: IAbiFn;
    getNextPayment: IAbiFn;
    pay: IAbiFn;
}

export interface IPlan {
    owner: string;
    totalNumOfPayments: number;
    currentNumOfPayments: number;
    status: IPlanStatus;
    type: 'bnpl' | 'pawn';
    wNFTContract: string;
    wNFTTokenId: string;
    paymentPlanContractAddress: string;
    collectionAddress: string;
}

export interface IExpectedPaymentPlan {
    interestFee: BigNumber;
    serviceFee: BigNumber;
    downpaymentAmount: BigNumber;
    totalPaymentAmount: BigNumber;
    totalFinancingAmount?: BigNumber;
}

export interface IBnplPrice extends IExpectedPaymentPlan {
    vaultId: number;
    tokenId: string;
    collectionName: string;
    wrapperAddress: string;
    signature: string;
    lastBlockNum: number;
    totalNumOfPayments: number;
    term: number;
    image: string;
    downpaymentRate: number;
    interestRate: number;
    interestRateApr: number;
    serviceFeeRate: number;
    price: BigNumber;
    currency: string;
    couponDiscountRate: number;
}

export interface IPawnPrice extends IExpectedPaymentPlan {
    signature: string;
    lastBlockNum: number;
    unlockAmount: BigNumber;
    totalNumOfPayments: number;
    appraisalValue: BigNumber;
    term: number;

    tokenId: string;
    vaultId: number;
    wrapperAddress: string;
    collectionName: string;
    interestRate: number;
    interestRateApr: number;
    serviceFeeRate: number;
    couponDiscountRate: number;
}

export interface IPlanInput {
    address: string;
    tokenId: string;
}

export interface ISDKResponse<T> {
    abi: IAbi;
    data: T;
    paymentPlanContractAddress: string;
}

export interface IPawnParams {
    term: string;
    totalNumOfPayments: string;
    weight: string;
    wallet: string;
}

export interface INFT {
    address: string;
    tokenId: string;
}

export interface IAppraisal {
    address: string;
    tokenId: string;
    wrapperAddress: string;
    collectionName: string;
    appraisalValue: string;
}

export interface IAppraisalError {
    message: 'Error: Project is not supported yet.';
}

export const chains = ['mainnet', 'goerli', 'polygon', 'mumbai', 'arbitrum', 'bsc', 'optimism'] as const;
export type IChain = typeof chains[keyof typeof chains];

export interface FnAcceptanceInput {
    signature: string;
    counterPaidPayments: number;
    wrapperAddress: string;
    tokenId: string;
    term: number;
    amount: string;
    totalNumOfPayments: number;
    interestRate: number;
    serviceFeeRate: number;
    blockNum: number;
    pricerSignature: string;
    wallet: string;
}
