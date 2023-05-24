import React from 'react';

export const Input = React.memo(
    ({ label, value, placeholder, type = 'text', ...props }: { label: string } & React.HTMLProps<HTMLInputElement>) => {
        return (
            <>
                <label htmlFor="form-control" className="form-label inline-block mb-2 text-gray-700">
                    {label}
                </label>
                <input
                    type={type}
                    className="input"
                    id="form-control"
                    value={value}
                    placeholder={placeholder || ''}
                    {...props}
                />
            </>
        );
    }
);

export default Input;
