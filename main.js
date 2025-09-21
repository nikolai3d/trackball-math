// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create zeppelin geometry
function createZeppelin() {
    const group = new THREE.Group();
    
    // Main body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(1, 32, 16);
    bodyGeometry.scale(2.5, 0.8, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4444aa });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);
    
    // Tail fins
    const finGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
    const finMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    // Vertical fin
    const verticalFin = new THREE.Mesh(finGeometry, finMaterial);
    verticalFin.position.set(-2.2, 0, 0);
    verticalFin.rotation.z = Math.PI / 2;
    verticalFin.castShadow = true;
    group.add(verticalFin);
    
    // Horizontal fins
    const horizontalFin1 = new THREE.Mesh(finGeometry, finMaterial);
    horizontalFin1.position.set(-2.2, 0.4, 0);
    horizontalFin1.rotation.x = Math.PI / 2;
    horizontalFin1.rotation.z = Math.PI / 2;
    horizontalFin1.castShadow = true;
    group.add(horizontalFin1);
    
    const horizontalFin2 = new THREE.Mesh(finGeometry, finMaterial);
    horizontalFin2.position.set(-2.2, -0.4, 0);
    horizontalFin2.rotation.x = -Math.PI / 2;
    horizontalFin2.rotation.z = Math.PI / 2;
    horizontalFin2.castShadow = true;
    group.add(horizontalFin2);
    
    // Gondola
    const gondolaGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
    const gondolaMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const gondola = new THREE.Mesh(gondolaGeometry, gondolaMaterial);
    gondola.position.set(0, -1.2, 0);
    gondola.castShadow = true;
    group.add(gondola);
    
    return group;
}

const zeppelin = createZeppelin();
scene.add(zeppelin);

// Calculate bounding box center
const box = new THREE.Box3().setFromObject(zeppelin);
const center = box.getCenter(new THREE.Vector3());
const boundingSize = new THREE.Vector3();
box.getSize(boundingSize);
const boundingDiagonal = boundingSize.length();
const trackballSphereRadius = boundingDiagonal * 0.65; // half diagonal scaled by 1.3

// Create a pivot group at the bounding box center
const pivotGroup = new THREE.Group();
pivotGroup.position.copy(center);
scene.add(pivotGroup);

// Move zeppelin to pivot group and adjust its position
scene.remove(zeppelin);
zeppelin.position.sub(center);
pivotGroup.add(zeppelin);

// Camera setup
camera.position.set(5, 3, 5);
camera.lookAt(center);

function createTrackballSphere(radius) {
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 24);
    const wireframeGeometry = new THREE.WireframeGeometry(sphereGeometry);
    const material = new THREE.LineBasicMaterial({
        color: 0x66ccff,
        opacity: 0.4,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, material);
    wireframe.renderOrder = 5;
    wireframe.frustumCulled = false;
    return wireframe;
}

function createTrackballDebugLine(color) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineDashedMaterial({
        color,
        dashSize: 0.08,
        gapSize: 0.05,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
        depthWrite: false
    });
    const line = new THREE.Line(geometry, material);
    line.visible = false;
    line.frustumCulled = false;
    line.renderOrder = 6;
    return line;
}

function createTrackballDebugPoint(color) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    const material = new THREE.PointsMaterial({
        color,
        size: 4,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false
    });
    const point = new THREE.Points(geometry, material);
    point.visible = false;
    point.frustumCulled = false;
    point.renderOrder = 7;
    return point;
}

const trackballSphereGroup = new THREE.Group();
trackballSphereGroup.position.copy(center);
scene.add(trackballSphereGroup);

const trackballSphere = createTrackballSphere(trackballSphereRadius);
trackballSphereGroup.add(trackballSphere);

const trackballAnchorLine = createTrackballDebugLine(0xffe066);
const trackballAnchorPoint = createTrackballDebugPoint(0xffe066);
const trackballCurrentLine = createTrackballDebugLine(0xffffff);
const trackballCurrentPoint = createTrackballDebugPoint(0xffffff);

