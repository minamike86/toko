import { NextResponse } from "next/server";
import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { OrderType } from "@/modules/sales/domain/OrderType";
import {
  orderRepo,
  catalogReadRepo,
  inventoryService,
} from "@/wiring/container";


type ErrorResponse = {
  error: string;
  message: string;
};

export async function POST(req: Request) {
  const body = await req.json();

  const useCase = new CreateOrder({
    orderRepo,
    catalogReadRepo,
    inventoryService,
  });

  try {
    const result = await useCase.execute({
      orderId: body.orderId,
      type: body.type as OrderType,
      payment: body.payment,
      items: body.items,
      createdBy: body.createdBy,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const response = mapErrorToResponse(error);
    return NextResponse.json(response, { status: 400 });
  }
}

function mapErrorToResponse(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    return {
      error: error.name,
      message: error.message,
    };
  }

  return {
    error: "UnknownError",
    message: "Terjadi kesalahan yang tidak terduga.",
  };
}
