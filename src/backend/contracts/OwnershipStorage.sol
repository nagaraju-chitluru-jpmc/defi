// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OwnershipStorage
 * @dev Library for ownership storage
 */
library OwnershipStorage {
    bytes32 constant OWNERSHIP_STORAGE_POSITION = keccak256("diamond.standard.ownership.storage");
    
    struct Data {
        address owner;
    }
    
    function data() internal pure returns (Data storage os) {
        bytes32 position = OWNERSHIP_STORAGE_POSITION;
        assembly {
            os.slot := position
        }
    }
}