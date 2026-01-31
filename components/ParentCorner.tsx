
import React from 'react';
import { connectWallet } from '../services/solana';

interface ParentCornerProps {
  walletAddress: string | null;
  setWalletAddress: (addr: string | null) => void;
  onBack: () => void;
  onLogOut: () => void;
}

const ParentCorner: React.FC<ParentCornerProps> = ({ walletAddress, setWalletAddress, onBack, onLogOut }) => {
  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) setWalletAddress(addr);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
  };

  return (
    <div className="flex-1 flex flex-col p-10 bg-stone-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-stone-800">🔐 Parent Corner</h2>
        <button onClick={onBack} className="text-stone-400 font-bold hover:text-stone-600 transition-colors">Back to App</button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
            <h3 className="text-xl font-bold text-stone-700 flex items-center gap-2">
              <span>🔌</span> Solana Wallet
            </h3>
            <p className="text-stone-500 leading-relaxed text-sm">
              Connect a parent wallet to store badges as NFTs on Solana Devnet.
            </p>

            {walletAddress ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Status: Active</p>
                  <p className="text-stone-600 font-mono text-xs break-all">{walletAddress}</p>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="w-full py-3 text-red-500 font-bold border-2 border-red-50 hover:bg-red-50 rounded-2xl transition-all"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button 
                onClick={handleConnect}
                className="w-full py-4 bg-stone-800 text-white font-black text-lg rounded-2xl shadow-lg hover:bg-stone-900 transition-all flex items-center justify-center gap-3"
              >
                Connect Wallet
              </button>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-4">
            <h3 className="text-xl font-bold text-stone-700 flex items-center gap-2">
              <span>👤</span> Account Settings
            </h3>
            <button 
              onClick={onLogOut}
              className="w-full py-4 bg-red-500 text-white font-black text-lg rounded-2xl shadow-lg hover:bg-red-600 transition-all"
            >
              Log Out of Piggy
            </button>
            <p className="text-xs text-stone-400 text-center">Your badges and progress are saved to your account.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
          <h3 className="text-xl font-bold text-stone-700 flex items-center gap-2">
            <span>⚙️</span> Badge Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
              <div>
                <p className="font-bold text-stone-700 text-sm">On-Chain Minting</p>
                <p className="text-xs text-stone-400">Mint badges as Solana NFTs</p>
              </div>
              <div className="w-12 h-6 bg-pink-500 rounded-full flex items-center justify-end px-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-blue-600 text-xs font-bold uppercase mb-1">Network Info</p>
              <p className="text-blue-800 text-sm font-medium italic">Current Network: Solana Devnet</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 italic">
            Note: Badges are educational tokens. They help your child visualize progress on their financial literacy journey.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentCorner;
