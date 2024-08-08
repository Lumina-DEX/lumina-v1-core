import { useState } from "react";
import { Button, Input, Select } from "react-daisyui";

interface Props {
  onSubmit: () => void;
}
const OtherSettingsStep: React.FC<Props> = ({ onSubmit }) => {
  const [enterprise, setEnterprise] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  return (
    <div className="w-full p-8 pt-0 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <span className="text-black text-lg font-bold">Display Settings</span>
        <div className="flex flex-col gap-2">
          <span className="text-black text-base">Visible on Lumina App</span>
          <Select
            size="md"
            value={enterprise}
            onChange={(event) => setEnterprise(event.target.value)}
          >
            <option value={""} disabled>
              Select Yes / No
            </option>
            <option value={"yes"}>Yes</option>
            <option value={"no"}>No</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-black text-lg font-bold">Controller Wallet</span>
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
          Create Pool
        </Button>
      </div>
    </div>
  );
};

export default OtherSettingsStep;
