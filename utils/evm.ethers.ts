import type { SafeEventEmitterProvider } from "@web3auth/base";
import { ethers } from "ethers";

export default class EthereumRpc {
  private provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  async getAccounts(): Promise<string> {
    try {
      const provider = new ethers.BrowserProvider(this.provider);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      return account;
    } catch (error: unknown) {
      return error as string;
    }
  }

  async getBalance(): Promise<string> {
    try {
      const provider = new ethers.BrowserProvider(this.provider);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      // Get user's balance in ether
      const balance = ethers.formatEther(
        await provider.getBalance(account) // Balance is in wei
      );
      return balance;
    } catch (error) {
      return error as string;
    }
  }

  async signMessage(msg: string): Promise<string> {
    try {
      const provider = new ethers.BrowserProvider(this.provider);
      const signer = await provider.getSigner();

      const originalMessage = msg;

      const signedMessage = await signer.signMessage(originalMessage);
      return signedMessage;
    } catch (error) {
      return error as string;
    }
  }

  async signAndSendTransaction(): Promise<string> {
    try {
      const provider = new ethers.BrowserProvider(this.provider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const tx = await signer.sendTransaction({
        to: address,
        value: ethers.parseEther("0.0001"),
      });
      const receipt = await tx.wait();
      return (await receipt?.getTransaction())?.hash || "0x0";
    } catch (error) {
      return error as string;
    }
  }
}
