import { promises } from "node:fs";
import {
  TransactionComputer,
  TransactionsFactoryConfig,
  SmartContractTransactionsFactory,
  Code,
  Address,
  AbiRegistry,
  TransactionWatcher,
  SmartContractTransactionsOutcomeParser,
  TransactionsConverter,
} from "@multiversx/sdk-core";
import {
  syncAndGetAccount,
  senderAddress,
  getSigner,
  apiNetworkProvider,
} from "./setup.js";

const deploySmartContract = async () => {
  const user = await syncAndGetAccount();
  const computer = new TransactionComputer();
  const signer = await getSigner();

  // Load smart contract code
  // For source code check: https://github.com/xdevguild/piggy-bank-sc/tree/master
  const codeBuffer = await promises.readFile("./piggybank.wasm");
  const code = Code.fromBuffer(codeBuffer);

  // Load ABI file (not required for now, but will be useful when interacting with the SC)
  // Although it would be helpful if we had initial arguments to pass
  const abiFile = await promises.readFile("./piggybank.abi.json", "UTF-8");
  const abiObj = JSON.parse(abiFile);

  // Prepare transfer transactions factory
  const factoryConfig = new TransactionsFactoryConfig({ chainID: "D" });
  let scFactory = new SmartContractTransactionsFactory({
    config: factoryConfig,
    abi: AbiRegistry.create(abiObj),
  });

  // Prepare deploy transaction
  const deployTransaction = scFactory.createTransactionForDeploy({
    sender: new Address(senderAddress),
    bytecode: code.valueOf(),
    gasLimit: 10000000n,
    arguments: [], // Pass arguments for init function on SC, we don't have any on this smart contract
    // Below ones are optional with default values
    nativeTransferAmount: 0, // Sometimes you need to send EGLD to the init function on SC
    isUpgradeable: true, // You will be able to upgrade the contract
    isReadable: false, // You will be able to read its state through another contract
    isPayable: false, // You will be able to send funds to it
    isPayableBySmartContract: false, // Only smart contract can send funds to it
  });

  // Increase the nonce
  deployTransaction.nonce = user.getNonceThenIncrement();

  // Serialize the transaction for signing
  const serializedDeployTransaction =
    computer.computeBytesForSigning(deployTransaction);

  // Sign the transaction with out signer
  deployTransaction.signature = await signer.sign(serializedDeployTransaction);

  // Broadcast the transaction
  const txHash = await apiNetworkProvider.sendTransaction(deployTransaction);

  // You can compute the smart contract addres before broadcasting the transaction
  // https://docs.multiversx.com/sdk-and-tools/sdk-js/sdk-js-cookbook-v13#computing-the-contract-address
  // But let's see how to get it from the network after deployment

  console.log("Pending...");

  // Get the transaction on network, we need to wait for results here, we use TransactionWatcher for that
  const transactionOnNetwork = await new TransactionWatcher(
    apiNetworkProvider
  ).awaitCompleted(txHash);

  // Now let's parse the results with TransactionsConverter and SmartContractTransactionsOutcomeParser
  const converter = new TransactionsConverter();
  const parser = new SmartContractTransactionsOutcomeParser();
  const transactionOutcome =
    converter.transactionOnNetworkToOutcome(transactionOnNetwork);
  const parsedOutcome = parser.parseDeploy({ transactionOutcome });

  console.log(
    `Smart Contract deployed. Here it is:\nhttps://devnet-explorer.multiversx.com/accounts/${parsedOutcome.contracts[0].address}\n\nCheck the transaction in the Explorer:\nhttps://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

deploySmartContract();
