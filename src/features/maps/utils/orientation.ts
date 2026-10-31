export function inferVerticalRotationAngle(
  width: number,
  height: number,
  isKnownCell: (index: number) => boolean,
): number {
  if (width <= 0 || height <= 0) return 0

  const sampleStep = Math.max(1, Math.ceil(Math.sqrt((width * height) / 40000)))
  let count = 0
  let sumX = 0
  let sumY = 0

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      if (!isKnownCell(y * width + x)) continue
      count += 1
      sumX += x
      sumY += height - y - 1
    }
  }

  if (count < 2) return 0

  const meanX = sumX / count
  const meanY = sumY / count
  let varianceX = 0
  let varianceY = 0
  let covariance = 0

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      if (!isKnownCell(y * width + x)) continue
      const dx = x - meanX
      const dy = height - y - 1 - meanY
      varianceX += dx * dx
      varianceY += dy * dy
      covariance += dx * dy
    }
  }

  varianceX /= count
  varianceY /= count
  covariance /= count

  const spread = Math.sqrt((varianceX - varianceY) ** 2 + 4 * covariance ** 2)
  const largestVariance = (varianceX + varianceY + spread) / 2
  const smallestVariance = (varianceX + varianceY - spread) / 2
  if (largestVariance <= 0 || (smallestVariance > 0 && largestVariance / smallestVariance < 1.18)) return 0

  const longAxisAngle = 0.5 * Math.atan2(2 * covariance, varianceX - varianceY)
  const verticalAxisAngle = longAxisAngle >= 0 ? Math.PI / 2 : -Math.PI / 2
  return verticalAxisAngle - longAxisAngle
}

export function rotatePointAroundCenter(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number,
): { x: number; y: number } {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + cosine * dx - sine * dy,
    y: center.y + sine * dx + cosine * dy,
  }
}
