# Fullstack Web3 Dapp Boilerplate

## Getting Started

### Install Foundry (if required)

```bash
curl -L https://foundry.paradigm.xyz | bash
```

### Install Foundry dependencies

This step will install OpenZeppelin V4 and V5 contracts libraries as well as Superfluid contracts libraries.
You may add further contract library based on your needs. Refer to [Foundry Book](https://book.getfoundry.sh/projects/dependencies) for more information.

```bash
cd packages/contracts
```

```bash
forge install
```

### Install Webapp dependencies

This step will install the common dependencies used for Web3 Dapps development such as `viem`, `wagmi`, `nextjs`, `tailwindcss`, etc.
You may refer to `packages/webapp/package.json` for the complete list of dependencies.

```bash
cd packages/webapp
```

```bash
yarn install
```

### Create a `.env` file in the `packages/webapp` directory and add your environment variables following the `.env.example` file

### Run the development server

```bash
cd packages/webapp
```

```bash
yarn dev
```
