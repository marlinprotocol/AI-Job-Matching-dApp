// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnclaveResponseVerifier {
    /**
     * @dev Verifies the enclave signature for a given response
     * @param receiptData ABI-encoded tuple containing:
     *   - model: The model name
     *   - prompt: The prompt sent to enclave
     *   - requestContext: JSON string of request context
     *   - response: Generated response from enclave
     *   - responseContext: JSON string of response context
     * @param timestamp The timestamp from response header
     * @param signature The 65-byte signature from header
     * @param enclavePubKey The 64-byte secp256k1 public key
     * @return True if signature is valid, false otherwise
     */
    function verifyEnclaveResponse(
        bytes memory receiptData,
        uint64 timestamp,
        bytes memory signature,
        bytes memory enclavePubKey
    ) public pure returns (bool) {
        // 1. Reconstruct the signed message
        bytes memory message = abi.encodePacked(
            "|oyster-hasher|",
            "|timestamp|",
            toBigEndianBytes(timestamp),
            "|ollama_signature_parameters|",
            receiptData
        );
        
        // 2. Hash the message
        bytes32 messageHash = keccak256(message);
        
        // 3. Extract signature components
        require(signature.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // 4. Handle v adjustment (Rust adds 27 to recovery ID)
        if (v < 27) {
            v += 27;
        }
        require(v == 27 || v == 28, "Invalid signature v value");
        
        // 5. Recover signer address
        address recoveredSigner = ecrecover(messageHash, v, r, s);
        
        // 6. Convert public key to address
        address enclaveAddress = publicKeyToAddress(enclavePubKey);
        
        // 7. Verify signature matches enclave
        return recoveredSigner == enclaveAddress;
    }

    /**
     * @dev Converts public key to Ethereum address
     * @param pubKey 64-byte public key (x,y concatenated)
     * @return Ethereum address derived from public key
     */
    function publicKeyToAddress(bytes memory pubKey) public pure returns (address) {
        require(pubKey.length == 64, "Invalid public key length");
        bytes32 hash = keccak256(pubKey);
        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Converts uint64 to big-endian bytes
     * @param value The timestamp value
     * @return 8-byte big-endian representation
     */
    function toBigEndianBytes(uint64 value) internal pure returns (bytes memory) {
        bytes memory result = new bytes(8);
        for (uint i = 0; i < 8; i++) {
            result[7 - i] = bytes1(uint8(value & 0xFF));
            value >>= 8;
        }
        return result;
    }
}