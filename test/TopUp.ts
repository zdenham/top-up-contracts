import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { ethers } from 'hardhat';
import { parseEther, Signer } from 'ethers';
import { TopUp } from '../typechain-types';

async function deployTopUpFixture() {
  const [owner, otherAccount, receiver] = await ethers.getSigners();
  const maxReceiverBalance = parseEther('1'); // Example max balance of 1 ether
  const topUpAmount = parseEther('0.1'); // Example top-up amount of 0.1 ether

  const ownerAddress = await owner.getAddress();
  const otherAddress = await otherAccount.getAddress();
  const receiverAddress = await receiver.getAddress();

  const TopUp = await ethers.getContractFactory('TopUp');

  const topUp = await TopUp.deploy(
    owner.address,
    maxReceiverBalance,
    topUpAmount,
    [receiverAddress]
  );

  // Sending some ether to the contract for top-up functionality
  const initialContractBalance = parseEther('5');
  const topUpAddress = await topUp.getAddress();
  await owner.sendTransaction({
    to: topUpAddress,
    value: initialContractBalance,
  });

  return {
    owner,
    ownerAddress,
    otherAccount,
    receiver,
    topUp,
    topUpAmount,
    initialContractBalance,
    otherAddress,
    receiverAddress,
  };
}

describe('TopUp', function () {
  let topUp: TopUp;
  let owner: Signer;
  let otherAccount: Signer;
  let receiver: Signer;
  let topUpAmount: bigint;
  let initialContractBalance: bigint;
  let ownerAddress: string;
  let otherAddress: string;
  let receiverAddress: string;
  context('with a topup contract deployed', async function () {
    beforeEach(async function () {
      ({
        topUp,
        owner,
        otherAccount,
        receiver,
        topUpAmount,
        initialContractBalance,
        ownerAddress,
        otherAddress,
        receiverAddress,
      } = await loadFixture(deployTopUpFixture));
    });

    it('should allow top up if the receiver address balance is less than the maxReceiverBalance', async function () {
      // Ensuring the receiver's balance is less than maxReceiverBalance before top-up
      expect(await ethers.provider.getBalance(receiverAddress)).to.be.lt(
        topUpAmount
      );

      await expect(topUp.topUp(receiverAddress))
        .to.emit(topUp, 'TopUpReceiver')
        .withArgs(receiverAddress);

      // The receiver's balance should increase by the topUpAmount
      expect(await ethers.provider.getBalance(receiverAddress)).to.equal(
        topUpAmount
      );
    });

    it('should emit a TopUp event when an address is topped up', async function () {
      await expect(topUp.topUp(receiverAddress))
        .to.emit(topUp, 'TopUpReceiver')
        .withArgs(receiverAddress);
    });

    it('should fail to top up if the receiver address balance is greater than the top up threshold', async function () {
      // First, artificially increase the receiver's balance to be above the maxReceiverBalance
      const highBalance = parseEther('2'); // 2 ether, for example
      await owner.sendTransaction({
        to: receiverAddress,
        value: highBalance,
      });

      // Attempting a top-up should fail
      await expect(topUp.topUp(receiverAddress)).to.be.revertedWithCustomError(
        topUp,
        'ReceiverBalanceTooHigh'
      );
    });

    it('should fail to top up if the receiver was not passed in the constructor', async function () {
      // Attempting to top-up an address not specified as a receiver should fail
      await expect(topUp.topUp(otherAddress)).to.be.revertedWithCustomError(
        topUp,
        'NotReceiver'
      );
    });

    it('should allow the withdrawAddress to withdraw', async function () {
      const initialOwnerBalance = await ethers.provider.getBalance(
        ownerAddress
      );

      // The withdraw function should successfully transfer all contract funds to the owner
      const tx = await topUp.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      // Owner's balance should increase by the initialContractBalance minus gas fees
      const balance = await ethers.provider.getBalance(ownerAddress);
      expect(balance).to.equal(
        initialOwnerBalance.add(initialContractBalance).sub(gasUsed)
      );
    });

    it('should fail to withdraw if the caller is not the withdrawAddress', async function () {
      const otherTopUp = await topUp.connect(otherAccount);

      // Attempting to withdraw with an account other than the owner should fail
      await expect(otherTopUp.withdraw()).to.be.revertedWithCustomError(
        otherTopUp,
        'NotWithdrawAddress'
      );
    });
  });
});