import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type HallucinationBlacklistRequest = MarketplaceLayerRequest;
export type HallucinationBlacklistClientOptions = MarketplaceSdkClientOptions;

export function createHallucinationBlacklistClient(
  options: HallucinationBlacklistClientOptions,
) {
  return {
    async check(request: HallucinationBlacklistRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/hallucination-blacklist",
        request,
      );
    },
  };
}
