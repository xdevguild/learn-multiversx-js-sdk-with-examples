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
  const semiFungibleTransaction = factory.createTransactionForESDTTokenTransfer(
    {
      sender: new Address(senderAddress),
      receiver: new Address(receiverAddress),
      tokenTransfers: [
        new TokenTransfer({
          token: new Token({ identifier: "DEMSFT-00eac9", nonce: BigInt("1") }),
          // Send 10
          amount: BigInt("10"), // or 10n
        }),
      ],
    }
  );

  semiFungibleTransaction.nonce = user.getNonceThenIncrement();

  const serializedsemiFungibleTransaction = computer.computeBytesForSigning(
    semiFungibleTransaction
  );

  semiFungibleTransaction.signature = await signer.sign(
    serializedsemiFungibleTransaction
  );

  const txHash = await apiNetworkProvider.sendTransaction(
    semiFungibleTransaction
  );

  console.log(
    "Semi-fungible ESDT sent. Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

makeTransfer();
