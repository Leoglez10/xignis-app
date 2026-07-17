import type { ComponentProps } from "react";
import { TextInput } from "./TextInput";

export function DateInput(props: Omit<ComponentProps<typeof TextInput>, "type">) {
  return <TextInput {...props} type="date" />;
}
