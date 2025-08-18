// Графичная сфера из полос с антиалиасингом в фрагменте
let sh;
const CYCLE=260;

const vert=`
precision mediump float; attribute vec3 aPosition,aNormal; uniform mat4 uModelViewMatrix,uProjectionMatrix; varying vec3 vN,vP; varying vec2 vUV;
void main(){ vN=normalize(mat3(uModelViewMatrix)*aNormal); vec4 p=uModelViewMatrix*vec4(aPosition,1.0); vP=p.xyz; // проецируем UV из нормалей
  vUV = normalize(aNormal).xy; gl_Position=uProjectionMatrix*p; }
`;

const frag=`
precision mediump float; varying vec3 vN,vP; varying vec2 vUV; uniform vec2 u_resolution; uniform float u_time; 
// полосы по одной оси с антиалиасингом
float aaStripe(float x,float w){ float edge= fwidth(x)*0.5; return smoothstep(w+edge,w-edge, abs(fract(x)-0.5)); }
void main(){ vec3 N=normalize(vN); vec3 V=normalize(-vP);
  // координата для полос: вращаем и смещаем по времени
  float u = vUV.x*8.0 + u_time*0.15; // частота и движение
  float stripe = aaStripe(u, 0.18); // 0..1 (белая полоса)
  vec3 col = mix(vec3(0.0), vec3(1.0), stripe);
  // лёгкий затеняющий фактор, чтобы придать объём
  float shade = 0.5 + 0.5*max(dot(N, vec3(0.0,0.0,1.0)),0.0);
  col *= mix(0.9,1.0, shade);
  gl_FragColor=vec4(col,1.0);
}
`;

function setup(){ const dpr=windowWidth<1024?1:1.5; pixelDensity(dpr); createCanvas(windowWidth,windowHeight,WEBGL); sh=createShader(vert,frag); shader(sh); noStroke(); }
function windowResized(){ resizeCanvas(windowWidth,windowHeight); }
function draw(){ background('#ffffff'); sh.setUniform('u_resolution',[width,height]); sh.setUniform('u_time', frameCount/60.0);
  rotateY(frameCount/CYCLE*PI*0.9); rotateX(frameCount/CYCLE*PI*0.8); rotateZ(frameCount/CYCLE*PI*0.3);
  sphere(min(width,height)*0.34, 100, 100);
}


