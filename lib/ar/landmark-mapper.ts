import { NormalizedLandmark } from './tracking-types';
import * as THREE from 'three';

/**
 * Converts a normalized MediaPipe landmark [0,1] to Three.js world coordinates.
 * 
 * We work in a "Unit Height" space:
 * - Y ranges from 1 (top) to -1 (bottom).
 * - X depends on the video's aspect ratio.
 * - Z is scaled for depth representation.
 * 
 * Mirroring is handled by flipping the X coordinate.
 */
export function landmarkToThree(
  lm: NormalizedLandmark,
  videoAspect: number,
  depthScale = 2,
  mirror = false
): THREE.Vector3 {
  // 1. Handle mirroring: mirror ? 1-x : x
  const nx = mirror ? 1 - lm.x : lm.x;

  // 2. Map X to [-aspect, aspect]
  const x = (nx - 0.5) * 2 * videoAspect;

  // 3. Map Y to [1, -1] (MediaPipe Y is 0 at top, 1 at bottom)
  const y = -(lm.y - 0.5) * 2;

  // 4. Map Z (MediaPipe Z is relative to depth, usually small)
  const z = -(lm.z ?? 0) * depthScale;

  return new THREE.Vector3(x, y, z);
}

/**
 * Compute midpoint between two landmarks in Three.js space.
 */
export function midpointThree(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
}

/**
 * Compute euler angles to align a cylinder/bone from point A to point B.
 */
export function directionToEuler(from: THREE.Vector3, to: THREE.Vector3): THREE.Euler {
  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir
  );
  return new THREE.Euler().setFromQuaternion(quaternion);
}