trackballSphereGroup.add(trackballAnchorLine);
trackballSphereGroup.add(trackballAnchorPoint);
trackballSphereGroup.add(trackballCurrentLine);
trackballSphereGroup.add(trackballCurrentPoint);

const trackballSphereWorldPosition = new THREE.Vector3();

function updateTrackballDebugElement(line, point, position) {
    const linePositions = line.geometry.attributes.position.array;
    linePositions[0] = 0;
    linePositions[1] = 0;
    linePositions[2] = 0;
    linePositions[3] = position.x;
    linePositions[4] = position.y;
    linePositions[5] = position.z;
    line.geometry.attributes.position.needsUpdate = true;
    if (typeof line.computeLineDistances === 'function') {
        line.computeLineDistances();
    }
    line.visible = true;

    const pointPositions = point.geometry.attributes.position.array;
    pointPositions[0] = position.x;
    pointPositions[1] = position.y;
    pointPositions[2] = position.z;
    point.geometry.attributes.position.needsUpdate = true;
    point.visible = true;
}

function hideTrackballDebugElement(line, point) {
    line.visible = false;
    point.visible = false;
}

// Create ground plane grid and world axis widget
function createGroundPlaneGrid() {
    const gridGroup = new THREE.Group();
    
    // Grid parameters
    const gridSize = 20;
    const gridDivisions = 20;
    const gridColor = 0x444444;
    
    // Create grid helper
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    gridGroup.add(gridHelper);
    
    // Create world axis widget with dashed lines
    const axisLength = 5;
    
    // X-axis (red, dashed)
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(axisLength, 0, 0)
    ]);
    const xAxisMaterial = new THREE.LineDashedMaterial({ 
        color: 0xff0000, 
        dashSize: 0.2, 
        gapSize: 0.1,
        opacity: 0.8,
        transparent: true
    });
    const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    xAxis.computeLineDistances();
    gridGroup.add(xAxis);
    
    // Y-axis (green, dashed)
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, axisLength, 0)
    ]);
    const yAxisMaterial = new THREE.LineDashedMaterial({ 
        color: 0x00ff00, 
        dashSize: 0.2, 
        gapSize: 0.1,
        opacity: 0.8,
        transparent: true
    });
    const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    yAxis.computeLineDistances();
    gridGroup.add(yAxis);
    
    // Z-axis (blue, dashed)
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, axisLength)
    ]);
    const zAxisMaterial = new THREE.LineDashedMaterial({ 
        color: 0x0000ff, 
        dashSize: 0.2, 
        gapSize: 0.1,
        opacity: 0.8,
        transparent: true
    });
    const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
    zAxis.computeLineDistances();
    gridGroup.add(zAxis);
    
    return gridGroup;
}

// Create and add grid overlay
const gridOverlay = createGroundPlaneGrid();
scene.add(gridOverlay);

// Grid toggle functionality
let gridVisible = true;
const gridToggleButton = document.getElementById('gridToggle');

gridToggleButton.addEventListener('click', () => {
    gridVisible = !gridVisible;
    gridOverlay.visible = gridVisible;
    
    if (gridVisible) {
        gridToggleButton.classList.add('active');
        gridToggleButton.textContent = 'Grid Overlay';
    } else {
        gridToggleButton.classList.remove('active');
        gridToggleButton.textContent = 'Show Grid';
    }
});

// Trackball unit-circle debug overlay
const trackballCircleOverlay = document.createElement('div');
trackballCircleOverlay.id = 'trackballCircleOverlay';
Object.assign(trackballCircleOverlay.style, {
    position: 'absolute',
    border: '2px dashed rgba(255, 255, 255, 0.35)',
    borderRadius: '50%',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    zIndex: '50',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
});
document.body.appendChild(trackballCircleOverlay);

