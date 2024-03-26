// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract TopUp {
    // State variables
    address payable public withdrawAddress;
    uint256 public maxReceiverBalance;
    uint256 public topUpAmount;

    mapping (address => bool) isReceiver;

    // Events
    event Withdrawal(uint indexed amount);
    event TopUpSent(address indexed receiver);
    event DepositReceived(address indexed sender, uint indexed amount);

    // Errors
    error NotEnoughReceivers();
    error ZeroValueForbidden();
    error NotReceiver();
    error ReceiverBalanceTooHigh();
    error NotWithdrawAddress();
    
    constructor(address payable _withdrawAddress, uint256 _maxReceiverBalance, uint256 _topUpAmount, address[] memory _receivers) {
        withdrawAddress = _withdrawAddress;

        if(_maxReceiverBalance == 0) revert ZeroValueForbidden();
        maxReceiverBalance = _maxReceiverBalance;

        if(_topUpAmount == 0) revert ZeroValueForbidden();
        topUpAmount = _topUpAmount;

        if(_receivers.length == 0) revert NotEnoughReceivers();

        for (uint i = 0; i < _receivers.length; i++) {
            isReceiver[_receivers[i]] = true;
        }
    }

    /**
     * @param _receiver The address of the receiver. Must be eligible to receive top-ups.
     * @dev eligible receivers are set in the constructor and must have a balance lower than maxReceiverBalance.
     */
    function topUp(address payable _receiver) public {
        if(!isReceiver[_receiver]) revert NotReceiver();
        if(_receiver.balance >= maxReceiverBalance) revert ReceiverBalanceTooHigh();

        emit TopUpSent(_receiver);
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

    receive() external payable { 
        // Fallback function
        emit DepositReceived(msg.sender, msg.value);
    }
}
