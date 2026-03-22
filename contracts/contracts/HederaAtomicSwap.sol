// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HederaAtomicSwap {
    struct Swap {
        bytes32 secretHash;
        address sender;
        address recipient;
        uint256 amount;
        uint256 timelock;
        bool claimed;
        bool refunded;
        bytes secret;
    }

    mapping(bytes32 => Swap) public swaps;

    event Locked(
        bytes32 indexed swapId,
        bytes32 indexed secretHash,
        address indexed sender,
        address recipient,
        uint256 amount,
        uint256 timelock
    );
    event Claimed(bytes32 indexed swapId, bytes secret);
    event Refunded(bytes32 indexed swapId);

    function lock(bytes32 secretHash, address recipient, uint256 timelock) external payable returns (bytes32 swapId) {
        require(msg.value > 0, "amount required");
        require(recipient != address(0), "recipient required");
        require(timelock > block.timestamp, "future timelock required");

        swapId = keccak256(
            abi.encodePacked(secretHash, msg.sender, recipient, msg.value, timelock, block.chainid)
        );
        require(swaps[swapId].sender == address(0), "swap exists");

        swaps[swapId] = Swap({
            secretHash: secretHash,
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            timelock: timelock,
            claimed: false,
            refunded: false,
            secret: ""
        });

        emit Locked(swapId, secretHash, msg.sender, recipient, msg.value, timelock);
    }

    function claim(bytes32 swapId, bytes calldata secret) external {
        Swap storage swap = swaps[swapId];
        require(swap.sender != address(0), "swap missing");
        require(msg.sender == swap.recipient, "not recipient");
        require(!swap.claimed, "already claimed");
        require(!swap.refunded, "already refunded");
        require(block.timestamp < swap.timelock, "timelock expired");
        require(sha256(secret) == swap.secretHash, "invalid secret");

        swap.claimed = true;
        swap.secret = secret;

        (bool ok, ) = payable(swap.recipient).call{value: swap.amount}("");
        require(ok, "transfer failed");

        emit Claimed(swapId, secret);
    }

    function refund(bytes32 swapId) external {
        Swap storage swap = swaps[swapId];
        require(swap.sender != address(0), "swap missing");
        require(msg.sender == swap.sender, "not sender");
        require(!swap.claimed, "already claimed");
        require(!swap.refunded, "already refunded");
        require(block.timestamp >= swap.timelock, "timelock active");

        swap.refunded = true;
        (bool ok, ) = payable(swap.sender).call{value: swap.amount}("");
        require(ok, "refund failed");

        emit Refunded(swapId);
    }

    function getSwap(bytes32 swapId) external view returns (
        bytes32 secretHash,
        address sender,
        address recipient,
        uint256 amount,
        uint256 timelock,
        bool claimed,
        bool refunded,
        bytes memory secret
    ) {
        Swap memory swap = swaps[swapId];
        return (
            swap.secretHash,
            swap.sender,
            swap.recipient,
            swap.amount,
            swap.timelock,
            swap.claimed,
            swap.refunded,
            swap.secret
        );
    }
}
