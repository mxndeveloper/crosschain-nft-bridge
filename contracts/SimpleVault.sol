// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleVault {
    // STATE VARIABLES
    mapping(address => uint256) public balances;

    // EVENTS
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // 'payable' allows the function to receive ETH
    function deposit() external payable {
        require(msg.value > 0, "Cannot deposit 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // FIXED: Function name, variable spelling, and .call syntax
    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient funds");

        // SECURITY PATTERN: Checks-Effects-Interactions
        // 1. Check (done above)
        // 2. Effects (update state FIRST)
        balances[msg.sender] -= _amount;

        // 3. Interaction (send ETH LAST) - prevents reentrancy
        // FIXED: Use {value: _amount} with curly braces, and add empty parentheses for data
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, _amount);
    }
}
