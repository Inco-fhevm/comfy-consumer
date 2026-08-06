"use client";
import { ActionModal, type ActionWidgetProps } from "./action-modal";
import { ShieldView } from "../views/shield-view";

export type DepositWidgetProps = ActionWidgetProps;

// Trigger → modal shield form (with token selection).
export function DepositWidget(props: DepositWidgetProps) {
  return <ActionModal {...props} title="Shield" View={ShieldView} balanceKind="public" />;
}