const trackballInfoPanel = document.createElement('div');
trackballInfoPanel.id = 'trackballInfoPanel';
Object.assign(trackballInfoPanel.style, {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
    zIndex: '120',
    whiteSpace: 'nowrap',
    pointerEvents: 'none'
});
document.body.appendChild(trackballInfoPanel);

const defaultTrackballInfoText = 'Overlay px (x: 0.00000, y: 0.00000) | Normalized (x: 0.00000, y: 0.00000)';

function updateTrackballCircleOverlaySize() {
    const rect = renderer.domElement.getBoundingClientRect();
    const diameter = Math.min(rect.width, rect.height);
    const left = rect.left + (rect.width - diameter) / 2;
    const top = rect.top + (rect.height - diameter) / 2;

    trackballCircleOverlay.style.width = `${diameter}px`;
    trackballCircleOverlay.style.height = `${diameter}px`;
    trackballCircleOverlay.style.left = `${left}px`;
    trackballCircleOverlay.style.top = `${top}px`;
}

function setTrackballCircleOverlayState(isInside) {
    if (isInside) {
        trackballCircleOverlay.style.borderColor = 'rgba(100, 200, 255, 0.85)';
        trackballCircleOverlay.style.boxShadow = '0 0 10px rgba(100, 200, 255, 0.55)';
    } else {
        trackballCircleOverlay.style.borderColor = 'rgba(255, 140, 140, 0.5)';
        trackballCircleOverlay.style.boxShadow = 'none';
    }
}

function updateTrackballInfoPanel(clientX, clientY, normalized) {
    const viewportRect = renderer.domElement.getBoundingClientRect();
    const pixelX = clientX - viewportRect.left;
    const pixelY = clientY - viewportRect.top;
    trackballInfoPanel.textContent = `Overlay px (x: ${pixelX.toFixed(5)}, y: ${pixelY.toFixed(5)}) | Normalized (x: ${normalized.x.toFixed(5)}, y: ${normalized.y.toFixed(5)})`;
}

function updateTrackballDebugDisplay(clientX, clientY, normalizedOverride = null) {
    const normalized = normalizedOverride || objectBehavior.getNormalizedTrackballCoordinates(clientX, clientY);
    const radiusSquared = normalized.x * normalized.x + normalized.y * normalized.y;
    setTrackballCircleOverlayState(radiusSquared <= 1);
    updateTrackballInfoPanel(clientX, clientY, normalized);
    updateTrackballCurrentProjection(normalized);
    return normalized;
}

updateTrackballCircleOverlaySize();
trackballInfoPanel.textContent = defaultTrackballInfoText;
setTrackballCircleOverlayState(false);

