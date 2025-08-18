let sh, lastVisible = true;
const CYCLE = 240;
const vert = `
precision mediump float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vNormal = normalize(mat3(uModelViewMatrix) * aNormal);
  vec4 pos = uModelViewMatrix * vec4(aPosition, 1.0);
  vPos = pos.xyz;
  gl_Position = uProjectionMatrix * pos;
}`;

const frag = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vPos;
uniform vec2 u_resolution;
uniform vec3 u_lightDir;
uniform vec3 u_col;
uniform vec3 u_Scol;
void main(){
  vec3 N = normalize(vNormal);
  vec3 L = normalize(u_lightDir);
  float diff = max(dot(N, -L), 0.0);
  float nd = clamp(diff*0.85 + 0.15, 0.0, 1.0);
  vec3 col = mix(u_Scol, u_col, nd);
  // мягкий виньетт
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float vig = smoothstep(1.2, 0.2, length(uv-0.5));
  col *= vig;
  gl_FragColor = vec4(col, 1.0);
}`;

function setCol(shader,colStr,shadowColStr){
  const c = color(colStr).levels; // [r,g,b,a]
  const s = color(shadowColStr).levels;
  shader.setUniform('u_col', [c[0]/255, c[1]/255, c[2]/255]);
  shader.setUniform('u_Scol', [s[0]/255, s[1]/255, s[2]/255]);
}

function setup(){
  const dpr = windowWidth < 1024 ? 1 : 1.5;
  pixelDensity(dpr);
  createCanvas(windowWidth, windowHeight, WEBGL);
  sh = createShader(vert, frag);
  shader(sh);
  sh.setUniform('u_resolution', [width, height]);
  sh.setUniform('u_lightDir', [-0.6, -0.4, -1.0]);
  noStroke();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  sh.setUniform('u_resolution', [width, height]);
}

function draw(){
  background('#0e0e0f');
  // мягкие цвета
  setCol(sh, '#e7e7e7', '#1a1a1a');

  const t = frameCount / CYCLE * TWO_PI;
  rotateX(t*0.5 + (mouseY-height/2)/height * 0.3);
  rotateY(t*0.6 + (mouseX-width/2)/width * 0.3);
  rotateZ(t*0.33);

  // геометрия: слегка деформированный «узел»
  const dx = 64, dy = 64;
  const g = new p5.Geometry(dx, dy);
  const R = min(width, height) * 0.28;
  const noiseAmp = 0.08 + 0.04*sin(frameCount/90.0);
  for (let yi=0; yi<=dy; yi++){
    const v = map(yi,0,dy,-PI/2,PI/2);
    const y = sin(v)*R;
    const r = cos(v)*R;
    for (let xi=0; xi<=dx; xi++){
      const u = xi/dx*TWO_PI;
      let x = cos(u)*r;
      let z = sin(u)*r;
      const n = noise(x*0.002, y*0.002, z*0.002 + frameCount*0.01);
      const k = 1.0 + noiseAmp*(n-0.5);
      g.vertices[xi + (dx+1)*yi] = createVector(x*k, y*k, z*k);
    }
  }
  g.computeFaces();
  g.computeNormals();
  g.averageNormals();
  this._renderer.createBuffers('a', g);
  this._renderer.drawBuffers('a');
}

// экономия ресурса в фоне
document.addEventListener('visibilitychange', ()=>{
  lastVisible = !document.hidden;
  if (!lastVisible) noLoop(); else loop();
});


