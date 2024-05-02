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
  const fungibleTransaction = factory.createTransactionForESDTTokenTransfer({
    sender: new Address(senderAddress),
    receiver: new Address(receiverAddress),
    tokenTransfers: [
      new TokenTransfer({
        token: new Token({ identifier: "DEMFUNGI-3ec13b" }),
        // Send 10, remember about 18 decimal places
        amount: BigInt("10000000000000000000"), // or 10000000000000000000n
      }),
    ],
  });

  fungibleTransaction.nonce = user.getNonceThenIncrement();

  const serializedfungibleTransaction =
    computer.computeBytesForSigning(fungibleTransaction);

  fungibleTransaction.signature = await signer.sign(
    serializedfungibleTransaction
  );

  const txHash = await apiNetworkProvider.sendTransaction(fungibleTransaction);

  console.log(
    "Fungible ESDT sent. Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

makeTransfer();
