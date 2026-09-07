import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

function useTokenColors() {
  const [colors, setColors] = useState({
    primary: "#a3e635",
    surface: "#22242e",
    muted: "#6b7280",
  });

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => {
      const raw = styles.getPropertyValue(name).trim();
      if (!raw) return fallback;
      try {
        return new THREE.Color(raw).getStyle();
      } catch {
        return fallback;
      }
    };
    setColors({
      primary: read("--primary", "#a3e635"),
      surface: read("--surface-2", "#22242e"),
      muted: read("--muted-foreground", "#6b7280"),
    });
  }, []);

  return colors;
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.exp(-2.5 * dt);
    camera.position.x += (pointer.x * 1.1 - camera.position.x) * k;
    camera.position.y += (0.4 + pointer.y * 0.6 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Rings({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!group.current) return;
    group.current.rotation.y += dt * 0.22;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.18;
  });

  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.5, i * 0.6, 0]}>
          <torusGeometry args={[1.55 + i * 0.42, 0.012, 8, 220]} />
          <meshBasicMaterial color={color} transparent opacity={0.55 - i * 0.14} />
        </mesh>
      ))}
    </group>
  );
}

function Core({ color, accent }: { color: string; accent: string }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!mesh.current) return;
    mesh.current.rotation.y += dt * 0.35;
    mesh.current.rotation.z += dt * 0.12;
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.02;
    mesh.current.scale.setScalar(s);
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.22}
          metalness={0.65}
          flatShading
        />
      </mesh>
      <mesh scale={1.06}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Motes({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (ref.current) ref.current.rotation.y -= dt * 0.06;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={color} size={0.028} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

export function HeroScene({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const colors = useTokenColors();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={className} aria-hidden />;

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <Suspense fallback={null}>
          <Environment>
            <Lightformer intensity={1.6} position={[0, 4, 2]} scale={[8, 8, 1]} />
            <Lightformer
              intensity={0.9}
              color={colors.primary}
              position={[-4, 0, 2]}
              rotation-y={Math.PI / 2}
              scale={[12, 2, 1]}
            />
          </Environment>
          <Core color={colors.surface} accent={colors.primary} />
          <Rings color={colors.primary} />
          <Motes color={colors.muted} />
        </Suspense>
        <Rig />
      </Canvas>
    </div>
  );
}
