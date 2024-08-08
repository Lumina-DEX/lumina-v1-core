import React, { ReactElement, useState, useEffect } from "react";
import ZKPid from "@/services/zkpid";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { Button, Input } from "react-daisyui";
import { NextPageWithLayout } from "@/pages/_app.page";
import { FaTimes } from "react-icons/fa";
import { useRouter } from "next/router";
import { IBusinessContact } from "@/types/businessContact";
import useSupabaseFunctions from "@/services/supabase";
import usePermission from "@/hooks/permission";

const KYBPage: NextPageWithLayout = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { submitBusinessForm } = useSupabaseFunctions();
  const { sync: syncPermission } = usePermission();
  const [formData, setFormData] = useState<IBusinessContact>({
    firstName: "",
    lastName: "",
    businessEmail: "",
    businessName: "",
    businessAddress: "",
    businessTaxId: "",
  });
  const [step, setStep] = useState<"guidance" | "started" | "finished">(
    "guidance"
  );
  const [isLoading, setLoading] = useState(false);

  const handleUpdateFormData =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((v) => ({ ...v, [key]: event.target.value }));
    };

  const onStartVerification = () => {
    setStep("started");
  };

  const onSubmitVerification = async () => {
    const mode =
      typeof window !== "undefined" && window.localStorage.getItem("TestMode");

    const address = searchParams.get("address");
    if (!address) {
      console.error("Address is null!");
      return;
    }

    try {
      setLoading(true);

      await submitBusinessForm(address, formData, mode === "true");
      const body = {
        data: {
          address,
          mode: mode === "true",
          verified: true,
        },
      };
      await fetch("/api/kyb", { method: "POST", body: JSON.stringify(body) });
      syncPermission(address);
    } catch (e) {
      console.error("onSubmitVerification", e);
    } finally {
      setLoading(false);
    }

    setStep("finished");
  };

  const onClose = () => {
    router.push("/dash");
  };

  const renderGuidance = () => (
    <>
      <div className="flex flex-col items-start text-left">
        <h3 className="font-bold text-xl">What is it?</h3>
        <ul className="list-disc pl-6">
          <li>
            <p>
              Business verification, commonly called KYB (i.e. Know Your
              Business), is performed by an external service provider.
            </p>
          </li>
          <li>
            <p>
              The final credential will be stored in your wallet and may be
              re-used with Lumina and complying applications.
            </p>
          </li>
        </ul>
      </div>

      <div className="flex flex-col items-start text-left">
        <h3 className="font-bold text-xl">Get ready</h3>
        <ul className="list-disc pl-6">
          <li>
            <p>Enter your business information in the next page.</p>
          </li>
        </ul>
      </div>

      <div className="flex flex-col items-start text-left">
        <h3 className="font-bold text-xl">Next steps</h3>
        <ul className="list-disc pl-6">
          <li>
            <p>
              You will be notified of the outcome once the verification has been
              completed.
            </p>
          </li>
        </ul>
      </div>

      <div className="w-full flex justify-center">
        <Button
          className="font-orbitron"
          color="primary"
          onClick={onStartVerification}
        >
          Start Verification
        </Button>
      </div>
    </>
  );

  const renderForm = () => (
    <>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl">
          Enter the following information, then click ‘Submit Verification’
        </p>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">First Name</span>
          </label>
          <Input
            placeholder="Enter First Name"
            value={formData.firstName}
            onChange={handleUpdateFormData("firstName")}
          />
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Last Name</span>
          </label>
          <Input
            placeholder="Enter Last Name"
            value={formData.lastName}
            onChange={handleUpdateFormData("lastName")}
          />
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Business Email</span>
          </label>
          <Input
            placeholder="Enter Business Email"
            value={formData.businessEmail}
            onChange={handleUpdateFormData("businessEmail")}
          />
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Business Name</span>
          </label>
          <Input
            placeholder="Enter Business Name"
            value={formData.businessName}
            onChange={handleUpdateFormData("businessName")}
          />
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Business Legal Address</span>
          </label>
          <Input
            placeholder="Enter Business Legal Address"
            value={formData.businessAddress}
            onChange={handleUpdateFormData("businessAddress")}
          />
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">
              Business Tax Identification Number
            </span>
          </label>
          <Input
            placeholder="Enter Tax ID Number"
            value={formData.businessTaxId}
            onChange={handleUpdateFormData("businessTaxId")}
          />
        </div>

        <div className="w-full flex justify-center">
          <Button
            className="font-orbitron"
            color="primary"
            onClick={onSubmitVerification}
            loading={isLoading}
          >
            Submit Verification
          </Button>
        </div>
      </div>
    </>
  );

  const renderResult = () => (
    <div className="card bg-blue-100 max-w-3xl p-12 gap-6 font-metrophobic relative">
      <p className="text-xl">
        Thank you for submitting your business information. You will be notified
        by email about the status of your KYB check. If approved, the final
        credential will be stored in your wallet and may be re-used with Lumina
        and complying applications.
      </p>
      <Button
        className="absolute top-2 right-2"
        shape="circle"
        variant="link"
        onClick={onClose}
      >
        <FaTimes size={24} />
      </Button>
    </div>
  );

  if (step === "finished") {
    return renderResult();
  }

  return (
    <div className="card bg-blue-100 max-w-3xl p-6 gap-6 font-metrophobic">
      <div className="flex flex-col items-center">
        <h1 className="font-bold text-2xl">Welcome to KYB check</h1>
      </div>

      {step === "guidance" && renderGuidance()}
      {step === "started" && renderForm()}
    </div>
  );
};

KYBPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default KYBPage;
