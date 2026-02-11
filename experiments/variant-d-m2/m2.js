let sh; const CYCLE=260; let scrollAmp=0;

const vert=`
precision mediump float; attribute vec3 aPosition,aNormal; uniform mat4 uModelViewMatrix,uProjectionMatrix; varying vec3 vN,vP; void main(){ vN=normalize(mat3(uModelViewMatrix)*aNormal); vec4 p=uModelViewMatrix*vec4(aPosition,1.0); vP=p.xyz; gl_Position=uProjectionMatrix*p; }
`;
// Матгласс: подсветка обода + мягкая «толщина» по нормали
const frag=`
precision mediump float; varying vec3 vN,vP; uniform vec2 u_resolution; uniform vec3 u_cA,u_cB; uniform float u_mix; 
void main(){ vec3 N=normalize(vN); vec3 V=normalize(-vP); float fres=pow(1.0-max(dot(N,V),0.0), 2.2); vec3 col=mix(u_cA,u_cB,u_mix); col = col*0.55 + vec3(1.0)*fres*0.35; gl_FragColor=vec4(col, 0.92); }
`;

function setup(){
  const dpr=windowWidth<1024?1:1.5; pixelDensity(dpr);
  createCanvas(windowWidth, windowHeight, WEBGL);
  sh=createShader(vert,frag); shader(sh); noStroke();
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

function draw(){
  background('#0e1014');
  // палитра между холодным и тёплым
  const t=fract(frameCount/420.0); sh.setUniform('u_cA',[0.7,0.78,0.95]); sh.setUniform('u_cB',[0.95,0.8,0.72]); sh.setUniform('u_mix',t);
  rotateX(frameCount/CYCLE*PI + 0.2*sin(frameCount/80.0));
  rotateY(frameCount/CYCLE*PI*0.9 + 0.15*cos(frameCount/90.0));
  noisedMorph(min(width,height)*0.28, 58, 58);
}

function noisedMorph(r,dx,dy){
  const g=new p5.Geometry(dx,dy); const t=frameCount*0.01; const amp=(0.12+0.05*sin(frameCount/60.0))*(1.0+scrollAmp);
  for(let yi=0; yi<=dy; yi++){
    const v=map(yi,0,dy,HALF_PI,-HALF_PI); let y=sin(v)*r; let rr=cos(v)*r;
    for(let xi=0; xi<=dx; xi++){
      const u=xi/dx*TWO_PI; let x=cos(u)*rr; let z=sin(u)*rr; if(yi==0||yi==dy){x=0;z=0;}
      // Морфинг в узел: добавим небольшую «гармонику»
      const knot = 0.08*sin(u*3.0 + t*1.2)*cos(v*2.0);
      let nv = noise(x/rr*0.9, y*0.02+t, z/rr*0.9);
      nv = 1.0 + amp*(nv-0.5) + knot;
      g.vertices[xi+(dx+1)*yi]=createVector(x*nv,y*nv,z*nv);
    }
  }
  g.computeFaces();
  for(let i=g.faces.length-1;i>=0;i--){ if(i<dx*2 && i%2==0 || i>g.faces.length-dx*2 && i%2==1) g.faces[i]=[]; }
  for(let i=g.faces.length-1;i>=0;i--){ if(g.faces[i].length==0) g.faces.splice(i,1); }
  g.computeNormals(); g.averageNormals();
  this._renderer.createBuffers('m2', g); this._renderer.drawBuffers('m2');
}

// Скролл влияет на амплитуду (мягко)
window.addEventListener('scroll', ()=>{
  const target = constrain((window.scrollY||0)/800,0,0.2);
  scrollAmp = lerp(scrollAmp, target, 0.2);
});