// Shared matrix utility functions
const MatrixUtils = {
    // Create rotation matrix around X axis
    createRotationX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        );
    },

    // Create rotation matrix around Y axis
    createRotationY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new THREE.Matrix4().set(
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        );
    },

    // Create rotation matrix around Z axis
    createRotationZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new THREE.Matrix4().set(
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    },

    // Create translation matrix
    createTranslation(x, y, z) {
        return new THREE.Matrix4().set(
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        );
    },

    // Create transform matrix to rotational basis
    // Transforms space so that:
    // - xRotation becomes (1, 0, 0)
    // - yRotation (orthogonalized) becomes (0, 1, 0) 
    // - zRotation (orthogonalized) becomes (0, 0, 1)
    // - pivotPoint becomes (0, 0, 0)
    createRotationalBasisTransform(xRotation, yRotation, zRotation, pivotPoint) {
        // Clone input vectors to avoid modifying originals
        const x = xRotation.clone();
        const y = yRotation.clone();
        const z = zRotation.clone();
        
        // Normalize x-axis (primary axis)
        x.normalize();
        
        // Orthogonalize y-axis against x-axis using Gram-Schmidt
        const yDotX = y.dot(x);
        y.sub(x.clone().multiplyScalar(yDotX));
        y.normalize();
        
        // Orthogonalize z-axis against both x and y axes
        const zDotX = z.dot(x);
        const zDotY = z.dot(y);
        z.sub(x.clone().multiplyScalar(zDotX));
        z.sub(y.clone().multiplyScalar(zDotY));
        z.normalize();
        
        // Create basis matrix (world -> local transform)
        // This matrix has the orthogonalized basis vectors as rows
        // so that when applied, it transforms the basis vectors to standard axes
        const basisMatrix = new THREE.Matrix4().set(
            x.x, x.y, x.z, 0,
            y.x, y.y, y.z, 0,
            z.x, z.y, z.z, 0,
            0,   0,   0,   1
        );
        
        // Create translation to move pivot to origin
        const translationMatrix = this.createTranslation(-pivotPoint.x, -pivotPoint.y, -pivotPoint.z);
        
        // Combine: first translate pivot to origin, then transform basis
        const result = new THREE.Matrix4();
        result.multiplyMatrices(basisMatrix, translationMatrix);
        
        return result;
    },

    // Create inverse transform from rotational basis back to world space
    createInverseRotationalBasisTransform(xRotation, yRotation, zRotation, pivotPoint) {
        // Clone and orthogonalize basis vectors (same as above)
        const x = xRotation.clone().normalize();
        const y = yRotation.clone();
        const z = zRotation.clone();
        
        // Orthogonalize y and z
        const yDotX = y.dot(x);
        y.sub(x.clone().multiplyScalar(yDotX)).normalize();
        
        const zDotX = z.dot(x);
        const zDotY = z.dot(y);
        z.sub(x.clone().multiplyScalar(zDotX));
        z.sub(y.clone().multiplyScalar(zDotY)).normalize();
        
        // Create inverse basis matrix (local -> world transform)
        // This matrix has the orthogonalized basis vectors as columns
        const inverseBasisMatrix = new THREE.Matrix4().set(
            x.x, y.x, z.x, 0,
            x.y, y.y, z.y, 0,
            x.z, y.z, z.z, 0,
            0,   0,   0,   1
        );
        
        // Create translation to move origin back to pivot
        const inverseTranslationMatrix = this.createTranslation(pivotPoint.x, pivotPoint.y, pivotPoint.z);
        
        // Combine: first transform basis, then translate back to pivot
        const result = new THREE.Matrix4();
        result.multiplyMatrices(inverseTranslationMatrix, inverseBasisMatrix);
        
        return result;
    },

    // Multiply multiple matrices in sequence: A * B * C * D * ...
    multiplyMatrices(...matrices) {
        if (matrices.length < 2) {
            throw new Error('Need at least 2 matrices to multiply');
        }
        
        let result = matrices[0].clone();
        for (let i = 1; i < matrices.length; i++) {
            result.multiplyMatrices(result, matrices[i]);
        }
        return result;
    },

    // Create rotation matrix around arbitrary world axis
    // Uses transform-to-basis approach:
    // 1. Transform to space where AxisPoint is origin and AxisDirection is Z-axis
    // 2. Rotate around Z-axis by specified angle
    // 3. Transform back to world space
    createAxisRotation(axisPoint, axisDirection, angle) {
        // Normalize the axis direction
        const zAxis = axisDirection.clone().normalize();
        
        // Create two perpendicular vectors to complete the basis
        // Choose an arbitrary vector that's not parallel to zAxis
        let tempVector = new THREE.Vector3(1, 0, 0);
        if (Math.abs(zAxis.dot(tempVector)) > 0.9) {
            tempVector.set(0, 1, 0);
        }
        
        // Create orthogonal basis using cross products
        const xAxis = new THREE.Vector3().crossVectors(tempVector, zAxis).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
        
        // Step 1: Transform to rotational basis
        // Move axisPoint to origin and align axisDirection with Z-axis
        const toBasisTransform = this.createRotationalBasisTransform(
            xAxis, yAxis, zAxis, axisPoint
        );
        
        // Step 2: Rotation around Z-axis in the transformed space
        const zRotation = this.createRotationZ(angle);
        
        // Step 3: Transform back to world space
        const fromBasisTransform = this.createInverseRotationalBasisTransform(
            xAxis, yAxis, zAxis, axisPoint
        );
        
        // Combine all transformations: fromBasis * zRotation * toBasis
        return this.multiplyMatrices(fromBasisTransform, zRotation, toBasisTransform);
    },

    // Virtual Trackball mathematics
    // Map normalized screen coordinates [-1,1] to unit sphere surface
    // Uses Shoemake's trackball algorithm for robust sphere mapping
    screenToSphere(x, y, radius = 1.0) {
        // Input x,y should be normalized screen coordinates in range [-1, 1]
        const lengthSquared = x*x + y*y;
        const radiusSquared = radius * radius;
        
        if (lengthSquared <= radiusSquared * 0.5) {
            // Inside the sphere - use true sphere equation: z = sqrt(r² - x² - y²)
            const z = Math.sqrt(radiusSquared - lengthSquared);
            return new THREE.Vector3(x, y, z);
        } else {
            // Outside sphere - use hyperbolic sheet to avoid discontinuity
            // This creates a smooth transition at the sphere boundary
            const z = radiusSquared / (2.0 * Math.sqrt(lengthSquared));
            return new THREE.Vector3(x, y, z);
        }
    },

    // Create rotation matrix from virtual trackball movement
    createTrackballRotation(startScreenPos, endScreenPos, pivotPoint, radius = 1.0) {
        // Map screen positions to sphere
        const startSphere = this.screenToSphere(startScreenPos.x, startScreenPos.y, radius);
        const endSphere = this.screenToSphere(endScreenPos.x, endScreenPos.y, radius);
        
        // Calculate rotation axis (cross product of sphere positions)
        const rotationAxis = new THREE.Vector3().crossVectors(startSphere, endSphere);
        
        // Calculate rotation angle
        const rotationAngle = startSphere.angleTo(endSphere);
        
        // Return identity matrix if no rotation needed
        if (rotationAngle < 0.0001 || rotationAxis.length() < 0.0001) {
            return new THREE.Matrix4(); // identity matrix
        }
        
        // Normalize the rotation axis
        rotationAxis.normalize();
        
        // Create rotation matrix around the calculated axis
        return this.createAxisRotation(pivotPoint, rotationAxis, rotationAngle);
    }
};

