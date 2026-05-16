import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type IntegrityAuditorRequest = MarketplaceLayerRequest;
export type IntegrityAuditorClientOptions = MarketplaceSdkClientOptions;

export function createIntegrityAuditorClient(options: IntegrityAuditorClientOptions) {
  return {
    async audit(request: IntegrityAuditorRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/integrity-auditor",
        request,
      );
    },
  };
}
