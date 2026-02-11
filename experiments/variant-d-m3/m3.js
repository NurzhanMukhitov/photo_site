let sh, pal=[[0.92,0.94,0.98],[0.2,0.22,0.28]];
const CYCLE=220;

const vert=`
precision mediump float; attribute vec3 aPosition,aNormal; uniform mat4 uModelViewMatrix,uProjectionMatrix; varying vec3 vN,vP; void main(){ vN=normalize(mat3(uModelViewMatrix)*aNormal); vec4 p=uModelViewMatrix*vec4(aPosition,1.0); vP=p.xyz; gl_Position=uProjectionMatrix*p; }
`;
const frag=`
precision mediump float; varying vec3 vN,vP; uniform vec3 u_c1,u_c2; uniform float u_mix; uniform vec2 u_resolution; 
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
void main(){ vec3 N=normalize(vN); vec3 V=normalize(-vP); float nd=max(dot(N,V),0.0); vec3 base=mix(u_c1,u_c2,u_mix); 
  // «пластик»: диффузия + небольшой spec от камеры
  float spec=pow(nd, 32.0)*0.35; vec3 col=base*(0.6+0.4*nd)+vec3(1.0)*spec; 
  // тонкое пленочное зерно
  float g = hash(gl_FragCoord.xy)*0.02-0.01; col += g;
  gl_FragColor=vec4(col,1.0);
}`;

async function preload(){
  try{ const res=await fetch('../../assets/photos.json'); const list=await res.json(); const take=Math.min(3,list.length);
    pal=[]; for(let i=0;i<take;i++){ const h=i/take*6.283; pal.push([0.65+0.3*cos(h), 0.68+0.28*sin(h*0.9), 0.8]); }
  }catch(e){}
}

function setup(){ const dpr=windowWidth<1024?1:1.5; pixelDensity(dpr); createCanvas(windowWidth, windowHeight, WEBGL); sh=createShader(vert,frag); shader(sh); noStroke(); }
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

function draw(){
  background('#101114');
  // «вдох/выдох»: быстрый набор амплитуды → длинное затухание
  const e = pulse(frameCount*0.02);
  const i=floor((frameCount/360.0)%pal.length); const j=(i+1)%pal.length; const t=fract(frameCount/360.0); sh.setUniform('u_c1',pal[i]); sh.setUniform('u_c2',pal[j]); sh.setUniform('u_mix',t);
  rotateX(frameCount/CYCLE*PI + 0.1*sin(frameCount/70.0)); rotateY(frameCount/CYCLE*PI*0.95 + 0.12*cos(frameCount/80.0));
  noisedSphere(min(width,height)*0.29, 58, 58, e);
}

function pulse(x){ // piecewise ease
  floatPart = x - floor(x);
  if (floatPart < 0.25) return 0.2 + floatPart*2.0; // быстрый «вдох»
  return 0.7 - (floatPart-0.25)*0.7*0.8; // длинный «выдох»
}

function noisedSphere(r,dx,dy, e){
  const g=new p5.Geometry(dx,dy); const t=frameCount*0.01; const amp=(0.11+0.08*e);
  for(let yi=0; yi<=dy; yi++){
    const v=map(yi,0,dy,HALF_PI,-HALF_PI); let y=sin(v)*r; let rr=cos(v)*r;
    for(let xi=0; xi<=dx; xi++){
      const u=xi/dx*TWO_PI; let x=cos(u)*rr; let z=sin(u)*rr; if(yi==0||yi==dy){x=0;z=0;}
      let nv=noise(x/rr*0.9, y*0.02+t, z/rr*0.9); nv=1.0+amp*(nv-0.5);
      g.vertices[xi+(dx+1)*yi]=createVector(x*nv,y*nv,z*nv);
    }
  }
  g.computeFaces(); for(let i=g.faces.length-1;i>=0;i--){ if(i<dx*2 && i%2==0 || i>g.faces.length-dx*2 && i%2==1) g.faces[i]=[]; }
  for(let i=g.faces.length-1;i>=0;i--){ if(g.faces[i].length==0) g.faces.splice(i,1); }
  g.computeNormals(); g.averageNormals(); this._renderer.createBuffers('m3', g); this._renderer.drawBuffers('m3');
}


