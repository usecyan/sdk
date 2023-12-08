import React, { useState } from 'react';
import Cyan, { IPlan } from '@usecyan/sdk';

import Button from '../common/Button';

export const GetUserPlans = React.memo(({ account, cyan }: { cyan: Cyan; account: string }) => {
    const [plans, setPlans] = useState([]);

    const getPlans = async () => {
        const plans = await cyan.getUserPlans(account);
        setPlans(plans);
    };

    const onPay = async (plan: IPlan) => {
        const tx = await cyan.pay(plan);
        await tx.wait();
    };

    const onPayEarly = async (plan: IPlan) => {
        const tx = await cyan.payEarly(plan);
        await tx.wait();
    };

    return (
        <form className="block p-6 rounded-lg shadow-lg border border-2 border-black bg-white">
            <h4 className="text-xl mb-3">User Plans</h4>
            <p>You have {plans.length}</p>
            <div>
                {plans.map(plan => (
                    <div key={plan.planId} className="plan-card">
                        <p>Plan ID: {plan.planId}</p>
                        <p>Collection address: {plan.collectionAddress}</p>
                        <p>Token ID: {plan.tokenId}</p>
                        <p>Current Number of payments: {plan.currentNumOfPayments}</p>
                        <p>Total number of payments: {plan.totalNumOfPayments}</p>
                        <p>Auto Repay Status: {plan.autoRepayStatus}</p>
                        <p>Type: {plan.type}</p>
                        <Button onClick={() => onPay(plan)}>Pay</Button>
                        <Button onClick={() => onPayEarly(plan)}>Pay early</Button>
                    </div>
                ))}
            </div>
            <Button onClick={getPlans}>Get plans</Button>
        </form>
    );
});

export default GetUserPlans;
