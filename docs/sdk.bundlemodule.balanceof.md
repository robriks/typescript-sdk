<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [BundleModule](./sdk.bundlemodule.md) &gt; [balanceOf](./sdk.bundlemodule.balanceof.md)

## BundleModule.balanceOf() method

Get NFT Balance

<b>Signature:</b>

```typescript
balanceOf(address: string, tokenId: string): Promise<BigNumber>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  address | string |  |
|  tokenId | string |  |

<b>Returns:</b>

Promise&lt;BigNumber&gt;

## Remarks

Get a wallets NFT balance (number of a specific NFT in this module owned by the wallet).

## Example


```javascript
// Address of the wallet to check NFT balance
const address = "{{wallet_address}}";
// The token ID of the NFT you want to check the wallets balance of
const tokenId = "0"

const balance = await module.balanceOf(address, tokenId);
console.log(balance);
```
