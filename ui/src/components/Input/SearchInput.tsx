import React from "react";
import { Input } from "react-daisyui";
import { AiOutlineSearch } from "react-icons/ai";

const SearchInput: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "color">
> = ({ ...rest }) => {
  return (
    <div className="relative">
      <Input {...rest} />
      <AiOutlineSearch className="absolute top-1/2 right-3 -translate-y-1/2 text-light-300" />
    </div>
  );
};

export default SearchInput;
