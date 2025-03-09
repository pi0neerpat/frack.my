Load yield rate
Display data on the landing page
Display data on the fluids list page


In order to finish the deposit flow we need to make some changes. Please implement these changes so we cna connect the user to the disitribution pool

Steps:

1. Generate the abi needed for the GDAv1Forwarder. The address for this contract is 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08
2. Get the distributionPool from the yieldBox contract (vaultAddress)
3. Create a transaction from the user to call GDAv1Forwarder.connectPool(poolAddress, bytes) => bool


Keep it simple