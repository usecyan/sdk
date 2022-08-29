import { IAbi } from '../types';

export const SampleERC721: { approve: IAbi['approve'] } = {
    approve: {
        inputs: [
            {
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
        ],
        name: 'approve',
        output: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
};

export default SampleERC721;
