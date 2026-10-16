import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  PresentationControls,
  Float,
  ContactShadows,
  useTexture,
} from "@react-three/drei";

// Papel ecológico beige (kraft claro).
const KRAFT = "#d9c8a6";
const KRAFT_IN = "#cbb891"; // interior un poco más cálido

// Panel de cartón reutilizable (caja delgada).
function Panel({ size, position = [0, 0, 0], rotation = [0, 0, 0], color = KRAFT }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
    </mesh>
  );
}

// Caja de empaque ABIERTA con las 4 tapas desplegadas (papel ecológico beige).
// Base + 4 paredes + 4 tapas con bisagra en el borde superior de cada pared.
function PackageBox() {
  const logo = useTexture("/logo_pr.png");
  const W = 1.6; // ancho
  const D = 1.2; // profundidad
  const H = 1.25; // alto de las paredes
  const t = 0.05; // grosor del cartón
  const flap = 0.85; // largo de las tapas
  const open = 1.15; // apertura de las tapas (radianes, hacia afuera)

  return (
    <group rotation={[0.12, -0.5, 0]} position={[0, -0.1, 0]}>
      {/* Base */}
      <Panel size={[W, t, D]} position={[0, -H / 2, 0]} color={KRAFT_IN} />

      {/* Paredes */}
      <Panel size={[W, H, t]} position={[0, 0, D / 2]} />
      <Panel size={[W, H, t]} position={[0, 0, -D / 2]} />
      <Panel size={[t, H, D]} position={[-W / 2, 0, 0]} />
      <Panel size={[t, H, D]} position={[W / 2, 0, 0]} />

      {/* Tapas abiertas (bisagra en el borde superior de cada pared) */}
      <group position={[0, H / 2, D / 2]} rotation={[open, 0, 0]}>
        <Panel size={[W, flap, t]} position={[0, flap / 2, 0]} />
      </group>
      <group position={[0, H / 2, -D / 2]} rotation={[-open, 0, 0]}>
        <Panel size={[W, flap, t]} position={[0, flap / 2, 0]} />
      </group>
      <group position={[-W / 2, H / 2, 0]} rotation={[0, 0, open]}>
        <Panel size={[t, flap, D]} position={[0, flap / 2, 0]} />
      </group>
      <group position={[W / 2, H / 2, 0]} rotation={[0, 0, -open]}>
        <Panel size={[t, flap, D]} position={[0, flap / 2, 0]} />
      </group>

      {/* Logo sobre la pared frontal (exterior) */}
      <mesh position={[0, 0, D / 2 + t / 2 + 0.002]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial map={logo} transparent roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function PackageHero3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.25, 7.6], fov: 28 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} />
      <directionalLight position={[-5, 2, -3]} intensity={0.45} />

      <Suspense fallback={null}>
        <PresentationControls
          global
          cursor
          snap
          polar={[-0.25, 0.35]}
          azimuth={[-0.7, 0.7]}
          config={{ mass: 1, tension: 220, friction: 26 }}
        >
          <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.7}>
            <PackageBox />
          </Float>
        </PresentationControls>

        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.45}
          scale={5}
          blur={2.8}
          far={2.5}
        />
      </Suspense>
    </Canvas>
  );
}