// Object behavior class for trackball rotation using 4x4 matrices
class ObjectBehavior {
    constructor(camera, object, scene) {
        this.camera = camera;
        this.object = object;
        this.scene = scene;
        this.anchor = null;
        this.trackballRadius = 1.0;
        this.sensitivity = 1.0;
        
        // Persistent camera basis vectors
        this.cameraXWorldSpace = new THREE.Vector4(1, 0, 0, 0);
        this.cameraYWorldSpace = new THREE.Vector4(0, 1, 0, 0);
        this.cameraZWorldSpace = new THREE.Vector4(0, 0, 1, 0);
        
        // Create visualization cylinders
        this.createVisualizationCylinders();
        
        // Update basis vectors
        this.updateCameraBasisVectors();
    }
    
    createVisualizationCylinders() {
        const cylinderGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
        
        // X-axis cylinder (red)
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.xCylinder = new THREE.Mesh(cylinderGeometry, xMaterial);
        this.xCylinder.visible = false;
        this.scene.add(this.xCylinder);
        
        // Y-axis cylinder (green)
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.yCylinder = new THREE.Mesh(cylinderGeometry, yMaterial);
        this.yCylinder.visible = false;
        this.scene.add(this.yCylinder);
        
        // Z-axis cylinder (blue)
        const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        this.zCylinder = new THREE.Mesh(cylinderGeometry, zMaterial);
        this.zCylinder.visible = false;
        this.scene.add(this.zCylinder);
    }
    
