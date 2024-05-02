import {
  TransactionComputer,
  Address,
  TransactionsFactoryConfig,
  TransferTransactionsFactory,
  TokenTransfer,
  Token,
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
  const multiTransferTransaction =
    factory.createTransactionForESDTTokenTransfer({
      sender: new Address(senderAddress),
      receiver: new Address(receiverAddress),
      tokenTransfers: [
        new TokenTransfer({
          token: new Token({
            identifier: "ELVNFACE-762e9d",
            nonce: BigInt("90"),
          }),
          // Send 1, it is always 1 for NFTs
          amount: BigInt("1"), // or 1n
        }),
        new TokenTransfer({
          token: new Token({ identifier: "DEMSFT-00eac9", nonce: BigInt("1") }),
          // Send 10
          amount: BigInt("10"), // or 10n
        }),
        new TokenTransfer({
          token: new Token({ identifier: "DEMFUNGI-3ec13b" }),
          // Send 10, remember about 18 decimal places
          amount: BigInt("10000000000000000000"), // or 10000000000000000000n
        }),
      ],
    });

  multiTransferTransaction.nonce = user.getNonceThenIncrement();

  const serializedmultiTransferTransaction = computer.computeBytesForSigning(
    multiTransferTransaction
  );

  multiTransferTransaction.signature = await signer.sign(
    serializedmultiTransferTransaction
  );

  const txHash = await apiNetworkProvider.sendTransaction(
    multiTransferTransaction
  );

  console.log(
    "Multiple ESDTs sent. Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

makeTransfer();
