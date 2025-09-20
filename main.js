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
    }
};

// Object behavior class for trackball rotation using 4x4 matrices
class ObjectBehavior {
    constructor(object) {
        this.object = object;
        this.anchor = null;
        this.rotationSpeed = 0.01;
        this.rotationBasis = MatrixUtils.createRotationalBasisTransform(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 1),
            this.object.position
        );
        this.rotationBasisInverse = this.rotationBasis.clone().invert();

    }

    beginInteraction(event) {
        this.anchor = {
            mousePosition: { x: event.clientX, y: event.clientY },
            matrix: this.object.matrix.clone()
        };
    }

    continueInteraction(event) {
        if (!this.anchor) return;

        const deltaMove = {
            x: event.clientX - this.anchor.mousePosition.x,
            y: event.clientY - this.anchor.mousePosition.y
        };

        // Create delta rotation matrices
        const deltaRotationY = MatrixUtils.createRotationY(deltaMove.x * this.rotationSpeed);
        const deltaRotationX = MatrixUtils.createRotationX(deltaMove.y * this.rotationSpeed);
        

        // Combine delta rotations: deltaMatrix = deltaRotationY * deltaRotationX
        const deltaMatrix = MatrixUtils.multiplyMatrices(this.rotationBasisInverse, deltaRotationY, deltaRotationX, this.rotationBasis);
        
        // Apply: resultMatrix = deltaMatrix * anchorMatrix
        const resultMatrix = new THREE.Matrix4();
        resultMatrix.multiplyMatrices(deltaMatrix, this.anchor.matrix);
        
        // Update object matrix
        this.object.matrix.copy(resultMatrix);
        this.object.matrixAutoUpdate = false;
    }

    endInteraction() {
        this.anchor = null;
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
const objectBehavior = new ObjectBehavior(pivotGroup);
const cameraBehavior = new CameraBehavior(camera, center);

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
}
window.addEventListener('resize', onWindowResize);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();