<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@3rdweb/sdk](./sdk.md) &gt; [IDropModule](./sdk.idropmodule.md) &gt; [mintBatch](./sdk.idropmodule.mintbatch.md)

## IDropModule.mintBatch() method

Allows you to mint a batch of tokens by passing in a list of metadata objects. The metadata objects will all be uploaded to a distributed file system in a folder format based on the storage provider set in the SDK.

Its important to note that the metadata objects are allowed to contain nested File\|Blob\|Buffer objects as well as any other data types, so properties like the `image` can be unique for each token that will be minted.

<b>Signature:</b>

```typescript
mintBatch(tokenMetadata: MetadataURIOrObject[]): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  tokenMetadata | [MetadataURIOrObject](./sdk.metadatauriorobject.md)<!-- -->\[\] | All token metadata objects to be minted. |

<b>Returns:</b>

Promise&lt;void&gt;
