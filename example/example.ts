/// <reference path="../typings/browser.d.ts"/>
import * as Argon from 'argon'

declare const THREE: any;

export const app = Argon.init();

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera();
export const user = new THREE.Object3D();
export const userLocation = new THREE.Object3D;
scene.add(camera);
scene.add(user);
scene.add(userLocation);

const renderer = new THREE.WebGLRenderer({ alpha: true, logarithmicDepthBuffer: true });
app.view.element.appendChild(renderer.domElement);

// app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
app.context.setDefaultReferenceFrame(app.context.localOriginEastNorthUp);

const geometry = new THREE.SphereGeometry( 30, 32, 32 );

export const xMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000} );

export const westSphere = new THREE.Mesh( geometry, xMaterial );
westSphere.position.x = -200;
scene.add( westSphere );
export const eastSphere = new THREE.Mesh( geometry, xMaterial );
eastSphere.position.x = 200;
scene.add( eastSphere );

export const yMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00} );

export const downSphere = new THREE.Mesh( geometry, yMaterial );
downSphere.position.y = -200;
scene.add( downSphere );
export const upSphere = new THREE.Mesh( geometry, yMaterial );
upSphere.position.y = 200;
scene.add( upSphere );

export const zMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff} );

export const northSphere = new THREE.Mesh( geometry, zMaterial );
northSphere.position.z = -200;
scene.add( northSphere );
export const southSphere = new THREE.Mesh( geometry, zMaterial );
southSphere.position.z = 200;
scene.add( southSphere );


app.vuforia.init({
	licenseKey: "AXRIsu7/////AAAAAaYn+sFgpkAomH+Z+tK/Wsc8D+x60P90Nz8Oh0J8onzjVUIP5RbYjdDfyatmpnNgib3xGo1v8iWhkU1swiCaOM9V2jmpC4RZommwQzlgFbBRfZjV8DY3ggx9qAq8mijhN7nMzFDMgUhOlRWeN04VOcJGVUxnKn+R+oot1XTF5OlJZk3oXK2UfGkZo5DzSYafIVA0QS3Qgcx6j2qYAa/SZcPqiReiDM9FpaiObwxV3/xYJhXPUGVxI4wMcDI0XBWtiPR2yO9jAnv+x8+p88xqlMH8GHDSUecG97NbcTlPB0RayGGg1F6Y7v0/nQyk1OIp7J8VQ2YrTK25kKHST0Ny2s3M234SgvNCvnUHfAKFQ5KV"
}).then((api)=>{
    api.objectTracker.createDataSet('dataset/StonesAndChips.xml').then( (dataSet)=>{

        dataSet.load().then(()=>{
            const trackables = dataSet.getTrackables();
            
            const stonesEntity = app.context.subscribeToEntityById(trackables['stones'].id)
            const stonesObject = new THREE.Object3D;
            scene.add(stonesObject);
            
            var targetSize = trackables['stones'].size
            
            var boxGeometry = new THREE.BoxGeometry(50, 50, 50);
            var material = new THREE.MeshNormalMaterial()
            material.side = THREE.DoubleSide;
            const box = new THREE.Mesh(boxGeometry, material);
            box.position.z = 25;
            box.position.y = 50;
            
            
            var axisHelper = new THREE.AxisHelper( 10 );
            stonesObject.add( axisHelper );
            axisHelper.position.z = 50;
            
            console.log('Subscribes to stones trackable with id ' + trackables['stones'].id);

            app.context.updateEvent.addEventListener((frameState) => {
                const stonesPose = app.context.getEntityPose(stonesEntity);

                if (stonesPose.poseStatus & Argon.PoseStatus.KNOWN) {
                    stonesObject.position.copy(stonesPose.position);
                    stonesObject.quaternion.copy(stonesPose.orientation);
                }
                
                if (stonesPose.poseStatus & Argon.PoseStatus.FOUND) {
                    stonesObject.add(box);
                } else if (stonesPose.poseStatus & Argon.PoseStatus.LOST) {
                    // stonesObject.remove(box);
                }
            })
        });
        
        api.objectTracker.activateDataSet(dataSet);
    });
})

