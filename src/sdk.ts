import { BigNumber, Contract, ContractTransaction, ethers, utils } from 'ethers';
import SampleERC721 from './abi/SampleERC721';
import { CyanAPI } from './api';

import {
    IAbi,
    IBnplPrice,
    INFT,
    IPawnPrice,
    IPawnParams,
    IPlan,
    IPlanInput,
    ISDKResponse,
    IAppraisal,
    IAppraisalError,
    IChain,
} from './types';
import { createHashSHA256 } from './utils';

export class CyanSDK {
    private provider: ethers.providers.Web3Provider;
    private api: CyanAPI;
    private abi: IAbi;
    private paymentPlanContractAddress: string;

    constructor({ host, apiKey, provider }: { host: string; apiKey: string; provider: ethers.providers.Web3Provider }) {
        this.provider = provider;
        this.api = new CyanAPI(apiKey, host);
    }

    /**
     * Retrieves BNPL pricing data for multiple NFTs in one request.
     * This endpoint accepts an array of NFT collection addresses and token IDs.
     * @param chain Chain slug
     * @param nfts Array of NFTs
     * @param wallet User wallet address
     * @returns Array of IBnplPrice
     */
    public async getBnplPrices(chain: IChain, nfts: IPlanInput[], wallet?: string): Promise<IBnplPrice[]> {
        const { abi, data, paymentPlanContractAddress } = await this.api.getBnplPrices(chain, nfts, wallet);

        this.abi = abi;
        this.paymentPlanContractAddress = paymentPlanContractAddress;
        return data;
    }

    /**
     * Retrieves PAWN appraisal data for multiple NFTs in one request. This endpoint accepts an array of NFT collection addresses and token IDs.
     * @param chain Chain slug
     * @param nfts Array of NFTs
     * @returns Array of IAppraisal or IAppraisalError
     */
    public async getPawnAppraisals(chain: IChain, nfts: INFT[]): Promise<(IAppraisal | IAppraisalError)[]> {
        return await this.api.getPawnAppraisals(chain, nfts);
    }

    /**
     * Retrieve pricing data for a single PAWN request. This endpoint prices out a plan to post the NFT as collateral and receive a loan in ETH.
     * @param chain Chain slug
     * @param address NFT Collection address
     * @param tokenId NFT id
     * @param params {weight, totalNumOfPayments, term, wallet }
     * @returns IPawnPrice
     */
    public async getPawnPrice(
        chain: IChain,
        address: string,
        tokenId: string,
        params: IPawnParams
    ): Promise<IPawnPrice> {
        const { data, abi, paymentPlanContractAddress } = await this.api.getPawnPrice(chain, address, tokenId, params);
        this.abi = abi;
        this.paymentPlanContractAddress = paymentPlanContractAddress;
        return data;
    }

    /**
     * Retrieve Plan details for an already executed BNPL or PAWN plan.
     * @param address NFT Collection address
     * @param tokenId NFT id
     * @returns IPlan
     */
    public async getPlan(address: string, tokenId: string): Promise<IPlan> {
        const { abi, data } = await this.api.getPlan(address, tokenId);
        this.abi = abi;
        return data;
    }

    /**
     * Retrieve BNPL or Pawn plans, by user, which are Activated, Funded or in Pending status.
     * @param address User wallet address
     * @returns Array of IPlan
     */
    public async getUserPlans(address: string): Promise<IPlan[]> {
        const { abi, data }: ISDKResponse<IPlan[]> = await this.api.getUserPlans(address);
        this.abi = abi;
        return data;
    }

    /**
     * Accept plan info
     * @param chain Chain slug
     * @param data IBnplPrice or IPawnPrice
     * @param wallet User wallet address
     */
    public async acceptPlanInfo(chain: IChain, data: IBnplPrice | IPawnPrice, wallet: string): Promise<void> {
        const price = 'unlockAmount' in data ? data.unlockAmount : data.price;
        const counterPaidPayments = 'unlockAmount' in data ? 0 : 1;
        const signature = await this.getAcceptanceSignature(data, wallet);

        await this.api.createAcceptance(chain, {
            signature,
            counterPaidPayments,
            wrapperAddress: data.wrapperAddress,
            tokenId: data.tokenId,
            term: data.term,
            amount: price.toString(),
            totalNumOfPayments: data.totalNumOfPayments,
            blockNum: data.lastBlockNum,
            interestRate: data.interestRate,
            serviceFeeRate: data.serviceFeeRate,
            pricerSignature: data.signature,
            wallet,
        });
    }

