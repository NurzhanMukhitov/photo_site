let renderer, sh;
const CYCLE = 210;

const vert = `
precision mediump float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec3 vNormal;
void main(){
  vNormal = normalize(mat3(uModelViewMatrix) * aNormal);
  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(aPosition,1.0));
}`;

const frag = `
precision mediump float;
varying vec3 vNormal;
uniform vec2 u_resolution;
uniform vec3 u_lightDir;
uniform vec3 u_col, u_Scol;
void main(){
  vec3 N = normalize(vNormal);
  vec3 L = normalize(u_lightDir);
  float diff = max(dot(N, -L), 0.0);
  vec3 base = mix(u_Scol, u_col, diff*0.8+0.2);
  gl_FragColor = vec4(base, 1.0);
}`;

function setCol(shader,colStr,shadowColStr){
  const c = color(colStr).levels; const s = color(shadowColStr).levels;
  shader.setUniform('u_col', [c[0]/255, c[1]/255, c[2]/255]);
  shader.setUniform('u_Scol', [s[0]/255, s[1]/255, s[2]/255]);
}

function setup(){
  const dpr = windowWidth < 1024 ? 1 : 1.5;
  pixelDensity(dpr);
  renderer = createCanvas(windowWidth, windowHeight, WEBGL);
  sh = createShader(vert, frag);
  shader(sh);
  sh.setUniform('u_resolution', [width, height]);
  sh.setUniform('u_lightDir', [-1.0,-0.2,0.0]);
  noStroke();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  sh.setUniform('u_resolution', [width, height]);
}

function draw(){
  background('#0e0f12');
  setCol(sh, '#F3F5F8', '#111318');
  rotateX(frameCount/CYCLE*PI);
  rotateY(frameCount/CYCLE*PI*0.9);
  rotateZ(frameCount/(CYCLE*1.5)*PI);
  noisedSphere(min(width,height)*0.3, 56, 56);
}

function noisedSphere(r, dx, dy){
  const g = new p5.Geometry(dx, dy);
  const t = frameCount*0.01;
  const amp = 0.15 + 0.06 * sin(frameCount/40.0);
  for(let yi=0; yi<=dy; yi++){
    const v = map(yi,0,dy, HALF_PI, -HALF_PI);
    const y = sin(v)*r;
    const rr = cos(v)*r;
    for(let xi=0; xi<=dx; xi++){
      const u = xi/dx * TWO_PI;
      let x = cos(u)*rr;
      let z = sin(u)*rr;
      if(yi==0||yi==dy){ x=0; z=0; }
      let nv = noise(x/rr*0.8, y*0.02 + t, z/rr*0.8);
      nv = map(nv,0,1,1.0, 1.0 + amp*(mouseIsPressed?1.4:1.0));
      g.vertices[xi + (dx+1)*yi] = createVector(x*nv, y*nv, z*nv);
    }
  }
  g.computeFaces();
  // чистим шахматные грани у полюсов
  for(let i=g.faces.length-1;i>=0;i--){ if(i < dx*2 && i%2==0 || i > g.faces.length-dx*2 && i%2==1) g.faces[i]=[]; }
  for(let i=g.faces.length-1;i>=0;i--){ if(g.faces[i].length==0) g.faces.splice(i,1); }
  g.computeNormals();
  g.averageNormals();
  this._renderer.createBuffers('d', g);
  this._renderer.drawBuffers('d');
}


