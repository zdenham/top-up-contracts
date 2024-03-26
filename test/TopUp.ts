import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { ethers } from 'hardhat';
import { parseEther, Signer } from 'ethers';
import { TopUp } from '../typechain-types';

async function deployTopUpFixture() {
  const [withdrawer, otherAccount, receiver] = await ethers.getSigners();
  const maxReceiverBalance = parseEther('1'); // Example max balance of 1 ether
  const topUpAmount = parseEther('0.1'); // Example top-up amount of 0.1 ether

  const withdrawerAddress = await withdrawer.getAddress();
  const otherAddress = await otherAccount.getAddress();
  const receiverAddress = await receiver.getAddress();

  // set the receiver balance to zero with hardhat
  await ethers.provider.send('hardhat_setBalance', [receiverAddress, '0x0']);

  const TopUp = await ethers.getContractFactory('TopUp');

  const topUp = await TopUp.deploy(
    withdrawerAddress,
    maxReceiverBalance,
    topUpAmount,
    [receiverAddress]
  );

  // Sending some ether to the contract for top-up functionality
  const initialContractBalance = parseEther('5');
  const topUpAddress = await topUp.getAddress();
  await withdrawer.sendTransaction({
    to: topUpAddress,
    value: initialContractBalance,
  });

  return {
    withdrawer,
    withdrawerAddress,
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
  let withdrawer: Signer;
  let otherAccount: Signer;
  let topUpAmount: bigint;
  let initialContractBalance: bigint;
  let withdrawerAddress: string;
  let otherAddress: string;
  let receiverAddress: string;

  it('should fail to deploy with a maxReceiverBalance of zero', async function () {
    const [withdrawer] = await ethers.getSigners();
    const withdrawerAddress = await withdrawer.getAddress();
    const maxReceiverBalance = 0;
    const topUpAmount = parseEther('0.1');
    const receiverAddress = withdrawerAddress;

    const TopUp = await ethers.getContractFactory('TopUp');

    await expect(
      TopUp.deploy(withdrawerAddress, maxReceiverBalance, topUpAmount, [
        receiverAddress,
      ])
    ).to.be.revertedWithCustomError(TopUp, 'ZeroValueForbidden');
  });

  it('should fail to deploy with a topUpAmount of zero', async function () {
    const [withdrawer] = await ethers.getSigners();
    const withdrawerAddress = await withdrawer.getAddress();
    const maxReceiverBalance = parseEther('1');
    const topUpAmount = 0;
    const receiverAddress = withdrawerAddress;

    const TopUp = await ethers.getContractFactory('TopUp');

    await expect(
      TopUp.deploy(withdrawerAddress, maxReceiverBalance, topUpAmount, [
        receiverAddress,
      ])
    ).to.be.revertedWithCustomError(TopUp, 'ZeroValueForbidden');
  });

  it('should fail to deploy with an empty receivers array', async function () {
    const [withdrawer] = await ethers.getSigners();
    const withdrawerAddress = await withdrawer.getAddress();
    const maxReceiverBalance = parseEther('1');
    const topUpAmount = parseEther('0.1');
    const receiverAddress = withdrawerAddress;

    const TopUp = await ethers.getContractFactory('TopUp');

    await expect(
      TopUp.deploy(withdrawerAddress, maxReceiverBalance, topUpAmount, [])
    ).to.be.revertedWithCustomError(TopUp, 'NotEnoughReceivers');
  });

  context('with a topup contract deployed', async function () {
    beforeEach(async function () {
      ({
        topUp,
        withdrawer,
        otherAccount,
        topUpAmount,
        initialContractBalance,
        withdrawerAddress,
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
        .to.emit(topUp, 'TopUpSent')
        .withArgs(receiverAddress);

      // The receiver's balance should increase by the topUpAmount
      expect(await ethers.provider.getBalance(receiverAddress)).to.equal(
        topUpAmount
      );
    });

    it('should fail to top up if the receiver address balance is greater than the top up threshold', async function () {
      // First, artificially increase the receiver's balance to be above the maxReceiverBalance
      const highBalance = parseEther('2'); // 2 ether, for example
      await withdrawer.sendTransaction({
        to: receiverAddress,
        value: highBalance,
      });

      // Attempting a top-up should fail
      await expect(topUp.topUp(receiverAddress)).to.be.revertedWithCustomError(
        topUp,
        'ReceiverBalanceTooHigh'
      );
    });

    it('should fail to top up an invalid receiver', async function () {
      // Attempting to top-up an address not specified as a receiver should fail
      await expect(topUp.topUp(otherAddress)).to.be.revertedWithCustomError(
        topUp,
        'NotReceiver'
      );
    });

    it('should allow the withdrawAddress to withdraw', async function () {
      const initialwithdrawerBalance = await ethers.provider.getBalance(
        withdrawerAddress
      );

      // The withdraw function should successfully transfer all contract funds to the withdrawer
      const tx = await topUp.withdraw();
      const receipt = await tx.wait();

      const gasUsed = receipt?.gasUsed ?? 0n;
      const gasPrice = receipt?.gasPrice ?? 0n;

      const gasCost = gasUsed * gasPrice;
      const expectedBalance =
        initialwithdrawerBalance + initialContractBalance - gasCost;

      // withdrawer's balance should increase by the initialContractBalance minus gas fees
      const balance = await ethers.provider.getBalance(withdrawerAddress);
      expect(balance).to.equal(expectedBalance);
    });

    it('should fail to withdraw if the caller is not the withdrawAddress', async function () {
      const otherTopUp = await topUp.connect(otherAccount);

      // Attempting to withdraw with an account other than the withdrawer should fail
      await expect(otherTopUp.withdraw()).to.be.revertedWithCustomError(
        otherTopUp,
        'NotWithdrawAddress'
      );
    });

    it('should reflect if a receiver is a receiver', async function () {
      expect(await topUp.isReceiverAddress(receiverAddress)).to.be.true;
      expect(await topUp.isReceiverAddress(otherAddress)).to.be.false;
    });

    it('should emit a deposit event when ether is sent to the contract', async function () {
      const depositAmount = parseEther('0.1');
      const topUpAddress = await topUp.getAddress();
      await expect(
        withdrawer.sendTransaction({ to: topUpAddress, value: depositAmount })
      )
        .to.emit(topUp, 'DepositReceived')
        .withArgs(withdrawerAddress, depositAmount);
    });
  });
});