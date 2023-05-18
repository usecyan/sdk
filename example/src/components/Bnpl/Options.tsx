import { useEffect, useState } from 'react';
import { IOption } from '@usecyan/sdk';
import { ethers } from 'ethers';

type IProps = {
    options: IOption[];
    onChange: (p: IOption) => void;
};

export const Options = ({ options, onChange }: IProps) => {
    const loanRates = new Set<number>(options.map((o) => o.loanRate));
    const durations = new Set<number>(options.map((o) => o.duration));

    const [selected, setSelected] = useState<{ loanRate: number; duration: number }>({
        loanRate: loanRates.values().next().value,
        duration: durations.values().next().value,
    });

    const selectedOption = options.find((o) => o.loanRate === selected.loanRate && o.duration === selected.duration);

    useEffect(() => {
        if (!selectedOption) return;

        onChange(selectedOption);
    }, [selected]);

    const onSelect = (o: Partial<IOption>) => {
        setSelected({ ...selectedOption, ...o });
    };

    return (
        <div>
            <fieldset className="flex">
                <legend>Select downpayment</legend>

                {Array.from(loanRates).map((n) => (
                    <div className="px-1" key={n}>
                        <input
                            type="radio"
                            id={`${n}-loanRate`}
                            name="loanRate"
                            value={n}
                            checked={selected.loanRate === n}
                            onChange={() => onSelect({ loanRate: n })}
                        />
                        <label htmlFor={`${n}-loanRate`} className="px-1">
                            {100 - n / 100} %
                        </label>
                    </div>
                ))}
            </fieldset>

            <fieldset className="flex">
                <legend>Select duration</legend>

                {Array.from(durations).map((n) => (
                    <div className="px-1" key={n}>
                        <input
                            type="radio"
                            id={`${n}-duration`}
                            name="duration"
                            value={n}
                            checked={selected.duration === n}
                            onChange={() => onSelect({ duration: n })}
                        />
                        <label htmlFor={`${n}-duration`} className="px-2">
                            {n} sec.
                        </label>
                    </div>
                ))}
            </fieldset>
            <div className="bg-slate-300 p-1 border border-black">
                <b>Selected Option:</b>
                <p>Total number of payments: {selectedOption.totalNumberOfPayments}</p>
                <p>Interest rate: {selectedOption.interestRate / 100}%</p>
                <p>Downpayment rate: {selectedOption.downpaymentRate / 100}%</p>
                <p>Downpayment amount: {ethers.utils.formatEther(selectedOption.downpaymentAmount)} ETH</p>
                <p>Monthly amount: {ethers.utils.formatEther(selectedOption.monthlyAmount)} ETH</p>
                <p>Service fee rate: {ethers.utils.formatEther(selectedOption.serviceFeeRate / 100)}%</p>
                <p>Duration: {selectedOption.duration} seconds</p>
                <p>Loan rate: {selectedOption.loanRate / 100}%</p>
            </div>
        </div>
    );
};
