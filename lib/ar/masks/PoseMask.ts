import * as THREE from 'three';
import { NormalizedLandmark } from '../tracking-types';
import { landmarkToThree, midpointThree, directionToEuler } from '../landmark-mapper';

/**
 * PoseMask — Three.js Group representing the body skeleton with:
 *   - A box (prism) for the torso
 *   - Cylinders for upper/lower arms and legs
 *
 * MediaPipe Pose landmark indices (33 total):
 *  11=left_shoulder, 12=right_shoulder
 *  13=left_elbow,    14=right_elbow
 *  15=left_wrist,    16=right_wrist
 *  23=left_hip,      24=right_hip
 *  25=left_knee,     26=right_knee
 *  27=left_ankle,    28=right_ankle
 */

const LIMB_PAIRS: [number, number][] = [
  [11, 13], // L upper arm
  [13, 15], // L forearm
  [12, 14], // R upper arm
  [14, 16], // R forearm
  [23, 25], // L thigh
  [25, 27], // L shin
  [24, 26], // R thigh
  [26, 28], // R shin
];

export class PoseMask {
  group: THREE.Group;
  private torso: THREE.Mesh;
  private limbs: THREE.Mesh[];
  private limbPivots: THREE.Group[];

  constructor(color = 0xffffff) {
    this.group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.5 });

    // Torso — box/prism
    const torsoGeo = new THREE.BoxGeometry(0.3, 0.4, 0.15);
    this.torso = new THREE.Mesh(torsoGeo, mat);
    this.group.add(this.torso);

    // Limbs — cylinders (one per pair)
    this.limbs = [];
    this.limbPivots = [];
    for (let i = 0; i < LIMB_PAIRS.length; i++) {
      const pivot = new THREE.Group();
      const geo = new THREE.CylinderGeometry(0.025, 0.025, 1, 8);
      const mesh = new THREE.Mesh(geo, mat);
      pivot.add(mesh);
      this.group.add(pivot);
      this.limbs.push(mesh);
      this.limbPivots.push(pivot);
    }
  }

  addBrandObject(obj: THREE.Object3D): void {
    this.group.add(obj);
  }

  update(landmarks: NormalizedLandmark[], aspect: number): void {
    if (!landmarks || landmarks.length < 29) return;

    const lm = (i: number) => landmarkToThree(landmarks[i], aspect);

    // Torso — between shoulder midpoint and hip midpoint
    const ls = lm(11), rs = lm(12), lh = lm(23), rh = lm(24);
    const shoulderMid = midpointThree(ls, rs);
    const hipMid = midpointThree(lh, rh);
    const torsoCenter = midpointThree(shoulderMid, hipMid);

    this.torso.position.copy(torsoCenter);
    const torsoHeight = shoulderMid.distanceTo(hipMid);
    const torsoWidth = ls.distanceTo(rs);
    this.torso.scale.set(torsoWidth, torsoHeight, 1);

    // Orient torso
    const up = new THREE.Vector3().subVectors(shoulderMid, hipMid).normalize();
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)
    );
    this.torso.rotation.copy(euler);

    // Limbs
    LIMB_PAIRS.forEach(([a, b], i) => {
      const pa = lm(a), pb = lm(b);
      const center = midpointThree(pa, pb);
      const length = pa.distanceTo(pb);
      const pivot = this.limbPivots[i];
      const mesh = this.limbs[i];

      pivot.position.copy(center);
      mesh.scale.set(1, length, 1);

      const dir = new THREE.Vector3().subVectors(pb, pa).normalize();
      pivot.setRotationFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      );
    });
  }
}
