import type { ActorContext } from "@/shared/system/types/actor-context";
import { InventoryService, IssueStockRequest } from "../application/InventoryService";
import { IssueStock } from "../application/IssueStock";
import {
  ReceiveStock,
  type ReceiveStockRequest,
} from "../application/ReceiveStock";

type IssueStockExecuteInput = Parameters<IssueStock["execute"]>[0];

export class InventoryServiceAdapter implements InventoryService {
  constructor(
    private readonly issueStockUseCase: IssueStock,
    private readonly receiveStockUseCase: ReceiveStock,
    private readonly defaultReturnActor: ActorContext,
  ) { }

  async issueStock(requests: IssueStockRequest[]): Promise<void> {
    await this.issueStockUseCase.execute(
      requests as IssueStockExecuteInput,
    );
  }

  async returnStock(requests: IssueStockRequest[]): Promise<void> {
    for (const request of requests) {
      const receiveRequest: ReceiveStockRequest = {
        variantId: request.variantId,
        quantity: request.quantity,
        reason: "PROCUREMENT_RECEIVE",
        referenceId: request.referenceId,
      };

      await this.receiveStockUseCase.execute(
        receiveRequest,
        this.defaultReturnActor,
      );
    }
  }
}