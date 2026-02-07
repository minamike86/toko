import { InventoryService, IssueStockRequest } from "../application/InventoryService";
import { IssueStock } from "../application/IssueStock";
import { ReceiveStock } from "../application/ReceiveStock";

export class InventoryServiceAdapter implements InventoryService {
  constructor(
    private readonly issueStockUseCase: IssueStock,
    private readonly receiveStockUseCase: ReceiveStock
  ) {}

  async issueStock(requests: IssueStockRequest[]): Promise<void> {
    await this.issueStockUseCase.execute(requests);
  }

  async returnStock(requests: IssueStockRequest[]): Promise<void> {
    await this.receiveStockUseCase.execute(requests);
  }
}
