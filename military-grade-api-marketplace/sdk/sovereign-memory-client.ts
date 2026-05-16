import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type SovereignMemoryRequest = MarketplaceLayerRequest;
export type SovereignMemoryClientOptions = MarketplaceSdkClientOptions;

export function createSovereignMemoryClient(options: SovereignMemoryClientOptions) {
  return {
    async write(request: SovereignMemoryRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/sovereign-memory",
        request,
      );
    },
  };
}
