# FlowClicker

Welcome to FlowClicker, an addictive clicker game built on modern web3 technologies. This isn't just a game; it's an experiment in community-driven value creation where every click contributes to a global economy.

![FlowClicker Gameplay](https://i.imgur.com/your-gameplay-image.png) <!-- Replace with a real image URL -->

## ✨ Core Concept

FlowClicker is a simple game with a deep economic model:

-   **Click to Earn:** Every click you make accumulates a balance of `$FLOW` tokens.
-   **Global Competition:** Your clicks contribute to your country's total score, placing you in a friendly global competition.
-   **Claim Your Rewards:** The tokens you accumulate can be claimed on-chain to your personal crypto wallet, giving you true ownership.

## ⚙️ How It Works: A Quick Technical Overview

FlowClicker is built with a modern tech stack designed for performance, scalability, and a seamless user experience.

-   **Frontend:** Next.js & React
-   **Styling:** Tailwind CSS & shadcn/ui
-   **Web3:** Wagmi & Viem for wallet interaction and smart contract communication.
-   **Backend/DB:** Next.js API Routes with Supabase for database management.

### The `Accumulate -> Claim` Model

To ensure a smooth and gas-free gaming experience, user actions are split into two phases:

1.  **Accumulation (Off-Chain):** Your clicks are rapidly tallied and stored in our Supabase database. This process is instant and requires no gas fees, allowing for fast-paced gameplay.
2.  **Claim (On-Chain):** When you're ready to receive your rewards, you initiate a `claim` transaction. Our backend generates a secure signature, and you submit it to the smart contract, which then mints your accumulated `$FLOW` tokens directly to your wallet. This is the only step that requires a gas fee.

### 🪙 The Emission Model: 3-Year Linear Decay

The `FlowClicker.sol` smart contract governs the token economy with a transparent and predictable emission schedule.

The reward for each click starts at a maximum value (`INITIAL_REWARD_PER_CLICK`) and decreases linearly over a fixed **3-year period** (`DECAY_DURATION_SECONDS`) until it reaches a permanent minimum value (`FINAL_REWARD_PER_CLICK`).

This model heavily incentivizes early participation while ensuring the long-term sustainability of the token economy.

## 🚀 Getting Started

Ready to play? Here’s how:

1.  **Get a Wallet:** You need a web3 wallet like [MetaMask](https://metamask.io/) or [Rabby](https://rabby.io/).
2.  **Connect:** Visit the FlowClicker site and connect your wallet.
3.  **Click:** Navigate to the game page and start clicking to accumulate `$FLOW`.
4.  **Claim:** Once you've accumulated enough tokens, claim them to your wallet by paying a small gas fee on the Sonic network.

## 🛠️ Running Locally

To run the project on your own machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Munaytu/FlowClicker.git
    cd FlowClicker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the necessary environment variables (e.g., Supabase keys).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:9002`.