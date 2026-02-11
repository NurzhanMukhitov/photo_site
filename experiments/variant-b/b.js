let pts = [], amp = 24, speed = 0.4;

function setup(){
  const dpr = windowWidth < 1024 ? 1 : 1.5;
  pixelDensity(dpr);
  createCanvas(windowWidth, windowHeight);
  noFill();
  stroke(240);
  strokeWeight(2);
  initPts();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  initPts();
}

function initPts(){
  pts = [];
  const n = 220; // больше — плотнее «лента»
  for (let i=0; i<n; i++){
    const x = map(i,0,n, -width, width); // запас слева/справа — для бесшва
    const y = height*0.5;
    pts.push(createVector(x,y));
  }
}

function draw(){
  background('#0d0f13');
  const t = frameCount * speed * 0.01;
  const a = amp + 16 * constrain((window.scrollY||0)/600, 0, 1); // немного от скролла

  beginShape();
  for (let i=0;i<pts.length;i++){
    const p = pts[i];
    const nx = p.x + 30*sin(0.002*p.x + t*1.3);
    const ny = p.y + a * sin(0.006*p.x + t);
    curveVertex(nx, ny);
  }
  endShape();

  // дублируем контур, создавая «ленту» толщиной
  stroke(200,200,255,32);
  beginShape();
  for (let i=0;i<pts.length;i++){
    const p = pts[i];
    const nx = p.x + 30*sin(0.002*p.x + t*1.3);
    const ny = p.y + 60 + a * sin(0.006*p.x + t + 0.6);
    curveVertex(nx, ny);
  }
  endShape();
}


