const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function acknowledgeProvider() {
  const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL);
  const signer = new ethers.Wallet(process.env.ZG_LEDGER_PRIVATE_KEY, provider);

  console.log("Wallet address:", signer.address);
  console.log("Provider address:", process.env.ZG_COMPUTE_PROVIDER_ADDRESS);

  // 0G Compute ABI for acknowledgeProvider function
  const abi = [
    "function acknowledgeProvider(address provider) external",
  ];

  const contract = new ethers.Contract(
    process.env.ZG_COMPUTE_PROVIDER_ADDRESS,
    abi,
    signer
  );

  try {
    console.log("Acknowledging provider...");
    const tx = await contract.acknowledgeProvider(process.env.ZG_COMPUTE_PROVIDER_ADDRESS);
    console.log("Transaction submitted:", tx.hash);
    
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log("\n✅ Provider acknowledged successfully!");
      console.log("Wallet is now registered with 0G Compute provider.");
    }
  } catch (error) {
    console.error("Error acknowledging provider:", error);
    process.exit(1);
  }
}

acknowledgeProvider();
