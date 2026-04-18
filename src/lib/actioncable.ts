import ActionCable from "actioncable";

const CABLE_URL = import.meta.env.VITE_CABLE_URL || "ws://localhost:8000/cable";

export function createCableConnection(token: string) {
  return ActionCable.createConsumer(`${CABLE_URL}?token=${token}`);
}
