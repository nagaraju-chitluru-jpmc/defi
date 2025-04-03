// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondStorage.sol";
import "./OwnershipStorage.sol";
import "./DiamondCutFacet.sol";
import "./DiamondLoupeFacet.sol";
import "./OwnershipFacet.sol";
import "./IDiamondCut.sol";
import "./IDiamondLoupe.sol";
import "./IERC173.sol";
import "./IERC165.sol";

/**
 * @title Diamond
 * @dev Main diamond contract (proxy)
 */
contract Diamond {
    // Event defined locally to avoid namespace issues
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor(address _owner) {
        // Set owner
        OwnershipStorage.Data storage os = OwnershipStorage.data();
        os.owner = _owner;
        
        // Emit ownership event
        emit OwnershipTransferred(address(0), _owner);
        
        // Add DiamondCutFacet
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](3);
        
        bytes4[] memory diamondCutSelectors = new bytes4[](1);
        diamondCutSelectors[0] = IDiamondCut.diamondCut.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondCutFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: diamondCutSelectors
        });
        
        // Add DiamondLoupeFacet
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        
        bytes4[] memory loupeSelectors = new bytes4[](5);
        loupeSelectors[0] = IDiamondLoupe.facets.selector;
        loupeSelectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        loupeSelectors[2] = IDiamondLoupe.facetAddresses.selector;
        loupeSelectors[3] = IDiamondLoupe.facetAddress.selector;
        loupeSelectors[4] = IERC165.supportsInterface.selector;
        
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });
        
        // Add OwnershipFacet
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        
        bytes4[] memory ownershipSelectors = new bytes4[](2);
        ownershipSelectors[0] = IERC173.owner.selector;
        ownershipSelectors[1] = IERC173.transferOwnership.selector;
        
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(ownershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: ownershipSelectors
        });
        
        // Add facets - internal function call, not a delegatecall
        diamondCut(cuts, address(0), "");
    }
    
    // Internal diamondCut function to avoid external calls during construction
    function diamondCut(
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) internal {
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
            address facetAddress = _diamondCut[facetIndex].facetAddress;
            bytes4[] memory functionSelectors = _diamondCut[facetIndex].functionSelectors;
            
            DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
            
            if (action == IDiamondCut.FacetCutAction.Add) {
                require(functionSelectors.length > 0, "No selectors provided");
                require(facetAddress != address(0), "facetAddress cannot be 0");
                
                uint16 selectorPosition = uint16(ds.facetFunctionSelectors[facetAddress].functionSelectors.length);
                
                // If it's a new facet address, add it to the facet addresses array
                if (selectorPosition == 0) {
                    ds.facetFunctionSelectors[facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
                    ds.facetAddresses.push(facetAddress);
                }
                
                for (uint256 selectorIndex; selectorIndex < functionSelectors.length; selectorIndex++) {
                    bytes4 selector = functionSelectors[selectorIndex];
                    address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
                    require(oldFacetAddress == address(0), "Function selector already exists");
                    
                    ds.selectorToFacetAndPosition[selector].facetAddress = facetAddress;
                    ds.selectorToFacetAndPosition[selector].functionSelectorPosition = selectorPosition;
                    ds.facetFunctionSelectors[facetAddress].functionSelectors.push(selector);
                    selectorPosition++;
                }
            }
        }
        
        // Call the initialization function if needed
        if (_init != address(0)) {
            (bool success, ) = _init.delegatecall(_calldata);
            require(success, "Initialization failed");
        }
    }
    
    // Find facet for function that is called and execute the
    // function if a facet is found and return any value
    fallback() external payable {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
    
    // This is payable to make it work with receive()
    receive() external payable {}
}