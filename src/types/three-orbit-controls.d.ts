declare module 'three/examples/jsm/controls/OrbitControls.js' {
  export class OrbitControls {
    constructor(camera: unknown, domElement: HTMLElement)
    target: { set: (x: number, y: number, z: number) => void }
    maxPolarAngle: number
    enableDamping: boolean
    update(): void
    dispose(): void
  }
}
