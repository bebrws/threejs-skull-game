import * as TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const GLTFLoaderInst = new GLTFLoader();

async function main() {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 2

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)

    const dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
    dirLight.position.set( 0, 0, 1 ).normalize();
    scene.add( dirLight );

    const pointLight = new THREE.PointLight( 0xffffff, 1.5 );
    pointLight.position.set( 0, 100, 90 );
    scene.add( pointLight );

    const skull = await GLTFLoaderInst.loadAsync('/skull/skull.glb')
    scene.add(skull.scene);

    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        render()
    }

    // const cubeScale = { x: 1, y: 1, z: 1 };
    // const updateCubeScale = () => {
    //     cube.scale.set(cubeScale.x, cubeScale.y, cubeScale.z)
    // };
    // const cubeTween = new TWEEN.Tween(cubeScale)
    //     .to({ x: 0.1, y: 0.1, z: 0.1 })
    //     .delay(100)
    //     .easing(TWEEN.Easing.Quadratic.In)
    //     .onUpdate(updateCubeScale)
    // const cubeTweenBack = new TWEEN.Tween(cubeScale)
    //     .to({ x: 1, y: 1, z: 1 })
    //     .delay(100)
    //     .easing(TWEEN.Easing.Bounce.Out)
    //     .onUpdate(updateCubeScale);

    // const cubeTweenChain = cubeTween.chain(cubeTweenBack);
    // cubeTweenBack.chain(cubeTween);

    // cubeTweenChain.start();


    function animate() {
        requestAnimationFrame(animate)

        TWEEN.update();
        // cube.rotation.x += 0.01
        // cube.rotation.y += 0.01

    
        controls.update()

        render()
    }

    function render() {
        renderer.render(scene, camera)
    }
    animate()

}

main();