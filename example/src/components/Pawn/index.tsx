import React, { useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import Cyan, { IChain, ItemType, IOption, utils, ISdkPricerStep2, ISdkPricerStep1 } from '@usecyan/sdk';

import Button from '../common/Button';
import Loading from '../common/Loading';
import { Options } from './Options';
import { ItemForm } from '../ItemForm';

type IItem = {
    address: string;
    tokenId: string;
    isAutoLiquidated: boolean;
};

type IProps = { provider: ethers.providers.Web3Provider; cyan: Cyan; chain: IChain };
export const CreatePawn = React.memo(({ provider, cyan }: IProps) => {
    const [currencyAddress, setCurrencyAddress] = useState<string>(ethers.constants.AddressZero);
    const [items, setItems] = useState<IItem[]>([]);
    const [itemsWithSelectedOptions, setItemsWithSelectedOptions] = useState<
        Array<
            ISdkPricerStep1['result']['items'][0] & {
                option: IOption;
            }
        >
    >([]);
    const [pricerStep1Data, setPricerStep1Data] = useState<ISdkPricerStep1['result']>(null);
    const [pricerStep2Data, setPricerStep2Data] = useState<ISdkPricerStep2['result']>(null);

    const [approved, setApproved] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    const onAddItem = (address: string, tokenId: string, isAutoLiquidated: boolean) => {
        setItems([...items, { address, tokenId, isAutoLiquidated }]);
    };

    const pricerStep1 = async () => {
        setLoading(true);
        try {
            const result = await cyan.pricePawnsStep1(
                currencyAddress,
                items.map(({ address, tokenId, isAutoLiquidated }) => ({
                    address,
                    tokenId,
                    isAutoLiquidated,
                    amount: 0,
                    itemType: ItemType.ERC721,
                }))
            );
            setItemsWithSelectedOptions(result.items.map(item => ({ ...item, option: item.options?.[0] })));
            setPricerStep1Data(result);
        } catch (e) {
            alert(e.message);
        }
        setLoading(false);
    };

    const pricerStep2 = async () => {
        const wallet = (await provider.listAccounts())[0];
        setLoading(true);
        try {
            const result = await cyan.pricePawnsStep2({
                items: itemsWithSelectedOptions.map(({ options, ...item }) => ({
                    ...item,
                    option: item.option,
                })),
                autoRepayStatus: 0,
                currencyAddress: currencyAddress,
                wallet,
            });
            setPricerStep2Data(result);
        } catch (e) {
            alert(e.message);
        }
        setLoading(false);
    };

    const handleAcceptance = async () => {
        setLoading(true);
        try {
            await cyan.acceptPlans(pricerStep2Data.filter(utils.isNonErrored));
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const handleGetApprovals = async () => {
        setLoading(true);
        try {
            for (const plan of pricerStep2Data.filter(utils.isNonErrored)) {
                await cyan.getApproval(plan.item.contractAddress, plan.item.tokenId, plan.item.itemType);
            }
            setApproved(true);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const handleCreatePawns = async () => {
        setLoading(true);
        try {
            const tx = await cyan.createPawns(pricerStep2Data.filter(utils.isNonErrored));
            await tx.wait();
            console.log('Pawn create result:', tx);
        } catch (e) {
            console.error(utils.getPaymentPlanError(e));
        }
        setLoading(false);
    };
    const setSelectedOptionForItem = (_item: ISdkPricerStep1['result']['items'][0], option: IOption) => {
        setItemsWithSelectedOptions([
            ...itemsWithSelectedOptions.filter(
                item => item.address !== _item.address || item.tokenId !== _item.tokenId
            ),
            {
                ..._item,
                option,
            },
        ]);
    };
    return (
        <form className="block p-6 rounded-lg shadow-lg border border-2 border-black bg-white">
            <h4 className="text-xl mb-3">Create PAWN</h4>

            <div>
                <input
                    value={currencyAddress}
                    className="input flex-1 mx-2 mb-1"
                    placeholder="Currency address"
                    onChange={e => setCurrencyAddress(e.target.value)}
                    required
                />
                {items.map(item => {
                    return (
                        <div key={`${item.address}:${item.tokenId}`} className="border border-black p-1 mb-1">
                            <div>Collection address: {item.address}</div>
                            <div>Token ID: {item.tokenId}</div>
                            <div>Auto liquidate: {item.isAutoLiquidated ? 'Yes' : 'No'}</div>
                        </div>
                    );
                })}
                <ItemForm onAddItem={onAddItem} />
            </div>
            {pricerStep1Data &&
                pricerStep1Data.items.map((item, i) => {
                    return (
                        <div key={`${item.address}:${item.tokenId}`} className="border border-black p-1 mb-1">
                            <div>Collection address: {item.address}</div>
                            <div>Token ID: {item.tokenId}</div>
                            {item.options?.length ? (
                                <Options
                                    key={`${item.address}:${item.tokenId}`}
                                    value={
                                        itemsWithSelectedOptions[i]?.option
                                            ? {
                                                  loanRate: itemsWithSelectedOptions[i].option.loanRate,
                                                  duration:
                                                      itemsWithSelectedOptions[i].option.term *
                                                      itemsWithSelectedOptions[i].option.totalNumberOfPayments,
                                              }
                                            : undefined
                                    }
                                    item={{
                                        address: item.address,
                                        tokenId: item.tokenId,
                                    }}
                                    options={item.options}
                                    onChange={(option: IOption) => setSelectedOptionForItem(item, option)}
                                />
                            ) : (
                                <div>
                                    <b>No loan options available</b>
                                </div>
                            )}
                        </div>
                    );
                })}
            {pricerStep2Data &&
                pricerStep2Data.filter(utils.isNonErrored).map(paymentPlan => (
                    <div className="bg-slate-300 p-1 border border-black" key={paymentPlan.planId}>
                        <b>Pricer Step 2 Result:</b>
                        <div>
                            <p>Plan ID: {paymentPlan.planId}</p>
                            <p>Interest Rate: {paymentPlan.plan.interestRate / 100}%</p>
                            <p>Priced Market: {paymentPlan.marketName}</p>
                            <p>Price: {ethers.utils.formatEther(paymentPlan.plan.amount)}ETH</p>
                            <p>Vault Address: {paymentPlan.item.cyanVaultAddress}</p>
                            <p>Is changed: {paymentPlan.isChanged}</p>
                            <p>Block number: {paymentPlan.blockNum}</p>
                            <p>Signature: {paymentPlan.signature}</p>
                        </div>
                    </div>
                ))}
            {loading ? (
                <Loading />
            ) : (
                <>
                    <Button type="button" onClick={pricerStep1}>
                        Pricer Step 1
                    </Button>
                    <Button type="button" onClick={pricerStep2} disabled={itemsWithSelectedOptions.length === 0}>
                        Pricer Step 2
                    </Button>
                    <Button type="button" onClick={handleAcceptance} disabled={!pricerStep2Data}>
                        2. Accept
                    </Button>
                    <Button type="button" onClick={handleGetApprovals} disabled={!pricerStep2Data}>
                        3. Get Approval
                    </Button>
                    <Button type="button" onClick={handleCreatePawns} disabled={!approved}>
                        4. Create Pawn
                    </Button>
                </>
            )}
        </form>
    );
});

export default CreatePawn;
