pragma solidity ^0.4.18;


contract DelegateProxy {

    /**
    * @dev Performs a delegatecall and returns whatever the delegatecall returned (entire context execution will return!)
    * @param _dst Destination address to perform the delegatecall
    * @param _calldata Calldata for the delegatecall
    */
    function delegatedFwd(address _dst, bytes _calldata) internal {
        assembly {
            let returnSize := 32
            let retVal := delegatecall(sub(gas, 10000), _dst, add(_calldata, 0x20), mload(_calldata), 0, returnSize)
            switch retVal case 0 { revert(0,0) } default { return(0, returnSize) }
        }
    }
}
