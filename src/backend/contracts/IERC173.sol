// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IERC173
 * @dev Standard interface for contract ownership
 */
interface IERC173 {
    function owner() external view returns (address owner_);
    function transferOwnership(address _newOwner) external;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}