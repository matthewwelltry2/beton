import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

type CubeState = 'intact' | 'cracked' | 'destroyed';

interface CubeMeshProps {
  state: CubeState;
  progress: number;
  maxProgress: number;
  isShaking: boolean;
  seedKey: string;
}

interface CrackLine {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

interface CrackStrip {
  center: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
}

interface FragmentConfig {
  position: THREE.Vector3;
  scale: number;
  rotation: THREE.Euler;
}

type ConcreteTextureVariant = 'intact' | 'cracked' | 'destroyed';
type CubeFace = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';

const texturePaths = [
  '/textures/concrete/concrete_basecolor_1k.jpg',
  '/textures/concrete/concrete_normal_1k.png',
  '/textures/concrete/concrete_roughness_1k.jpg',
] as const;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seedValue: string) => {
  let seed = hashString(seedValue) || 1;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
};

const drawDestroyedPits = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const random = createSeededRandom('concrete:destroyed:pits');
  const pitCount = 220;

  context.save();
  for (let i = 0; i < pitCount; i += 1) {
    const radius = 0.4 + random() * 2.2;
    const x = random() * width;
    const y = random() * height;
    const darkAlpha = 0.03 + random() * 0.07;
    const lightAlpha = 0.015 + random() * 0.03;

    context.fillStyle = `rgba(24, 28, 32, ${darkAlpha})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = `rgba(240, 242, 244, ${lightAlpha})`;
    context.beginPath();
    context.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.55, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
};

const faceList: CubeFace[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
const projectFacePoint = (face: CubeFace, u: number, v: number): THREE.Vector3 => {
  const surface = 0.503;
  switch (face) {
    case 'px':
      return new THREE.Vector3(surface, u, v);
    case 'nx':
      return new THREE.Vector3(-surface, u, v);
    case 'py':
      return new THREE.Vector3(u, surface, v);
    case 'ny':
      return new THREE.Vector3(u, -surface, v);
    case 'pz':
      return new THREE.Vector3(u, v, surface);
    case 'nz':
      return new THREE.Vector3(u, v, -surface);
  }
};

const getSurfaceNormal = (point: THREE.Vector3): THREE.Vector3 => {
  const absX = Math.abs(point.x);
  const absY = Math.abs(point.y);
  const absZ = Math.abs(point.z);

  if (absX >= absY && absX >= absZ) {
    return new THREE.Vector3(Math.sign(point.x) || 1, 0, 0);
  }
  if (absY >= absX && absY >= absZ) {
    return new THREE.Vector3(0, Math.sign(point.y) || 1, 0);
  }
  return new THREE.Vector3(0, 0, Math.sign(point.z) || 1);
};

const createConcreteVariantTexture = (sourceTexture: THREE.Texture, variant: ConcreteTextureVariant): THREE.Texture => {
  const sourceImage = sourceTexture.image as CanvasImageSource & { width?: number; height?: number };
  const width = Math.max(1, sourceImage?.width ?? 1024);
  const height = Math.max(1, sourceImage?.height ?? 1024);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    return sourceTexture.clone();
  }

  if (sourceImage) {
    context.drawImage(sourceImage, 0, 0, width, height);
  } else {
    context.fillStyle = '#b7bcc0';
    context.fillRect(0, 0, width, height);
  }

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const tone =
    variant === 'intact'
      ? { contrast: 1.02, offset: 24, noise: 4.5 }
      : variant === 'cracked'
        ? { contrast: 1.05, offset: 16, noise: 5.2 }
        : { contrast: 1.08, offset: 6, noise: 6 };

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const luminance = r * 0.299 + g * 0.587 + b * 0.114;
    const grainSeed = Math.sin((index / 4) * 0.067 + 1.13) * 43758.5453;
    const grain = (grainSeed - Math.floor(grainSeed) - 0.5) * tone.noise;
    const contrasted = (luminance - 128) * tone.contrast + 128;
    const value = clamp(Math.round(contrasted + tone.offset + grain), 44, 240);

    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);

  if (variant === 'destroyed') {
    drawDestroyedPits(context, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

function useConcreteTextures() {
  const [map, normalMap, roughnessMap] = useTexture([...texturePaths]) as THREE.Texture[];
  const { gl } = useThree();
  const variantMaps = useMemo(
    () => ({
      intactMap: createConcreteVariantTexture(map, 'intact'),
      crackedMap: createConcreteVariantTexture(map, 'cracked'),
      destroyedMap: createConcreteVariantTexture(map, 'destroyed'),
    }),
    [map],
  );

  useEffect(() => {
    const maxAnisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 8);
    const texturedMaterials = [variantMaps.intactMap, variantMaps.crackedMap, variantMaps.destroyedMap];

    texturedMaterials.forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.6, 1.6);
      texture.anisotropy = maxAnisotropy;
      texture.needsUpdate = true;
    });

    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(1.6, 1.6);
    roughnessMap.repeat.set(1.6, 1.6);
    normalMap.anisotropy = maxAnisotropy;
    roughnessMap.anisotropy = maxAnisotropy;
  }, [gl, normalMap, roughnessMap, variantMaps]);

  useEffect(
    () => () => {
      variantMaps.intactMap.dispose();
      variantMaps.crackedMap.dispose();
      variantMaps.destroyedMap.dispose();
    },
    [variantMaps],
  );

  return {
    intactMap: variantMaps.intactMap,
    crackedMap: variantMaps.crackedMap,
    destroyedMap: variantMaps.destroyedMap,
    normalMap,
    roughnessMap,
  };
}

function CubeMesh({ state, progress, maxProgress, isShaking, seedKey }: CubeMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const crackProgress = clamp(progress / maxProgress, 0, 1);
  const textures = useConcreteTextures();

  const crackLines = useMemo(() => {
    const random = createSeededRandom(`${seedKey}:cracks`);
    const lines: CrackLine[] = [];
    const count = 16;

    for (let i = 0; i < count; i += 1) {
      const face = faceList[Math.floor(random() * faceList.length)];
      const segmentCount = 2 + Math.floor(random() * 4);
      let u = (random() - 0.5) * 0.78;
      let v = (random() - 0.5) * 0.78;

      for (let j = 0; j < segmentCount; j += 1) {
        const prevU = u;
        const prevV = v;
        u = clamp(u + (random() - 0.5) * 0.34, -0.48, 0.48);
        v = clamp(v + (random() - 0.5) * 0.34, -0.48, 0.48);
        lines.push({
          start: projectFacePoint(face, prevU, prevV),
          end: projectFacePoint(face, u, v),
        });
      }
    }

    return lines;
  }, [seedKey]);

  const fragments = useMemo(() => {
    const random = createSeededRandom(`${seedKey}:fragments`);
    return Array.from({ length: 9 }, () => ({
      position: new THREE.Vector3((random() - 0.5) * 1.5, (random() - 0.5) * 1.4, (random() - 0.5) * 1.5),
      scale: 0.12 + random() * 0.17,
      rotation: new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI),
    })) as FragmentConfig[];
  }, [seedKey]);

  const particlePositions = useMemo(() => {
    const random = createSeededRandom(`${seedKey}:particles`);
    return new Float32Array(Array.from({ length: 150 }, () => (random() - 0.5) * 2));
  }, [seedKey]);

  useFrame((renderState, delta) => {
    if (!meshRef.current) return;
    const elapsed = renderState.clock.elapsedTime;

    if (isShaking && state !== 'destroyed') {
      meshRef.current.position.x = Math.sin(elapsed * 40) * 0.016 * crackProgress;
      meshRef.current.position.y = Math.cos(elapsed * 48) * 0.008 * crackProgress;
    } else {
      meshRef.current.position.x = 0;
      meshRef.current.position.y = 0;
    }

    if (state === 'destroyed') {
      meshRef.current.rotation.x += delta * 0.12;
      meshRef.current.rotation.y += delta * 0.08;
      meshRef.current.rotation.z += delta * 0.06;
      return;
    }

    meshRef.current.rotation.x = 0;
    meshRef.current.rotation.z = 0;
    meshRef.current.rotation.y += delta * (state === 'cracked' ? 0.16 : 0.24);
  });

  const visibleCracksCount =
    state === 'intact'
      ? 0
      : state === 'destroyed'
        ? crackLines.length
        : Math.max(1, Math.round(crackLines.length * clamp((crackProgress - 0.6) / 0.4, 0, 1)));
  const visibleCracks = crackLines.slice(0, visibleCracksCount);
  const crackStrips = useMemo(() => {
    const strips: CrackStrip[] = [];

    visibleCracks.forEach((line) => {
      const direction = new THREE.Vector3().subVectors(line.end, line.start);
      const length = direction.length();
      if (length < 0.01) return;

      const tangent = direction.normalize();
      const normal = getSurfaceNormal(line.start);
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      const adjustedTangent = new THREE.Vector3().crossVectors(bitangent, normal).normalize();

      const rotationMatrix = new THREE.Matrix4().makeBasis(adjustedTangent, bitangent, normal);
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
      const center = new THREE.Vector3()
        .addVectors(line.start, line.end)
        .multiplyScalar(0.5)
        .addScaledVector(normal, 0.0032);

      strips.push({ center, quaternion, length });
    });

    return strips;
  }, [visibleCracks]);

  return (
    <group ref={meshRef}>
      {state !== 'destroyed' && (
        <>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              map={state === 'cracked' ? textures.crackedMap : textures.intactMap}
              normalMap={textures.normalMap}
              roughnessMap={textures.roughnessMap}
              normalScale={new THREE.Vector2(0.7, 0.7)}
              metalness={0.05}
              roughness={state === 'cracked' ? 0.98 : 0.94}
              color={state === 'cracked' ? '#d0d5da' : '#dce1e6'}
            />
          </mesh>

          <mesh>
            <boxGeometry args={[1.01, 1.01, 1.01]} />
            <meshBasicMaterial color="#8e97a1" wireframe transparent opacity={0.12} />
          </mesh>

          {crackStrips.map((strip, index) => (
            <mesh key={index} position={strip.center} quaternion={strip.quaternion} scale={[strip.length, state === 'destroyed' ? 0.027 : 0.02, 1]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                color={state === 'destroyed' ? '#fb923c' : '#f59e0b'}
                transparent
                opacity={state === 'destroyed' ? 0.95 : 0.9}
                depthWrite={false}
              />
            </mesh>
          ))}

          <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshBasicMaterial color="#5f6670" transparent opacity={0.08 + crackProgress * 0.15} />
          </mesh>
          <mesh position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshBasicMaterial color="#5f6670" transparent opacity={0.08 + crackProgress * 0.15} />
          </mesh>
        </>
      )}

      {state === 'destroyed' &&
        fragments.map((fragment, index) => (
          <mesh key={index} position={fragment.position} rotation={fragment.rotation} scale={fragment.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              map={textures.destroyedMap}
              normalMap={textures.normalMap}
              roughnessMap={textures.roughnessMap}
              normalScale={new THREE.Vector2(0.6, 0.6)}
              metalness={0.04}
              roughness={0.99}
              color="#c2c8ce"
            />
          </mesh>
        ))}

      {state === 'destroyed' && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={50} array={particlePositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#9aa1a8" size={0.035} transparent opacity={0.75} />
        </points>
      )}
    </group>
  );
}

interface Cube3DProps {
  state: CubeState;
  progress: number;
  maxProgress: number;
  isShaking: boolean;
  seedKey: string;
  compact?: boolean;
}

function FallbackCube({
  state,
  progress,
  maxProgress,
  compact = false,
}: Pick<Cube3DProps, 'state' | 'progress' | 'maxProgress' | 'compact'>) {
  const percent = clamp((progress / maxProgress) * 100, 0, 100);
  const heightClass = compact ? 'h-56' : 'h-72';

  return (
    <div className={`relative ${heightClass} w-full overflow-hidden rounded-2xl bg-gradient-to-b from-secondary/60 to-secondary/34`}>
      <div className="absolute inset-x-8 top-8 rounded-2xl bg-white/86 p-6 backdrop-blur-md">
        <div className="mb-4 text-center text-sm font-medium text-muted-foreground">Упрощенный режим визуализации</div>
        <div className="mx-auto mb-4 h-28 w-28 rounded-2xl border border-border bg-gradient-to-br from-zinc-100 to-zinc-300" />
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all duration-300 ${
              state === 'intact' ? 'bg-success' : state === 'cracked' ? 'bg-amber-500' : 'bg-danger'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div
          className={`
            rounded-xl border px-4 py-2 text-xs font-semibold backdrop-blur-md
            ${state === 'intact' ? 'border-success/20 bg-success/10 text-success' : ''}
            ${state === 'cracked' ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' : ''}
            ${state === 'destroyed' ? 'border-danger/20 bg-danger/10 text-danger' : ''}
          `}
        >
          {state === 'intact' && 'Целый образец'}
          {state === 'cracked' && 'Появились трещины'}
          {state === 'destroyed' && 'Образец разрушен'}
        </div>
        <div className="rounded-lg border border-border/70 bg-white/86 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          2D-режим
        </div>
      </div>
    </div>
  );
}

export function Cube3D({ state, progress, maxProgress, isShaking, seedKey, compact = false }: Cube3DProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const heightClass = compact ? 'h-56' : 'h-72';

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    setIsLowPerformance(lowCpu || lowMemory);
  }, []);

  if (reducedMotion || isLowPerformance) {
    return <FallbackCube state={state} progress={progress} maxProgress={maxProgress} compact={compact} />;
  }

  return (
    <div className={`relative ${heightClass} w-full overflow-hidden rounded-2xl bg-gradient-to-b from-secondary/50 to-secondary/20`}>
      <Canvas dpr={[1, 1.6]}>
        <PerspectiveCamera makeDefault position={[2.2, 1.8, 2.2]} />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />

        <ambientLight intensity={0.72} />
        <directionalLight position={[5, 6, 4]} intensity={1.1} />
        <directionalLight position={[-4, 4, -4]} intensity={0.3} color="#6b7280" />
        <pointLight position={[0, 2.5, 0]} intensity={0.16} color="#b8c0c8" />

        <gridHelper args={[4, 8, '#94a3b8', '#cbd5e1']} position={[0, -0.5, 0]} />

        <CubeMesh state={state} progress={progress} maxProgress={maxProgress} isShaking={isShaking} seedKey={seedKey} />
      </Canvas>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div
          className={`
            rounded-xl border px-4 py-2 text-xs font-semibold backdrop-blur-md
            ${state === 'intact' ? 'border-success/20 bg-success/10 text-success' : ''}
            ${state === 'cracked' ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' : ''}
            ${state === 'destroyed' ? 'border-danger/20 bg-danger/10 text-danger' : ''}
          `}
        >
          {state === 'intact' && 'Целый образец'}
          {state === 'cracked' && 'Появились трещины'}
          {state === 'destroyed' && 'Образец разрушен'}
        </div>
        <div className="rounded-lg border border-border/70 bg-white/86 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          3D-визуализация
        </div>
      </div>
    </div>
  );
}

useTexture.preload([...texturePaths]);
