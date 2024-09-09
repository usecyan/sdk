import { useState } from 'react';

type IProps = {
    onAddItem(address: string, tokenId: string, isAutoLiquidated: boolean): void;
};
export const ItemForm = ({ onAddItem }: IProps) => {
    const [address, setAddress] = useState<string>('');
    const [tokenId, setTokenId] = useState<string>('');
    const [isAutoLiquidated, setIsAutoLiquidated] = useState<boolean>(false);

    const _onAddItem = () => {
        onAddItem(address, tokenId, isAutoLiquidated);
        setAddress('');
        setTokenId('');
    };

    return (
        <div className="flex">
            <input
                value={address}
                className="input flex-1 mx-2"
                placeholder="Collection address"
                onChange={e => setAddress(e.target.value)}
                required
            />
            <input
                className="input flex-1 mx-2"
                placeholder="Token ID"
                value={tokenId}
                onChange={e => setTokenId(e.target.value)}
                required
            />
            <div className="flex-col mx-2">
                <div>Auto liquidate:</div>
                <input
                    type="checkbox"
                    className="input flex-1 h-7"
                    checked={isAutoLiquidated}
                    onChange={e => setIsAutoLiquidated(e.target.checked)}
                />
            </div>
            <button className="button" onClick={_onAddItem}>
                Add item
            </button>
        </div>
    );
};
