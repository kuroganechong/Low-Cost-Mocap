import { MutableRefObject, useEffect, useRef } from "react";
import { BufferGeometry, Color, InstancedMesh, Material, Matrix4, NormalBufferAttributes, Object3D, Vector3 } from "three";
import { numberToHexColor } from "../shared/styles/scripts/helpers";

export interface FilteredObject {
  pos: [number, number, number];
  heading: number;
  index: number;
}

export default function Objects({filteredObjectsRef, count, isObjectsVisible }: {filteredObjectsRef: MutableRefObject<FilteredObject[]>, count: number, isObjectsVisible: boolean}) {
  let objects = filteredObjectsRef.current.flat()

  const instancedMeshRef = useRef<InstancedMesh<BufferGeometry<NormalBufferAttributes>, Material | Material[]> | null>(null)
  const temp = new Object3D()
  const tempColour = new Color()

  let arrowDefaultDirection = new Vector3
  arrowDefaultDirection.set(1,0,0)

  let arrowDefaultLocation = new Vector3
  arrowDefaultLocation.set(0,0,0)

  useEffect(() => {
    objects.forEach(({pos, heading, index}, i) => {
      temp.position.set(pos[0], pos[2], pos[1]) // y is up in threejs
      let threeRotationMatrixY = new Matrix4
      threeRotationMatrixY.makeRotationY(heading)
      let threeRotationMatrixZ = new Matrix4
      threeRotationMatrixZ.makeRotationZ(Math.PI/2)
      threeRotationMatrixY.multiply(threeRotationMatrixZ)
      temp.setRotationFromMatrix(threeRotationMatrixY)
      temp.updateMatrix()
      instancedMeshRef.current!.setMatrixAt(i, temp.matrix)
      instancedMeshRef.current!.setColorAt(i, tempColour.set(numberToHexColor(index, 2))) 
    })
    instancedMeshRef.current!.instanceMatrix.needsUpdate = true 
    instancedMeshRef.current!.visible = isObjectsVisible
  }, [count])
  return (
    <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, objects.length]}>
        <coneGeometry args={[0.005, 0.02, 5, 5]}/>
        <meshPhongMaterial/>
    </instancedMesh>
  )
}