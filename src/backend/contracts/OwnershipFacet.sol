// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OwnershipStorage.sol";
import "./IERC173.sol";

/**
 * @title OwnershipFacet
 * @dev Implementation of the ownership facet
 */
contract OwnershipFacet is IERC173 {
    function owner() external view override returns (address owner_) {
        return OwnershipStorage.data().owner;
    }
    
    function transferOwnership(address _newOwner) external override {
        OwnershipStorage.Data storage os = OwnershipStorage.data();
        require(msg.sender == os.owner, "Only owner can transfer ownership");
        
        emit OwnershipTransferred(os.owner, _newOwner);
        os.owner = _newOwner;
    }
}