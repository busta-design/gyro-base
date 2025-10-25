<div align="center">
  <img src="/public/Gyro .png" alt="GYRO Wallet Logo" width="200"/>
  <h1 align="center">GYRO Wallet</h1>
  <p align="center">
    A modern and secure digital wallet
    <br />
    <a href="https://gyro-base.vercel.app/"><strong>Explore the demo »</strong></a>
    <br />
    <br />
  </p>
</div>



# GYRO Base

Fintech web app (Next.js App Router) for USDC on/off-ramp on Base Sepolia with Privy smart wallets, deposit by QR, withdrawals, transfers, and staking with a custom smart contract.

## Main features
- **Dashboard**: USDC balance, exchange rates, quick actions
- **Ads**: watch ads to earn “coins” (1 coin = $0.10, local persistence)
- **My Account**: user details, wallet address, navigation
- **Deposit**: bank transfer QR (mock) with Bs→USDC conversion
- **Receive**: QR and address to receive USDC on Base Sepolia
- **Withdraw**: flows for bank transfers (Bs) or USDC on-chain sends
- **QR Transfer**: send USDC by scanning recipient QR
- **Earn with GYRO**: USDC staking using a custom contract (5% APY)

## Tech stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind-like utilities
- **Wallet**: Privy Smart Wallets (`@privy-io/react-auth`) with optional paymaster
- **Blockchain**: Base Sepolia, viem for reads/tx data encoding
- **Contracts**: project USDC + custom staking contract

## Contracts and addresses (Base Sepolia)
Defined in `lib/constants/contractAddresses.ts`:
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Staking**: `0x3d8B53368Bbc655ECA11A07dDfE2f47D03254D21`

https://sepolia.basescan.org/address/0x3d8B53368Bbc655ECA11A07dDfE2f47D03254D21#code

ABIs in `lib/constants/abi/`:
- `usdcAbi.ts` (exports `USDC_ABI`)
- `stakingAbi.ts` (exports `STAKING_ABI`)

## Project structure
```
app/
├── dashboard/          # Home with balance and quick actions
├── ads/                # Watch ads, earn coins
├── account/            # My account, user details
├── deposit-qr/         # Bank deposit QR
├── receive/            # Receive USDC (QR + address)
├── withdraw/           # Withdrawals (Bs/USDC)
├── qr-transfer/        # Transfer via QR
├── earn/               # USDC staking
├── fund/               # Configure deposit amount
├── funding/            # Funding method selector
└── api/
    ├── rates/          # Bs/USDC exchange rates
    ├── mock/           # Bank deposit simulation
    ├── webhook/        # Withdrawal processing
    └── transactions/   # History (placeholder)

contracts/src/
└── Staking.sol         # Custom staking contract

lib/constants/
├── abi/                # Contract ABIs
└── contractAddresses.ts

## Earn with GYRO (Staking)
Custom contract (`contracts/src/Staking.sol`) with:
- **APY**: fixed 5% APY
- **Fee**: 0.3% charged only on rewards when withdrawing/claiming
- **No fee on stake**: users deposit 100% of their amount
- **Core functions**:
  - `stake(amount)`: deposit USDC
  - `claimRewards()`: claim rewards only (fee applies)
  - `withdraw(amount)`: withdraw principal + rewards (fee on rewards only)
  - `calculateRewards(user)`: view pending rewards

The UI (`/earn`) provides:
- Auto-refresh every 3s to show rewards in near real-time
- Immediate refresh after each transaction
- Automatic USDC allowance management
- Loading states and error handling

## Environment variables
Create `.env.local`:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
BOB_USDC_RATE_DEPOSIT=12.60    # Deposit rate (1 USD = X Bs)
BOB_USDC_RATE_WITHDRAWL=12.40  # Withdrawal rate
```

## Main flows

### Add funds
1. `/fund` → set amount in Bs
2. `/deposit-qr` → generate QR with transfer details
3. Simulate bank payment (mock) → receive USDC in wallet

### Withdraw
1. `/withdraw` → choose type (Bs or USDC)
2. `/withdraw/new?type=bs` → pick bank account
3. `/withdraw/new?type=usdc` → send USDC on-chain
4. `/withdraw/success` → confirmation

### Staking
1. `/earn` → view balance, staked, rewards
2. Stake → approve USDC + deposit
3. Claim → claim rewards only (0.3% fee on rewards)
4. Withdraw → withdraw principal + rewards (fee on rewards only)

## Setup & usage
```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Development
pnpm dev

# Production
pnpm build
pnpm start

# Lint
pnpm lint
```


## Core APIs
- `GET /api/rates`: current exchange rates
- `POST /api/mock/bank-deposit`: simulate a bank deposit
- `POST /api/webhook/bank/withdraw`: process USDC→Bs withdrawal

## Troubleshooting

### Paymaster/Gas sponsor
If you use a gas sponsor, allowlist these addresses:
- `SEPOLIA_BASE_USDC` (for transfers/approvals)
- `SEPOLIA_BASE_STAKING` (for stake/claim/withdraw)

**GYRO Base** - Fintech app to explore on/off‑ramp and DeFi on Base Sepolia 🚀
