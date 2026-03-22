export const HEDERA_SWAP_ABI = [
  "function lock(bytes32 secretHash,address recipient,uint256 timelock) payable returns (bytes32 swapId)",
  "function claim(bytes32 swapId,bytes secret)",
  "function refund(bytes32 swapId)",
  "function getSwap(bytes32 swapId) view returns (bytes32,address,address,uint256,uint256,bool,bool,bytes)",
  "event Locked(bytes32 indexed swapId, bytes32 indexed secretHash, address indexed sender, address recipient, uint256 amount, uint256 timelock)",
  "event Claimed(bytes32 indexed swapId, bytes secret)",
  "event Refunded(bytes32 indexed swapId)"
];
