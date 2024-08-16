import { JsonRpcSigner } from '@ethersproject/providers';
import { BigNumber, constants as ethConsts, ContractTransaction, ethers } from 'ethers';

import { CyanAPI } from './api';
import {
    CyanFactory,
    PaymentPlanV2,
    CyanWallet,
    CyanFactory__factory as CyanFactoryFactory,
    PaymentPlanV2__factory as PaymentPlanV2Factory,
    CyanWallet__factory as CyanWalletFactory,
    ERC721__factory as ERC721Factory,
    ERC20__factory as ERC20Factory,
    ERC1155__factory as ERC1155Factory,
} from './contracts';
import { CyanError, NoWalletError } from './errors';

import {
    IPlan,
    IChain,
    ICyanSDKConstructor,
    ICreatePlanParams,
    IConfigs,
    ISdkPricerStep1,
    ISdkPricerStep2,
    IPricerStep2,
    IItem,
    IItemWithPrice,
    IOffer,
    ICurrency,
    ItemType,
    IGetCollectionsMaxLtvs,
    PlanTypes,
} from './types';
import {
    generateBnplOptions,
    generateNonce,
    generatePawnOptions,
    isNonErrored,
    typedDataDomain,
    typedDataTypes,
} from './utils';

export class CyanSDK {
    private signer: JsonRpcSigner;
    private api: CyanAPI;
    private configs: IConfigs;

    constructor({ host, apiKey, provider }: ICyanSDKConstructor) {
        this.signer = provider.getSigner();
        this.api = new CyanAPI(apiKey, host);
    }

    /**
     * Initiates Cyan SDK.
     */
    public static async initiate(args: ICyanSDKConstructor): Promise<CyanSDK> {
        const sdk = new CyanSDK(args);
        await sdk.configure();
        return sdk;
    }

    /**
     * Downloads and stores configs from Cyan API.
     * You should call this method before using any other methods.
     */
    public async configure(): Promise<IConfigs> {
        const configs = await this.api.getConfigs();
        this._setConfigs(configs);
        return configs;
    }

    /**
     * Performs the first step of pricing BNPLs and generating options from the response.
     * @param {string} currencyAddress The currency to use for BNPL.
     * @param {Array<IItem | IItemWithPrice>} items An array of objects representing the items to price.
     * @returns {Promise<ISdkPricerStep1['result']>} A Promise that resolves to an object containing the priced items and pricing options.
     */
    public async priceBnplsStep1(
        currencyAddress: string,
        items: Array<IItem | IItemWithPrice>
    ): Promise<ISdkPricerStep1['result']> {
        const chain = await this._getChain();
        const response = await this.api.priceBnplsStep1({ chain, items, currencyAddress });
        const options = generateBnplOptions(response);
        return {
            items: items.map((item, i) => ({
                ...item,
                ...response.items[i],
            })),
            options,
        };
    }

    /**
     * Performs the second step of pricing BNPLs.
     * @param {ISdkPricerStep2['params']} args - The pricing parameters
     * @returns {Promise<ISdkPricerStep2['result']>} The pricing result
     */
    public async priceBnplsStep2(args: ISdkPricerStep2['params']): Promise<ISdkPricerStep2['result']> {
        const response = await this.api.priceBnplsStep2(await this._buildStep2Request(args));
        return this._buildStep2Result({ ...args, ...response });
    }

    /**
     * Performs the first step of pricing Pawns and generating options from the response.
     * @param {string} currencyAddress The currency to use for BNPL.
     * @param {Array<IItem | IItemWithPrice>} items An array of objects representing the items to price.
     * @returns {Promise<ISdkPricerStep1['result']>} A Promise that resolves to an object containing the priced items and pricing options.
     */
    public async pricePawnsStep1(
        currencyAddress: string,
        items: Array<IItem | IItemWithPrice>
    ): Promise<ISdkPricerStep1['result']> {
        const chain = await this._getChain();
        const wallet = await this.signer.getAddress();
        const data = await this.api.pricePawnsStep1({ chain, items, currencyAddress, wallet });
        const options = generatePawnOptions(data);
        return {
            items: items.map((item, i) => ({
                ...item,
                ...data.items[i],
            })),
            options,
        };
    }

