import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type ZeroKnowledgeProofLayerRequest = MarketplaceLayerRequest;
export type ZeroKnowledgeProofLayerClientOptions = MarketplaceSdkClientOptions;

export function createZeroKnowledgeProofLayerClient(
  options: ZeroKnowledgeProofLayerClientOptions,
) {
  return {
    async prove(request: ZeroKnowledgeProofLayerRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/zero-knowledge-proof-layer",
        request,
      );
    },
  };
}