    updateCameraBasisVectors() {
        // Reset to identity vectors
        this.cameraXWorldSpace.set(1, 0, 0, 0);
        this.cameraYWorldSpace.set(0, 1, 0, 0);
        this.cameraZWorldSpace.set(0, 0, 1, 0);
        
        // Transform by camera's world matrix
        this.cameraXWorldSpace.applyMatrix4(this.camera.matrixWorld);
        this.cameraYWorldSpace.applyMatrix4(this.camera.matrixWorld);
        this.cameraZWorldSpace.applyMatrix4(this.camera.matrixWorld);
        
        // Update rotation basis matrices for camera-aligned rotations
        this.rotationBasis = MatrixUtils.createRotationalBasisTransform(
            new THREE.Vector3(this.cameraXWorldSpace.x, this.cameraXWorldSpace.y, this.cameraXWorldSpace.z),
            new THREE.Vector3(this.cameraYWorldSpace.x, this.cameraYWorldSpace.y, this.cameraYWorldSpace.z),
            new THREE.Vector3(this.cameraZWorldSpace.x, this.cameraZWorldSpace.y, this.cameraZWorldSpace.z),
            this.object.position
        );
        this.rotationBasisInverse = this.rotationBasis.clone().invert();
    }
    
    updateVisualizationCylinders() {
        const pivotPos = this.object.position;
        const axisLength = 1.0;
        
        // X-axis cylinder (red)
        const xDir = new THREE.Vector3(this.cameraXWorldSpace.x, this.cameraXWorldSpace.y, this.cameraXWorldSpace.z).normalize();
        this.xCylinder.position.copy(pivotPos).add(xDir.clone().multiplyScalar(axisLength * 0.5));
        this.xCylinder.lookAt(pivotPos.clone().add(xDir));
        this.xCylinder.rotateX(Math.PI / 2);
        
        // Y-axis cylinder (green)
        const yDir = new THREE.Vector3(this.cameraYWorldSpace.x, this.cameraYWorldSpace.y, this.cameraYWorldSpace.z).normalize();
        this.yCylinder.position.copy(pivotPos).add(yDir.clone().multiplyScalar(axisLength * 0.5));
        this.yCylinder.lookAt(pivotPos.clone().add(yDir));
        this.yCylinder.rotateX(Math.PI / 2);
        
        // Z-axis cylinder (blue)
        const zDir = new THREE.Vector3(this.cameraZWorldSpace.x, this.cameraZWorldSpace.y, this.cameraZWorldSpace.z).normalize();
        this.zCylinder.position.copy(pivotPos).add(zDir.clone().multiplyScalar(axisLength * 0.5));
        this.zCylinder.lookAt(pivotPos.clone().add(zDir));
        this.zCylinder.rotateX(Math.PI / 2);
    }

    beginInteraction(event) {
        // Update camera basis vectors at start of interaction
        this.updateCameraBasisVectors();

        // Convert screen coordinates to normalized trackball coordinates
        const normalizedStart = this.getNormalizedTrackballCoordinates(event.clientX, event.clientY);

        this.anchor = {
            mousePosition: { x: event.clientX, y: event.clientY },
            normalizedStart,
            matrix: this.object.matrix.clone()
        };

        updateTrackballDebugDisplay(event.clientX, event.clientY, normalizedStart);
        updateTrackballAnchorProjection(normalizedStart);

        // Show visualization cylinders
        this.updateVisualizationCylinders();
        this.xCylinder.visible = true;
        this.yCylinder.visible = true;
        this.zCylinder.visible = true;
    }