    /**
     * Performs the second step of pricing Pawns.
     * @param {ISdkPricerStep2['params']} args - The pricing parameters
     * @returns {Promise<ISdkPricerStep2['result']>} The pricing result
     */
    public async pricePawnsStep2(args: ISdkPricerStep2['params']): Promise<ISdkPricerStep2['result']> {
        const response = await this.api.pricePawnsStep2(await this._buildStep2Request(args));
        return this._buildStep2Result({ ...args, ...response });
    }

    /**
     * Accepts payment plans by signing a typed data message and sending it to the API.
     * @param {ICreatePlanParams[]} plans - Array of payment plan objects to accept.
     * @throws {CyanError} PaymentPlanContract not found. Please try reconfiguring the SDK.
     * @returns {Promise<void>}
     */
    public async acceptPlans(plans: ICreatePlanParams[]): Promise<void> {
        const chainId = await this.signer.getChainId();
        const _plans = plans.map(({ item, plan, planId, signature, blockNum }) => ({
            item: {
                itemType: item.itemType,
                amount: item.amount,
                tokenId: item.tokenId,
                contractAddress: item.contractAddress.toLowerCase(),
                cyanVaultAddress: item.cyanVaultAddress.toLowerCase(),
            },
            plan: {
                amount: plan.amount,
                term: plan.term,
                downPaymentPercent: plan.downPaymentPercent,
                interestRate: plan.interestRate,
                serviceFeeRate: plan.serviceFeeRate,
                totalNumberOfPayments: plan.totalNumberOfPayments,
                counterPaidPayments: plan.counterPaidPayments,
                autoRepayStatus: plan.autoRepayStatus,
            },
            autoRepayStatus: plan.autoRepayStatus,
            signature,
            planId,
            blockNum,
        }));

        const paymentPlanContract = await this.getPaymentPlanContract();
        if (!paymentPlanContract) {
            throw new CyanError('PaymentPlanContract not found. Please try reconfiguring the SDK.');
        }
        typedDataDomain.chainId = chainId;
        typedDataDomain.verifyingContract = paymentPlanContract.address;

        const nonce = await generateNonce(_plans);
        const value = { 'Payment Plans': _plans, nonce };
        const signature = await this.signer._signTypedData(typedDataDomain, typedDataTypes, value);
        await this.api.createAcceptance({ planIds: _plans.map(({ planId }) => planId), signature });
    }

    /**
     * Creates BNPL (Buy Now Pay Later) plans by calling the createBNPL function of the payment plan contract.
     * @param {string} currencyAddress The address of the currency to use for the BNPL plans.
     * @param {ICreatePlanParams[]} plans An array of objects containing the parameters for each plan to create.
     * @param {boolean} payFromCyanWallet Whether to pay the downpayment using the Cyan Wallet or not (only works for native currency)
     * @returns {Promise<ContractTransaction>} A Promise that resolves to a ContractTransaction object.
     */
    public async createBnpls(
        currencyAddress: string,
        plans: ICreatePlanParams[],
        payFromCyanWallet: boolean = false
    ): Promise<ContractTransaction> {
        const contract = await this.getPaymentPlanContract();
        const isNativeCurrency = currencyAddress === ethConsts.AddressZero;

        const createBnplTxns = [];
        let totalDownPayment = BigNumber.from(0);
        for (const plan of plans) {
            const data = contract.interface.encodeFunctionData('createBNPL', [
                plan.item,
                plan.plan,
                plan.planId,
                plan.blockNum,
                plan.signature,
            ]);
            const [downpayment] = await contract.getExpectedPlan(plan.plan);
            totalDownPayment = totalDownPayment.add(downpayment);

            const value = isNativeCurrency ? downpayment : 0;
            createBnplTxns.push({ to: contract.address, data, value });
        }

        if (!isNativeCurrency) {
            await this.checkAndAllowCurrencyForPlan(currencyAddress, totalDownPayment);
        }

        if (plans.length === 1) {
            return await this.signer.sendTransaction(createBnplTxns[0]);
        }

        const cyanWallet = await this.getOrCreateCyanWallet();
        const value = isNativeCurrency && !payFromCyanWallet ? totalDownPayment : 0;
        return await cyanWallet.executeBatch(createBnplTxns, { value });
    }

