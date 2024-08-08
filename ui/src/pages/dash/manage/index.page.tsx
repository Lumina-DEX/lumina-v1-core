import Layout from "@/components/Layout";
import { ReactElement } from "react";
import type { NextPageWithLayout } from "@/pages/_app.page";
import ManageCard from "./ManageCard";
import OrdersCard from "./OrdersCard";

const ManagePage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-8">
      <ManageCard />
      {/* <OrdersCard /> */}
    </div>
  );
};

ManagePage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default ManagePage;
