---
slug: /sdk.ipfsstorage.upload
title: IpfsStorage.upload() method
hide_title: true
---
<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[@thirdweb-dev/sdk](./sdk.md) &gt; [IpfsStorage](./sdk.ipfsstorage.md) &gt; [upload](./sdk.ipfsstorage.upload.md)

## IpfsStorage.upload() method

Uploads a file to the storage.

**Signature:**

```typescript
upload(data: string | FileOrBuffer, contractAddress?: string, signerAddress?: string): Promise<string>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  data | string &#124; [FileOrBuffer](./sdk.fileorbuffer.md) | The data to be uploaded. Can be a file/buffer (which will be loaded), or a string. |
|  contractAddress | string | Optional. The contract address the data belongs to. |
|  signerAddress | string | Optional. The address of the signer. |

**Returns:**

Promise&lt;string&gt;

- The hash of the uploaded data.