    /**
     * Creates pawn plans by calling the createPawn function of the payment plan contract.
     * @param {ICreatePlanParams[]} plans An array of objects containing the parameters for each plan to create.
     * @returns {Promise<ContractTransaction>} A Promise that resolves to a ContractTransaction object representing the transaction hash of the contract invocation.
     */
    public async createPawns(plans: ICreatePlanParams[]): Promise<ContractTransaction> {
        const paymentPlanContract = await this.getPaymentPlanContract();
        if (plans.length > 1) {
            const cyanWallet = await this.getOrCreateCyanWallet();
            const _getCreatePawnData = async (
                plan: ICreatePlanParams
            ): Promise<{ to: string; data: string; value: BigNumber }> => {
                const createPawnData = paymentPlanContract.interface.encodeFunctionData('createPawn', [
                    plan.item,
                    plan.plan,
                    plan.planId,
                    plan.blockNum,
                    plan.signature,
                ]);
                return { to: paymentPlanContract.address, data: createPawnData, value: BigNumber.from(0) };
            };
            return await cyanWallet.executeBatch(await Promise.all(plans.map(_getCreatePawnData)));
        }

        const plan = plans[0];
        return await paymentPlanContract.createPawn(plan.item, plan.plan, plan.planId, plan.blockNum, plan.signature);
    }

    /**
     * Checks if the user has allowed the Payment Plan Contract to spend the specified amount of the given currency, and approves it if not.
     * @param currencyAddress The address of the currency to be checked and allowed.
     * @param amount The amount of currency to be checked and allowed.
     * @returns Promise that resolves when the approval transaction has been confirmed.
     * @throws CyanError if PaymentPlanContract is not found.
     */
    public async checkAndAllowCurrencyForPlan(currencyAddress: string, amount: BigNumber): Promise<void> {
        const contract = ERC20Factory.connect(currencyAddress, this.signer);
        const cyanConduitAddress = await this._getConduitAddress();
        const wallet = await this.signer.getAddress();

        const userAllowance = await contract.allowance(wallet, cyanConduitAddress);
        if (userAllowance.gte(amount)) return;

        const tx = await contract.approve(cyanConduitAddress, amount);
        await tx.wait();
    }

    /**
     * Approve Payment Plan Contract to spend a specific ERC721 or ERC1155 token on behalf of the signer.
     * @param {string} address - The address of the ERC721 or ERC1155 contract.
     * @param {string} tokenId - The ID of the token to approve.
     * @returns {Promise<void>} - A Promise that resolves when the transaction is confirmed.
     * @throws {Error} - Throws an error if the PaymentPlan contract is not found or if the transaction fails.
     */
    public async getApproval(address: string, tokenId: string, tokenType: ItemType = ItemType.ERC721): Promise<void> {
        const cyanWallet = await this.getCyanWallet();
        let tx: ContractTransaction | undefined = undefined;
        const approvalAddress = await this._getConduitAddress();

        if (tokenType === ItemType.ERC1155) {
            const erc1155Contract = ERC1155Factory.connect(address, this.signer);
            const balanceOf = await erc1155Contract.balanceOf(this.signer.getAddress(), tokenId);
            if (balanceOf.eq(0)) return;

            const isApprovedForAll = await erc1155Contract.isApprovedForAll(this.signer.getAddress(), approvalAddress);
            if (isApprovedForAll) return;
            tx = await erc1155Contract.setApprovalForAll(approvalAddress, true);
        } else if (tokenType === ItemType.ERC721) {
            const erc721Contract = ERC721Factory.connect(address, this.signer);
            const ownerOf = await erc721Contract.ownerOf(tokenId);
            if (ownerOf.toLowerCase() === cyanWallet.address.toLowerCase()) return;
            const isApprovedForAll = await erc721Contract.isApprovedForAll(this.signer.getAddress(), approvalAddress);
            if (isApprovedForAll) return;
            const approvedTo = await erc721Contract.getApproved(tokenId);

            if (approvedTo.toLowerCase() === approvalAddress.toLowerCase()) return;
            tx = await erc721Contract.setApprovalForAll(approvalAddress, true);
        } else {
            throw new Error(`Not supported token type ${tokenType}`);
        }
        await tx.wait();
        return;
    }

