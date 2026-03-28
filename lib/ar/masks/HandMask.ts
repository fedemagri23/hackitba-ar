import * as THREE from 'three';
import { NormalizedLandmark } from '../tracking-types';
import { landmarkToThree, midpointThree } from '../landmark-mapper';

/**
 * HandMask — Three.js Group representing a hand with:
 *   - A box (prism) for the palm
 *   - Cylinders for each finger segment (5 fingers × 3 phalanges = 15 cylinders)
 *
 * MediaPipe Hand landmark indices (21 total):
 *   0=wrist
 *   1-4: thumb (CMC, MCP, IP, TIP)
 *   5-8: index  (MCP, PIP, DIP, TIP)
 *   9-12: middle (MCP, PIP, DIP, TIP)
 *   13-16: ring  (MCP, PIP, DIP, TIP)
 *   17-20: pinky (MCP, PIP, DIP, TIP)
 */

// Each pair of adjacent landmark indices forms one finger segment
const FINGER_PAIRS: [number, number][] = [
  // thumb
  [1, 2], [2, 3], [3, 4],
  // index
  [5, 6], [6, 7], [7, 8],
  // middle
  [9, 10], [10, 11], [11, 12],
  // ring
  [13, 14], [14, 15], [15, 16],
  // pinky
  [17, 18], [18, 19], [19, 20],
];

// Palm polygon vertices for sizing: wrist + 4 MCP knuckles
const PALM_IDX = [0, 5, 9, 13, 17];

export class HandMask {
  group: THREE.Group;
  private palm: THREE.Mesh;
  private fingerPivots: THREE.Group[];
  private fingerMeshes: THREE.Mesh[];

  constructor(color = 0xffffff) {
    this.group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.5 });

    // Palm box
    const palmGeo = new THREE.BoxGeometry(0.12, 0.14, 0.04);
    this.palm = new THREE.Mesh(palmGeo, mat);
    this.group.add(this.palm);

    // Finger segments
    this.fingerPivots = [];
    this.fingerMeshes = [];
    for (let i = 0; i < FINGER_PAIRS.length; i++) {
      const pivot = new THREE.Group();
      const geo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6);
      const mesh = new THREE.Mesh(geo, mat);
      pivot.add(mesh);
      this.group.add(pivot);
      this.fingerPivots.push(pivot);
      this.fingerMeshes.push(mesh);
    }
  }

  addBrandObject(obj: THREE.Object3D): void {
    this.group.add(obj);
  }

  update(landmarks: NormalizedLandmark[], aspect: number): void {
    if (!landmarks || landmarks.length < 21) return;

    const lm = (i: number) => landmarkToThree(landmarks[i], aspect);

    // Palm: centre between wrist and middle finger MCP
    const wrist = lm(0);
    const middleMCP = lm(9);
    const palmCenter = midpointThree(wrist, middleMCP);
    this.palm.position.copy(palmCenter);

    const palmHeight = wrist.distanceTo(middleMCP);
    const palmWidth = lm(5).distanceTo(lm(17));
    this.palm.scale.set(palmWidth * 0.9, palmHeight, 1);

    const palmDir = new THREE.Vector3().subVectors(middleMCP, wrist).normalize();
    this.palm.setRotationFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), palmDir)
    );

    // Finger segments
    FINGER_PAIRS.forEach(([a, b], i) => {
      const pa = lm(a), pb = lm(b);
      const center = midpointThree(pa, pb);
      const length = pa.distanceTo(pb);
      const pivot = this.fingerPivots[i];
      const mesh = this.fingerMeshes[i];

      pivot.position.copy(center);
      mesh.scale.set(1, length, 1);

      const dir = new THREE.Vector3().subVectors(pb, pa).normalize();
      pivot.setRotationFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      );
    });
  }
}
