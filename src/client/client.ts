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

    const vertexShader = `
    #include <common>
    uniform float iTime;

    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec3 permute(vec3 x) {
        return mod289(((x*34.0)+1.0)*x);
      }
      
      float snoise(vec2 v)
        {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                           -0.577350269189626,  // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
      // First corner
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
      
      // Other corners
        vec2 i1;
        //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
        //i1.y = 1.0 - i1.x;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        // x0 = x0 - 0.0 + 0.0 * C.xx ;
        // x1 = x0 - i1 + 1.0 * C.xx ;
        // x2 = x0 - 1.0 + 2.0 * C.xx ;
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
      
      // Permutations
        i = mod289(i); // Avoid truncation effects in permutation
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
      
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
      
      // Gradients: 41 points uniformly over a line, mapped onto a diamond.
      // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
      
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
      
      // Normalise gradients implicitly by scaling m
      // Approximation of: m *= inversesqrt( a0*a0 + h*h );
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      
      // Compute final noise value at P
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

    varying vec2 vUv;
    void main() {
      vUv = uv;

      float time = iTime * 2.0;
          
      // Create large, incidental noise waves
      float noise = max(0.0, snoise(vec2(time, uv.y * 0.3)) - 0.3) * (1.0 / 0.7);
      
      // Offset by smaller, constant noise waves
      noise = noise + (snoise(vec2(time*10.0, uv.y * 2.4)) - 0.5) * 0.15;
      
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
      
      // Apply the noise as x displacement for every line
      float xpos = gl_Position.x - noise * noise * 0.25;
      float ypos = gl_Position.y - noise * noise * 0.25;
      float zpos = gl_Position.z - noise * noise * 0.25;

    
      gl_Position = projectionMatrix * modelViewMatrix * vec4( xpos, ypos, gl_Position.z, 1.0 );
    }
    `

    const fragmentShader = `
    #include <common>

    uniform vec3 iResolution;
    uniform float iTime;
    uniform sampler2D iChannel0;
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec3 permute(vec3 x) {
        return mod289(((x*34.0)+1.0)*x);
      }
      
      float snoise(vec2 v)
        {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                           -0.577350269189626,  // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
      // First corner
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
      
      // Other corners
        vec2 i1;
        //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
        //i1.y = 1.0 - i1.x;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        // x0 = x0 - 0.0 + 0.0 * C.xx ;
        // x1 = x0 - i1 + 1.0 * C.xx ;
        // x2 = x0 - 1.0 + 2.0 * C.xx ;
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
      
      // Permutations
        i = mod289(i); // Avoid truncation effects in permutation
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
      
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
      
      // Gradients: 41 points uniformly over a line, mapped onto a diamond.
      // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
      
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
      
      // Normalise gradients implicitly by scaling m
      // Approximation of: m *= inversesqrt( a0*a0 + h*h );
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      
      // Compute final noise value at P
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void mainImage( out vec4 fragColor, in vec2 fragCoord )
      {
          vec2 uv = fragCoord.xy / iResolution.xy;    
          float time = iTime * 2.0;
          
          // Create large, incidental noise waves
          float noise = max(0.0, snoise(vec2(time, uv.y * 0.3)) - 0.3) * (1.0 / 0.7);
          
          // Offset by smaller, constant noise waves
          noise = noise + (snoise(vec2(time*10.0, uv.y * 2.4)) - 0.5) * 0.15;
          
          // Apply the noise as x displacement for every line
          float xpos = uv.x - noise * noise * 0.25;
          fragColor = texture(iChannel0, vec2(xpos, uv.y));
          
          // Mix in some random interference for lines
          fragColor.rgb = mix(fragColor.rgb, vec3(rand(vec2(uv.y * time))), noise * 0.3).rgb;
          
          // Apply a line pattern every 4 pixels
          if (floor(mod(fragCoord.y * 0.25, 2.0)) == 0.0)
          {
              fragColor.rgb *= 1.0 - (0.15 * noise);
          }
          
          // Shift green/blue channels (using the red channel)
          fragColor.g = mix(fragColor.r, texture(iChannel0, vec2(xpos + noise * 0.05, uv.y)).g, 0.25);
          fragColor.b = mix(fragColor.r, texture(iChannel0, vec2(xpos - noise * 0.05, uv.y)).b, 0.25);
      }
      varying vec2 vUv;
      void main() {
        // mainImage(gl_FragColor, vUv * iResolution.xy);
        mainImage(gl_FragColor, vUv);
      }
    `

    // const textureLoader = new THREE.TextureLoader()
    // const texture = textureLoader.load(
    //     'https://threejsfundamentals.org/threejs/resources/images/bayer.png'
    // )
    // texture.minFilter = THREE.NearestFilter
    // texture.magFilter = THREE.NearestFilter
    // texture.wrapS = THREE.RepeatWrapping
    // texture.wrapT = THREE.RepeatWrapping
    // let uniforms = {
    //     colorB: { type: 'vec3', value: new THREE.Color(0xacb6e5) },
    //     colorA: { type: 'vec3', value: new THREE.Color(0x74ebd5) },
    //     iTime: { value: 0 },
    //     iResolution: { value: new THREE.Vector3(1, 1, 1) },
    //     iChannel0: { value: texture },
    // }

    // skull.scene.traverse(function (child: any) {
    //     if (child.isMesh) {
    //         child.material = new THREE.ShaderMaterial({
    //             uniforms,
    //             vertexShader,
    //             fragmentShader,
    //         })
    //     }
    // })

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

    // const skullRotation = new THREE.Vector3( 0, 0, 0);
    // skull.scene.getWorldDirection(skullRotation);
    // skull.scene
    // const updateCubeScale = () => {

    // skull.scene.setRotationFromAxisAngle
    // cube.scale.set(cubeScale.x, cubeScale.y, cubeScale.z)
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

    function render(time: any) {
        requestAnimationFrame(render)

        // TWEEN.update()
        // cube.rotation.x += 0.01
        // cube.rotation.y += 0.01

        controls.update()

        const timeSeconds = time * 0.001 // convert to seconds
        // uniforms.iTime.value = timeSeconds

        // renderer.render(scene, camera);
        composer.render()
    }
    requestAnimationFrame(render)
}

main()
