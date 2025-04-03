// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondStorage.sol";
import "./IDiamondLoupe.sol";
import "./IERC165.sol";
import "./IDiamondCut.sol";
import "./IERC173.sol";

/**
 * @title DiamondLoupeFacet
 * @dev Implementation of the diamond loupe facet
 */
contract DiamondLoupeFacet is IDiamondLoupe, IERC165 {
    function facets() external view override returns (Facet[] memory facets_) {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        uint256 numFacets = ds.facetAddresses.length;
        facets_ = new Facet[](numFacets);
        
        for (uint256 i; i < numFacets; i++) {
            address facetAddress = ds.facetAddresses[i];
            facets_[i].facetAddress = facetAddress;
            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress].functionSelectors;
        }
    }

    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;
    }

    function facetAddresses() external view override returns (address[] memory facetAddresses_) {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        facetAddresses_ = ds.facetAddresses;
    }

    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;
    }

    function supportsInterface(bytes4 _interfaceId) external view override returns (bool) {
        DiamondStorage.DiamondState storage ds = DiamondStorage.diamondStorage();
        
        if (_interfaceId == type(IERC165).interfaceId) {
            return true;
        }
        if (_interfaceId == type(IDiamondCut).interfaceId) {
            return ds.selectorToFacetAndPosition[IDiamondCut.diamondCut.selector].facetAddress != address(0);
        }
        if (_interfaceId == type(IDiamondLoupe).interfaceId) {
            return
                ds.selectorToFacetAndPosition[IDiamondLoupe.facets.selector].facetAddress != address(0) &&
                ds.selectorToFacetAndPosition[IDiamondLoupe.facetFunctionSelectors.selector].facetAddress != address(0) &&
                ds.selectorToFacetAndPosition[IDiamondLoupe.facetAddresses.selector].facetAddress != address(0) &&
                ds.selectorToFacetAndPosition[IDiamondLoupe.facetAddress.selector].facetAddress != address(0);
        }
        if (_interfaceId == type(IERC173).interfaceId) {
            return
                ds.selectorToFacetAndPosition[IERC173.owner.selector].facetAddress != address(0) &&
                ds.selectorToFacetAndPosition[IERC173.transferOwnership.selector].facetAddress != address(0);
        }
        return false;
    }
}