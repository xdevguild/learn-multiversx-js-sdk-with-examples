import {
  Address,
  TokenManagementTransactionsFactory,
  TransactionComputer,
  TransactionsFactoryConfig,
  TokenManagementTransactionsOutcomeParser,
  TransactionsConverter,
  TransactionWatcher,
} from "@multiversx/sdk-core";
import {
  syncAndGetAccount,
  senderAddress,
  getSigner,
  apiNetworkProvider,
} from "./setup.js";

const collectionName = "NFTCollection";
const collectionTicker = "TTTTT";
const collectionId = "TTTTT-adfc1e"; // It will be the ticker + hash, you'll get it after issuance

const parseOutcome = async (txHash, type) => {
  console.log("Pending...");

  // Get the transaction on network, we need to wait for results here, we use TransactionWatcher for that
  const transactionOnNetwork = await new TransactionWatcher(
    apiNetworkProvider
  ).awaitCompleted(txHash);

  // Parse the outcome
  const converter = new TransactionsConverter();
  const parser = new TokenManagementTransactionsOutcomeParser();
  const transactionOutcome =
    converter.transactionOnNetworkToOutcome(transactionOnNetwork);

  let parsedOutcome;

  if (type === "issue") {
    parsedOutcome = parser.parseIssueNonFungible(transactionOutcome);

    console.log(`Token identifier: ${parsedOutcome?.[0]?.tokenIdentifier}`);
  }
  if (type === "create") {
    parsedOutcome = parser.parseNftCreate(transactionOutcome);

    console.log(
      `Token identifier: ${parsedOutcome?.[0]?.tokenIdentifier} Nonce: ${parsedOutcome?.[0]?.nonce}`
    );
  }
};

/**
 * Common operation to process each transaction
 */
const processTransaction = async (transaction, type) => {
  const user = await syncAndGetAccount();
  const computer = new TransactionComputer();
  const signer = await getSigner();

  // Increase the nonce
  transaction.nonce = user.getNonceThenIncrement();

  // Serialize the transaction for signing
  const serializedTransaction = computer.computeBytesForSigning(transaction);

  // Sign the transaction with our signer
  transaction.signature = await signer.sign(serializedTransaction);

  // Broadcast the transaction
  const txHash = await apiNetworkProvider.sendTransaction(transaction);

  await parseOutcome(txHash, type);

  console.log(
    "Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

const getTransactionFactory = () => {
  const factoryConfig = new TransactionsFactoryConfig({ chainID: "D" });
  const factory = new TokenManagementTransactionsFactory({
    config: factoryConfig,
  });
  return factory;
};

/**
 * Issue an NFT collection
 */
const issueNftCollection = () => {
  const factory = getTransactionFactory();

  const transaction = factory.createTransactionForIssuingNonFungible({
    canAddSpecialRoles: true,
    canChangeOwner: true,
    canFreeze: true,
    canPause: true,
    canTransferNFTCreateRole: true,
    canUpgrade: true,
    canWipe: true,
    sender: new Address(senderAddress),
    tokenName: collectionName,
    tokenTicker: collectionTicker,
  });

  processTransaction(transaction, "issue");
};

/**
 * Set special roles for the NFT collection
 */
const setSpecialRolesForNft = () => {
  const factory = getTransactionFactory();

  const transaction =
    factory.createTransactionForSettingSpecialRoleOnNonFungibleToken({
      addRoleNFTCreate: true,
      addRoleNFTBurn: true,
      addRoleNFTAddURI: true,
      addRoleNFTUpdateAttributes: true,
      addRoleESDTTransferRole: false,
      sender: new Address(senderAddress),
      tokenIdentifier: collectionId,
      user: new Address(senderAddress), // The owner of the role, in our case the same as sender
    });

  processTransaction(transaction);
};

/**
 * create an actual NFT
 */
const createNft = () => {
  const factory = getTransactionFactory();

  const attributes = new TextEncoder().encode(
    "metadata:bafybeihof6n2b4gkahn2nwfhcxe72kvms4o5uevcok5chvg6f2zpfsi6hq/33.json"
  );
  const hash = "";

  const transaction = factory.createTransactionForCreatingNFT({
    // You can read more about attributes in the docs. The data should be in the proper format to be picked up by MultiversX services like Explorer, etc.
    attributes,
    hash, // It can be any hash, for example hash of the attributes, images, etc. (not mandatory)
    initialQuantity: 1n, // It will be always 1 (BigInt) for NFT
    name: "Some NFT name for the token",
    royalties: 500, // number from 0 to 10000 where 10000 is 100%
    sender: new Address(senderAddress),
    tokenIdentifier: collectionId,
    uris: [
      "https://ipfs.io/ipfs/bafybeibimqon4pjm54x27n6we5qohx57gd6n2mnbkxu2r6nejp3nbenk7u/33.png",
      "https://ipfs.io/ipfs/bafybeihof6n2b4gkahn2nwfhcxe72kvms4o5uevcok5chvg6f2zpfsi6hq/33.json",
    ],
  });

  // Very custom gasLimit calculation. Sometimes (like in this case), the built-in gas calculation isn't enough
  // Check docs for more info on how gas limits are calculated
  // Anyway, you can define your own value through transaction.gasLimit
  transaction.gasLimit = BigInt(
    transaction.data.length * 1500 +
      (attributes?.length || 0 + hash?.length || 0) * 50000
  );

  processTransaction(transaction, "create");
};

/**
 * Here we will manage which function to call
 */
const nftManagement = () => {
  const args = process.argv.slice(2);
  const functionName = args[0];

  const functions = {
    issueNftCollection,
    setSpecialRolesForNft,
    createNft,
  };

  if (functionName in functions) {
    functions[functionName]();
  } else {
    console.log("Function not found!");
  }
};

nftManagement();
