# Trackball Mathematics Documentation

This document outlines the core mathematical functions required for virtual trackball interaction.

In the main.js file, this is implemented in the ObjectBehavior class.

## Core Mathematical Flow

The trackball interaction follows this mathematical pipeline:

1. **Screen Coordinate Normalization** - Convert mouse position to normalized unit circle coordinates
2. **Sphere Projection** - Map 2D normalized coordinates to 3D unit sphere surface  
3. **Rotation Calculation** - Compute rotation axis and angle from sphere positions
4. **Coordinate Space Transformation** - Transform rotation to camera-aligned space
5. **Matrix Application** - Apply final rotation to object

## Required Mathematical Functions

### 1. Screen Coordinate Conversion

**JS Function**: `getTrackballUnitCircleMouseCoordinates`

**Purpose**: Converts screen pixel coordinates to normalized unit circle coordinates [-1,1]

**Inputs**:
- `clientX: number` - Mouse X position in screen pixels
- `clientY: number` - Mouse Y position in screen pixels

**Outputs**:
- `{x: number, y: number}` - Normalized coordinates where the smaller screen dimension maps to [-1,1]

**Notes**: Centers the coordinate system and uses the smaller screen dimension to maintain aspect ratio, so the normalized unit circle is always a circle, not an ellipse. 

---

### 2. Unit Circle to Unit Sphere Projection

**JS Function**: `MatrixUtils.screenUnitCircleToUnitSphere`

**Purpose**: Maps 2D normalized screen coordinates to 3D unit sphere surface using Shoemake's algorithm

**Inputs**:
- `x: number` - Normalized X coordinate [-1,1]
- `y: number` - Normalized Y coordinate [-1,1]

**Outputs**:
- `THREE.Vector3` - Point on unit sphere surface

**Algorithm**:
- If `x² + y² ≤ 0.5`: Use sphere equation `z = √(1 - x² - y²)`
- If `x² + y² > 0.5`: Use hyperbolic sheet `z = 1/(2√(x² + y²))` for smooth transition

---

### 3. Trackball Rotation Calculation

**JS Function**: `MatrixUtils.createTrackballRotation`

**Purpose**: Computes rotation matrix from two sphere positions representing start and end of mouse drag

**Inputs**:
- `startScreenUnitCircle: {x: number, y: number}` - Starting normalized screen position
- `endScreenUnitCircle: {x: number, y: number}` - Ending normalized screen position  
- `pivotPoint: THREE.Vector3` - World space pivot point for rotation

**Outputs**:
- `{matrix: THREE.Matrix4, axis: THREE.Vector3, angle: number}` - Rotation transformation data

**Algorithm**:
1. Map both screen positions to unit sphere using `screenUnitCircleToUnitSphere`
2. Calculate rotation axis via cross product: `axis = start × end`
3. Calculate rotation angle: `angle = arccos(start · end)`
4. Create rotation matrix around calculated axis and pivot point

---

### 4. Coordinate Space Transformation

**JS Function**: `MatrixUtils.createRotationalBasisTransform`

**Purpose**: Creates transformation matrix to convert between coordinate systems

**Inputs**:
- `xRotation: THREE.Vector3` - Primary basis vector (will become X-axis)
- `yRotation: THREE.Vector3` - Secondary basis vector (orthogonalized to Y-axis)
- `zRotation: THREE.Vector3` - Tertiary basis vector (orthogonalized to Z-axis)  
- `pivotPoint: THREE.Vector3` - Origin point for the new coordinate system

**Outputs**:
- `THREE.Matrix4` - Transformation matrix (world → local coordinates)

**Algorithm**:
1. Normalize primary axis (X)
2. Orthogonalize Y-axis against X using Gram-Schmidt process
3. Orthogonalize Z-axis against both X and Y
4. Create basis matrix with orthonormal vectors as rows
5. Combine with translation to move pivot to origin

---

### 5. Axis Rotation

**Function**: `MatrixUtils.createAxisRotation`

**Purpose**: Creates rotation matrix around arbitrary world-space axis

**Inputs**:
- `axisPoint: THREE.Vector3` - Point on rotation axis
- `axisDirection: THREE.Vector3` - Direction vector of rotation axis
- `angle: number` - Rotation angle in radians

**Outputs**:
- `THREE.Matrix4` - Rotation transformation matrix

**Algorithm**:
1. Create orthonormal basis with axis direction as Z-axis
2. Transform to basis space (axis becomes Z-axis, point becomes origin)
3. Apply Z-axis rotation by specified angle
4. Transform back to world space

## Pseudo Code (Once You have all the math functions implemented)

### onBeginInteraction(mouseEvent)

```
1. Update camera basis vectors from current camera world matrix:
   cameraXWorldSpace = transform(1,0,0) by camera.matrixWorld
   cameraYWorldSpace = transform(0,1,0) by camera.matrixWorld  
   cameraZWorldSpace = transform(0,0,1) by camera.matrixWorld

2. Create rotational basis transformation matrices:
   rotationBasis = createRotationalBasisTransform(cameraX, cameraY, cameraZ, pivotPoint)
   rotationBasisInverse = inverse(rotationBasis)

3. Convert mouse position to normalized coordinates:
   anchorUnitCircle = getTrackballUnitCircleMouseCoordinates(mouseX, mouseY)

4. Store anchor state:
   anchor = {
     mousePosition: (mouseX, mouseY),
     unitCircleMouseAnchor: anchorUnitCircle,
     objectMatrix: clone(object.matrix)
   }

```

### onContinueInteraction(mouseEvent)

```
1. Convert current mouse position to normalized coordinates:
   currentUnitCircle = getTrackballUnitCircleMouseCoordinates(mouseX, mouseY)

2. Calculate trackball rotation in camera space:
   trackballRotation = createTrackballRotation(
     anchor.unitCircleMouseAnchor, 
     currentUnitCircle, 
     pivotPoint
   )
   // Returns: {matrix, axis, angle}

3. Transform rotation from camera space to world space:
   worldSpaceRotation = rotationBasisInverse × trackballRotation.matrix × rotationBasis

4. Apply rotation to object:
   newObjectMatrix = worldSpaceRotation × anchor.objectMatrix
   object.matrix = newObjectMatrix

```


