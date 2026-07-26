"use client";
import { ActionModal, type ActionWidgetProps } from "./action-modal";
import { UnshieldView } from "../views/unshield-view";

export type WithdrawWidgetProps = ActionWidgetProps;

// Trigger → modal unshield form (with token selection).
export function WithdrawWidget(props: WithdrawWidgetProps) {
  return <ActionModal {...props} title="Unshield" View={UnshieldView} />;
}
