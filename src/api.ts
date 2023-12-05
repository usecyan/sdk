import { BigNumber } from 'ethers';
import {
    IConfigs,
    ICreateAcceptance,
    IFulfillOffer,
    IGetCollectionTopBid,
    IOffer,
    IPlan,
    IPricerStep1,
    IPricerStep2,
} from './types';
import { HttpError } from './errors';

export class CyanAPI {
    private fetchData: (p: string, o?: RequestInit) => Promise<any>;

    constructor(apiKey: string, host: string) {
        this.fetchData = async (path: string, options: RequestInit = {}) => {
            const url = new URL(path, host).toString();
            const res = await fetch(url, {
                headers: {
                    'X-API-KEY': apiKey,
                    'content-type': 'application/json',
                },
                ...options,
            });
            if (!res.ok) {
                const error = await res.json();
                throw new HttpError(error.message, res.status);
            }
            return await res.json();
        };
    }

    public async getConfigs(): Promise<IConfigs> {
        return await this.fetchData('/v2/configs');
    }

    /**
     * Creates acceptance signature
     */
    public async createAcceptance(args: ICreateAcceptance): Promise<void> {
        await this.fetchData('/v2/users/accept-plan', { method: 'POST', body: JSON.stringify(args) });
    }

    /**
     * Calls BNPL pricer step 1
     */
    public async priceBnplsStep1(body: IPricerStep1['request']): Promise<IPricerStep1['response']> {
        return await this._pricerStep1('/v2/pricer/bnpl-step1', body);
    }

    /**
     * Calls BNPL pricer step 2
     */
    public async priceBnplsStep2(body: IPricerStep2['request']): Promise<IPricerStep2['response']> {
        return await this._pricerStep2('/v2/pricer/bnpl-step2', body);
    }

    /**
     * Calls Pawn pricer step 1
     */
    public async pricePawnsStep1(body: IPricerStep1['request']): Promise<IPricerStep1['response']> {
        return await this._pricerStep1('/v2/pricer/pawn-step1', body);
    }

    /**
     * Calls Pawn pricer step 2
     */
    public async pricePawnsStep2(body: IPricerStep2['request']): Promise<IPricerStep2['response']> {
        return await this._pricerStep2('/v2/pricer/pawn-step2', body);
    }

    private async _pricerStep1(url: string, body: IPricerStep1['request']): Promise<IPricerStep1['response']> {
        const { items, ...response } = await this.fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ ...body, source: 'sdk' }),
        });
        return {
            ...response,
            items: items.map((item: { price: string; interestRate: number }) => ({
                interestRate: item.interestRate,
                price: BigNumber.from(item.price),
            })),
        };
    }

    private async _pricerStep2(url: string, body: IPricerStep2['request']): Promise<IPricerStep2['response']> {
        const response = await this.fetchData(url, { method: 'POST', body: JSON.stringify(body) });
        return {
            ...response,
            plans: response.plans.map(
                (plan: {
                    interestRate: number;
                    planId: number;
                    price: string;
                    signature: string;
                    vaultAddress: string;
                }) => ({
                    ...plan,
                    price: BigNumber.from(plan.price),
                })
            ),
        };
    }

    /**
     * Retrieve BNPL or Pawn plans, by user, which are Activated, Funded or in Pending status.
     * @param address User wallet address
     * @returns Array of IPlan
     */
    public async getUserPlans(address: string): Promise<IPlan[]> {
        return await this.fetchData(`/v2/plans?wallet=${address}`);
    }

    public async getCollectionTopBids(body: IGetCollectionTopBid['request']): Promise<IOffer[]> {
        const { collectionAddress, tokenId, chain } = body;
        const queryParams = new URLSearchParams({
            chain: chain as string,
        });
        if (tokenId) queryParams.append('tokenId', tokenId);
        return await this.fetchData(`/v2/collections/${collectionAddress}/top-bid?${queryParams}`);
    }

    public async getFulfillOffer(body: IFulfillOffer['request']): Promise<IFulfillOffer['result']> {
        const { planId, chain, offerHash } = body;
        const queryParams = new URLSearchParams({
            chain: chain as string,
            offerHash,
        });
        return await this.fetchData(`/v2/plans/${planId}/fulfill-offer?${queryParams}`);
    }
}
