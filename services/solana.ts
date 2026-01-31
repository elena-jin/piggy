
import { Connection, clusterApiUrl, PublicKey, Transaction } from '@solana/web3.js';
import { Badge } from '../types';

const DEVNET_URL = clusterApiUrl('devnet');

export const getBadgeMetadata = (concept: string) => {
  if (concept.toLowerCase().includes('saving')) {
    return { name: "Saving Star", image: "🌟" };
  } else if (concept.toLowerCase().includes('want')) {
    return { name: "Needs vs Wants Hero", image: "🦸" };
  } else {
    return { name: "Smart Spender", image: "💎" };
  }
};

export const mintBadgeOnChain = async (walletAddress: string, concept: string, storyTitle: string): Promise<string> => {
  // In a real production environment, this would call a backend API that uses a master key to mint.
  // For this hackathon/demo, we simulate the on-chain latency and return a mock signature.
  console.log(`Minting ${concept} badge for ${walletAddress} on Solana Devnet...`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockSignature = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      resolve(mockSignature);
    }, 2000);
  });
};

export const getWalletAddress = async (): Promise<string | null> => {
  const { solana } = window as any;
  if (solana?.isPhantom) {
    try {
      const response = await solana.connect({ onlyIfTrusted: true });
      return response.publicKey.toString();
    } catch (err) {
      return null;
    }
  }
  return null;
};

export const connectWallet = async (): Promise<string | null> => {
  const { solana } = window as any;
  if (solana?.isPhantom) {
    try {
      const response = await solana.connect();
      return response.publicKey.toString();
    } catch (err) {
      console.error("Wallet connection failed", err);
      return null;
    }
  } else {
    window.open('https://phantom.app/', '_blank');
    return null;
  }
};