    continueInteraction(event) {
        if (!this.anchor) return;

        // Convert current screen coordinates to normalized trackball coordinates
        const currentNormalized = this.getNormalizedTrackballCoordinates(event.clientX, event.clientY);

        updateTrackballDebugDisplay(event.clientX, event.clientY, currentNormalized);
        updateTrackballAnchorProjection(this.anchor.normalizedStart);
        
        // Apply sensitivity scaling
        const startPos = {
            x: this.anchor.normalizedStart.x * this.sensitivity,
            y: this.anchor.normalizedStart.y * this.sensitivity
        };
        const endPos = {
            x: currentNormalized.x * this.sensitivity,
            y: currentNormalized.y * this.sensitivity
        };
        
        // Create virtual trackball rotation in camera space
        const trackballDeltaMatrix = MatrixUtils.createTrackballRotation(
            startPos, 
            endPos, 
            this.object.position, 
            this.trackballRadius
        );
        
        // Transform rotation to camera-aligned space
       const deltaMatrix = MatrixUtils.multiplyMatrices(
            this.rotationBasisInverse, 
            trackballDeltaMatrix, 
            this.rotationBasis
        );
        
        // Apply: resultMatrix = deltaMatrix * anchorMatrix
        const resultMatrix = new THREE.Matrix4();
        resultMatrix.multiplyMatrices(deltaMatrix, this.anchor.matrix);
        
        // Update object matrix
        this.object.matrix.copy(resultMatrix);
        this.object.matrixAutoUpdate = false;
    }

    getNormalizedTrackballCoordinates(clientX, clientY) {
        const rect = renderer.domElement.getBoundingClientRect();
        const minDimension = Math.min(rect.width, rect.height);

        if (minDimension === 0) {
            return { x: 0, y: 0 };
        }

        const halfSize = minDimension / 2;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        return {
            x: (clientX - centerX) / halfSize,
            y: (centerY - clientY) / halfSize
        };
    }

    getTrackballProjectionPoint(normalized) {
        const radius = this.trackballRadius;
        const scaledX = normalized.x * this.sensitivity;
        const scaledY = normalized.y * this.sensitivity;
        const projection = MatrixUtils.screenToSphere(scaledX, scaledY, radius);

        if (projection.lengthSq() === 0) {
            return new THREE.Vector3(0, 0, trackballSphereRadius);
        }

        if (radius !== 0) {
            projection.divideScalar(radius);
        }

        const lengthSq = projection.lengthSq();
        if (lengthSq > 0) {
            projection.normalize();
        } else {
            projection.set(0, 0, 1);
        }

        return projection.multiplyScalar(trackballSphereRadius);
    }

    endInteraction() {
        this.anchor = null;

        // Hide visualization cylinders
        this.xCylinder.visible = false;
        this.yCylinder.visible = false;
        this.zCylinder.visible = false;

        hideTrackballDebugElement(trackballAnchorLine, trackballAnchorPoint);
    }
}

// Camera behavior class for orbit controls using 4x4 matrices
class CameraBehavior {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.anchor = null;
        this.orbitSpeed = 0.01;
    }

    beginInteraction(event) {
        // Store camera's current transformation matrix relative to target
        const cameraToTarget = new THREE.Vector3();
        cameraToTarget.subVectors(this.camera.position, this.target);
        
        this.anchor = {
            mousePosition: { x: event.clientX, y: event.clientY },
            cameraOffset: cameraToTarget.clone(),
            cameraMatrix: this.camera.matrix.clone()
        };
    }

    continueInteraction(event) {
        if (!this.anchor) return;

        const deltaMove = {
            x: event.clientX - this.anchor.mousePosition.x,
            y: event.clientY - this.anchor.mousePosition.y
        };

        // Create delta rotation matrices
        const deltaRotationY = MatrixUtils.createRotationY(-deltaMove.x * this.orbitSpeed);
        const deltaRotationX = MatrixUtils.createRotationX(deltaMove.y * this.orbitSpeed);
        
        // Combine rotations: deltaMatrix = deltaRotationY * deltaRotationX
        const deltaMatrix = new THREE.Matrix4();
        deltaMatrix.multiplyMatrices(deltaRotationY, deltaRotationX);
        
        // Apply rotation to the camera offset vector
        const rotatedOffset = this.anchor.cameraOffset.clone();
        rotatedOffset.applyMatrix4(deltaMatrix);
        
        // Clamp vertical rotation to prevent flipping
        const distance = rotatedOffset.length();
        const phi = Math.acos(rotatedOffset.y / distance);
        const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
        
        if (Math.abs(phi - clampedPhi) > 0.001) {
            const theta = Math.atan2(rotatedOffset.x, rotatedOffset.z);
            rotatedOffset.x = distance * Math.sin(clampedPhi) * Math.sin(theta);
            rotatedOffset.y = distance * Math.cos(clampedPhi);
            rotatedOffset.z = distance * Math.sin(clampedPhi) * Math.cos(theta);
        }
        
        // Update camera position
        this.camera.position.copy(this.target);
        this.camera.position.add(rotatedOffset);
        this.camera.lookAt(this.target);
    }

    endInteraction() {
        this.anchor = null;
    }
}

