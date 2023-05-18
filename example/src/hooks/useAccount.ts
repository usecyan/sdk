import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Cyan from '@usecyan/sdk';

declare let window: any;
let cyan: Cyan;
let provider: ethers.providers.Web3Provider;

const chainIdToSlug = {
    '0x1': 'mainnet',
    '0x5': 'goerli',
};

export default () => {
    const [errorMessage, setErrorMessage] = useState(null);
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [chain, setChain] = useState(null);

    const connectHandler = async () => {
        if (window.ethereum) {
            try {
                const res = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                });
                await accountsChanged(res[0]);
            } catch (err) {
                console.error(err);
                setErrorMessage('There was a problem connecting to MetaMask');
            }
        } else {
            setErrorMessage('Install MetaMask');
        }
    };

    const accountsChanged = async (newAccount: string) => {
        setAccount(newAccount);
        try {
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [newAccount.toString(), 'latest'],
            });
            setBalance(ethers.utils.formatEther(balance));
        } catch (err) {
            console.error(err);
            setErrorMessage('There was a problem connecting to MetaMask');
        }
    };

    const chainChanged = (chainId: string) => {
        setErrorMessage(null);
        setAccount(null);
        setBalance(null);
        setChain(chainIdToSlug[chainId]);
    };

    useEffect(() => {
        if (!window.ethereum) return;

        window.ethereum.on('accountsChanged', accountsChanged);
        window.ethereum.on('chainChanged', chainChanged);
        provider = new ethers.providers.Web3Provider(window?.ethereum, 'any');

        (async () => {
            cyan = await Cyan.initiate({
                apiKey: '4I9zLVXwiS2nkWZoqLfRMv6G1jCRDD7sn4I8_y-Brr8',
                provider,
                host: 'http://localhost:5000',
            });
        })();

        chainChanged(window.ethereum.chainId);
    }, []);

    return {
        chain,
        account,
        balance,
        errorMessage,
        connectHandler,
        provider,
        cyan,
    };
};