    /**
     * Get Acceptance Signature
     * @param data IBnplPrice or IPawnPrice
     * @param wallet User wallet address
     */
    public async getAcceptanceSignature(data: IPawnPrice | IBnplPrice, wallet: string): Promise<string> {
        const signer = this.provider.getSigner();
        const price = 'unlockAmount' in data ? data.unlockAmount : data.price;
        const counterPaidPayments = 'unlockAmount' in data ? 0 : 1;

        const nonce = await createHashSHA256(
            [
                data.tokenId,
                data.wrapperAddress,
                price.toString(),
                data.term,
                data.totalNumOfPayments,
                counterPaidPayments,
                data.lastBlockNum,
                data.interestRate,
                data.serviceFeeRate,
                data.signature,
                wallet,
            ].join('.')
        );

        const message = `
You are accepting following info:

Token ID: ${data.tokenId}
Amount: ${utils.formatEther(price)} ETH
Number of payments: ${data.totalNumOfPayments}
Paid payments: ${counterPaidPayments}
Interest Rate: ${(data.interestRate / 100).toFixed(2)} %
Service Fee Rate: ${(data.serviceFeeRate / 100).toFixed(2)} %
Your wallet: ${wallet}

Your Nonce: ${nonce}
`;
        return await signer.signMessage(message);
    }

    /**
     * Retrieve the next payment information with the returned result of getPlan
     * @param plan Plan
     * @returns Next payment data
     */
    public async getNextPayment(
        plan: IPlan
    ): Promise<{
        payAmountForCollateral: string;
        payAmountForInterest: string;
        payAmountForService: string;
        currentPayment: string;
        nextPaymentDate?: Date;
    }> {
        this.paymentPlanContractAddress = plan.paymentPlanContractAddress;
        const contract = new Contract(plan.paymentPlanContractAddress, Object.values(this.abi), this.provider);

        const inputs = this.parseInputs(this.abi.getNextPayment.inputs, plan);

        const [
            payAmountForCollateral,
            payAmountForInterest,
            payAmountForService,
            currentPayment,
            nextPaymentDate,
        ] = await contract.getNextPayment.apply(null, inputs);

        return {
            payAmountForCollateral: payAmountForCollateral.toString(),
            payAmountForInterest: payAmountForInterest.toString(),
            payAmountForService: payAmountForService.toString(),
            currentPayment: currentPayment.toString(),
            nextPaymentDate: new Date(nextPaymentDate.toNumber() * 1000),
        };
    }

    /**
     * Creates BNPL Plan with the given calculated data from @getBnplPrices
     * @param calculatedData IBnplPrice
     * @returns transaction
     */
    public async createBnpl(calculatedData: IBnplPrice): Promise<ContractTransaction> {
        const signer = this.provider.getSigner();
        const contract = new Contract(this.paymentPlanContractAddress, Object.values(this.abi), signer);

        const { wrapperAddress, tokenId, price, lastBlockNum, totalNumOfPayments, ...rest } = calculatedData;

        const data = {
            wNFTContract: wrapperAddress,
            wNFTTokenId: tokenId,
            amount: price,
            signedBlockNum: lastBlockNum,
            totalNumberOfPayments: totalNumOfPayments,
            ...rest,
        };

        const inputs = this.parseInputs(this.abi.createBNPLPaymentPlan.inputs, data);

        inputs.push({ value: data.downpaymentAmount });

        const tx = await contract.createBNPLPaymentPlan.apply(null, inputs);
        await tx.wait();
        return tx;
    }