// Create behavior instances
const objectBehavior = new ObjectBehavior(camera, pivotGroup, scene);
const cameraBehavior = new CameraBehavior(camera, center);

function updateTrackballAnchorProjection(normalized) {
    if (!normalized) return;
    const projection = objectBehavior.getTrackballProjectionPoint(normalized);
    updateTrackballDebugElement(trackballAnchorLine, trackballAnchorPoint, projection);
}

function updateTrackballCurrentProjection(normalized) {
    if (!normalized) {
        hideTrackballDebugElement(trackballCurrentLine, trackballCurrentPoint);
        return;
    }

    const projection = objectBehavior.getTrackballProjectionPoint(normalized);
    updateTrackballDebugElement(trackballCurrentLine, trackballCurrentPoint, projection);
}

function updateTrackballCircleDebug(event) {
    updateTrackballDebugDisplay(event.clientX, event.clientY);
}

window.addEventListener('mousemove', updateTrackballCircleDebug);
window.addEventListener('mouseleave', () => {
    setTrackballCircleOverlayState(false);
    trackballInfoPanel.textContent = defaultTrackballInfoText;
    hideTrackballDebugElement(trackballCurrentLine, trackballCurrentPoint);
    hideTrackballDebugElement(trackballAnchorLine, trackballAnchorPoint);
});

// Mouse interaction state
let isMouseDown = false;
let currentBehavior = null;

// Mouse event handlers
function onMouseDown(event) {
    isMouseDown = true;
    
    if (event.button === 0) { // Left click - object rotation
        currentBehavior = objectBehavior;
    } else if (event.button === 2) { // Right click - camera orbit
        currentBehavior = cameraBehavior;
    }
    
    if (currentBehavior) {
        currentBehavior.beginInteraction(event);
    }
    
    event.preventDefault();
}

function onMouseUp(event) {
    if (currentBehavior) {
        currentBehavior.endInteraction();
        currentBehavior = null;
    }
    
    isMouseDown = false;
    event.preventDefault();
}

function onMouseMove(event) {
    if (!isMouseDown || !currentBehavior) return;
    
    currentBehavior.continueInteraction(event);
    event.preventDefault();
}

function onContextMenu(event) {
    event.preventDefault();
}

// Add event listeners
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('contextmenu', onContextMenu);

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateTrackballCircleOverlaySize();
    trackballInfoPanel.textContent = defaultTrackballInfoText;
    hideTrackballDebugElement(trackballCurrentLine, trackballCurrentPoint);
    hideTrackballDebugElement(trackballAnchorLine, trackballAnchorPoint);
}
window.addEventListener('resize', onWindowResize);

function updateTrackballSphereDebug() {
    trackballSphereGroup.position.copy(objectBehavior.object.position);
    trackballSphereGroup.quaternion.copy(camera.quaternion);
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    updateTrackballSphereDebug();
    renderer.render(scene, camera);
}

animate();
