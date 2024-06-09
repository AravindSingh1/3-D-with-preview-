import * as THREE from 'three';
import { OrbitControls } from '/OrbitControls.js';
import { GLTFLoader } from '/GLTFLoader.js';
import { DRACOLoader } from '/DRACOLoader.js';

const fullSvgEl = document.getElementById("parentSVG");
const selectedFiles = document.getElementById("filesInp");
const getBtn = document.getElementById("getBtn");
const manualCtrlsWrapperDiv = document.querySelector(".mnCtrls");
const rotationsEl = document.getElementById("rotations");
const rotateXRangeEl = document.getElementById('rotateX');
const rotateYRangeEl = document.getElementById('rotateY');
const rotateZRangeEl = document.getElementById('rotateZ');
const cameraManualCtrlsDiv = document.querySelector(".cameraCtrls");
const cameraAcc = document.getElementById("cameraAcc");
const cameraXEl = document.getElementById("cameraX");
const cameraYEl = document.getElementById("cameraY");
const cameraZEl = document.getElementById("cameraZ");
const shadowCtrlDiv = document.querySelector(".shadowCtrls");
const shadowCtrlsAcc = document.getElementById("shadowAcc");
const shadowOnOffEl = document.getElementById("shadowOnOffEl");
const shadowTransparencyEl = document.getElementById("shadowTransparencyValue");
const shadowBlurEl = document.getElementById("shadowBlurEl");
const prevDivEl = document.querySelector(".preview");


let ctrls;
let scene;
let camera;
let model;
let renderer;
let plane;
let directionalLight;
let boundingBoxObj;
let shadowMaterial;
let prevImg;

getBtn.addEventListener("click", renderDom);
rotationsEl.addEventListener("click", handleRotation);
cameraAcc.addEventListener("click", handleCameras);
shadowCtrlsAcc.addEventListener("click", handleShadow)
rotateXRangeEl.addEventListener("mousemove", rotateXHandle);
rotateYRangeEl.addEventListener("mousemove", rotateYHandle);
rotateZRangeEl.addEventListener("mousemove", rotateZHandle);
cameraXEl.addEventListener("change", ctrlCameraX);
cameraYEl.addEventListener("change", ctrlCameraY);
cameraZEl.addEventListener("change", ctrlCameraZ);
shadowOnOffEl.addEventListener("mousedown", toggleShadow);
shadowTransparencyEl.addEventListener("mousemove", ctrlShadowTransparency);
shadowBlurEl.addEventListener("mousemove", ctrlShadowBlur);


function renderDom() {
    if (selectedFiles.files.length == 0) {
        alert("No file selected !");
        return;
    }
    let width = window.innerWidth * 70 / 100;
    let height = window.innerHeight;
    let g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    var newNode = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
    let attributesForNewNode = { width: width, height: height, x: `0`, y: "30" };
    setAttributes(newNode, attributesForNewNode);
    g.appendChild(newNode);

    var renderingDiv = document.createElement('div');
    var divIdName = `div_1`;
    setAttributes(renderingDiv, { id: divIdName, class: "renderingDiv" });
    newNode.appendChild(renderingDiv);

    renderFile(renderingDiv);
    fullSvgEl.appendChild(g);
}


function renderFile(div) {
    let hlight;
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(5, 2, 5);

    scene = new THREE.Scene();
    const color = new THREE.Color("white");
    scene.background = color;
    scene.updateMatrixWorld(true);

    hlight = new THREE.AmbientLight(0x404040, 100);
    scene.add(hlight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 10);
    directionalLight.position.set(5, 2, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.bias = 0.00001; // Adjust as needed
    directionalLight.shadow.radius = 1;
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    console.log(dracoLoader);
    loader.setDRACOLoader(dracoLoader);
    const fileSrc = URL.createObjectURL(selectedFiles.files[0]);
    loader.load(fileSrc, async function (glb) {
        model = glb.scene;

        model.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = false; // Models usually don't receive shadows themselves
            }
        });

        boundingBoxObj = new THREE.Box3().setFromObject(model);
        console.log("y", boundingBoxObj.max.y);

        var size = new THREE.Vector3();     // Three vector -> it gives 3d vector with x, y, z coordinates
        boundingBoxObj.getSize(size);          // getting initial size of 3d-Object
        var maxSize = new THREE.Vector3(5, 5, 5);  // setting mximum size ratio for a 3-d object
        var minSize = new THREE.Vector3(1.3, 1.3, 1.3); // setting minimum size ratio for a 3-d oject

        if (size.x > maxSize.x || size.y > maxSize.y || size.z > maxSize.z) {   // reducing the size if it is more than respective view ratio according to vivible ratio
            var scaleFactor = Math.min(maxSize.x / size.x, maxSize.y / size.y, maxSize.z / size.z);
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        if (size.x < minSize || size.y < minSize.y || size.z < minSize.z) {  // inncreasing the size of 3-d object if it is less than respective ratio
            var scaleFactor = Math.max(minSize.x / size.x, minSize.y / size.y, minSize.z / size.z);
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(devicePixelRatio);
        let width = window.innerWidth * 70 / 100;
        let height = width * 2.5 / 3;
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5;
        renderer.shadowMap.enabled = true;
        renderer.setClearColor("white", 0);

        camera.lookAt(new THREE.Vector3(0, 0, 0));   // camera should look at the origin in cartecian coordinates

        await renderer.compileAsync(scene, camera);
        scene.add(model);

        boundingBoxObj = new THREE.Box3().setFromObject(model);
        console.log("y", boundingBoxObj.max.y);

        const geometry = new THREE.PlaneGeometry(20, 20);
        shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
        plane = new THREE.Mesh(geometry, shadowMaterial);
        plane.position.y = boundingBoxObj.min.y;
        plane.rotation.x = - Math.PI / 2;
        plane.receiveShadow = true;
        plane.material.side = THREE.DoubleSide;
        scene.add(plane);

        renderer.render(scene, camera);
        setInitialCmraValues();

        prevImg = document.createElement("img");
        setAttributes(prevImg, {id:"imgPrView", alt:"nn"});
        prevDivEl.appendChild(prevImg);

        renderer.domElement.setAttribute("id", "canvas");
        div.appendChild(renderer.domElement);  //adding rendered 3d object to dom in respective div
        div.addEventListener("mousedown", ctrlsHandling);
        div.addEventListener("mouseup", renderShadow);
        showPreview();
    })
}


