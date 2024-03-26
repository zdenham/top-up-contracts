// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract TopUp {
    address payable public withdrawAddress;
    uint256 public maxReceiverBalance;
    uint256 public topUpAmount;

    mapping (address => bool) isReceiver;

    event Withdrawal(uint indexed amount);
    event TopUpReceiver(address indexed receiver);

    error NotEnoughReceivers();
    error ZeroValueForbidden();
    error NotReceiver();
    error ReceiverBalanceTooHigh();
    error NotWithdrawAddress();
    
    constructor(address payable _withdrawAddress, uint256 _maxReceiverBalance, uint256 _topUpAmount, address[] memory _receivers) {
        withdrawAddress = _withdrawAddress;

        if(maxReceiverBalance == 0) revert ZeroValueForbidden();
        maxReceiverBalance = _maxReceiverBalance;

        if(topUpAmount == 0) revert ZeroValueForbidden();
        topUpAmount = _topUpAmount;

        if(_receivers.length == 0) revert NotEnoughReceivers();

        for (uint i = 0; i < _receivers.length; i++) {
            isReceiver[_receivers[i]] = true;
        }
    }

    function topUp(address payable _receiver) public payable {
        if(!isReceiver[_receiver]) revert NotReceiver();
        if(_receiver.balance >= maxReceiverBalance) revert ReceiverBalanceTooHigh();

        emit TopUpReceiver(_receiver);
        _receiver.transfer(topUpAmount);
    }

    function withdraw() public {
        if(msg.sender != withdrawAddress) revert NotWithdrawAddress();

        emit Withdrawal(address(this).balance);

        withdrawAddress.transfer(address(this).balance);
    }

    function isReceiverAddress(address _receiver) public view returns (bool) {
        return isReceiver[_receiver];
    }
}
