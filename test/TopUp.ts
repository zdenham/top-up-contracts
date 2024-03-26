import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('TopUp', function () {
  async function deployTopUp() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const TopUp = await hre.ethers.getContractFactory('TopUp');
    const topup = await TopUp.deploy();

    return { owner, otherAccount, topup };
  }

  it(
    'should allow top up if the receiver address balance is less than the top up amount'
  );
  it('should allow anyone to call the top up function');
  it('should emit an event for every receiver');
  it('should emit a TopUp event when an address is topped up');
  it(
    'should fail to top up if the receiver address balance is greater than the top up threshold'
  );
  it('should fail to top up if the receiver was not passed in the constructor');
  it('should allow the withdrawAddress to withdraw');
  it('should fail to withdraw if the caller is not the withdrawAddress');
});