function ctrlsHandling() {
    scene.remove(plane);
    if (ctrls) {
        return;
    }
    ctrls = new OrbitControls(camera, renderer.domElement);
    ctrls.addEventListener('change', render);
    ctrls.minDistance = 0.1;
    ctrls.maxDistance = 900;
    ctrls.target.set(0, 0, 0);
    ctrls.update();
}


function render() {
    renderer.render(scene, camera);
    cameraXEl.value = camera.position.x;
    cameraYEl.value = camera.position.y;
    cameraZEl.value = camera.position.z;
}


let isShadowOn = false;
function renderShadow() {
    if (isShadowOn) {
        if (plane && directionalLight && camera) {
            let x = camera.position.x;
            let y = camera.position.y;
            let z = camera.position.z;
            directionalLight.position.set(-x * 1 / 2, +y + 2, +z);

            boundingBoxObj = new THREE.Box3().setFromObject(model);
            plane.position.y = boundingBoxObj.min.y;

            scene.add(plane);
            render();
        }
    }
    showPreview();
}

// function calculatePositionOfPlane() {
//     if (camera) {
//         let x = camera.position.x;
//         let y = camera.position.y;
//         let z = camera.position.z;
//         x = +x;
//         y = +y;
//         z = +z;
//         // console.log(x, y, z);
//         let xValue = x > 0 ? x : -1 * x;
//         let yValue = y > 0 ? y : -1 * y;
//         let zValue = z > 0 ? z : -1 * z;
//         let xToRtrn = x > 0 ? -5 : 5;
//         let ytoRtrn = y > 0 ? -2 : 2;
//         let zToRtrn = z > 0 ? -5 : 5;


//         if (xValue <= 5 || yValue <= 2 || zValue <= 5) {
//             xToRtrn = x > 0 ? -1 * x : xValue;
//             ytoRtrn = y > 0 ? -1 * y : yValue;
//             zToRtrn = z > 0 ? -1 * z : zValue;
//         }

//         let vector = new THREE.Vector3(xToRtrn, ytoRtrn, zToRtrn);
//         return vector;
//     }
// }

function setAttributes(element, allAttributes) {
    let attriButes = Object.keys(allAttributes);
    let attributeValues = Object.values(allAttributes);
    for (let i = 0; i < attriButes.length; i++) {
        element.setAttribute(attriButes[i], attributeValues[i]);
    }
}


let rotationIsOpened = false;
function handleRotation() {
    if (rotationIsOpened) {
        manualCtrlsWrapperDiv.style.height = "100px";
        document.getElementById("upDownArrowAcc").classList.remove("fa-chevron-up");
        document.getElementById("upDownArrowAcc").classList.add("fa-chevron-down");
        rotationIsOpened = false;
    }
    else {
        manualCtrlsWrapperDiv.style.height = "300px";
        document.getElementById("upDownArrowAcc").classList.remove("fa-chevron-down");
        document.getElementById("upDownArrowAcc").classList.add("fa-chevron-up");
        rotationIsOpened = true;
    }
}


let initialXValue = rotateXRangeEl.value;
function rotateXHandle() {
    let crrRotationValue = rotateXRangeEl.value;
    let CrrDeg = (crrRotationValue / 100) * Math.PI * 2;
    let prevDeg = (initialXValue / 100) * Math.PI * 2;
    let degToRotate = CrrDeg - prevDeg;
    if (model) {
        model.rotateY(degToRotate);
        initialXValue = crrRotationValue;
        render();
    }
}


