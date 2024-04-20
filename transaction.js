import { Transaction, TransactionComputer } from "@multiversx/sdk-core";
import {
  receiverAddress,
  syncAndGetAccount,
  senderAddress,
  getSigner,
  apiNetworkProvider,
} from "./setup.js";

const sendEgld = async () => {
  const user = await syncAndGetAccount();

  const transaction = new Transaction({
    data: Buffer.from("This is the demo transaction!"),
    gasLimit: 100000n,
    sender: senderAddress,
    receiver: receiverAddress,
    value: 1000000000000000n, // 0.001 EGLD
    chainID: "D",
  });

  transaction.nonce = user.getNonceThenIncrement();

  const computer = new TransactionComputer();
  const serializedTransaction = computer.computeBytesForSigning(transaction);

  const signer = await getSigner();

  transaction.signature = await signer.sign(serializedTransaction);

  const txHash = await apiNetworkProvider.sendTransaction(transaction);

  console.log(
    "Check in the explorer: ",
    `https://devnet-explorer.multiversx.com/transactions/${txHash}`
  );
};

sendEgld();
