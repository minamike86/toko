import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/ApplicationError";
import { DomainError } from "@/shared/errors/DomainError";
import { InsufficientStockError } from "@/modules/inventory/domain/InventoryErrors";

type ErrorResponse = {
  error: string;
  message: string;
};

export type HttpErrorMapping = {
  status: number;
  body: ErrorResponse;
};

export function mapHttpError(error: unknown): HttpErrorMapping {
  console.error("[mapHttpError] raw error:", error);
  console.error(
    "[mapHttpError] meta:",
    error instanceof Error
      ? {
        name: error.name,
        message: error.message,
        constructorName: error.constructor.name,
        stack: error.stack,
      }
      : {
        type: typeof error,
        value: error,
      },
  );

  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: {
        error: error.name,
        message: error.message,
      },
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      status: 403,
      body: {
        error: error.name,
        message: error.message,
      },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: {
        error: error.name,
        message: error.message,
      },
    };
  }

  if (error instanceof ConflictError) {
    return {
      status: 409,
      body: {
        error: error.name,
        message: error.message,
      },
    };
  }

  if (error instanceof InsufficientStockError) {
    return {
      status: 409,
      body: {
        error: error.name,
        message: error.message,
      },
    };
  }


  if (error instanceof DomainError) {
    return {
      status: 400,
      body: {
        error: error.name,
        message: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "UnexpectedError",
      message: "Terjadi kesalahan yang tidak terduga.",
    },
  };
}