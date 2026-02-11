let sh, pal = [[0.95,0.96,0.98],[0.16,0.17,0.2],[0.65,0.7,0.85],[0.88,0.9,0.94]];
const CYCLE = 240;

const vert = `
precision mediump float;
attribute vec3 aPosition; attribute vec3 aNormal;
uniform mat4 uModelViewMatrix, uProjectionMatrix; varying vec3 vN; varying vec3 vP;
void main(){ vN = normalize(mat3(uModelViewMatrix)*aNormal); vec4 p = uModelViewMatrix*vec4(aPosition,1.0); vP=p.xyz; gl_Position=uProjectionMatrix*p; }
`;

// керамика: диффузия + тонкий Fresnel rim + мягкое зерно
const frag = `
precision mediump float; varying vec3 vN; varying vec3 vP;
uniform vec2 u_resolution; uniform vec3 u_lightDir; uniform vec3 u_c1; uniform vec3 u_c2; uniform float u_mix;
float rnd(vec2 uv){ return fract(sin(dot(uv, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec3 N=normalize(vN); vec3 L=normalize(u_lightDir); vec3 V=normalize(-vP);
  float diff=max(dot(N,-L),0.0);
  float rim=pow(1.0-max(dot(N,V),0.0), 2.0);
  vec3 base=mix(u_c1,u_c2,u_mix);
  vec3 col = base* (0.2+0.8*diff) + vec3(0.85,0.9,1.0)*rim*0.3;
  float grain = (rnd(gl_FragCoord.xy)*0.02-0.01);
  col += grain;
  gl_FragColor=vec4(col,1.0);
}`;

async function preload(){
  try{
    const res=await fetch('../../assets/photos.json');
    const list=await res.json();
    const take=Math.min(4,list.length);
    // быстрая палитра — средние тона (эмпирика):
    pal = [];
    for(let i=0;i<take;i++){
      // распределим по кругу по файлам (упрощённо)
      const hue = (i/take)*6.283;
      pal.push([0.6+0.3*Math.cos(hue), 0.6+0.3*Math.sin(hue*0.9), 0.7+0.25*Math.sin(hue*1.1+1.0)]);
    }
  }catch(e){ /* default pal stays */ }
}

function setup(){
  const dpr = windowWidth<1024?1:1.5; pixelDensity(dpr);
  createCanvas(windowWidth, windowHeight, WEBGL);
  sh=createShader(vert,frag); shader(sh);
  sh.setUniform('u_resolution',[width,height]); sh.setUniform('u_lightDir',[-0.8,-0.3,-1.0]);
  noStroke();
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); sh.setUniform('u_resolution',[width,height]); }

function draw(){
  background('#0f1012');
  // палитра: плавный бег между 2 соседними цветов
  const i=floor((frameCount/300.0)%pal.length); const j=(i+1)%pal.length; const t=fract(frameCount/300.0);
  sh.setUniform('u_c1', pal[i]); sh.setUniform('u_c2', pal[j]); sh.setUniform('u_mix', t);

  const px = (mouseX-width/2)/width * 0.25; const py = (mouseY-height/2)/height * 0.25;
  rotateX(frameCount/CYCLE*PI + py); rotateY(frameCount/CYCLE*PI*0.9 + px);
  noisedSphere(min(width,height)*0.3, 60, 60);
}

function noisedSphere(r, dx, dy){
  const g=new p5.Geometry(dx,dy); const t=frameCount*0.01; const amp=0.14+0.05*sin(frameCount/50.0);
  for(let yi=0; yi<=dy; yi++){
    const v=map(yi,0,dy,HALF_PI,-HALF_PI); const y=sin(v)*r; const rr=cos(v)*r;
    for(let xi=0; xi<=dx; xi++){
      const u=xi/dx*TWO_PI; let x=cos(u)*rr; let z=sin(u)*rr; if(yi==0||yi==dy){x=0;z=0;}
      let nv=noise(x/rr*0.9, y*0.02+t, z/rr*0.9); nv=1.0+amp*(nv-0.5);
      g.vertices[xi+(dx+1)*yi]=createVector(x*nv,y*nv,z*nv);
    }
  }
  g.computeFaces(); for(let i=g.faces.length-1;i>=0;i--){ if(i<dx*2 && i%2==0 || i>g.faces.length-dx*2 && i%2==1) g.faces[i]=[]; }
  for(let i=g.faces.length-1;i>=0;i--){ if(g.faces[i].length==0) g.faces.splice(i,1); }
  g.computeNormals(); g.averageNormals();
  this._renderer.createBuffers('m1', g); this._renderer.drawBuffers('m1');
}


