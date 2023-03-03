import React, { useState } from 'react';
import { ethers } from 'ethers';
import Cyan, { IChain } from '@usecyan/sdk';

import Button from '../common/Button';
import Input from '../common/Input';
import Loading from '../common/Loading';

type IProps = { provider: ethers.providers.Web3Provider; cyan: Cyan; chain: IChain };
export const CreateBNPL = React.memo(({ provider, cyan, chain }: IProps) => {
    const [address, setAddress] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [data, setData] = useState(null);
    const [plan, setPlan] = useState(null);
    const [nextPayment, setNextPayment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const check = async () => {
        try {
            setLoading(true);
            const signer = provider.getSigner();

            const calculatedData = await cyan.getBnplPrices(
                chain,
                [
                    {
                        address,
                        tokenId,
                    },
                ],
                await signer.getAddress()
            );
            console.log('BNPL get price:', calculatedData);
            setData(calculatedData[0]);
            setMessage(`${calculatedData[0].collectionName} ${calculatedData[0].tokenId}`);
        } catch (e) {
            console.log(e.statusCode, e.message);
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptance = async () => {
        try {
            setLoading(true);
            const signer = provider.getSigner();
            await cyan.acceptPlanInfo(chain, data, await signer.getAddress());
            setMessage('Accepted');
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBNPL = async () => {
        setLoading(true);
        const result = await cyan.createBnpl(data);
        console.log('BNPL create result:', result);
        setMessage(result.hash);
        setLoading(false);
    };

    const handleNextPayment = async () => {
        setLoading(true);
        const plan = await cyan.getPlan(address, tokenId);
        setPlan(plan);
        const nextPaymentData = await cyan.getNextPayment(plan);
        console.log('BNPL Next payment:', nextPaymentData);
        setNextPayment(nextPaymentData);
        setMessage(nextPaymentData.nextPaymentDate.toString());
        setLoading(false);
    };

    const handlePay = async () => {
        setLoading(true);
        if (!plan) {
            const plan = await cyan.getPlan(address, tokenId);
            setPlan(plan);
        }
        const result = await cyan.pay(plan, nextPayment.currentPayment);
        console.log('BNPL Pay:', result);
        setMessage(result.hash);
        setLoading(false);
    };

    return (
        <form className="block p-6 rounded-lg shadow-lg border border-2 border-black bg-white">
            <h4 className="text-xl mb-3">Create BNPL</h4>
            <Input
                label="Collection Address"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            />
            <Input
                label="Token ID"
                value={tokenId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenId(e.target.value)}
            />
            <div>{message}</div>
            {loading ? (
                <Loading />
            ) : (
                <>
                    <Button onClick={check}>Check</Button>
                    <Button onClick={handleAcceptance}>Accept</Button>
                    <Button onClick={handleCreateBNPL} disabled={!data}>
                        Create BNPL
                    </Button>
                    <Button onClick={handleNextPayment}>Get Next Payment</Button>
                    <Button onClick={handlePay} disabled={!nextPayment}>
                        Pay
                    </Button>
                </>
            )}
        </form>
    );
});

export default CreateBNPL;
