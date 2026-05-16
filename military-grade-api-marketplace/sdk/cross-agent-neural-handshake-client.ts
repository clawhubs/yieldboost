import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type CrossAgentNeuralHandshakeRequest = MarketplaceLayerRequest;
export type CrossAgentNeuralHandshakeClientOptions = MarketplaceSdkClientOptions;

export function createCrossAgentNeuralHandshakeClient(
  options: CrossAgentNeuralHandshakeClientOptions,
) {
  return {
    async write(request: CrossAgentNeuralHandshakeRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/cross-agent-neural-handshake",
        request,
      );
    },
  };
}
