import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { ethers } from 'hardhat';
import { parseEther } from 'ethers';

describe('TopUp', function () {
  async function deployTopUpFixture() {
    const [owner, otherAccount, receiver] = await ethers.getSigners();
    const maxReceiverBalance = parseEther('1'); // Example max balance of 1 ether
    const topUpAmount = parseEther('0.1'); // Example top-up amount of 0.1 ether

    const TopUp = await ethers.getContractFactory('TopUp');
    const topUp = await TopUp.deploy(
      owner.address,
      maxReceiverBalance,
      topUpAmount,
      [receiver.address]
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
      otherAccount,
      receiver,
      topUp,
      topUpAmount,
      initialContractBalance,
    };
  }

  it('should allow top up if the receiver address balance is less than the maxReceiverBalance', async function () {
    const { topUp, receiver, topUpAmount } = await loadFixture(
      deployTopUpFixture
    );

    // Ensuring the receiver's balance is less than maxReceiverBalance before top-up
    expect(await ethers.provider.getBalance(receiver.address)).to.be.lt(
      topUpAmount
    );

    await expect(topUp.topUp(receiver.address))
      .to.emit(topUp, 'TopUpReceiver')
      .withArgs(receiver.address);

    // The receiver's balance should increase by the topUpAmount
    expect(await ethers.provider.getBalance(receiver.address)).to.equal(
      topUpAmount
    );
  });

  it('should emit a TopUp event when an address is topped up', async function () {
    const { topUp, receiver } = await loadFixture(deployTopUpFixture);

    await expect(topUp.topUp(receiver.address))
      .to.emit(topUp, 'TopUpReceiver')
      .withArgs(receiver.address);
  });

  it('should fail to top up if the receiver address balance is greater than the top up threshold', async function () {
    const { topUp, receiver, owner } = await loadFixture(deployTopUpFixture);

    // First, artificially increase the receiver's balance to be above the maxReceiverBalance
    const highBalance = parseEther('2'); // 2 ether, for example
    await owner.sendTransaction({
      to: receiver.address,
      value: highBalance,
    });

    // Attempting a top-up should fail
    await expect(topUp.topUp(receiver.address)).to.be.revertedWithCustomError(
      topUp,
      'ReceiverBalanceTooHigh'
    );
  });

  it('should fail to top up if the receiver was not passed in the constructor', async function () {
    const { topUp, otherAccount } = await loadFixture(deployTopUpFixture);

    // Attempting to top-up an address not specified as a receiver should fail
    await expect(
      topUp.topUp(otherAccount.address)
    ).to.be.revertedWithCustomError(topUp, 'NotReceiver');
  });

  it('should allow the withdrawAddress to withdraw', async function () {
    const { topUp, owner, initialContractBalance } = await loadFixture(
      deployTopUpFixture
    );

    const initialOwnerBalance = await owner.;

    // The withdraw function should successfully transfer all contract funds to the owner
    const tx = await topUp.withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    // Owner's balance should increase by the initialContractBalance minus gas fees
    expect(await owner.getBalance()).to.equal(
      initialOwnerBalance.add(initialContractBalance).sub(gasUsed)
    );
  });

  it('should fail to withdraw if the caller is not the withdrawAddress', async function () {
    const { topUp, otherAccount } = await loadFixture(deployTopUpFixture);

    // Attempting to withdraw with an account other than the owner should fail
    await expect(topUp.connect(otherAccount).withdraw()).to.be.revertedWith(
      'NotWithdrawAddress'
    );
  });
});