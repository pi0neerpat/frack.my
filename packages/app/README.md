# Web3 Dapp Template

A web3 dApp template for building and prototyping web3 applications.

## Tech Stack

- React 18
- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- Web3 Libraries:
  - wagmi v2
  - viem
  - @reown/appkit
  - @reown/appkit-adapter-wagmi

## Project Structure

The webapp package file structure is as follow :

```
packages/webapp
├── README.md
├── components.json
├── next-env.d.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── src
│   ├── app
│   ├── components
│   ├── config
│   ├── context
│   ├── hooks
│   └── lib
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

1. Install dependencies:

```bash
yarn install
```

2. Run development server:

```bash
yarn dev
```

3. Build for production:

```bash
yarn build
```

4. Start production server:

```bash
yarn start
```

The app will be available at [http://localhost:3000](http://localhost:3000).
