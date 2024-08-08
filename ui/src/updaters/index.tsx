import { useRouter } from "next/router";
import AccountUpdater from "./account";
import KycUpdater from "./kyc";
export default function Updaters() {
  const router = useRouter();

  return (
    <>
      {router.pathname.startsWith("/dash") && <AccountUpdater />}
      <KycUpdater />
    </>
  );
}
