import React from "react";
import { Table } from "react-daisyui";
import useTransactions from "@/states/useTransactions";
import CurrencyFormat from "react-currency-format";

const TransactionTable = () => {
  const transactions = useTransactions((state) => state.transactions);

  return (
    <div className="w-full py-2">
      <Table className="px-8 bg-light-100 overflow-hidden">
        <Table.Head className="text-base text-default rounded-t-lg bg-light-200">
          <span></span>
          <div className="flex gap-4 text-slate-400 ">
            <span className="cursor-pointer hover:text-black">All</span>
            <span className="cursor-pointer hover:text-black">Swaps</span>
            <span className="cursor-pointer hover:text-black">Adds</span>
            <span className="cursor-pointer hover:text-black">Removes</span>
          </div>
          <div className="cursor-pointer">Total Value</div>
          <div className="cursor-pointer max-lg:hidden">Token Amount</div>
          <div className="cursor-pointer max-lg:hidden">Token Amount</div>
          <div className="cursor-pointer max-md:hidden">Account</div>
          <div className="cursor-pointer max-sm:hidden ">Time</div>
        </Table.Head>
        <Table.Body>
          {transactions.map((transaction, index) => (
            <Table.Row key={index} className="text-disabled">
              <span></span>
              <div className="text-orange-600">
                Swap &nbsp; {transaction.fromToken} &nbsp; for &nbsp;
                {transaction.toToken}
              </div>
              <CurrencyFormat
                displayType="text"
                className="font-secondary text-right text-base text-slate-500"
                thousandSeparator
                decimalScale={2}
                prefix="$"
                value={transaction.totalValue}
              />
              <div className="text-slate-500 max-lg:hidden">
                {transaction.fromTokenAmount} {transaction.fromToken}
              </div>
              <div className="text-slate-500 max-lg:hidden">
                {transaction.toTokenAmout} {transaction.toToken}
              </div>
              <div className="text-orange-600 max-md:hidden">
                {transaction.account}
              </div>
              <div className="text-slate-500 max-sm:hidden">
                {transaction.time}
              </div>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default TransactionTable;
