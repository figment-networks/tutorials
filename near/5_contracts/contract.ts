import { context, storage, logging } from "near-sdk-as";

export function getValue(): string | null {
  return storage.getString("test");
}

export function setValue(value: string): void {
  logging.log("Setting value to " + value);
  storage.setString("test", value);
}
