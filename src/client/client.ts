import * as TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'

const GLTFLoaderInst = new GLTFLoader()

async function main() {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.z = 2

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.125)
    dirLight.position.set(0, 0, 1).normalize()
    scene.add(dirLight)

    const pointLight = new THREE.PointLight(0xffffff, 1.5)
    pointLight.position.set(0, 100, 90)
    scene.add(pointLight)

    const skull = await GLTFLoaderInst.loadAsync('/skull/skull.glb')

    scene.add(skull.scene)

    // postprocessing

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const glitchPass = new GlitchPass()
    composer.addPass(glitchPass)
  
    // done postprocessing

    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        composer.setSize(window.innerWidth, window.innerHeight)
        requestAnimationFrame(render)
    }

  // const skullState = { x: (skull.scene.rotation as any)._x, y: (skull.scene.rotation as any)._y, z: (skull.scene.rotation as any)._z };
  const skullState = { x: 0, y: 0, z: 0 };
  let lastSkullState = { x: 0, y: 0, z: 0 };
  
  const updateSkullTween = () => {
    // console.log("before: ", (skull.scene.rotation as any))
    // console.log(skullState)
    // const rads = { x: skullState.x * Math.PI / 180, y: skullState.y * Math.PI / 180, z: skullState.z * Math.PI / 180 };
    // console.log("what it sets to:", JSON.stringify(rads))
    // skull.scene.rotateX(rads.x)
    // skull.scene.rotateY(rads.y)
    // skull.scene.rotateZ(rads.z)
    
    const angleDiff = { x: skullState.x - lastSkullState.x, y: skullState.y - lastSkullState.y, z: skullState.z - lastSkullState.z };
    console.log("skullState", skullState);
    console.log("lastSkullState", lastSkullState);
    console.log("angleDiff", angleDiff);

    skull.scene.rotateX(angleDiff.x)
    skull.scene.rotateY(angleDiff.y)
    skull.scene.rotateZ(angleDiff.z)
    lastSkullState = JSON.parse(JSON.stringify(skullState));
    
    // (skull.scene.rotation as any)._x = skullState.x;
    // (skull.scene.rotation as any)._y = skullState.y;
    // (skull.scene.rotation as any)._z = skullState.z;
    console.log("after div", (skull.scene.rotation as any))
    };
    const skullTween = new TWEEN.Tween(skullState)
      .to({ x: 4, y: 4, z: 4 })
      .duration(1000)
        .delay(100)
        .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(updateSkullTween)

    const skullTweenBack = new TWEEN.Tween(skullState)
        .to({ x: 0, y: 0, z: 0 })
        .delay(100)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(updateSkullTween);

    const skullTweenChain = skullTween.chain(skullTweenBack);
    skullTweenBack.chain(skullTween);

    skullTweenChain.start();

    // let lastTime = 0;
    function render(time: any) {
        requestAnimationFrame(render)

      TWEEN.update()
      
      // if (time - lastTime > 100) {
      //   TWEEN.update()
      //   lastTime = time;
      // }
      const timeSeconds = time * 0.001 // convert to seconds
      // skull.scene.rotateX(time / 50000 % 360);
      // skull.scene.rotateY(time / 50000 % 360);
      // skull.scene.rotateZ(time/100000 % 360);

        controls.update()

        // uniforms.iTime.value = timeSeconds

        // renderer.render(scene, camera);
        composer.render()
    }
    requestAnimationFrame(render)
}

main()
