import { promises } from "node:fs";
import { Address, Account } from "@multiversx/sdk-core";
import { ApiNetworkProvider } from "@multiversx/sdk-network-providers";
import { UserSigner } from "@multiversx/sdk-wallet";

export const senderAddress =
  "erd10dgr4hshjgkv6wxgmzs9gaxk5q27cq2sntgwugu87ah5pelknegqc6suj6";
export const receiverAddress =
  "erd176ddeqqde20rhgej35taa5jl828n9z4pur52x3lnfnj75w4v2qyqa230vx";

const keyFilePath = `./${senderAddress}.json`;

// Should be always kept privately, here hardcoded for the demo
const password = "Ab!12345678";

// The convenient way of doing network requests using the devnet API
export const apiNetworkProvider = new ApiNetworkProvider(
  "https://devnet-api.multiversx.com"
);

export const syncAndGetAccount = async () => {
  const address = new Address(senderAddress);
  const userAccount = new Account(address);
  const userAccountOnNetwork = await apiNetworkProvider.getAccount(address);
  userAccount.update(userAccountOnNetwork);
  return userAccount;
};

const getKeyFileObject = async () => {
  const fileContents = await promises.readFile(keyFilePath, {
    encoding: "utf-8",
  });
  return fileContents;
};

export const getSigner = async () => {
  const wallet = await getKeyFileObject();
  return UserSigner.fromWallet(JSON.parse(wallet), password);
};
