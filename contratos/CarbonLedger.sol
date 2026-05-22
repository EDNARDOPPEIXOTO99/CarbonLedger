// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonLedger {
    
    struct CarbonRecord {
        string projectName;
        uint256 carbonAmount;
        address registeredBy;
        uint256 timestamp;
    }

    CarbonRecord[] public records;
    
    event CarbonRegistered(
        string projectName,
        uint256 carbonAmount,
        address registeredBy,
        uint256 timestamp
    );

    function registerCarbon(
        string memory _projectName,
        uint256 _carbonAmount
    ) public {
        records.push(CarbonRecord(
            _projectName,
            _carbonAmount,
            msg.sender,
            block.timestamp
        ));
        
        emit CarbonRegistered(
            _projectName,
            _carbonAmount,
            msg.sender,
            block.timestamp
        );
    }

    function totalRecords() public view returns (uint256) {
        return records.length;
    }

    function getRecord(uint256 _index) public view returns (
        string memory,
        uint256,
        address,
        uint256
    ) {
        CarbonRecord memory r = records[_index];
        return (r.projectName, r.carbonAmount, r.registeredBy, r.timestamp);
    }
}