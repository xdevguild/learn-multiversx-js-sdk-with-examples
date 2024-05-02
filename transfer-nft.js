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
  const nonFungibleTransaction = factory.createTransactionForESDTTokenTransfer({
    sender: new Address(senderAddress),
    receiver: new Address(receiverAddress),
    tokenTransfers: [
      new TokenTransfer({
        token: new Token({
          identifier: "ELVNFACE-762e9d",
          nonce: BigInt("86"),
        }),
        // Send 1, it is always 1 for NFTs
        amount: BigInt("1"), // or 1n
      }),
    ],
  });

  nonFungibleTransaction.nonce = user.getNonceThenIncrement();

  const serializednonFungibleTransaction = computer.computeBytesForSigning(
    nonFungibleTransaction
  );

  nonFungibleTransaction.signature = await signer.sign(
    serializednonFungibleTransaction
  );

  const txHash = await apiNetworkProvider.sendTransaction(
    nonFungibleTransaction
  );

  console.log(
    "Semi-fungible ESDT sent. Check in the Explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

makeTransfer();
