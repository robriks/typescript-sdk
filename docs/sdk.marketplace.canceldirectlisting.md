<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [Marketplace](./sdk.marketplace.md) &gt; [cancelDirectListing](./sdk.marketplace.canceldirectlisting.md)

## Marketplace.cancelDirectListing() method

Cancel Direct Listing

<b>Signature:</b>

```typescript
cancelDirectListing(listingId: BigNumberish): Promise<TransactionResult>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  listingId | BigNumberish |  |

<b>Returns:</b>

Promise&lt;TransactionResult&gt;

## Remarks

Cancel a direct listing on the marketplace

## Example


```javascript
// The listing ID of the direct listing you want to cancel
const listingId = "0";

await contract.cancelDirectListing(listingId);
```
