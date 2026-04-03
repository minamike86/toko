import { InventoryService, IssueStockRequest } from "../application/InventoryService";
import { IssueStock } from "../application/IssueStock";
import { ReceiveStock } from "../application/ReceiveStock";
import { ActorContext } from "@/shared/system/types/actor-context";

export class InventoryServiceAdapter implements InventoryService {
  constructor(
    private readonly issueStockUseCase: IssueStock,
    private readonly receiveStockUseCase: ReceiveStock,
    private readonly defaultReturnActor: ActorContext,
  ) { }

  async issueStock(requests: IssueStockRequest[]): Promise<void> {
    await this.issueStockUseCase.execute(requests);
  }

  async returnStock(requests: IssueStockRequest[]): Promise<void> {
    await this.receiveStockUseCase.execute(requests, this.defaultReturnActor);
  }
}