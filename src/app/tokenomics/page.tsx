"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useSwitchChain } from "wagmi";
import { config, sonicMainnet } from "@/lib/wagmi";

const TokenomicsPage = () => {
  const { switchChain } = useSwitchChain({ config });

  const handleSwitchNetwork = () => {
    switchChain({ chainId: sonicMainnet.id });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to FlowClicker
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your Adventure in the Crypto Universe. Here you will learn how your
          clicks turn into real value, in a simple and transparent way.
        </p>
      </header>

      <main className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Part 1: The Game - From Clicks to Digital Coins
            </CardTitle>
            <CardDescription>
              FlowClicker is simple, but its engine is revolutionary. Understand
              how it works.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              Unlike other games, in FlowClicker the points you earn are truly
              yours, in the form of a cryptocurrency called{" "}
              <strong>$FLOW</strong>. The process is divided into two key phases:
              Accumulate and Claim.
            </p>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold">
                  Phase 1: Accumulate Clicks (Free & Instant!)
                </AccordionTrigger>
                <AccordionContent className="text-base">
                  <p>
                    When you click in the game, your balance of claimable $FLOW
                    increases. This action is <strong>free</strong>. It is not a
                    blockchain transaction, so it does not cost "gas" and is
                    instantaneous. You are accumulating your future reward on our
                    servers, competing against other players and countries in
                    real-time.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold">
                  Phase 2: Claim Tokens (The Blockchain Transaction)
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4">
                  <p>
                    When you decide you have accumulated enough tokens, you can
                    "Claim" them. This is the moment you interact with the
                    blockchain to transfer the $FLOW from our system to your
                    personal wallet.{" "}
                    <strong>This is the only step that requires a "gas" fee.</strong>
                  </p>
                  <div>
                    <h4 className="font-bold">Tools You&apos;ll Need:</h4>
                    <ul className="list-disc list-inside mt-2 space-y-2">
                      <li>
                        <strong>A Digital Wallet:</strong> It&apos;s an app like{" "}
                        <a
                          href="https://metamask.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          MetaMask
                        </a>{" "}
                        or{" "}
                        <a
                          href="https://rabby.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Rabby
                        </a>
                        . It acts as your personal vault and your identity in the
                        crypto world. Remember:{" "}
                        <strong>
                          NEVER share your 12-word "seed phrase".
                        </strong>
                      </li>
                      <li>
                        <strong>The Correct Network:</strong> FlowClicker operates on the{" "}
                        <strong>Sonic Mainnet</strong>. Your wallet must be
                        connected to this network to be able to claim.
                        <div className="my-3">
                          <Button onClick={handleSwitchNetwork}>
                            Add/Switch to Sonic Mainnet
                          </Button>
                        </div>
                        <details className="text-sm text-muted-foreground">
                          <summary>Or add it manually</summary>
                          <p className="mt-2 bg-muted p-3 rounded-md">
                            Name: <code>Sonic</code> <br />
                            RPC URL: <code>https://rpc.soniclabs.com</code> <br />
                            Chain ID: <code>146</code> <br />
                            Symbol: <code>S</code> <br />
                            Explorer: <code>https://sonicscan.org</code>
                          </p>
                        </details>
                      </li>
                      <li>
                        <strong>Gas for the Transaction:</strong> To pay the
                        network fee, you need a small amount of Sonic&apos;s native
                        token, called <strong>&apos;S&apos;</strong>. You must acquire &apos;S&apos;
                        through a "Bridge" (from another blockchain) or an
                        "Exchange" that supports it. Check the official Sonic
                        channels for this information.
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Part 2: Tokenomics - The Economy of FlowClicker
            </CardTitle>
            <CardDescription>
              Where does $FLOW come from and why could it have value?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="text-xl font-semibold">
              $FLOW Creation: The Players&apos; Factory
            </h3>
            <p>
              The supply of $FLOW starts at ZERO. The tokens do not exist
              until a player claims them. The FlowClicker smart contract acts
              like a machine that <strong>"mints"</strong> (creates) new
              tokens the very instant a player executes a "Claim" transaction.
              The power to create the currency is, literally, in the hands of
              the community.
            </p>

            <h3 className="text-xl font-semibold">
              The Value: Supply, Demand, and Utility
            </h3>
            <p>The value of $FLOW is not magical. It is based on two principles:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Supply and Demand:</strong> The supply is controlled by
                the players when they claim tokens. The demand is created by the
                community. If the game is popular, more people will want to own
                $FLOW. If demand grows faster than supply, the value of the
                token tends to rise.
              </li>
              <li>
                <strong>Future Utility:</strong> Value will also come from its
                use. In the future, you might need $FLOW to buy upgrades (more
                tokens per click, shorter cooldowns), customize your game, or
                even vote on decisions about the future of FlowClicker.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Part 3: The Linear Decay Emission Model
            </CardTitle>
            <CardDescription>
              This section details the definitive economic mechanism of the <code>FlowClicker.sol</code> smart contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold">
                  For Beginners: A 3-Year Countdown for Bonus Rewards
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4">
                  <p>
                    Imagine the game&apos;s bonus rewards as a giant block of ice that melts over exactly <strong>3 years</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      At launch, the ice block is whole, and every click gives the highest possible reward (<strong>1 token</strong>).
                    </li>
                    <li>
                      For the next 3 years, the block melts at a slow, constant, and predictable rate. As it melts, the reward you get per click also decreases steadily.
                    </li>
                    <li>
                      After exactly 3 years, the main bonus block has completely melted. From that moment on, every click will give a smaller, permanent reward (<strong>0.01 tokens</strong>) forever.
                    </li>
                  </ul>
                  <p className="font-semibold text-primary">
                    This system is fair and transparent. It&apos;s designed to heavily reward the earliest players while ensuring the game remains viable and rewarding for years to come.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold">
                  For Experts: Technical Deep Dive
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4">
                  <p>
                    The emission model is a <strong>linear decay</strong> over a fixed period. The core logic is handled by the <code>getCurrentReward()</code> view function.
                  </p>
                  <h4 className="font-bold">Core Governance Constants:</h4>
                  <ul className="list-mono list-disc list-inside bg-muted p-4 rounded-md">
                    <li><code>DECAY_DURATION_SECONDS</code>: A fixed value of <strong>94,608,000</strong> (3 years * 365 days * 24 hours * 3600 seconds).</li>
                    <li><code>INITIAL_REWARD_PER_CLICK</code>: The starting reward at launch, set to <strong>1 token</strong>.</li>
                    <li><code>FINAL_REWARD_PER_CLICK</code>: The permanent reward after the decay period ends, set to <strong>0.01 tokens</strong>.</li>
                  </ul>

                  <h4 className="font-bold">The Linear Interpolation Algorithm:</h4>
                   <ol className="list-decimal list-inside space-y-2">
                    <li><strong>Calculate Elapsed Time:</strong> The contract gets the time since launch: <code>elapsed = block.timestamp - LAUNCH_TIME</code>.</li>
                    <li><strong>Check if Decay Period is Over:</strong> If <code>elapsed >= DECAY_DURATION_SECONDS</code>, the function simply returns <code>FINAL_REWARD_PER_CLICK</code>.</li>
                    <li><strong>Calculate Total Reward Range:</strong> The total amount of reward that will decay over the 3 years is calculated: <code>rewardRange = INITIAL_REWARD_PER_CLICK - FINAL_REWARD_PER_CLICK</code>.</li>
                    <li><strong>Calculate Current Decay:</strong> The amount of reward that has decayed so far is found by calculating how far into the 3-year period we are: <code>decayedAmount = (rewardRange * elapsed) / DECAY_DURATION_SECONDS</code>.</li>
                    <li><strong>Determine Current Reward:</strong> The current reward is the starting reward minus the amount that has decayed: <code>currentReward = INITIAL_REWARD_PER_CLICK - decayedAmount</code>.</li>
                  </ol>
                  <p>
                    The main <code>claim()</code> function uses this returned value from <code>getCurrentReward()</code> to mint the precise amount of tokens.
                  </p>
                   <p className="mt-4 text-muted-foreground">
                    This model creates a perfectly predictable and autonomous emission curve. The rules are locked in the contract, providing fairness and transparency. The code is the law.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TokenomicsPage;