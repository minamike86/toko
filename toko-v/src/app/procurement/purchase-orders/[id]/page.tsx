import { CancelPurchaseOrderButton } from "./_components/CancelPurchaseOrderButton";

type PurchaseOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PurchaseOrderDetailPage(
  props: PurchaseOrderDetailPageProps,
) {
  const { id } = await props.params;

  return (
    <div className="flex items-center gap-3">
      <CancelPurchaseOrderButton
        purchaseOrderId={id}
        status="CREATED"
      />
    </div>
  );
}