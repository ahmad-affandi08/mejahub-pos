/**
 * Server-side socket event helpers.
 * These functions try to emit via Socket.io if available,
 * otherwise they are no-ops (graceful degradation).
 */
import { emitToBranch, emitToKDS } from "@/lib/socket-server";

export function notifyNewOrder(branchId: string, orderData: unknown): void {
  emitToBranch(branchId, "new-order", orderData);
  emitToKDS(branchId, "new-order", orderData);
}

export function notifyOrderUpdated(branchId: string, orderData: unknown): void {
  emitToBranch(branchId, "order-updated", orderData);
}

export function notifyOrderItemStatus(
  branchId: string,
  data: { orderId: string; itemId: string; status: string }
): void {
  emitToBranch(branchId, "order-item-status", data);
  emitToKDS(branchId, "order-item-status", data);
}

export function notifyTableStatusChange(
  branchId: string,
  data: { tableId: string; status: string }
): void {
  emitToBranch(branchId, "table-status-change", data);
}

export function notifyNewCustomerOrder(
  branchId: string,
  data: { orderNumber: string; tableName: string; customerName: string }
): void {
  emitToBranch(branchId, "new-customer-order", data);
  emitToKDS(branchId, "new-order", data);
}

export function notifyPaymentCompleted(
  branchId: string,
  data: { orderId: string; orderNumber: string; method: string; amount: number }
): void {
  emitToBranch(branchId, "payment-completed", data);
}

export function notifyShiftOpened(
  branchId: string,
  data: { shiftId: string; userName: string }
): void {
  emitToBranch(branchId, "shift-opened", data);
}

export function notifyShiftClosed(
  branchId: string,
  data: { shiftId: string; userName: string }
): void {
  emitToBranch(branchId, "shift-closed", data);
}
