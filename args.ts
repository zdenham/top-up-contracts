import { ethers } from 'hardhat';

const withdrawAddress = '0x373567EFF052B296496862A285f347DbA0Aa8942';
const maxTopUp = ethers.parseEther('5');
const maxBalance = ethers.parseEther('6');

export default [
  withdrawAddress,
  maxBalance,
  maxTopUp,
  // [
  //   '0x926Ad961479Ed9C3a16f683c06AdA108dBB6B579',
  //   '0xe0957D0B5927B563Cc98542308f1fc54C35A02Ea',
  //   '0xD9595078875752f2A2FdcBd67839093347a05080',
  // ],
  ['0x5536F782b73780b8019770F09706d4fAa603f88d'],
];
