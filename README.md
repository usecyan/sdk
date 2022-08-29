# Cyan SDK

The buy now pay later service for the Metaverse.

## Install

`yarn add @usecyan/sdk`

## Documentation

Documentation of the Cyan SDK and Public APIs [link](https://docs.usecyan.com)

## Usage

The below is a simple example of using `Cyan SDK`'s `getPlans` method.

```typescript
import { ethers } from 'ethers';
import Cyan from '@usecyan/sdk';

const apiKey = process.env.CYAN_API_KEY;

const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
const host = https://testnet-api.usecyan.com

const cyan = new Cyan({apiKey, provider, host});

const signer = provider.getSigner();

const address = await signer.getAddress();

const userPlans = await cyan.getPlans(address);
```

For more usage, see [docs]('https://docs.usecyan.com') and example project in this repo.
