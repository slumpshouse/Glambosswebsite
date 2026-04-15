import { prisma } from "./prisma";
import { executeSaleTransaction } from "./sale-transaction";
import type {
  ConfirmPendingRequestInput,
  ConfirmPendingRequestResult,
} from "../types/request-confirmation";

export async function confirmPendingRequest(
  input: ConfirmPendingRequestInput
): Promise<ConfirmPendingRequestResult> {
  return prisma.$transaction(async (tx) => {
    const request = await tx.request.findUnique({
      where: { id: input.requestId },
      include: {
        product: {
          select: {
            id: true,
            cost: true,
            stock: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be confirmed");
    }

    const { sale, customer } = await executeSaleTransaction(tx, {
      requestId: request.id,
      productId: request.productId,
      quantity: request.quantity,
      customerPhone: input.customerPhone,
      customerName: input.customerName,
    });

    // 5) Update request status to completed and link customer
    const updatedRequest = await tx.request.update({
      where: { id: request.id },
      data: {
        status: "completed",
        customerId: customer.id,
      },
      select: {
        id: true,
        status: true,
        productId: true,
        quantity: true,
        customerId: true,
      },
    });

    return {
      request: {
        id: updatedRequest.id,
        status: "completed",
        productId: updatedRequest.productId,
        quantity: updatedRequest.quantity,
        customerId: updatedRequest.customerId,
      },
      sale,
      customer,
    };
  });
}
