export function robotYawToCssRotation(
  robotYaw: number,
  mapOriginYaw: number,
) {
  return -(robotYaw - mapOriginYaw)
}
