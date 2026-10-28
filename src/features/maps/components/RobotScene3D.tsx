import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import type {
  OccupancyMapMetadata,
  PathPoint2D,
  Pose2D,
} from '../types/runtime'

function RobotModel({ pose }: { pose: Pose2D }) {
  const group = useRef<{
    position: { lerp: (target: { x: number; y: number; z: number }, alpha: number) => void }
    rotation: { y: number }
  }>(null)
  useFrame(() => {
    if (!group.current) return
    group.current.position.lerp({ x: pose.x, y: 0.05, z: -pose.y } as never, 0.16)
    group.current.rotation.y += (-pose.yaw - group.current.rotation.y) * 0.16
  })

  return (
    <group ref={group} position={[pose.x, 0.05, -pose.y]} rotation={[0, -pose.yaw, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      <mesh position={[0.12, 0.39, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.055, 20]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.09, 0.215]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.035, 20]} />
        <meshStandardMaterial color="#172027" />
      </mesh>
      <mesh position={[0, 0.09, -0.215]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.035, 20]} />
        <meshStandardMaterial color="#172027" />
      </mesh>
    </group>
  )
}

function Path3D({ points }: { points: PathPoint2D[] }) {
  if (points.length < 2) return null
  return (
    <group>
      {points.slice(1).map((point, index) => {
        const previous = points[index]
        const dx = point.x - previous.x
        const dz = -(point.y - previous.y)
        const length = Math.hypot(dx, dz)
        return (
          <mesh
            key={`${point.x}-${point.y}-${index}`}
            position={[(point.x + previous.x) / 2, 0.025, -(point.y + previous.y) / 2]}
            rotation={[0, -Math.atan2(dz, dx), 0]}
          >
            <boxGeometry args={[length, 0.018, 0.025]} />
            <meshBasicMaterial color="#22c8f2" />
          </mesh>
        )
      })}
    </group>
  )
}

function CameraOrbit({ x, y, z }: { x: number; y: number; z: number }) {
  const { camera, gl } = useThree()
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement)
    controls.target.set(x, y, z)
    controls.maxPolarAngle = Math.PI / 2.05
    controls.enableDamping = true
    controls.update()
    return () => controls.dispose()
  }, [camera, gl, x, y, z])
  return null
}

type Props = {
  map: OccupancyMapMetadata
  robot?: Pose2D
  draft?: Pose2D | null
  path?: PathPoint2D[] | null
}

export default function RobotScene3D({ map, robot, draft, path }: Props) {
  const mapYaw = map.origin[2]
  const cosine = Math.cos(mapYaw)
  const sine = Math.sin(mapYaw)
  const centerLocalX = map.widthMeters / 2
  const centerLocalY = map.heightMeters / 2
  const centerX = map.origin[0] + cosine * centerLocalX - sine * centerLocalY
  const centerY = map.origin[1] + sine * centerLocalX + cosine * centerLocalY

  return (
    <div className="h-full min-h-0 w-full">
      <Canvas shadows camera={{ position: [centerX + 3.5, 4.5, -centerY + 4], fov: 48 }}>
        <color attach="background" args={['#091318']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 7, 4]} intensity={1.5} castShadow />
        <mesh position={[centerX, -0.03, -centerY]} rotation={[0, mapYaw, 0]} receiveShadow>
          <boxGeometry args={[map.widthMeters, 0.06, map.heightMeters]} />
          <meshStandardMaterial color="#d9dedb" />
        </mesh>
        {map.obstacles.map((obstacle, index) => (
          <mesh
            key={`${obstacle.worldX}-${obstacle.worldY}-${index}`}
            position={[obstacle.worldX, 0.5, -obstacle.worldY]}
            rotation={[0, mapYaw, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[obstacle.worldWidth, 1, obstacle.worldHeight]} />
            <meshStandardMaterial color="#405c68" />
          </mesh>
        ))}
        {path && <Path3D points={path} />}
        {draft && (
          <mesh position={[draft.x, 0.04, -draft.y]}>
            <cylinderGeometry args={[0.1, 0.1, 0.03, 24]} />
            <meshStandardMaterial color="#faad37" emissive="#9a5a00" />
          </mesh>
        )}
        {robot && <RobotModel pose={robot} />}
        <gridHelper args={[Math.max(map.widthMeters, map.heightMeters), 32, '#31515c', '#19313a']} position={[centerX, 0.005, -centerY]} />
        <CameraOrbit x={centerX} y={0} z={-centerY} />
      </Canvas>
    </div>
  )
}
