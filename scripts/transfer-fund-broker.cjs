const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function transferFundToBroker() {
  const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL);
  const signer = new ethers.Wallet(process.env.ZG_LEDGER_PRIVATE_KEY, provider);

  console.log("Wallet address:", signer.address);
  console.log("Provider address:", process.env.ZG_COMPUTE_PROVIDER_ADDRESS);

  // 0G Compute ABI for transferFund function
  const abi = [
    "function transferFund(address provider, uint256 amount) external",
  ];

  const contract = new ethers.Contract(
    process.env.ZG_COMPUTE_PROVIDER_ADDRESS,
    abi,
    signer
  );

  try {
    // Transfer 0.001 OG to initialize sub-account
    const amount = ethers.parseEther("0.001");
    console.log("Transferring", ethers.formatEther(amount), "OG to broker sub-account...");
    
    const tx = await contract.transferFund(process.env.ZG_COMPUTE_PROVIDER_ADDRESS, amount);
    console.log("Transaction submitted:", tx.hash);
    
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log("\n✅ Funds transferred successfully!");
      console.log("Broker sub-account is now initialized.");
    }
  } catch (error) {
    console.error("Error transferring funds:", error);
    process.exit(1);
  }
}

transferFundToBroker();
