/**
 * Dimension Labels for 3D Scene
 * Creates text labels and measurement lines in Three.js
 */

import React from 'react';
import * as THREE from "three";
import { Text, Html } from "@react-three/drei";

interface DimensionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: number;
}

/**
 * 3D Dimension Line Component with Text Label
 */
export const DimensionLine: React.FC<DimensionLineProps> = ({
  start,
  end,
  label,
  offset = 2
}) => {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);

  // Calculate midpoint for label
  const midpoint = new THREE.Vector3()
    .addVectors(startVec, endVec)
    .multiplyScalar(0.5);

  // Offset label position
  const labelPos: [number, number, number] = [
    midpoint.x,
    midpoint.y + offset,
    midpoint.z
  ];

  // Create line geometry
  const points = [startVec, endVec];

  return (
    <group name={`dimension-${label}`}>
      {/* Main dimension line */}
      <line>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              ...start,
              ...end
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#555555" linewidth={2} />
      </line>

      {/* Extension markers at ends */}
      <ExtensionMarker position={start} direction={getPerpendicularDirection(startVec, endVec)} />
      <ExtensionMarker position={end} direction={getPerpendicularDirection(startVec, endVec)} />

      {/* Text label - using Three.js text instead of HTML */}
      <mesh position={labelPos}>
        <planeGeometry args={[3, 1]} />
        <meshBasicMaterial color="white" opacity={0.8} transparent />
      </mesh>
    </group>
  );
};

interface ExtensionMarkerProps {
  position: [number, number, number];
  direction: THREE.Vector3;
}

const ExtensionMarker: React.FC<ExtensionMarkerProps> = ({ position, direction }) => {
  const start = new THREE.Vector3(...position).add(direction.clone().multiplyScalar(0.5));
  const end = new THREE.Vector3(...position).sub(direction.clone().multiplyScalar(0.5));

  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([
            start.x, start.y, start.z,
            end.x, end.y, end.z
          ])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color="#555555" linewidth={1} />
    </line>
  );
};

function getPerpendicularDirection(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3 {
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  return new THREE.Vector3(-direction.z, 0, direction.x);
}

/**
 * Standard Dimension Set for Tabletop Stand
 */
interface StandardDimensionsProps {
  spec: {
    stand: { W: number; D: number; H: number };
  };
}

export const StandardDimensions: React.FC<StandardDimensionsProps> = ({ spec }) => {
  const { W, D, H } = spec.stand;

  return (
    <group name="standard-dimensions">
      {/* Width dimension (front, above stand) */}
      <DimensionLine
        start={[-W/2, H + 3, D/2 + 1]}
        end={[W/2, H + 3, D/2 + 1]}
        label={`${W} cm`}
        offset={0.5}
      />

      {/* Depth dimension (right side) */}
      <DimensionLine
        start={[W/2 + 3, H + 1, -D/2]}
        end={[W/2 + 3, H + 1, D/2]}
        label={`${D} cm`}
        offset={0.5}
      />

      {/* Height dimension (left side) */}
      <DimensionLine
        start={[-W/2 - 3, 0, -D/2 - 1]}
        end={[-W/2 - 3, H, -D/2 - 1]}
        label={`${H} cm`}
        offset={0.5}
      />
    </group>
  );
};

/**
 * Alternative text-only approach using drei/Text
 */
export const TextDimensionLine: React.FC<DimensionLineProps> = ({
  start,
  end,
  label,
  offset = 2
}) => {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const midpoint = new THREE.Vector3()
    .addVectors(startVec, endVec)
    .multiplyScalar(0.5)
    .add(new THREE.Vector3(0, offset, 0));

  return (
    <group name={`text-dimension-${label}`}>
      {/* Line */}
      <line>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([...start, ...end])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#444444" />
      </line>

      {/* 3D Text Label */}
      <Text
        position={[midpoint.x, midpoint.y, midpoint.z]}
        fontSize={1.2}
        color="#444444"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        {label}
      </Text>
    </group>
  );
};