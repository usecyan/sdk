import {
    IAppraisal,
    IAppraisalError,
    IBnplPrice,
    INFT,
    IPawnParams,
    IPawnPrice,
    IPlan,
    IPlanInput,
    ISDKResponse,
} from './types';
import { HttpError } from './utils';

export class CyanAPI {
    private fetchData: (p: string, o?: RequestInit) => Promise<any>;

    constructor(apiKey: string, host: string) {
        this.fetchData = async (path: string, options?: RequestInit) => {
            try {
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
                    const err = new HttpError(error.message, res.status);
                    return Promise.reject(err);
                }
                return res.json();
            } catch (error) {
                throw error;
            }
        };
    }

    /**
     * Retrieves BNPL pricing data for multiple NFTs in one request.
     * This endpoint accepts an array of NFT collection addresses and token IDs.
     * @param nfts Array of NFTs
     * @param wallet User wallet address
     * @returns Array of IBnplPrice
     */
    public async getBnplPrices(nfts: IPlanInput[], wallet?: string): Promise<ISDKResponse<IBnplPrice[]>> {
        const options = {
            method: 'POST',
            body: JSON.stringify({
                nfts,
            }),
        };

        const params: Record<string, string> = wallet ? { wallet, source: 'sdk' } : { source: 'sdk' };

        const searchParams = new URLSearchParams(params);

        return await this.fetchData(`/bnpl/pricer?${searchParams}`, options);
    }

    /**
     * Retrieves PAWN appraisal data for multiple NFTs in one request. This endpoint accepts an array of NFT collection addresses and token IDs.
     * @param nfts Array of NFTs
     * @returns IAppraisal or IAppraisalError
     */
    public async getPawnAppraisals(nfts: INFT[]): Promise<(IAppraisal | IAppraisalError)[]> {
        const options = {
            method: 'POST',
            body: JSON.stringify({
                nfts,
            }),
        };
        return await this.fetchData('/pawn/pricer', options);
    }

    /**
     * Retrieve pricing data for a single PAWN request. This endpoint prices out a plan to post the NFT as collateral and receive a loan in ETH.
     * @param address NFT Collection address
     * @param tokenId NFT id
     * @param params {weight, totalNumOfPayments, term, wallet }
     * @returns IPawnPrice
     */
    public async getPawnPrice(
        address: string,
        tokenId: string,
        params: IPawnParams
    ): Promise<ISDKResponse<IPawnPrice>> {
        return await this.fetchData(`/pawn/pricer/${address}/${tokenId}?` + new URLSearchParams({ ...params }));
    }

    /**
     * Retrieve Plan details for an already executed BNPL or PAWN plan.
     * @param address NFT Collection address
     * @param tokenId NFT id
     * @returns IPlan
     */
    public async getPlan(address: string, tokenId: string): Promise<ISDKResponse<IPlan>> {
        return await this.fetchData(`/get-plan/${address}/${tokenId}`);
    }

    /**
     * Retrieve BNPL or Pawn plans, by user, which are Activated, Funded or in Pending status.
     * @param address User wallet address
     * @returns Array of IPlan
     */
    public async getUserPlans(address: string): Promise<ISDKResponse<IPlan[]>> {
        return await this.fetchData(`/users/${address}/plans`);
    }
}