let initialYValue = rotateYRangeEl.value;
function rotateYHandle() {
    let crrRotationValue = rotateYRangeEl.value;
    let CrrDeg = (crrRotationValue / 100) * Math.PI * 2;
    let prevDeg = (initialYValue / 100) * Math.PI * 2;
    let degToRotate = CrrDeg - prevDeg;
    if (model) {
        model.rotateX(degToRotate);
        initialYValue = crrRotationValue;
        render();
    }
}


let initialZValue = rotateZRangeEl.value;
function rotateZHandle() {
    let crrRotationValue = rotateZRangeEl.value;
    let CrrDeg = (crrRotationValue / 100) * Math.PI * 2;
    let prevDeg = (initialZValue / 100) * Math.PI * 2;
    let degToRotate = CrrDeg - prevDeg;
    if (model) {
        model.rotateZ(degToRotate);
        initialZValue = crrRotationValue;
        render();
    }
}


let cameraAccIsOpened = false;
function handleCameras() {
    if (cameraAccIsOpened) {
        cameraManualCtrlsDiv.style.height = "100px";
        document.getElementById("upDownArrowCameraAcc").classList.remove("fa-chevron-up");
        document.getElementById("upDownArrowCameraAcc").classList.add("fa-chevron-down");
        cameraAccIsOpened = false;
    }
    else {
        cameraManualCtrlsDiv.style.height = "300px";
        document.getElementById("upDownArrowCameraAcc").classList.remove("fa-chevron-down");
        document.getElementById("upDownArrowCameraAcc").classList.add("fa-chevron-up");
        cameraAccIsOpened = true;
    }
}


function setInitialCmraValues() {
    if (camera) {
        cameraXEl.value = camera.position.x;
        cameraYEl.value = camera.position.y;
        cameraZEl.value = camera.position.z;
    }
};


function ctrlCameraX() {
    console.log("running camera function ......");
    if (camera) {
        let cameraPositionX = cameraXEl.value;
        let cameraPositionY = cameraYEl.value;
        let cameraPositionZ = cameraZEl.value;
        camera.position.set(+cameraPositionX, +cameraPositionY, +cameraPositionZ);
        camera.lookAt(new THREE.Vector3());
        render();
    }
}


function ctrlCameraY() {
    if (camera) {
        if (cameraYEl.value < 900 && cameraYEl.value > 0.1) {
            let cameraPositionX = cameraXEl.value;
            let cameraPositionY = cameraYEl.value;
            let cameraPositionZ = cameraZEl.value;
            camera.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
            camera.lookAt(new THREE.Vector3());
            render();
        }
    }
}


function ctrlCameraZ() {
    if (camera) {
        if (cameraZEl.value < 900 && cameraZEl.value > 0.1) {
            let cameraPositionX = cameraXEl.value;
            let cameraPositionY = cameraYEl.value;
            let cameraPositionZ = cameraZEl.value;
            camera.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
            camera.lookAt(new THREE.Vector3());
            render();
        }
    }
}


let shadowAccIsOpened = false;
function handleShadow() {
    if (shadowAccIsOpened) {
        shadowCtrlDiv.style.height = "100px";
        document.getElementById("upDownArrowShadowAcc").classList.remove("fa-chevron-up");
        document.getElementById("upDownArrowShadowAcc").classList.add("fa-chevron-down");
        shadowAccIsOpened = false;
    }
    else {
        shadowCtrlDiv.style.height = "300px";
        document.getElementById("upDownArrowShadowAcc").classList.remove("fa-chevron-down");
        document.getElementById("upDownArrowShadowAcc").classList.add("fa-chevron-up");
        shadowAccIsOpened = true;
    }
}


// let base = Math.PI / 4;
// document.addEventListener("keydown", function (ev) {
//     if (ev.code == "Enter") {
//         if (plane) {
//             plane.rotation.y = base;
//             console.log("enter ", (base / Math.PI) * 180, "deg");
//         }
//         render();
//         base -= Math.PI / 12;
//     }
// });


function toggleShadow() {
    if (isShadowOn) {
        if (scene && plane) {
            scene.remove(plane);
            render();
        } else {
            alert("scene is not rendered !");
        }
        isShadowOn = false;
    } else {
        isShadowOn = true;
        if (scene && plane) {
            renderShadow();
        } else {
            alert("scene is not rendered !");
        }
    }
}


function ctrlShadowTransparency() {
    if (scene) {
        let opacity = shadowTransparencyEl.value / 100;
        shadowMaterial.opacity = opacity;
        render();
    }
}


function ctrlShadowBlur() {
    let blurValue = shadowBlurEl.value;
    if (directionalLight) {
        directionalLight.shadow.radius = blurValue;
        render();
    }
}


document.addEventListener("keydown", function(ev){
    if(ev.code == "Enter"){
        showPreview();
    }
});

function showPreview() {
    if(scene, camera){
        renderer.render(scene, camera);
        let cnv = document.getElementById("canvas");
        let cnvUrl = cnv.toDataURL("image/jpeg");
        prevImg.src = cnvUrl;
        // console.log(cnvUrl);
    }
}
