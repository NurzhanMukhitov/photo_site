let rings=72, R;
function setup(){ const dpr=windowWidth<1024?1:1.5; pixelDensity(dpr); createCanvas(windowWidth,windowHeight,WEBGL); noFill(); stroke(255); strokeCap(ROUND); R=min(width,height)*0.33; }
function windowResized(){ resizeCanvas(windowWidth,windowHeight); R=min(width,height)*0.33; }
function draw(){ background(0); rotateY(frameCount*0.01); rotateX(-HALF_PI*0.8); rotateZ(-0.2);
  const t=frameCount*0.02; const thickBase=2.0; const ringStep=R*2.0/rings;
  for(let i=0;i<rings;i++){
    const y = -R + i*ringStep;
    const rr = sqrt(max(R*R - y*y, 0.0));
    const w = (0.5+0.5*sin(y*0.03 + t))*6.0 + thickBase; // толщина пульсирует
    strokeWeight(w);
    beginShape(POINTS);
    for(let a=0; a<TWO_PI; a+=0.06){
      const x=rr*cos(a), z=rr*sin(a);
      // динамический зазор — выкусываем сектора
      const gap = 0.25 + 0.2*sin(t*0.6 + y*0.02);
      if (abs(sin(a*2.0 + y*0.01 + t*0.8))>gap) vertex(x,y,z);
    }
    endShape();
  }
}


