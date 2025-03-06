import React from "react";
import DepositForm from "../../../components/deposit-form";

const AssetDepositPage = ({ params }) => {
  const { asset } = params;

  return (
    <div>
      <h1>Deposit {asset}</h1>
      <DepositForm assetType={asset} />
      {/* Other content related to the asset can go here */}
    </div>
  );
};

export default AssetDepositPage;