    /**
     * Get the following payment information for a payment plan
     * @param {IPlan} plan - The payment plan object
     * @param {boolean} [isEarlyRepayment=false] - Optional flag to indicate if this is early repayment or not
     * @returns {Promise<Object>} An object containing payment information
     * @throws {Error} Throws an error if the payment plan contract cannot be found or if there is an issue getting payment information
     */
    public async getPaymentInfo(
        plan: { planId: number; paymentPlanContractAddress: string },
        isEarlyRepayment: boolean = false
    ): Promise<{
        payAmountForCollateral: string;
        payAmountForInterest: string;
        payAmountForService: string;
        currentPayment: string;
        dueDate?: Date;
    }> {
        const contract = PaymentPlanV2Factory.connect(plan.paymentPlanContractAddress, this.signer);
        const [
            payAmountForCollateral,
            payAmountForInterest,
            payAmountForService,
            currentPayment,
            dueDate,
        ] = await contract.getPaymentInfoByPlanId(plan.planId, isEarlyRepayment);
        return {
            payAmountForCollateral: payAmountForCollateral.toString(),
            payAmountForInterest: payAmountForInterest.toString(),
            payAmountForService: payAmountForService.toString(),
            currentPayment: currentPayment.toString(),
            dueDate: new Date(dueDate.toNumber() * 1000),
        };
    }

    /**
     * Pays the next payment for a payment plan
     * @param {IPlan} plan - The payment plan object
     * @returns {Promise<ContractTransaction>} A Promise that resolves to a ContractTransaction object.
     */
    public async pay(plan: IPlan): Promise<ContractTransaction> {
        return await this._pay(plan, false);
    }

    /**
     * Pays the remaining payment for a payment plan
     * @param {IPlan} plan - The payment plan object
     * @returns {Promise<ContractTransaction>} A Promise that resolves to a ContractTransaction object.
     */
    public async payEarly(plan: IPlan): Promise<ContractTransaction> {
        return await this._pay(plan, true);
    }

    /**
     * Retrieve BNPL or Pawn plans, by user, which are Activated, Funded or in Pending status.
     * @param address User wallet address
     * @returns Array of IPlan
     */
    public async getUserPlans(address: string): Promise<IPlan[]> {
        return await this.api.getUserPlans(address);
    }

    /**
     * Retrieves the PaymentPlanV2 contract instance for the current chain.
     * Throws a CyanError if the contract cannot be found for the current chain.
     * @returns {Promise<PaymentPlanV2>} The PaymentPlanV2 contract instance.
     * @throws {CyanError} If the PaymentPlan contract is not found for the current chain.
     */
    public async getPaymentPlanContract(): Promise<PaymentPlanV2> {
        const chainId = await this.signer.getChainId();
        const contract = this.configs.paymentPlanContracts.find(
            ({ isActive, chainId: _chainId }) => isActive && _chainId === chainId
        );

        if (!contract) {
            throw new CyanError('Can not find PaymentPlan contract for this chain');
        }

        return PaymentPlanV2Factory.connect(contract.address, this.signer);
    }

