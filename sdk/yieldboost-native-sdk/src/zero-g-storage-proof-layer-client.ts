import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type ZeroGStorageProofLayerRequest = MarketplaceLayerRequest;
export type ZeroGStorageProofLayerClientOptions = MarketplaceSdkClientOptions;

export function createZeroGStorageProofLayerClient(
  options: ZeroGStorageProofLayerClientOptions,
) {
  return {
    async store(request: ZeroGStorageProofLayerRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/zero-g-storage-proof-layer",
        request,
      );
    },
  };
}
