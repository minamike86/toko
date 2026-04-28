export type VerifyNonAcceptedInspectionResolutionInput = {
  receivingInspectionId: string;
};

export interface NonAcceptedInspectionResolutionQuery {
  isResolved(
    input: VerifyNonAcceptedInspectionResolutionInput,
  ): Promise<boolean>;
}