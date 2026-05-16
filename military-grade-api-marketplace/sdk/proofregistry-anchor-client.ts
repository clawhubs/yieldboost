import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type ProofRegistryAnchorRequest = MarketplaceLayerRequest;
export type ProofRegistryAnchorClientOptions = MarketplaceSdkClientOptions;

export function createProofRegistryAnchorClient(options: ProofRegistryAnchorClientOptions) {
  return {
    async anchor(request: ProofRegistryAnchorRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/proofregistry-anchor",
        request,
      );
    },
  };
}