    /**
     * Retrieves the Cyan Factory contract instance for the current chain.
     * Throws a CyanError if the contract cannot be found for the current chain.
     * @returns {Promise<PaymentPlanV2>} The Cyan Factory contract instance.
     * @throws {CyanError} If the Cyan Factory contract is not found for the current chain.
     */
    public async getFactoryContract(): Promise<CyanFactory> {
        const chainId = await this.signer.getChainId();
        const contract = this.configs.factoryContracts.find(({ chainId: _chainId }) => _chainId === chainId);

        if (!contract) {
            throw new CyanError('Can not find Factory contract for this chain');
        }

        return CyanFactoryFactory.connect(contract.address, this.signer);
    }

    /**
     * Returns an instance of the CyanWallet contract for the current user.
     * @throws {NoWalletError} if no wallet is associated with the current user.
     * @returns {Promise<CyanWallet>} An instance of the CyanWallet contract.
     */
    public async getCyanWallet(): Promise<CyanWallet> {
        const factoryContract = await this.getFactoryContract();
        const ownerAddress = await this.signer.getAddress();
        const walletAddress = await factoryContract.getOwnerWallet(ownerAddress);
        if (walletAddress === ethConsts.AddressZero) {
            throw new NoWalletError();
        }

        return CyanWalletFactory.connect(walletAddress, this.signer);
    }

    /**
     * Creates a new CyanWallet for the current user if it does not exist, or returns the existing one.
     * @returns {Promise<ContractTransaction>} A promise that resolves with a ContractTransaction representing the transaction that deploys or retrieves the CyanWallet contract.
     */
    public async createCyanWallet(): Promise<ContractTransaction> {
        const factoryContract = await this.getFactoryContract();
        return await factoryContract.getOrDeployWallet(await this.signer.getAddress());
    }

    /**
     * Retrieves top bids of the specific collection or token
     * @param {string} collectionAddress - The collection address
     * @param {string} tokenId - The token id
     * @returns {Promise<IOffer[]>} The top bid result
     */
    public async getTopBids(collectionAddress: string, tokenId?: string): Promise<IOffer[]> {
        const chain = await this._getChain();
        const topBids = await this.api.getCollectionTopBids({ chain, collectionAddress, tokenId });
        return topBids;
    }

    /**
     * Retrieve the maximum LTVs for the given plan type across all supported collections
     * @param {string} planType - The plan type
     * @returns {Promise<IGetCollectionsMaxLtvs['result']>} The maximum LTVs by currency address
     */
    public async getMaxLtvs(planType: 'bnpl' | 'pawn'): Promise<IGetCollectionsMaxLtvs['result']> {
        const chain = await this._getChain();
        return await this.api.getMaxLtvs({ chain, planType: PlanTypes[planType] });
    }

    /**
     * Fulfill bid offer of the plan
     * @param {IPlan} plan - Plan object to sell
     * @param {IOffer} offer - Offer objects to accept
     * @returns {Promise<ContractTransaction>}
     */
    public async fulfillOffer(plan: IPlan, offer: IOffer): Promise<ContractTransaction> {
        const chain = await this._getChain();
        const contract = PaymentPlanV2Factory.connect(plan.paymentPlanContractAddress, this.signer);

        const offerFulfillment = await this.api.getFulfillOffer({
            chain,
            planId: plan.planId,
            offerHash: offer.hash,
        });

        return await contract.earlyUnwind(plan.planId, offer.price.netAmount.raw, offerFulfillment);
    }

