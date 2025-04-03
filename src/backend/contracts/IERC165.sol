// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IERC165
 * @dev Standard interface for ERC165
 */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
