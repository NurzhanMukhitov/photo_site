// Вайрфрейм-сфера (сеточная), деформированная шумом
let R, detail=64;
function setup(){ const dpr=windowWidth<1024?1:1.5; pixelDensity(dpr); createCanvas(windowWidth,windowHeight,WEBGL); noFill(); stroke(235); strokeWeight(1.2); R=min(width,height)*0.3; }
function windowResized(){ resizeCanvas(windowWidth,windowHeight); R=min(width,height)*0.3; }
function draw(){ background('#0f1114'); orbitControl(1.0,1.0,0.1); rotateY(frameCount*0.005);
  const t=frameCount*0.01; const amp=0.12+0.05*sin(frameCount/70.0);
  for(let lat=0; lat<=detail; lat++){
    const th1=map(lat,0,detail,0,PI); const th2=map(lat+1,0,detail,0,PI);
    beginShape();
    for(let lon=0; lon<=detail; lon++){
      const ph=map(lon,0,detail,0,TWO_PI);
      // первая широта
      let x1=sin(th1)*cos(ph), y1=cos(th1), z1=sin(th1)*sin(ph);
      let n1=noise(x1*1.2, y1*1.2+t, z1*1.2); let r1=R*(1.0+amp*(n1-0.5));
      vertex(x1*r1,y1*r1,z1*r1);
    }
    endShape();

    // меридианы (вертикальные линии)
    if (lat%8==0){ // реже, чтобы не перегружать
      beginShape();
      for(let lon=0; lon<=detail; lon++){
        const ph=map(lon,0,detail,0,TWO_PI);
        let x2=sin(th2)*cos(ph), y2=cos(th2), z2=sin(th2)*sin(ph);
        let n2=noise(x2*1.2, y2*1.2+t, z2*1.2); let r2=R*(1.0+amp*(n2-0.5));
        vertex(x2*r2,y2*r2,z2*r2);
      }
      endShape();
    }
  }
}


