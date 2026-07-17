import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/** Light tap: avanzar paso, selección de opción. */
export async function tapHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* web/no-op */
  }
}

/** Medium bump: retroceder paso, descartar. */
export async function bumpHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* web/no-op */
  }
}

/** Success notification: envío exitoso, aprobación, etc. */
export async function successHaptic() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* web/no-op */
  }
}
