// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./GameItemNFT.sol";

contract MockBridge is EIP712 {
    using ECDSA for bytes32;

    // The NFT contract on **this** chain (source or destination)
    GameItemNFT public nftContract;
    // Trusted relayer address (signs mint authorisations)
    address public relayer;
    // Nonce per user to prevent replay
    mapping(address => uint256) public nonces;

    event Locked(address indexed sender, uint256 tokenId, uint256 nonce);
    event Minted(address indexed to, uint256 tokenId, uint256 nonce);

    error InvalidSignature();

    // EIP‑712 type hash
    bytes32 private constant MINT_TYPEHASH =
        keccak256("Mint(address to,uint256 tokenId,uint256 nonce)");

    constructor(
        address _nftContract,
        address _relayer
    ) EIP712("MockBridge", "1") {
        nftContract = GameItemNFT(_nftContract);
        relayer = _relayer;
    }

    /// @notice Lock an NFT on the source chain (transfer to this bridge)
    function lock(uint256 tokenId) external {
        // Transfer from user to bridge (user must have approved)
        IERC721(address(nftContract)).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );
        uint256 nonce = nonces[msg.sender]++;
        emit Locked(msg.sender, tokenId, nonce);
    }

    /// @notice Mint on the destination chain with a relayer signature
    /// @param to Recipient of the NFT
    /// @param tokenId Token ID to mint (must match the source chain ID)
    /// @param nonce The nonce from the Lock event
    /// @param signature EIP‑712 signature from the trusted relayer
    function mint(
        address to,
        uint256 tokenId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        // Verify the relayer signed the mint authorisation
        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, to, tokenId, nonce)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        if (signer != relayer) revert InvalidSignature();

        // Mint the NFT on this chain (bridge must have MINTER_ROLE)
        nftContract.safeMint(to);
        emit Minted(to, tokenId, nonce);
    }
}
