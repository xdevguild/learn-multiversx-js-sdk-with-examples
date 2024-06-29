import { promises } from "node:fs";
import {
  Address,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  TransactionComputer,
  AbiRegistry,
  QueryRunnerAdapter,
  SmartContractQueriesController,
} from "@multiversx/sdk-core";
import {
  syncAndGetAccount,
  senderAddress,
  getSigner,
  apiNetworkProvider,
} from "./setup.js";

/**
 * Replace with your own deployed piggy bank smart contract
 * check deploy-smart-contract.js on how to deploy one
 */
const PIGGYBANK_CONTRACT_ADDRESS =
  "erd1qqqqqqqqqqqqqpgqtrajzw4vq0zxccdt9u66cvgg6vz8c6cwnegqkfqkpq";

/**
 * Load ABI file
 */
const getAbi = async () => {
  const abiFile = await promises.readFile("./piggybank.abi.json", "UTF-8");
  return JSON.parse(abiFile);
};

const scTransaction = async ({ functionName, args, amount }) => {
  const user = await syncAndGetAccount();
  const computer = new TransactionComputer();
  const signer = await getSigner();

  const abiObj = await getAbi();

  const factoryConfig = new TransactionsFactoryConfig({ chainID: "D" });
  const factory = new SmartContractTransactionsFactory({
    config: factoryConfig,
    abi: AbiRegistry.create(abiObj),
  });

  const transaction = factory.createTransactionForExecute({
    sender: new Address(senderAddress),
    contract: Address.fromBech32(PIGGYBANK_CONTRACT_ADDRESS),
    function: functionName,
    gasLimit: 5000000,
    arguments: args || [],
    nativeTransferAmount: amount,
  });

  // Increase the nonce
  transaction.nonce = user.getNonceThenIncrement();

  // Serialize the transaction for signing
  const serializedTransaction = computer.computeBytesForSigning(transaction);

  // Sign the transaction with our signer
  transaction.signature = await signer.sign(serializedTransaction);

  // Broadcast the transaction
  const txHash = await apiNetworkProvider.sendTransaction(transaction);

  console.log(
    "Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

/**
 * Call the createPiggy endpoint on the PiggyBank smart contract
 * https://github.com/xdevguild/piggy-bank-sc/blob/master/src/lib.rs#L25
 * We pass the unix timestamp in the future
 */
const createPiggy = async () => {
  await scTransaction({
    functionName: "createPiggy",
    args: [1750686756],
  });
};

/**
 * Call the addAmount endpoint on the PiggyBank smart contract
 * https://github.com/xdevguild/piggy-bank-sc/blob/master/src/lib.rs#L42
 */
const addAmount = async () => {
  await scTransaction({
    functionName: "addAmount",
    amount: 1000000000000000n,
  });
};

/**
 * Query the getLockedAmount endpoint on the PiggyBank smart contract
 * https://github.com/xdevguild/piggy-bank-sc/blob/master/src/lib.rs#L92
 */
const getLockedAmount = async () => {
  const abiObj = await getAbi();

  const queryRunner = new QueryRunnerAdapter({
    networkProvider: apiNetworkProvider,
  });

  const controller = new SmartContractQueriesController({
    queryRunner: queryRunner,
    abi: AbiRegistry.create(abiObj),
  });

  const query = controller.createQuery({
    contract: PIGGYBANK_CONTRACT_ADDRESS,
    function: "getLockedAmount",
    arguments: [senderAddress],
  });

  const response = await controller.runQuery(query);

  const [amount] = controller.parseQueryResponse(response);

  // The returned amount is a BigNumber
  console.log("Locked amount is: ", amount.valueOf());
};

/**
 * Here we will manage which function to call
 */
const smartContractInteractions = () => {
  const args = process.argv.slice(2);
  const functionName = args[0];

  const functions = {
    createPiggy,
    addAmount,
    getLockedAmount,
  };

  if (functionName in functions) {
    functions[functionName]();
  } else {
    console.log("Function not found!");
  }
};

smartContractInteractions();
