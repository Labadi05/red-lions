"use client";

import { useEffect } from "react";
import { markAllRead } from "./actions";

// Marks the messages as seen once the inbox is opened
export default function MarkRead({ hasUnread }) {
  useEffect(() => {
    if (hasUnread) markAllRead();
  }, [hasUnread]);

  return null;
}