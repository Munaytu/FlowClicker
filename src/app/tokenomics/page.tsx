'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, HelpCircle, Wallet } from "lucide-react";

export default function TokenomicsPage() {
  return (
    <div className="container py-10 animate-fade-in">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Understanding FlowClicker Tokenomics</h1>
          <p className="mt-2 text-lg text-muted-foreground">How rewards work and how to get started.</p>
        </div>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Token Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>The total supply of tokens is fixed. When tokens are claimed, a small fee is distributed to support the project's growth and sustainability. Here is the breakdown:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><span className="font-medium text-foreground">Developer Fund (10%):</span> To support ongoing development and new features.</li>
              <li><span className="font-medium text-foreground">Foundation (5%):</span> For marketing, partnerships, and community grants.</li>
              <li><span className="font-medium text-foreground">Burn (5%):</span> A portion of tokens are permanently removed from circulation (burned), which can help stabilize the token's value.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              How the Reward System Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><span className="font-bold">1. Click:</span> Play the game and click the button. Each click is recorded on our server.</p>
            <p><span className="font-bold">2. Earn:</span> For every click you make, you generate a proportional amount of claimable tokens. The more you click, the more you can claim.</p>
            <p><span className="font-bold">3. Claim:</span> When you're ready, you can claim your earned tokens. This is a transaction on the blockchain that will send the tokens to your wallet. You will need a small amount of the native currency (Sonic) to pay for the transaction fee (gas).</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Beginner's Guide: Getting a Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>To store your tokens and interact with the game, you need a crypto wallet. A wallet is like a digital bank account that you control.</p>
            <h3 className="font-bold">Recommended Wallets:</h3>
            <p>We recommend using one of these popular and secure browser-extension wallets:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">MetaMask</a>: The most popular choice for browser wallets.</li>
              <li><a href="https://www.rainbow.me/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rainbow Wallet</a>: A user-friendly and beautifully designed wallet.</li>
              <li><a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Coinbase Wallet</a>: A great option for those new to crypto.</li>
            </ul>
            <p className="mt-4">After installing a wallet extension in your browser, follow its instructions to create a new wallet. <span className="font-bold text-destructive">IMPORTANT:</span> Be sure to write down your seed phrase and store it in a safe, private place. Never share it with anyone.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
