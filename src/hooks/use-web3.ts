import { useEffect, useState } from "react";
import Web3 from "web3";
import { FRACKING_ABI, FRACKING_ADDRESS } from "../config/contracts";

export const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const loadAccount = async () => {
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    };

    loadAccount();
    const frackingContract = new web3.eth.Contract(
      FRACKING_ABI,
      FRACKING_ADDRESS
    );
    setContract(frackingContract);
  }, []);

  return { account, contract };
};