app.updateEvent.addEventListener(() => {
    const userPose = app.context.getEntityPose(app.context.user);

    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        user.position.copy(userPose.position);
        user.quaternion.copy(userPose.orientation);
        userLocation.position.copy(userPose.position);
    }
})

app.renderEvent.addEventListener(() => {
    const viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    
    for (let subview of app.view.getSubviews()) {
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        const {x,y,width,height} = subview.viewport;
        renderer.setViewport(x,y,width,height);
        renderer.setScissor(x,y,width,height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
    }
})

// // creating 6 divs to indicate the x y z positioning
// const divXpos = document.createElement('div')
// const divXneg = document.createElement('div')
// const divYpos = document.createElement('div')
// const divYneg = document.createElement('div')
// const divZpos = document.createElement('div')
// const divZneg = document.createElement('div')

// // programatically create a stylesheet for our direction divs
// // and add it to the document
// const style = document.createElement("style");
// style.type = 'text/css';
// document.head.appendChild(style);
// const sheet = <CSSStyleSheet>style.sheet;
// sheet.insertRule(`
//     .direction {
//         opacity: 0.5;
//         width: 100px;
//         height: 100px;
//         border-radius: 50%;
//         line-height: 100px;
//         fontSize: 20px;
//         text-align: center;
//     }
// `, 0);

// // Put content in each one  (should do this as a couple of functions)
// // for X
// divXpos.className = 'direction'
// divXpos.style.backgroundColor = "red"
// divXpos.innerText = "Pos X = East"

// divXneg.className = 'direction'
// divXneg.style.backgroundColor = "red"
// divXneg.innerText = "Neg X = West"

// // for Y
// divYpos.className = 'direction'
// divYpos.style.backgroundColor = "blue"
// divYpos.innerText = "Pos Y = Up"

// divYneg.className = 'direction'
// divYneg.style.backgroundColor = "blue"
// divYneg.innerText = "Neg Y = Down"

// //for Z
// divZpos.className = 'direction'
// divZpos.style.backgroundColor = "green"
// divZpos.innerText = "Pos Z = South"

// divZneg.className = 'direction'
// divZneg.style.backgroundColor = "green"
// divZneg.innerText = "Neg Z = North"

// // create 6 CSS3DObjects in the scene graph
// const cssObjectXpos = new THREE.CSS3DObject(divXpos)
// const cssObjectXneg = new THREE.CSS3DObject(divXneg)
// const cssObjectYpos = new THREE.CSS3DObject(divYpos)
// const cssObjectYneg = new THREE.CSS3DObject(divYneg)
// const cssObjectZpos = new THREE.CSS3DObject(divZpos)
// const cssObjectZneg = new THREE.CSS3DObject(divZneg)

// // the width and height is used to align things.
// cssObjectXpos.position.x = 200.0
// cssObjectXpos.rotation.y = - Math.PI / 2

// cssObjectXneg.position.x = -200.0
// cssObjectXneg.rotation.y = Math.PI / 2

// // for Y
// cssObjectYpos.position.y = 200.0
// cssObjectYpos.rotation.x = Math.PI / 2

// cssObjectYneg.position.y = - 200.0
// cssObjectYneg.rotation.x = - Math.PI / 2

// // for Z
// cssObjectZpos.position.z = 200.0
// cssObjectZpos.rotation.y = Math.PI

// cssObjectZneg.position.z = -200.0
// //no rotation need for this one

// userLocation.add(cssObjectXpos)
// userLocation.add(cssObjectXneg)
// userLocation.add(cssObjectYpos)
// userLocation.add(cssObjectYneg)
// userLocation.add(cssObjectZpos)
// userLocation.add(cssObjectZneg)