    /**
     * Pays the payment for payment plans
     * @param {Array<IPlan>} plans - The payment plan objects
     * @param {boolean} isEarlyPayment - The flag to indicate if this is early payment or not
     * @param {string} releaseWallet - The wallet address to release the token
     * @returns {Promise<ContractTransaction>} A Promise that resolves to a ContractTransaction object.
     */
    public async payBulk(
        plans: IPlan[],
        isEarlyPayment: boolean,
        releaseWallet?: string
    ): Promise<ContractTransaction> {
        if (
            !plans.length ||
            !plans.every(plan => plan.paymentPlanContractAddress === plans[0].paymentPlanContractAddress)
        ) {
            throw new Error('All plans must be from the same payment plan contract');
        }

        const plansWithNextPayment = await Promise.all(
            plans.map(async plan => {
                const nextPayment = await this.getPaymentInfo(plan, isEarlyPayment);
                return {
                    ...plan,
                    nextPayment,
                };
            })
        );
        const totalRepaymentAmountByCurrency = plansWithNextPayment.reduce<{
            [key: string]: {
                totalCost: BigNumber;
                currency: ICurrency;
                isNativeCurrency: boolean;
            };
        }>((acc, plan) => {
            const currencyAddress = plan.currency.address.toLowerCase();
            if (acc[currencyAddress]) {
                acc[currencyAddress] = {
                    totalCost: acc[currencyAddress].totalCost.add(plan.nextPayment?.currentPayment || 0),
                    currency: plan.currency,
                    isNativeCurrency: currencyAddress === ethers.constants.AddressZero,
                };
            } else {
                acc[currencyAddress] = {
                    totalCost: BigNumber.from(plan.nextPayment?.currentPayment) || BigNumber.from(0),
                    currency: plan.currency,
                    isNativeCurrency: currencyAddress === ethers.constants.AddressZero,
                };
            }
            return acc;
        }, {});

        const cyanConduitAddress = await this._getConduitAddress();
        const currencyValues = Object.values(totalRepaymentAmountByCurrency);
        const cyanWallet = await this.getCyanWallet();
        const paymentPlanAddress = plans[0].paymentPlanContractAddress;
        const contract = PaymentPlanV2Factory.connect(paymentPlanAddress, this.signer);
        const bulkTransactions = [];
        for (const { currency, totalCost, isNativeCurrency } of currencyValues) {
            if (!isNativeCurrency) {
                const erc20 = ERC20Factory.connect(currency.address, this.signer);
                const userAllowance = await erc20.allowance(cyanWallet.address, cyanConduitAddress);
                if (userAllowance.lt(totalCost)) {
                    const encodedAllowanceFnData = erc20.interface.encodeFunctionData('approve', [
                        cyanConduitAddress,
                        totalCost,
                    ]);
                    bulkTransactions.push({
                        to: currency.address,
                        data: encodedAllowanceFnData,
                        value: 0,
                    });
                }
            }
        }
        for (const plan of plansWithNextPayment) {
            const isNativeCurrency = plan.currency.address.toLowerCase() === ethers.constants.AddressZero.toLowerCase();
            const encodedPayFnData = contract.interface.encodeFunctionData('pay', [plan.planId, isEarlyPayment]);

            bulkTransactions.push({
                to: plan.paymentPlanContractAddress,
                data: encodedPayFnData,
                value: isNativeCurrency ? plan.nextPayment.currentPayment : 0,
            });
            const totalNumOfPaymentsLeft = plan.totalNumOfPayments - plan.currentNumOfPayments;
            if (
                (totalNumOfPaymentsLeft === 1 || isEarlyPayment) &&
                releaseWallet &&
                cyanWallet.address.toLowerCase() !== releaseWallet.toLowerCase()
            ) {
                if (plan.tokenType === ItemType.ERC1155) {
                    const contractIFace = ERC1155Factory.createInterface();
                    const encodedFnDataTransfer = contractIFace.encodeFunctionData('safeTransferFrom', [
                        cyanWallet.address,
                        releaseWallet,
                        plan.tokenId,
                        plan.tokenAmount,
                        [],
                    ]);
                    bulkTransactions.push({
                        to: plan.collectionAddress,
                        data: encodedFnDataTransfer,
                        value: 0,
                    });
                } else {
                    const sampleContractIFace = ERC721Factory.createInterface();
                    const encodedFnDataTransfer = sampleContractIFace.encodeFunctionData('safeTransferFrom', [
                        cyanWallet.address,
                        releaseWallet,
                        plan.tokenId,
                    ]);
                    bulkTransactions.push({
                        to: plan.collectionAddress,
                        data: encodedFnDataTransfer,
                        value: 0,
                    });
                }
            }
        }
        return await cyanWallet.executeBatch(bulkTransactions);
    }