    /**
     * Creates Pawn Plan with the given calculated data from @getPawnPrice
     * @param calculatedData Return value of @getPawnPrice
     * @returns transaction
     */
    public async createPawn(calculatedData: IPawnPrice): Promise<ContractTransaction> {
        const signer = this.provider.getSigner();
        const contract = new Contract(this.paymentPlanContractAddress, Object.values(this.abi), signer);

        const { wrapperAddress, tokenId, unlockAmount, lastBlockNum, totalNumOfPayments, ...rest } = calculatedData;

        const data = {
            wNFTContract: wrapperAddress,
            wNFTTokenId: tokenId,
            amount: unlockAmount,
            signedBlockNum: lastBlockNum,
            totalNumberOfPayments: totalNumOfPayments,
            ...rest,
        };

        const inputs = this.parseInputs(this.abi.createPAWNPaymentPlan.inputs, data);

        const tx = await contract.createPAWNPaymentPlan.apply(null, inputs);
        await tx.wait();
        return tx;
    }

    /**
     * Asks for NFT approval only if token has not given approval to Cyan wrapper contract
     * @param address NFT collection address
     * @param pawn Return value of @getPawnPrice
     * @returns boolean
     */
    public async getApproval(address: string, pawn: IPawnPrice): Promise<boolean> {
        const isWrapperApproved = await this.checkApproval(address, pawn);
        if (isWrapperApproved) {
            return true;
        }

        const signer = this.provider.getSigner();
        const inputs = this.parseInputs(SampleERC721.approve.inputs, {
            to: pawn.wrapperAddress,
            tokenId: pawn.tokenId,
        });
        const sampleContract = new Contract(address, Object.values(SampleERC721), signer);

        const tx = await sampleContract.approve.apply(null, inputs);
        await tx.wait();
        return true;
    }

    /**
     * Checks current token has given approval to Cyan wrapper contract
     * @param address NFT Collection address
     * @param pawn Return value of @getPawnPrice
     * @returns boolean
     */
    public async checkApproval(address: string, pawn: IPawnPrice): Promise<boolean> {
        const signer = this.provider.getSigner();
        const sampleContract = new Contract(address, Object.values(SampleERC721), signer);
        const inputs = this.parseInputs(SampleERC721.getApproved.inputs, {
            tokenId: pawn.tokenId,
        });
        const result = await sampleContract.getApproved.apply(null, inputs);
        return result.toLowerCase() === pawn.wrapperAddress.toLowerCase();
    }

    /**
     * Make the payment for the plan(BNPL or Pawn)
     * @param plan IPlan retrieved from backend.
     * @param amount Amount to pay, `currentPayment` field of @getNextPayment's result.
     * @returns transaction
     */
    public async pay(plan: IPlan, amount: BigNumber): Promise<ContractTransaction> {
        const signer = this.provider.getSigner();

        const contract = new Contract(plan.paymentPlanContractAddress, Object.values(this.abi), signer);

        const inputs = this.parseInputs(this.abi.pay.inputs, plan);
        inputs.push({ value: amount });

        const tx = await contract.pay.apply(null, inputs);
        await tx.wait();
        return tx;
    }

    /**
     * Maps the given data according to given object
     * @param obj ABI function inputs
     * @param data data need to be mapped
     * @returns mapped array.
     */
    private parseInputs(
        obj:
            | IAbi['createBNPLPaymentPlan']['inputs']
            | IAbi['createPAWNPaymentPlan']['inputs']
            | IAbi['getNextPayment']['inputs']
            | IAbi['pay']['inputs']
            | IAbi['sampleERC721']['approve']['inputs']
            | IAbi['sampleERC721']['getApproved']['inputs'],
        data: Record<string, number | string | BigNumber | any>
    ): any[] {
        const inputs = obj
            .map((input: { name: string; internalType: string; type: string }) => input.name)
            .map((i: keyof typeof data) => data[i]);
        return inputs;
    }

    /**
     * Sets paymentPlanContractAddress
     * @param paymentPlanContractAddress
     */
    public _setPaymentPlanContractAddress(paymentPlanContractAddress: string) {
        this.paymentPlanContractAddress = paymentPlanContractAddress;
    }

    /**
     * Sets abi
     * @param abi
     */
    public _setAbi(abi: IAbi) {
        this.abi = abi;
    }
}

export default CyanSDK;
