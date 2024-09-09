import { BigNumber, constants as ethConsts } from 'ethers';
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer';

import {
    Errored,
    FnGetExpectedPlanSync,
    ICreatePlanParams,
    IItem,
    IItemWithPrice,
    IPricerStep1,
    ISdkPricerStep1,
} from './types';
import { PaymentPlanV2__factory as PaymentPlanV2Factory } from './contracts';

export const createHashSHA256 = async (message: string): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('sha-256', new TextEncoder().encode(message));
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

export const calculateTotals = (items: { price: BigNumber; interestRate: number }[]) => {
    const initialAmounts = { totalPrice: ethConsts.Zero, totalInterestFee: ethConsts.Zero };
    const { totalPrice, totalInterestFee } = items.reduce((acc, { price, interestRate }) => {
        const interestFee = price.mul(interestRate);
        return {
            totalPrice: acc.totalPrice.add(price),
            totalInterestFee: acc.totalInterestFee.add(interestFee),
        };
    }, initialAmounts);
    const totalInterestRate = totalInterestFee.div(totalPrice).toNumber();

    return { totalPrice, totalInterestRate };
};

export const getExpectedPlanSync = (plan: FnGetExpectedPlanSync['params']): FnGetExpectedPlanSync['result'] => {
    const { amount, downpaymentRate, interestRate, serviceFeeRate, totalNumberOfPayments } = plan;

    if (totalNumberOfPayments < 1) throw new Error('Invalid total number of payments');

    const payCountWithoutDownPayment = totalNumberOfPayments - (downpaymentRate > 0 ? 1 : 0);
    const downpaymentAmount = amount.mul(downpaymentRate).div(10000);

    const totalLoanAmount = amount.sub(downpaymentAmount);
    const totalInterestFee = totalLoanAmount.mul(interestRate).div(10000);
    const totalServiceFee = amount.mul(serviceFeeRate).div(10000);

    const singleLoanAmount = totalLoanAmount.div(payCountWithoutDownPayment);
    const singleInterestFee = totalInterestFee.div(payCountWithoutDownPayment);
    const singleServiceFee = totalServiceFee.div(totalNumberOfPayments);
    const monthlyAmount = singleLoanAmount.add(singleInterestFee).add(singleServiceFee);
    const totalAmount = amount.add(totalInterestFee).add(totalServiceFee);

    return {
        downpaymentAmount: downpaymentRate > 0 ? downpaymentAmount.add(singleServiceFee) : ethConsts.Zero,
        totalInterestFee,
        totalServiceFee,
        monthlyAmount,
        totalAmount,
    };
};

// All properties on a domain are optional
export const typedDataDomain: TypedDataDomain = {
    name: 'Cyan Payment Plan',
    version: '2',
};

// The named list of all type definitions
export const typedDataTypes: Record<string, TypedDataField[]> = {
    Item: [
        { name: 'cyanVaultAddress', type: 'address' },
        { name: 'contractAddress', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'itemType', type: 'uint8' },
    ],
    Plan: [
        { name: 'amount', type: 'uint256' },
        { name: 'downPaymentPercent', type: 'uint32' },
        { name: 'interestRate', type: 'uint32' },
        { name: 'serviceFeeRate', type: 'uint32' },
        { name: 'term', type: 'uint32' },
        { name: 'totalNumberOfPayments', type: 'uint8' },
        { name: 'counterPaidPayments', type: 'uint8' },
        { name: 'autoRepayStatus', type: 'uint8' },
    ],
    PaymentPlan: [
        { name: 'item', type: 'Item' },
        { name: 'plan', type: 'Plan' },
        { name: 'planId', type: 'uint256' },
        { name: 'blockNum', type: 'uint256' },
    ],
    PlanCreation: [
        { name: 'Payment Plans', type: 'PaymentPlan[]' },
        { name: 'nonce', type: 'string' },
    ],
};

export const generateNonce = async (paymentPlans: ICreatePlanParams[]) => {
    // WARN: Do not touch `nonce` unless you know what you're doing!

    // Converting BigNumber to string for more convenient hashing
    const paymentPlanString = paymentPlans
        .sort((a, b) => a.planId - b.planId)
        .map(paymentPlan =>
            [
                paymentPlan.item.cyanVaultAddress,
                paymentPlan.item.contractAddress,
                paymentPlan.item.tokenId,
                paymentPlan.item.amount,
                paymentPlan.item.itemType,
                paymentPlan.plan.amount.toString(),
                paymentPlan.plan.downPaymentPercent,
                paymentPlan.plan.interestRate,
                paymentPlan.plan.serviceFeeRate,
                paymentPlan.plan.term,
                paymentPlan.plan.totalNumberOfPayments,
                paymentPlan.plan.counterPaidPayments,
                paymentPlan.plan.autoRepayStatus,
                paymentPlan.planId,
                paymentPlan.blockNum,
                paymentPlan.signature,
            ].join('|')
        )
        .join('||');
    return await createHashSHA256(paymentPlanString);
};

export const generateBnplOptions = (
    result: IPricerStep1['response'],
    items: Array<IItem | IItemWithPrice>
): ISdkPricerStep1['result']['items'] => generateOptions('bnpl', result, items);
export const generatePawnOptions = (
    result: IPricerStep1['response'],
    items: Array<IItem | IItemWithPrice>
): ISdkPricerStep1['result']['items'] => generateOptions('pawn', result, items);
const generateOptions = (
    type: 'bnpl' | 'pawn',
    result: IPricerStep1['response'],
    items: Array<IItem | IItemWithPrice>
): ISdkPricerStep1['result']['items'] => {
    const { items: pricedItems } = result;
    const { totalInterestRate, totalPrice } = calculateTotals(
        pricedItems.map(({ price, interestRate }) => ({ price: BigNumber.from(price), interestRate }))
    );
    const itemsWithOptions = pricedItems.map((pricedResult, index) => {
        const item = items[index];
        const options = pricedResult.config.map(
            ([term, totalNumberOfPayments, serviceFeeRate, loanRate, multiplier, divider, adder]) => {
                const downpaymentRate = type === 'bnpl' ? 100_00 - loanRate : 0;
                const counterPaidPayments = type === 'bnpl' ? 1 : 0;

                const interestRate = Math.ceil((totalInterestRate * multiplier) / divider) + adder;
                const { downpaymentAmount, monthlyAmount } = getExpectedPlanSync({
                    amount: totalPrice.mul(downpaymentRate + loanRate).div(100_00),
                    downpaymentRate,
                    interestRate,
                    serviceFeeRate,
                    totalNumberOfPayments,
                });
                return {
                    term,
                    totalNumberOfPayments,
                    interestRate,
                    downpaymentRate,
                    counterPaidPayments,
                    downpaymentAmount,
                    monthlyAmount,
                    serviceFeeRate,
                    loanRate,
                };
            }
        );
        return {
            ...item,
            interestRate: pricedResult.interestRate,
            price: BigNumber.from(pricedResult.price),
            options,
        };
    });
    return itemsWithOptions;
};

export const getPaymentPlanError = (error: any): string => {
    const iface = PaymentPlanV2Factory.createInterface();
    if (!error?.error?.data?.originalError?.data) {
        return 'Something went wrong';
    }

    const revertData = error.error.data.originalError.data;
    try {
        return iface.parseError(revertData).name;
    } catch (e) {
        return error.error.data.originalError.message;
    }
};

export const isNonErrored = <T>(item: Errored<T>): item is T => !('error' in item);
