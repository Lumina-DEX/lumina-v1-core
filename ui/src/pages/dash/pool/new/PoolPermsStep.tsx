import { useState } from "react";
import { Button, Input, Select } from "react-daisyui";

interface Props {
  onSubmit: () => void;
}
const PoolPermsStep: React.FC<Props> = ({ onSubmit }) => {
  const [enterprise, setEnterprise] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  return (
    <div className="w-full p-8 pt-0 flex flex-col gap-4">
      <span className="italic">
        Permissioned liquidity provisioning reserved for enterprises who
        complete KYB
      </span>

      <div className="flex flex-col gap-4">
        <span className="text-black text-lg font-bold">Global Permissions</span>
        <div className="flex flex-col gap-2">
          <span className="text-black text-base">Allowed Enterprises</span>
          <Select
            size="md"
            value={enterprise}
            onChange={(event) => setEnterprise(event.target.value)}
          >
            <option value={""} disabled>
              Select Countries
            </option>
            <option value={undefined}>None</option>
            <option value={"Homer"}>Homer</option>
            <option value={"Marge"}>Marge</option>
          </Select>
        </div>
      </div>

      <span className="text-black text-lg font-bold text-center">Or</span>

      <div className="flex flex-col gap-2">
        <span className="text-black text-lg font-bold">Local Permissions</span>
        <Input
          placeholder="Enter Attestation Whitelist Contract Address"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </div>

      <div className="w-full flex justify-center">
        <Button
          className="w-1/2 shadow-md text-white"
          size="md"
          color="primary"
          onClick={onSubmit}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};

export default PoolPermsStep;
