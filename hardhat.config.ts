import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';

const DEPLOYER_PK = process.env.JUICE_DEPLOYER_PK;

// TODO - DRY -> resolution not working right now
const rpcByNetwork = (network: string) => {
  switch (network) {
    case 'fuji':
      return 'https://api.avax-test.network/ext/bc/C/rpc';
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
    fuji: getChainConfig('fuji'),
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: 'avalanche',
        chainId: 43114,
        urls: {
          apiURL: 'https://api.snowscan.xyz/api',
          browserURL: 'https://avascan.info',
        },
      },
      {
        network: 'fuji',
        chainId: 43113,
        urls: {
          apiURL:
            'https://api.avascan.info/v2/network/testnet/evm/43113/etherscan',
          browserURL: 'https://avascan.info',
        },
      },
    ],
  },
};

export default config;

