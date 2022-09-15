import React, { useState } from 'react';
import { ethers } from 'ethers';
import Cyan, { IPawnPrice } from '@usecyan/sdk';

import Button from '../common/Button';
import Input from '../common/Input';
import Loading from '../common/Loading';

export const CreatePawn = React.memo(({ provider, cyan }: { provider: ethers.providers.Web3Provider; cyan: Cyan }) => {
    const [address, setAddress] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [term, setTerm] = useState<'2678400' | '86400'>('2678400');
    const [weight, setWeight] = useState<'20' | '33' | '50'>('33');
    const [appraisal, setAppraisal] = useState<IPawnPrice>(null);
    const [approved, setApproved] = useState<boolean>(false);
    const [nextPayment, setNextPayment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const getPrice = async () => {
        setLoading(true);
        const signer = provider.getSigner();

        try {
            const calculatedData = await cyan.getPawnPrice(address, tokenId, {
                term,
                totalNumOfPayments: term === '2678400' ? '3' : '1',
                wallet: await signer.getAddress(),
                weight,
            });
            setAppraisal(calculatedData);
            console.log('Pawn get price:', calculatedData);
            setMessage(`${calculatedData.collectionName}-${calculatedData.tokenId}`);
            setLoading(false);
        } catch (e) {
            console.log(e);
        }
    };

    const handleGetApproval = async () => {
        try {
            setLoading(true);
            const approval = await cyan.getApproval(address, appraisal);
            console.log('Pawn Approval:', approval);
            setApproved(true);
            setMessage(approval);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePawn = async () => {
        setLoading(true);
        const result = await cyan.createPawn(appraisal);
        console.log('Pawn result:', result);
        setMessage(result.hash);
        setLoading(false);
    };

    const handleNextPayment = async () => {
        setLoading(true);
        const plan = await cyan.getPlan(address, tokenId);
        const nextPaymentData = await cyan.getNextPayment(plan);
        setNextPayment(nextPaymentData);
        console.log('Pawn Next payment:', nextPaymentData);
        setMessage(nextPaymentData.nextPaymentDate.toString());
        setLoading(false);
    };

    const handlePay = async () => {
        setLoading(true);
        const plan = await cyan.getPlan(address, tokenId);
        const result = await cyan.pay(plan, nextPayment.currentPayment);
        console.log('Pawn pay result:', result);
        setMessage(result.hash);
        setLoading(false);
    };

    return (
        <form className="block p-6 rounded-lg shadow-lg border border-2 border-black bg-white">
            <h4 className="text-xl mb-3">Create PAWN</h4>
            <Input
                label="Collection Address"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                required
            />
            <Input
                label="Token ID"
                value={tokenId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenId(e.target.value)}
                required
            />
            <div className="my-2">
                <label htmlFor="term" className="m-1">
                    Term:
                </label>
                <label>
                    <input
                        type="radio"
                        name="term"
                        value="2678400"
                        checked={term === '2678400'}
                        onChange={() => setTerm('2678400')}
                        className="mx-1"
                    />
                    Normal
                </label>
                <label>
                    <input
                        type="radio"
                        name="term"
                        value="86400"
                        checked={term === '86400'}
                        onChange={() => {
                            setTerm('86400');
                            setWeight('50');
                        }}
                        className="mx-1"
                        id="term"
                    />
                    Flash
                </label>
                <div>
                    <label htmlFor="weight">Weight:</label>
                    {term === '86400' ? (
                        <label htmlFor="weight-50">
                            <input
                                type="radio"
                                name="weight"
                                id="weight-50"
                                value="50"
                                checked={weight === '50'}
                                onChange={() => setWeight('50')}
                                required
                            />
                            50
                        </label>
                    ) : (
                        <>
                            <input
                                type="radio"
                                name="weight"
                                value="20"
                                id="weight-20"
                                checked={weight === '20'}
                                onChange={() => setWeight('20')}
                                required
                            />
                            <label htmlFor="weight-20">20</label>
                            <input
                                type="radio"
                                name="weight"
                                value="33"
                                id="weight-33"
                                checked={weight === '33'}
                                onChange={() => setWeight('33')}
                                required
                            />
                            <label htmlFor="weight-20">33</label>
                        </>
                    )}
                </div>
            </div>
            <div className="m-2">{message}</div>
            {loading ? (
                <Loading />
            ) : (
                <>
                    <Button type="button" onClick={getPrice}>
                        1. Check
                    </Button>
                    <Button type="button" onClick={handleGetApproval} disabled={!appraisal}>
                        2. Get Approval
                    </Button>
                    <Button type="button" onClick={handleCreatePawn} disabled={!approved}>
                        3. Create Pawn
                    </Button>
                    <Button type="button" onClick={handleNextPayment}>
                        4. Get Next Payment
                    </Button>
                    <Button type="button" onClick={handlePay} disabled={!nextPayment}>
                        5. Pay
                    </Button>
                </>
            )}
        </form>
    );
});

export default CreatePawn;
