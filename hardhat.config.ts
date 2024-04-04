import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';

const DEPLOYER_PK = process.env.JUICE_DEPLOYER_PK;

// TODO - DRY -> resolution not working right now
const rpcByNetwork = (network: string) => {
  switch (network) {
    default:
      return 'https://api.avax.network/ext/bc/C/rpc';
  }
};

const getChainConfig = (chain: string) => {
  if (!DEPLOYER_PK) throw new Error('No deployer private key found');

  switch (chain) {
    default:
      return {
        url: rpcByNetwork(chain),
        accounts: [DEPLOYER_PK],
      };
  }
};

const config: HardhatUserConfig = {
  solidity: '0.8.19',
  networks: {
    avalanche: getChainConfig('avalanche'),
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21,
  },
  etherscan: {
    customChains: [
      {
        network: 'avalanche',
        chainId: 43114,
        urls: {
          apiURL: 'https://api.snowscan.xyz/api',
          browserURL: 'https://avascan.info',
        },
      },
    ],
  },
};

export default config;

