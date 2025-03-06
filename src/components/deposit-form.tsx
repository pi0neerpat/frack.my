import React, { useState } from "react";
import { useWeb3 } from "../hooks/use-web3";
import { FRACKING_ABI, FRACKING_ADDRESS } from "../config/contracts";

const DepositForm = ({ assetType }) => {
  const { account, contract } = useWeb3();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    try {
      // Check allowance and call deposit function
      const tx = await contract.methods
        .deposit(assetType, amount)
        .send({ from: account });
      console.log("Transaction successful:", tx);
      // Handle success (e.g., redirect or show success message)
    } catch (err) {
      setError("Transaction failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Deposit {assetType}</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        min="0.01"
        step="0.01"
      />
      <button onClick={handleDeposit} disabled={loading}>
        {loading ? "Processing..." : "Deposit"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default DepositForm;
