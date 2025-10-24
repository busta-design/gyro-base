# GYRO Base — README (Español)

Aplicación web (Next.js App Router) para onramp/offramp en USDC sobre Base Sepolia con smart wallets (Privy), depósitos por QR, retiros en Bs/USDC y una pantalla de “Ganar con GYRO” que permite invertir USDC en Uniswap v3 para obtener rendimiento por comisiones del AMM.

## Demo rápido
- Dashboard: saldo, atajos a Depositar, Retirar y Ganar con GYRO.
- Depositar (QR): genera un QR para recibir transferencias (mock bancario) o compartir la dirección EVM.
- Recibir USDC: muestra tu dirección y QR con metadatos simples (Base Sepolia / contrato USDC).
- Retirar Bs: flujo guiado de retiro a cuenta bancaria (demo).
- Retirar USDC: enviar USDC a otra dirección EVM.
- Ganar con GYRO: invierte tu USDC, swappea ~50% a WETH y mintea una posición LP WETH/USDC en Uniswap v3.

## Stack
- Next.js (App Router), TypeScript, Tailwind-like utility classes.
- Privy Smart Wallets (`@privy-io/react-auth`), viem.
- Uniswap v3 (Base Sepolia):
  - NonfungiblePositionManager (NFPM)
  - SwapRouter02
- Base Sepolia RPC (Coinbase Developer o el RPC público `https://sepolia.base.org`).

## Requisitos
- Node 18+ y pnpm (o npm/yarn).
- Cuenta de Privy y un App ID/client id.
- (Opcional) Cuenta en Coinbase Developer para usar paymaster/gas sponsor.
- bsETH de faucet si operas sin sponsor.

## Instalación
```bash
pnpm i
cp .env.example .env.local
# Rellena .env.local con tus credenciales
pnpm dev
```
Abre http://localhost:3000

## Variables de entorno (`.env.local`)
- NEXT_PUBLIC_PRIVY_APP_ID=...
- NEXT_PUBLIC_PRIVY_CLIENT_ID=...
- PRIVATE_KEY=0x... (llave del servidor para endpoints admin/bootstrapping de pools)
- BOB_USDC_RATE_DEPOSIT=12.60
- BOB_USDC_RATE_WITHDRAWL=12.40

## Dirección de contratos (Base Sepolia)
- USDC de prueba del proyecto: `SEPOLIA_BASE_USDC` en `lib/constants/contractAddresses.ts`
- WETH: `0x4200000000000000000000000000000000000006`
- NFPM (NonfungiblePositionManager): `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2`
- SwapRouter02: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`

## Estructura principal
- `app/`
  - `dashboard/page.tsx`: Home con accesos a deposit/withdraw/earn.
  - `deposit-qr/page.tsx`: QR para depósitos.
  - `receive/page.tsx`: Recibir USDC (QR+dirección).
  - `withdraw/`
    - `page.tsx`: selector de retiro Bs/USDC.
    - `new/page.tsx`: flujo Bs y, para `?type=usdc`, retiro USDC on-chain.
    - `success/page.tsx`: confirmación de retiro.
  - `earn/page.tsx`: inversión directa del usuario en Uniswap v3.
  - `api/`
    - `rates/route.ts`: tasas de cambio (depósito/retiro).
    - `webhook/bank/withdraw/route.ts`: webhook de retiro (USDC->BOB demo) y trazas.
    - `earn/create-pool/route.ts`: crear/inicializar pool (admin/demo).
    - `earn/mint/route.ts`: mintear liquidez desde servidor (admin/demo).
- `lib/constants/abi/USDC_ABI.ts`: ABI USDC.
- `lib/constants/contractAddresses.ts`: addresses del proyecto.
- `lib/services/currencyConverter.ts`: utilidades de conversión Bs/USDC.

## Pantallas y flujos

### Depositar (QR)
- Ruta: `/deposit-qr`.
- Muestra QR con metadatos (dirección EVM, moneda, etc.) y botones para compartir.

### Recibir USDC
- Ruta: `/receive`.
- QR sin MEMO, detalles de red (Base Sepolia) y contrato USDC.

### Retirar Bs
- Rutas: `/withdraw`, `/withdraw/new?type=bs`.
- UI de selección de cuenta bancaria (demo) y confirmación de acciones.

### Retirar USDC (EVM)
- Ruta: `/withdraw/new?type=usdc`.
- Envía USDC on-chain usando smart wallet de Privy.

### Ganar con GYRO (Uniswap v3)
- Ruta: `/earn`.
- Lee balances USDC/WETH del usuario.
- Invierte el monto en USDC:
  1) Aprobar al router y swappear ~50% USDC→WETH (SwapRouter02).
  2) Aprobar NFPM para USDC/WETH.
  3) Mintear posición LP (Uniswap v3) con rango amplio.
- Requisitos:
  - El pool WETH/USDC debe existir para el fee seleccionado (una vez puedes crearlo con `/api/earn/create-pool`).
  - Sponsor de gas (paymaster) debe permitir los contratos llamados, o el usuario debe tener bsETH para gas.

## Endpoints relevantes
- `POST /api/rates` (GET realmente): devuelve `depositRate`, `withdrawalRate`.
- `POST /api/webhook/bank/withdraw`: procesa retiro USDC->BOB (demo), retorna `withdrawalId` y montos.
- `POST /api/earn/create-pool`: crea+inicializa pool WETH/USDC en NFPM. Body: `{ priceUSDCperWETH, fee }`.
- `POST /api/earn/mint`: aprueba y mintea liquidez en NFPM. Body: `{ amountWeth, amountUsdc, fee }`.

## Scripts
- `pnpm dev`: servidor de desarrollo.
- `pnpm build && pnpm start`: producción.
- `pnpm lint`: lint.

## Consideraciones de seguridad
- Nunca expongas `PRIVATE_KEY` del servidor en el cliente.
- Usa variables de entorno y secretos del deploy provider.
- En producción, valida estrictamente entradas y verifica on-chain txHashes si haces conciliaciones reales.

## Troubleshooting

### 1) Sponsor de gas (paymaster) bloquea transacciones
Error típico: `request denied - called address not in allowlist`.
Agrega estas direcciones al allowlist del proyecto (Base Sepolia):
- USDC (tu token): `SEPOLIA_BASE_USDC`
- WETH: `0x4200000000000000000000000000000000000006`
- SwapRouter02: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- NFPM: `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2`
Alternativa: desactiva sponsor para estas txs y usa bsETH del usuario.

### 2) Warning React: `isActive` prop
Proviene de una dependencia (por ejemplo, UI de Privy). No lo agregamos en el DOM en nuestro código. Puedes ignorarlo en dev o actualizar paquetes.

### 3) BigInt y TypeScript target
Si ves errores de BigInt, asegúrate que `tsconfig.json` apunte a `"target": "ES2020"` o superior.

### 4) El pool no existe
Inicializa una vez con `/api/earn/create-pool` (usa `PRIVATE_KEY`) y establece un `fee` y `precio` inicial razonable.

## Roadmap sugerido
- Modo fallback sin sponsor (toggle en `/earn`).
- Collect fees y decreaseLiquidity desde UI.
- Slippage y cotización previa para swaps.
- Migración a Base mainnet y uso de USDC oficial.
- Pruebas e2e y componentes.

---
Hecho con ❤️ para explorar experiencias de on/off-ramp y DeFi sobre Base.
