import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type SecureComputeTeeRequest = MarketplaceLayerRequest;
export type SecureComputeTeeClientOptions = MarketplaceSdkClientOptions;

export function createSecureComputeTeeClient(options: SecureComputeTeeClientOptions) {
  return {
    async execute(request: SecureComputeTeeRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/secure-compute-tee",
        request,
      );
    },
  };
}
