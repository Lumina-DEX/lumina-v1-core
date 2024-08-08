import { Button } from "react-daisyui";
import type { NextPageWithLayout } from "@/pages/_app.page";

const OrdersCard: NextPageWithLayout = () => {
  return (
    <div className="px-4">
      <div className="card font-metrophobic">
        <div className="flex flex-col gap-y-4 py-6">
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-2xl font-orbitron">Orders</h1>
          </div>
          <div className="w-full flex gap-4 px-4">
            <Button className="flex-1">Open (1)</Button>
            <Button className="flex-1">Completed (1)</Button>
            <Button className="flex-1">Canceled (0)</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersCard;
