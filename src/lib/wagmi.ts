
import { createModal, getDefaultConfig } from "@rabby-wallet/rabbykit";
import { createConfig, http } from "@wagmi/core";
import { mainnet, arbitrum, bsc, optimism, polygon } from "@wagmi/core/chains";

const sonic = {
    id: 146,
    name: 'Sonic',
    network: 'sonic',
    nativeCurrency: { name: 'S', symbol: 'S', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] },
        public: { http: ['https://rpc.soniclabs.com'] },
    },
    blockExplorers: {
        default: { name: 'SonicScan', url: 'https://sonicscan.org' },
    },
    testnet: false,
};

export const config = createConfig(
  getDefaultConfig({
    appName: "FlowClicker",
    appUrl: "https://flow-clicker.vercel.app/",
    appIcon: "https://flow-clicker.vercel.app/favicon.ico",
    projectId: "58a22d2bc1c793fc31c117ad9ceba8d9", // Please replace with your own project ID
    chains: [sonic, mainnet, arbitrum, bsc, optimism, polygon],
    transports: {
      [sonic.id]: http(),
      [mainnet.id]: http('https://eth.drpc.org'),
      [arbitrum.id]: http('https://arbitrum.drpc.org'),
      [bsc.id]: http('https://bsc.drpc.org'),
      [optimism.id]: http('https://optimism.drpc.org'),
      [polygon.id]: http('https://polygon.drpc.org'),
    },
  })
);

export const rabbykit = createModal({
  wagmi: config,
});
