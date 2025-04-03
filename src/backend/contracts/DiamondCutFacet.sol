// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondStorage.sol";
import "./IDiamondCut.sol";
import "./IERC173.sol";

/**
 * @title DiamondCutFacet
 * @dev Implementation of the diamond cut facet
 */
contract DiamondCutFacet is IDiamondCut {
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        require(msg.sender == IERC173(address(this)).owner(), "Must be contract owner");
        
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            FacetCutAction action = _diamondCut[facetIndex].action;
            address facetAddress = _diamondCut[facetIndex].facetAddress;
            bytes4[] memory functionSelectors = _diamondCut[facetIndex].functionSelectors;
            
            if (action == FacetCutAction.Add) {
                addFunctions(ds, facetAddress, functionSelectors);
            } else if (action == FacetCutAction.Replace) {
                replaceFunctions(ds, facetAddress, functionSelectors);
            } else if (action == FacetCutAction.Remove) {
                removeFunctions(ds, facetAddress, functionSelectors);
            } else {
                revert("Incorrect FacetCutAction");
            }
        }
        emit DiamondCut(_diamondCut, _init, _calldata);
        
        // Call the initialization function if needed
        if (_init != address(0)) {
            (bool success, ) = _init.delegatecall(_calldata);
            require(success, "Initialization failed");
        }
    }

    function addFunctions(
        DiamondStorage.DiamondState storage ds,
        address _facetAddress,
        bytes4[] memory _functionSelectors
    ) internal {
        require(_functionSelectors.length > 0, "No selectors provided");
        require(_facetAddress != address(0), "facetAddress cannot be 0");
        
        uint16 selectorPosition = uint16(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        
        // If it's a new facet address, add it to the facet addresses array
        if (selectorPosition == 0) {
            enforceHasContractCode(_facetAddress);
            ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
            ds.facetAddresses.push(_facetAddress);
        }
        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "Function selector already exists");
            
            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
            ds.selectorToFacetAndPosition[selector].functionSelectorPosition = selectorPosition;
            ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(selector);
            selectorPosition++;
        }
    }

    function replaceFunctions(
        DiamondStorage.DiamondState storage ds,
        address _facetAddress,
        bytes4[] memory _functionSelectors
    ) internal {
        require(_functionSelectors.length > 0, "No selectors provided");
        require(_facetAddress != address(0), "facetAddress cannot be 0");
        enforceHasContractCode(_facetAddress);
        
        uint16 selectorPosition = uint16(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        
        // If it's a new facet address, add it to the facet addresses array
        if (selectorPosition == 0) {
            ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
            ds.facetAddresses.push(_facetAddress);
        }
        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != address(0), "Function does not exist");
            require(oldFacetAddress != _facetAddress, "Cannot replace function with same function");
            
            removeFunction(ds, oldFacetAddress, selector);
            
            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
            ds.selectorToFacetAndPosition[selector].functionSelectorPosition = selectorPosition;
            ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(selector);
            selectorPosition++;
        }
    }

    function removeFunctions(
        DiamondStorage.DiamondState storage ds,
        address _facetAddress,
        bytes4[] memory _functionSelectors
    ) internal {
        require(_functionSelectors.length > 0, "No selectors provided");
        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != address(0), "Function does not exist");
            removeFunction(ds, oldFacetAddress, selector);
        }
    }

    function removeFunction(
        DiamondStorage.DiamondState storage ds,
        address _facetAddress,
        bytes4 _selector
    ) internal {
        // Get index of selector in function selectors array
        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;
        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;
        
        // If not the last selector
        if (selectorPosition != lastSelectorPosition) {
            // Replace selector with last selector
            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];
            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;
            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint16(selectorPosition);
        }
        
        // Remove last selector
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();
        delete ds.selectorToFacetAndPosition[_selector];
        
        // If no more selectors for facet address
        if (lastSelectorPosition == 0) {
            // Get facet address position in facet addresses array
            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;
            
            // If not the last facet address
            if (facetAddressPosition != lastFacetAddressPosition) {
                // Replace facet address with last facet address
                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];
                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;
                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = uint16(facetAddressPosition);
            }
            
            // Remove last facet address
            ds.facetAddresses.pop();
            delete ds.facetFunctionSelectors[_facetAddress];
        }
    }

    function enforceHasContractCode(address _contract) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, "Contract address has no code");
    }
}