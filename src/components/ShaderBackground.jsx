import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ShaderBackground() {
  const canvasRef = useRef(null)
  const sceneRef = useRef({
    scene: null, camera: null, renderer: null,
    mesh: null, uniforms: null, animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const refs = sceneRef.current

    const vertexShader = `
      attribute vec3 position;
      void main() { gl_Position = vec4(position, 1.0); }
    `

    const fragmentShader = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;

      // ── Helpers ──────────────────────────────────────────────────────────

      float segDist(vec2 p, vec2 a, vec2 b) {
        vec2 ab = b - a, ap = p - a;
        return length(ap - clamp(dot(ap,ab)/dot(ab,ab), 0.0, 1.0) * ab);
      }

      bool inTri(vec2 p, vec2 a, vec2 b, vec2 c) {
        float d0 = (b.x-a.x)*(p.y-a.y) - (b.y-a.y)*(p.x-a.x);
        float d1 = (c.x-b.x)*(p.y-b.y) - (c.y-b.y)*(p.x-b.x);
        float d2 = (a.x-c.x)*(p.y-c.y) - (a.y-c.y)*(p.x-c.x);
        return (d0>=0.0&&d1>=0.0&&d2>=0.0)||(d0<=0.0&&d1<=0.0&&d2<=0.0);
      }

      // ── Wavy ray PINNED to orig ───────────────────────────────────────────
      // Key: wave = sin(along*k + phase) - sin(phase)
      //   => at along=0: wave = sin(phase) - sin(phase) = 0. Always.
      // Amplitude envelope grows away from the prism so it starts as a pinpoint.
      float wavyRay(vec2 p, vec2 orig, float angle, float tOff) {
        vec2 dir  = vec2(cos(angle), sin(angle));
        vec2 perp = vec2(-sin(angle), cos(angle));

        vec2  op    = p - orig;
        float along = dot(op, dir);
        if (along < 0.0) return 0.0;

        float perpDist = dot(op, perp);

        // Phase-shifted time per beam so they oscillate independently
        float t1  = time * (1.5 + 0.20 * sin(time * 0.09 + tOff));
        float t2  = time * (1.1 + 0.18 * sin(time * 0.13 + tOff * 0.8));

        // Pinned: subtract the wave's value at along=0 so origin is always 0
        float ph1 = tOff - t1;
        float ph2 = tOff * 0.7 - t2;
        float env = 1.0 - exp(-along * 3.5);   // amplitude ramps up from 0 at prism
        float wave = (sin(along * 2.5 + ph1) - sin(ph1)) * 0.052 * env
                   + (sin(along * 1.5 + ph2) - sin(ph2)) * 0.024 * env;

        float d    = abs(perpDist - wave);
        float fade = exp(-along * 0.44);
        return fade / max(d, 0.00007);
      }

      // ── White incoming beam — pinned at the PRISM END (b = inPt) ─────────
      // 'a' = left-edge source, 'b' = prism face (where beam must connect).
      // We invert 'along' so fromEnd=0 is at the prism face → always zero there.
      float wavySeg(vec2 p, vec2 a, vec2 b) {
        vec2  dir    = normalize(b - a);
        vec2  perp   = vec2(-dir.y, dir.x);

        vec2  op     = p - a;
        float segLen = length(b - a);
        float along  = clamp(dot(op, dir), 0.0, segLen);
        float perpDist = dot(op, perp);

        // Distance measured from the prism end (so pin is at fromEnd=0)
        float fromEnd = segLen - along;

        float t1  = time * 1.7;
        float t2  = time * 1.2;
        float ph1 = -t1;
        float ph2 = -t2;
        float env = 1.0 - exp(-fromEnd * 3.5);  // calm at prism, wavy at left

        float wave = (sin(fromEnd * 2.5 + ph1) - sin(ph1)) * 0.075 * env
                   + (sin(fromEnd * 1.5 + ph2) - sin(ph2)) * 0.035 * env;

        float d = abs(perpDist - wave);
        return 1.0 / max(d, 0.00007);
      }

      // ── Main ─────────────────────────────────────────────────────────────

      void main() {
        vec2  uv  = gl_FragCoord.xy / resolution.xy;
        float asp = resolution.x / resolution.y;
        vec2  p   = vec2(uv.x * asp, uv.y);   // aspect-corrected, Y-up

        vec3 col = vec3(0.0);

        // ── Prism ───────────────────────────────────────────────────────
        float cx  = 0.10 * asp;
        float pH  = 0.38;
        float pHW = 0.15;

        vec2 apex = vec2(cx,        0.5 + pH * 0.5);
        vec2 bL   = vec2(cx - pHW,  0.5 - pH * 0.5);
        vec2 bR   = vec2(cx + pHW,  0.5 - pH * 0.5);

        vec2 inPt  = (apex + bL) * 0.5;   // white beam enters here
        vec2 outPt = (apex + bR) * 0.5;   // center of right face

        // Spread the color exit points along the right face
        vec2 rfDir = normalize(bR - apex); // direction down-right along the right face
        vec2 outRed    = outPt - rfDir * 0.045; // higher
        vec2 outOrange = outPt - rfDir * 0.030;
        vec2 outYellow = outPt - rfDir * 0.015;
        vec2 outGreen  = outPt;                 // center
        vec2 outBlue   = outPt + rfDir * 0.015;
        vec2 outIndigo = outPt + rfDir * 0.030;
        vec2 outViolet = outPt + rfDir * 0.045; // lower

        // ── White wavy beam (pinned at inPt, stops at prism face) ───────
        // White beam comes in horizontally matched to inPt.y — clean connection to refraction ray
        vec2 beamSrc = vec2(0.0, inPt.y);
        bool insidePrism = inTri(p, apex, bL, bR);

        // White beam: only render LEFT of the prism face, not across the screen
        if (!insidePrism && p.x <= inPt.x + 0.01) {
          float wBeam = wavySeg(p, beamSrc, inPt);
          col += vec3(wBeam * 0.00082);
        }

        // Refraction INSIDE the prism: fanning out from white point to the rainbow colors
        if (insidePrism) {
          // Central white fading ray
          float dCenter = segDist(p, inPt, outPt);
          float refractGlow = 0.0018 / max(dCenter, 0.00030);
          col += vec3(refractGlow * 0.35);

          // Spectral fan spreading to individual exit points
          float iGlow = 0.0007; // interior ray brightness
          col += vec3(1.00, 0.00, 0.00) * iGlow / max(segDist(p, inPt, outRed), 0.0002);
          col += vec3(1.00, 0.48, 0.00) * iGlow / max(segDist(p, inPt, outOrange), 0.0002);
          col += vec3(1.00, 1.00, 0.00) * iGlow / max(segDist(p, inPt, outYellow), 0.0002);
          col += vec3(0.00, 0.92, 0.00) * iGlow / max(segDist(p, inPt, outGreen), 0.0002);
          col += vec3(0.00, 0.45, 1.00) * iGlow / max(segDist(p, inPt, outBlue), 0.0002);
          col += vec3(0.28, 0.00, 0.90) * iGlow / max(segDist(p, inPt, outIndigo), 0.0002);
          col += vec3(0.70, 0.00, 1.00) * iGlow / max(segDist(p, inPt, outViolet), 0.0002);
        }

        // ── Rainbow beams (pinned at their respective exit points, wave grows outward) ─────
        float bw = 0.00115;
        col += vec3(1.00, 0.00, 0.00) * bw * wavyRay(p, outRed,    0.35, 0.0);  // Red
        col += vec3(1.00, 0.48, 0.00) * bw * wavyRay(p, outOrange, 0.23, 0.7);  // Orange
        col += vec3(1.00, 1.00, 0.00) * bw * wavyRay(p, outYellow, 0.11, 1.3);  // Yellow
        col += vec3(0.00, 0.92, 0.00) * bw * wavyRay(p, outGreen,  0.00, 1.9);  // Green
        col += vec3(0.00, 0.45, 1.00) * bw * wavyRay(p, outBlue,  -0.11, 2.5);  // Blue
        col += vec3(0.28, 0.00, 0.90) * bw * wavyRay(p, outIndigo,-0.23, 3.1);  // Indigo
        col += vec3(0.70, 0.00, 1.00) * bw * wavyRay(p, outViolet,-0.35, 3.7);  // Violet

        // ── Prism glass ─────────────────────────────────────────────────
        float eDist = min(min(segDist(p, apex, bL), segDist(p, apex, bR)),
                              segDist(p, bL, bR));
        float edgeG = 0.0028 / max(eDist, 0.0007);

        if (insidePrism) {
          col = col * 0.12 + vec3(0.06, 0.09, 0.17);
          col += vec3(0.40, 0.52, 0.80) * edgeG * 0.40;
        } else {
          col += vec3(0.55, 0.65, 0.90) * edgeG * 0.45;
        }

        // ── Vignette ────────────────────────────────────────────────────
        float vig = 1.0 - smoothstep(0.35, 1.0, length(uv - 0.5));
        col *= 0.82 + 0.18 * vig;

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `

    const initScene = () => {
      refs.scene    = new THREE.Scene()
      refs.renderer = new THREE.WebGLRenderer({ canvas })
      refs.renderer.setPixelRatio(window.devicePixelRatio)
      refs.renderer.setClearColor(new THREE.Color(0x050505))
      refs.camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      refs.uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time:       { value: 0.0 },
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([-1,-1,0, 1,-1,0, -1,1,0, 1,-1,0, -1,1,0, 1,1,0]), 3
      ))
      refs.mesh = new THREE.Mesh(geo, new THREE.RawShaderMaterial({
        vertexShader, fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      }))
      refs.scene.add(refs.mesh)
      handleResize()
    }

    const animate = () => {
      if (refs.uniforms) refs.uniforms.time.value += 0.004
      if (refs.renderer && refs.scene && refs.camera)
        refs.renderer.render(refs.scene, refs.camera)
      refs.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return
      refs.renderer.setSize(window.innerWidth, window.innerHeight, false)
      refs.uniforms.resolution.value = [window.innerWidth, window.innerHeight]
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
        if (refs.mesh.material instanceof THREE.Material) refs.mesh.material.dispose()
      }
      refs.renderer?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        display: 'block', zIndex: 0, pointerEvents: 'none',
      }}
    />
  )
}
