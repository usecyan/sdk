import React, { useState } from 'react';
import Cyan from '@usecyan/sdk';

import Button from '../common/Button';
import Input from '../common/Input';

export const GetUserPlans = React.memo(
  ({ account, cyan }: { cyan: Cyan; account: string }) => {
    const [userAddress, setUserAddress] = useState(account);
    const [plans, setPlans] = useState([]);

    const getPlans = async () => {
      const plans = await cyan.getUserPlans(userAddress);
      setPlans(plans);
      console.log('User Plans', plans);
    };

    return (
      <form className="block p-6 rounded-lg shadow-lg border border-2 border-black bg-white">
        <h4 className="text-xl mb-3">User Plans</h4>
        <Input
          label="Collection Address"
          value={userAddress}
          placeholder="Wallet address"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUserAddress(e.target.value)
          }
        />
        <p>You have {plans.length}</p>
        <Button onClick={getPlans}>Get plans</Button>
      </form>
    );
  }
);

export default GetUserPlans;
