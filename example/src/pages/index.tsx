import React from "react";

import useAccount from "../hooks/useAccount";
import { Button } from "../components/common";
import CreateBNPL from "../components/Bnpl";
import CreatePawn from "../components/Pawn";
import GetUserPlans from "../components/Plan";

export default function Home() {
  const { account, balance, errorMessage, connectHandler, provider, cyan, chain } =
    useAccount();

  return (
    <>
      <div className="max-w-2xl mx-auto py-24 px-4 grid items-center grid-cols-1 gap-y-16 gap-x-8 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8 lg:grid-cols-3">
        <span> Account: {account} </span>
        <span>
          Balance: {balance} {balance ? "ETH" : null}
        </span>
        <Button onClick={connectHandler}>Connect Account</Button>
        {errorMessage ? <p>Error: {errorMessage}</p> : null}
      </div>

      {account ? (
        <div className="container mx-auto grid items-center max-w-2xl grid-cols-1 gap-y-16 gap-x-8 lg:grid-cols-1 lg:max-w-7xl">
          <CreateBNPL provider={provider} cyan={cyan} chain={chain} />
          <CreatePawn provider={provider} cyan={cyan} chain={chain} />
          <GetUserPlans cyan={cyan} account={account} />
        </div>
      ) : null}
    </>
  );
}
