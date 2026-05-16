import {
  type MarketplaceLayerRequest,
  type MarketplaceSdkClientOptions,
  postMarketplaceRequest,
} from "./shared";

export type ProgrammableGovernanceRequest = MarketplaceLayerRequest;
export type ProgrammableGovernanceClientOptions = MarketplaceSdkClientOptions;

export function createProgrammableGovernanceClient(
  options: ProgrammableGovernanceClientOptions,
) {
  return {
    async evaluate(request: ProgrammableGovernanceRequest) {
      return postMarketplaceRequest(
        options,
        "/api/dev/store/layers/programmable-governance",
        request,
      );
    },
  };
}
