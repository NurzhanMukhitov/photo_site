let pts=[]; let R; let dens= window.innerWidth<1024? 420 : 900; // количество точек
function setup(){ const dpr=windowWidth<1024?1:1.5; pixelDensity(dpr); createCanvas(windowWidth,windowHeight,WEBGL); noStroke(); R=min(width,height)*0.34; init(); }
function windowResized(){ resizeCanvas(windowWidth,windowHeight); R=min(width,height)*0.34; init(); }
function init(){ pts=[]; randomSeed(2); for(let i=0;i<dens;i++){ // равномерно по сфере (фибоначчи-похожее распределение)
  const z = map(i,0,dens,-1,1); const a = i* (PI*(3.0 - sqrt(5.0))); const r = sqrt(1.0 - z*z);
  pts.push(createVector(r*cos(a), z, r*sin(a)));
}}
function draw(){ background('#0b0c0f'); rotateY(frameCount*0.007); rotateX(0.4*sin(frameCount*0.004));
  for(const p of pts){ const amp = 0.06 + 0.04*sin(frameCount*0.01 + p.y*3.0); const rr = R*(1.0+amp*(noise(p.x*2.0, p.y*2.0, p.z*2.0)-0.5)); const x= p.x*rr, y=p.y*rr, z=p.z*rr;
    const glow = 180 + 75*sin(frameCount*0.02 + (p.y+1.0)*1.5);
    fill(glow, glow, 255, 220);
    push(); translate(x,y,z); sphere(2,6,6); pop();
  }
}


