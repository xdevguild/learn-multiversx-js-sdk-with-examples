import {
  TransactionComputer,
  Address,
  TransactionsFactoryConfig,
  TransferTransactionsFactory,
} from "@multiversx/sdk-core";
import {
  receiverAddress,
  syncAndGetAccount,
  senderAddress,
  getSigner,
  apiNetworkProvider,
} from "./setup.js";

const makeTransfer = async () => {
  const user = await syncAndGetAccount();
  const computer = new TransactionComputer();
  const signer = await getSigner();

  // Prepare transfer transactions factory
  const factoryConfig = new TransactionsFactoryConfig({ chainID: "D" });
  const factory = new TransferTransactionsFactory({ config: factoryConfig });

  // Transfer native EGLD token (value transfer, the same as with the simple transaction)
  const egldTransaction = factory.createTransactionForNativeTokenTransfer({
    sender: new Address(senderAddress),
    receiver: new Address(receiverAddress),
    // 0.01 EGLD (EGLD has 18 decimal places)
    nativeAmount: BigInt("10000000000000000"),
  });

  egldTransaction.nonce = user.getNonceThenIncrement();

  const serializedEgldTransaction =
    computer.computeBytesForSigning(egldTransaction);

  egldTransaction.signature = await signer.sign(serializedEgldTransaction);

  const txHash = await apiNetworkProvider.sendTransaction(egldTransaction);

  console.log(
    "EGLD sent. Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

makeTransfer();
