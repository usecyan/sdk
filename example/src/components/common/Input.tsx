import React from "react";

export const Input = React.memo(
  ({
    label,
    value,
    placeholder,
    type = "text",
    ...props
  }: { label: string } & React.HTMLProps<HTMLInputElement>) => {
    return (
      <>
        <label
          htmlFor="form-control"
          className="form-label inline-block mb-2 text-gray-700"
        >
          {label}
        </label>
        <input
          type={type}
          className="
        form-control
        block
        w-full
        px-3
        py-1.5
        text-base
        font-normal
        text-gray-700
        bg-white bg-clip-padding
        border border-solid border-gray-300
        rounded
        transition
        ease-in-out
        m-0
        focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
      "
          id="form-control"
          value={value}
          placeholder={placeholder || ""}
          {...props}
        />
      </>
    );
  }
);

export default Input;
