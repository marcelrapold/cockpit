'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const SYNODIC_MONTH_DAYS = 29.530588853;
const NEW_MOON_REFERENCE_UTC = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

type MoonSignal3DProps = {
  impactCount: number;
  signalTone: 'pending' | 'live' | 'offline';
};

type MoonMeshProps = MoonSignal3DProps & {
  reduceMotion: boolean;
};

function positiveModulo(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo;
}

function getLunarPhase(now: Date) {
  const daysSinceReference = (now.getTime() - NEW_MOON_REFERENCE_UTC) / DAY_MS;
  const age = positiveModulo(daysSinceReference, SYNODIC_MONTH_DAYS);
  const phaseAngle = (age / SYNODIC_MONTH_DAYS) * Math.PI * 2;
  const illumination = (1 - Math.cos(phaseAngle)) / 2;

  return {
    age,
    phaseAngle,
    illumination,
  };
}

function clampImpactCount(value: number) {
  return Math.max(8, Math.min(44, Math.round(value)));
}

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pointOnMoon(index: number) {
  const lon = THREE.MathUtils.degToRad(-115 + seededUnit(index + 2) * 230);
  const lat = THREE.MathUtils.degToRad(-58 + seededUnit(index + 19) * 116);
  const radius = 1.055 + seededUnit(index + 41) * 0.02;

  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const loseContext = context?.getExtension('WEBGL_lose_context');
    loseContext?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduceMotion;
}

function CommitFlow({ impactCount, signalTone, reduceMotion }: MoonMeshProps) {
  const flowRef = useRef<THREE.Group>(null);
  const beadCount = Math.max(8, Math.min(18, Math.round(impactCount / 2)));
  const color =
    signalTone === 'live' ? '#34d399' : signalTone === 'offline' ? '#60a5fa' : '#fbbf24';
  const beads = useMemo(
    () =>
      Array.from({ length: beadCount }, (_, index) => {
        const angle = (index / beadCount) * Math.PI * 2;
        const radius = 1.28 + seededUnit(index + 101) * 0.08;
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle * 1.7) * 0.08,
            Math.sin(angle) * radius * 0.32,
          ),
          scale: 0.008 + seededUnit(index + 131) * 0.009,
        };
      }),
    [beadCount],
  );

  useFrame((state) => {
    if (!flowRef.current || reduceMotion) return;
    flowRef.current.rotation.y = state.clock.elapsedTime * 0.18;
    flowRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.27) * 0.08;
  });

  return (
    <group ref={flowRef} rotation={[0.42, 0, -0.16]}>
      <mesh>
        <torusGeometry args={[1.28, 0.0035, 8, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.36} />
      </mesh>
      {beads.map((bead, index) => (
        <mesh key={index} position={bead.position}>
          <sphereGeometry args={[bead.scale, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

function MoonMesh({ impactCount, signalTone, reduceMotion }: MoonMeshProps) {
  const moonRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Group>(null);
  const colorMap = useLoader(THREE.TextureLoader, '/moon/lroc_color_2k.jpg');
  const displacementMap = useLoader(THREE.TextureLoader, '/moon/ldem_3_8bit.jpg');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
    displacementMap.anisotropy = 8;
  }, [colorMap, displacementMap]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const phase = useMemo(() => getLunarPhase(now), [now]);
  const impacts = useMemo(
    () => Array.from({ length: clampImpactCount(impactCount) }, (_, index) => pointOnMoon(index)),
    [impactCount],
  );

  const lightPosition = useMemo<[number, number, number]>(() => {
    return [
      Math.sin(phase.phaseAngle) * 4.6,
      0.55,
      -Math.cos(phase.phaseAngle) * 4.6,
    ];
  }, [phase.phaseAngle]);

  const impactColor =
    signalTone === 'live' ? '#34d399' : signalTone === 'offline' ? '#60a5fa' : '#fbbf24';

  useFrame((state) => {
    if (reduceMotion) return;
    const t = state.clock.elapsedTime;
    if (moonRef.current) {
      moonRef.current.rotation.y = t * 0.055;
      moonRef.current.rotation.x = Math.sin(t * 0.19) * 0.025;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = -t * 0.075;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.012);
    }
  });

  return (
    <>
      <ambientLight intensity={0.08 + phase.illumination * 0.08} />
      <directionalLight
        position={lightPosition}
        intensity={2.6}
        color="#fff4df"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3.8, -1.6, -2.5]} intensity={0.28} color="#38bdf8" />

      <group ref={moonRef} rotation={[0.12, -0.35, 0.03]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1, 144, 72]} />
          <meshStandardMaterial
            map={colorMap}
            bumpMap={displacementMap}
            displacementMap={displacementMap}
            bumpScale={0.045}
            displacementScale={0.035}
            roughness={0.96}
            metalness={0}
          />
        </mesh>
        <group ref={glowRef}>
          {impacts.map((position, index) => (
            <mesh key={index} position={position}>
              <sphereGeometry args={[0.012 + seededUnit(index + 77) * 0.01, 10, 10]} />
              <meshStandardMaterial
                color={impactColor}
                emissive={impactColor}
                emissiveIntensity={1.6}
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      </group>
      <CommitFlow
        impactCount={impactCount}
        signalTone={signalTone}
        reduceMotion={reduceMotion}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.17, 0]} receiveShadow>
        <circleGeometry args={[1.35, 96]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.38} />
      </mesh>
    </>
  );
}

function MoonFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_45%,rgba(251,191,36,0.16),rgba(15,23,42,0)_60%)]">
      <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_30%,#f8fafc,#94a3b8_46%,#111827_72%)] shadow-[0_0_70px_rgba(251,191,36,0.25)]" />
    </div>
  );
}

export function MoonSignal3D({ impactCount, signalTone }: MoonSignal3DProps) {
  const [canUseWebGL, setCanUseWebGL] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    setCanUseWebGL(webglAvailable());
  }, []);

  return (
    <div
      aria-label="Realtime 3D moon surface"
      title="NASA CGI Moon Kit: LRO color map and LOLA displacement map"
      className="relative h-[170px] min-w-[230px] overflow-hidden rounded-md border border-white/10 bg-[#050816] md:h-[190px] md:w-[270px]"
    >
      <MoonFallback />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.14),transparent_34%),radial-gradient(circle_at_15%_82%,rgba(14,165,233,0.18),transparent_30%)]" />
      {canUseWebGL ? (
        <Canvas
          className="relative z-10"
          shadows
          camera={{ position: [0, 0.22, 3.15], fov: 38 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <MoonMesh
              impactCount={impactCount}
              signalTone={signalTone}
              reduceMotion={reduceMotion}
            />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              rotateSpeed={0.42}
              autoRotate={!reduceMotion}
              autoRotateSpeed={0.18}
              minPolarAngle={Math.PI / 2.8}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
