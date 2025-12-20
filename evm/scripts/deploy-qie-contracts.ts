import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying QIE Stealth Address contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy StealthAddressRegistry first
  console.log("\nDeploying StealthAddressRegistry...");
  const StealthAddressRegistry = await ethers.getContractFactory("StealthAddressRegistry");
  const registry = await StealthAddressRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("StealthAddressRegistry deployed to:", registryAddress);

  // Deploy PaymentManager with registry address
  console.log("\nDeploying PaymentManager...");
  const PaymentManager = await ethers.getContractFactory("PaymentManager");
  const paymentManager = await PaymentManager.deploy(registryAddress);
  await paymentManager.waitForDeployment();
  const paymentManagerAddress = await paymentManager.getAddress();
  console.log("PaymentManager deployed to:", paymentManagerAddress);

  // Save deployment addresses to a JSON file
  const deploymentInfo = {
    network: "qie-testnet",
    chainId: (await deployer.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      StealthAddressRegistry: {
        address: registryAddress,
        constructorArgs: []
      },
      PaymentManager: {
        address: paymentManagerAddress,
        constructorArgs: [registryAddress]
      }
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, "qie-testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", deploymentFile);

  // Verify contracts (if verification is available)
  console.log("\nDeployment completed successfully!");
  console.log("StealthAddressRegistry:", registryAddress);
  console.log("PaymentManager:", paymentManagerAddress);
  
  // Test basic functionality
  console.log("\nTesting basic functionality...");
  
  try {
    // Test registry
    const metaAddressCount = await registry.getMetaAddressCount(deployer.address);
    console.log("Initial meta address count for deployer:", metaAddressCount.toString());
    
    // Test payment manager
    const registryFromPaymentManager = await paymentManager.registry();
    console.log("Registry address from PaymentManager:", registryFromPaymentManager);
    console.log("Registry addresses match:", registryFromPaymentManager === registryAddress);
    
    console.log("Basic functionality tests passed!");
  } catch (error) {
    console.error("Error testing basic functionality:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });