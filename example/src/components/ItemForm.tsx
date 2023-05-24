import { useState } from 'react';

type IProps = {
    onAddItem(address: string, tokenId: string): void;
};
export const ItemForm = ({ onAddItem }: IProps) => {
    const [address, setAddress] = useState<string>('');
    const [tokenId, setTokenId] = useState<string>('');

    const _onAddItem = () => {
        onAddItem(address, tokenId);
        setAddress('');
        setTokenId('');
    };

    return (
        <div className="flex">
            <input
                value={address}
                className="input flex-1 mx-2"
                placeholder="Collection address"
                onChange={(e) => setAddress(e.target.value)}
                required
            />
            <input
                className="input flex-1 mx-2"
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                required
            />
            <button className="button" onClick={_onAddItem}>
                Add item
            </button>
        </div>
    );
};
