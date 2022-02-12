<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [DropErc1155Contract](./sdk.droperc1155contract.md) &gt; [createBatch](./sdk.droperc1155contract.createbatch.md)

## DropErc1155Contract.createBatch() method

Create a batch of NFTs to be claimed in the future

<b>Signature:</b>

```typescript
createBatch(metadatas: NFTMetadataInput[]): Promise<TransactionResultWithId<NFTMetadata>[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  metadatas | NFTMetadataInput\[\] |  |

<b>Returns:</b>

Promise&lt;TransactionResultWithId&lt;NFTMetadata&gt;\[\]&gt;

## Remarks

Create batch allows you to create a batch of many NFTs in one transaction.

## Example


```javascript
// Custom metadata of the NFTs to create
const metadatas = [{
  name: "Cool NFT",
  description: "This is a cool NFT",
  image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
}, {
  name: "Cool NFT",
  description: "This is a cool NFT",
  image: fs.readFileSync("path/to/image.png"),
}];

const results = await contract.createBatch(metadatas); // uploads and creates the NFTs on chain
const firstTokenId = results[0].id; // token id of the first created NFT
const firstNFT = await results[0].data(); // (optional) fetch details of the first created NFT
```
