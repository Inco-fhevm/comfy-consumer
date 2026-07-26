"use client";
import { ActionModal, type ActionWidgetProps } from "./action-modal";
import { SendView } from "../views/send-view";

export type SendWidgetProps = ActionWidgetProps;

// Trigger → modal confidential-send form (with token selection).
export function SendWidget(props: SendWidgetProps) {
  return <ActionModal {...props} title="Send" View={SendView} />;
}