    public async getOrCreateCyanWallet(): Promise<CyanWallet> {
        try {
            return await this.getCyanWallet();
        } catch (e) {
            if (e instanceof NoWalletError) {
                const tx = await this.createCyanWallet();
                await tx.wait();
                return await this.getCyanWallet();
            }
            throw e;
        }
    }

    public _setConfigs(configs: IConfigs): void {
        this.configs = configs;
    }

    private async _pay(plan: IPlan, isEarlyRepayment = false): Promise<ContractTransaction> {
        const contract = PaymentPlanV2Factory.connect(plan.paymentPlanContractAddress, this.signer);
        const currencyAddress = await contract.getCurrencyAddressByPlanId(plan.planId);
        const isNativeCurrency = currencyAddress === ethConsts.AddressZero;
        const { currentPayment } = await this.getPaymentInfo(plan, isEarlyRepayment);

        if (!isNativeCurrency) {
            await this.checkAndAllowCurrencyForPlan(currencyAddress, BigNumber.from(currentPayment));
        }
        return await contract.pay(plan.planId, isEarlyRepayment, {
            value: isNativeCurrency ? currentPayment : 0,
        });
    }

    private async _buildStep2Request(args: ISdkPricerStep2['params']): Promise<IPricerStep2['request']> {
        const { wallet, items, option, currencyAddress, autoRepayStatus } = args;
        const chain = await this._getChain();
        return {
            chain,
            items: items.map(item => ({
                address: item.address,
                tokenId: item.tokenId,
                itemType: item.itemType,
                amount: item.amount,
            })),
            currencyAddress,
            option: [option.term, option.totalNumberOfPayments, option.loanRate],
            autoRepayStatus,
            wallet,
        };
    }

    private _buildStep2Result(args: ISdkPricerStep2['params'] & IPricerStep2['response']): ISdkPricerStep2['result'] {
        const { items, option, autoRepayStatus, blockNumber, plans } = args;

        return plans.map((plan, i) => {
            if (!isNonErrored(plan)) {
                return plan;
            }

            return {
                item: {
                    amount: items[i].amount,
                    tokenId: items[i].tokenId,
                    contractAddress: items[i].address,
                    cyanVaultAddress: plan.vaultAddress,
                    itemType: items[i].itemType,
                },
                plan: {
                    amount: plan.price.mul(option.downpaymentRate + option.loanRate).div(100_00),
                    downPaymentPercent: option.downpaymentRate,
                    interestRate: plan.interestRate,
                    serviceFeeRate: option.serviceFeeRate,
                    term: option.term,
                    totalNumberOfPayments: option.totalNumberOfPayments,
                    counterPaidPayments: option.counterPaidPayments,
                    autoRepayStatus: autoRepayStatus,
                },
                planId: plan.planId,
                blockNum: blockNumber,
                signature: plan.signature,
                isChanged: items[i].price.eq(plan.price),
                marketName: plan.marketName,
            };
        });
    }

    private async _getChain(): Promise<IChain> {
        const chainId = await this.signer.getChainId();
        const CHAINS: Record<number, IChain> = {
            1: 'mainnet',
            5: 'goerli',
            11155111: 'sepolia',
            137: 'polygon',
            80001: 'mumbai',
            42161: 'arbitrum',
            56: 'bsc',
            10: 'optimism',
        };
        return CHAINS[chainId];
    }

    private async _getConduitAddress(): Promise<string> {
        const chainId = await this.signer.getChainId();
        const cyanConduit = this.configs.cyanConduitAddresses.find(cyanConduit => cyanConduit.chainId === chainId);
        if (!cyanConduit) {
            throw new Error('Can not find Cyan Conduit address for this chain');
        }
        return cyanConduit.address;
    }
}

export default CyanSDK;
