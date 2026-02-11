let imgs = [], angle = 0, ready = false;

async function preload(){
  try {
    const res = await fetch('../../assets/photos.json');
    const list = await res.json();
    const limit = min(14, list.length);
    for (let i=0;i<limit;i++){
      const src = '../../' + list[i].thumb; // берём превью
      imgs.push(loadImage(src));
    }
  } catch(e){
    // fallback: ничего не грузим
  }
}

function setup(){
  const dpr = windowWidth < 1024 ? 1 : 1.25;
  pixelDensity(dpr);
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

function draw(){
  background('#0f1012');
  if (imgs.length === 0) return;

  // мягкое освещение фоном
  directionalLight(180, 190, 220, -0.3, -0.2, -1);
  ambientLight(60);

  const r = min(width, height) * 0.36;
  const n = imgs.length;
  angle += 0.004; // медленно вращаем
  rotateY(angle);

  for (let i=0;i<n;i++){
    push();
    const a = i/n * TWO_PI;
    const x = r * cos(a);
    const z = r * sin(a);
    translate(x, 0, z);
    rotateY(-a - angle); // всегда лицом к камере

    // плоскость под изображение
    const w = min(width, height)*0.28;
    const h = w * 2/3;
    // имитируем сильный blur/десатур
    tint(220, 220, 230, 180);
    imageMode(CENTER);
    image(imgs[i], 0, 0, w, h);
    pop();
  }
}


