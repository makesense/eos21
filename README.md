# EOS21 Protocol ✌🏻☝🏼 - SENSE Implementation
Teleport your ERC20 tokens to EOS.

## Summary

EOS21 is a protocol to enable cross-chain ⛓ token movement between ETH and EOS.
For the original README see the sheos repo [eos21](https://github.com/sheos-org/eos21)

## Steps

1. Compile Blackhole contract. For our purposes we will focus on the EOS Account version.
2. Deploy contract with the following settings params:
```
constructor(address _erc20Contract, uint _criticBlock, uint _minimumAmount) public {
```
  * address: testnet or mainnet contract address.
  * criticBlock: 0
  * minimumAmount: 100 TBD.

WIP

