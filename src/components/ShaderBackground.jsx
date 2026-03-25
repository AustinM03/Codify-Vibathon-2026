import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ShaderBackground() {
  const canvasRef = useRef(null)
  const sceneRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const refs = sceneRef.current

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        float d = length(p) * distortion;

        // 3 prism-split x-offsets
        float x1 = p.x * (1.0 + d * 2.0);
        float x2 = p.x;
        float x3 = p.x * (1.0 - d * 2.0);

        // Varying speeds — each stream drifts at its own pace
        float t1 = time * (0.8 + 0.2 * sin(time * 0.13));
        float t2 = time * (1.0 + 0.15 * sin(time * 0.09 + 2.0));
        float t3 = time * (0.9 + 0.25 * sin(time * 0.11 + 4.0));

        // Smooth curves with a subtle wobble layered on top
        float y1 = sin((x1 + t1) * xScale) * yScale
                  + sin((x1 * 0.6 + t1 * 0.7) * 1.8) * 0.07;

        float y2 = sin((x2 + t2) * xScale) * yScale
                  + sin((x2 * 0.7 + t2 * 0.6) * 1.6) * 0.08;

        float y3 = sin((x3 + t3) * xScale) * yScale
                  + sin((x3 * 0.5 + t3 * 0.8) * 2.0) * 0.06;

        float s1 = 0.035 / abs(p.y + y1);
        float s2 = 0.035 / abs(p.y + y2);
        float s3 = 0.035 / abs(p.y + y3);

        // Shifting gradient — colors slowly rotate over time
        float hueShift = time * 0.15;
        vec3 c1 = vec3(
          0.55 + 0.45 * sin(hueShift),
          0.20 + 0.15 * sin(hueShift + 2.1),
          0.30 + 0.40 * sin(hueShift + 4.2)
        );
        vec3 c2 = vec3(
          0.20 + 0.20 * sin(hueShift + 1.0),
          0.55 + 0.40 * sin(hueShift + 3.1),
          0.30 + 0.30 * sin(hueShift + 5.2)
        );
        vec3 c3 = vec3(
          0.30 + 0.30 * sin(hueShift + 2.0),
          0.25 + 0.20 * sin(hueShift + 4.1),
          0.55 + 0.45 * sin(hueShift + 0.5)
        );

        vec3 col = s1*c1 + s2*c2 + s3*c3;
        col *= 0.22;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    const initScene = () => {
      refs.scene = new THREE.Scene()
      refs.renderer = new THREE.WebGLRenderer({ canvas })
      refs.renderer.setPixelRatio(window.devicePixelRatio)
      refs.renderer.setClearColor(new THREE.Color(0x050505))

      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      refs.uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.15 },
      }

      const position = [
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
      ]

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', positions)

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      })

      refs.mesh = new THREE.Mesh(geometry, material)
      refs.scene.add(refs.mesh)

      handleResize()
    }

    const animate = () => {
      if (refs.uniforms) refs.uniforms.time.value += 0.004
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return
      const width = window.innerWidth
      const height = window.innerHeight
      refs.renderer.setSize(width, height, false)
      refs.uniforms.resolution.value = [width, height]
    }

    initScene()
    animate()
    window.addEventListener('resize', handleResize)

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      window.removeEventListener('resize', handleResize)
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }
      refs.renderer?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
