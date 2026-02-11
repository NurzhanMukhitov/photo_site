// Desktop-only T4 wireframe sphere (lazy-init)
(function(){
  const init = () => {
    const mount = document.getElementById('hero-sphere');
    if (!mount) return;
    // Разрешаем мобильные только на странице Contact
    const isMobile = window.matchMedia('(max-width: 1100px)').matches;
    const allowMobile = document.body && document.body.classList.contains('page-contact');
    if (isMobile && !allowMobile) return;
    // Prefer reduced motion: render one frame and stop
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create container canvas via p5
    const sketch = (p) => {
      let R, detail = 64;
      p.setup = () => {
        const dpr = allowMobile ? Math.min(window.devicePixelRatio || 1, 1.3) : 1.25;
        p.pixelDensity(dpr);
        p.createCanvas(mount.clientWidth, mount.clientHeight, p.WEBGL).parent(mount);
        p.noFill();
        p.stroke(20);
        p.strokeWeight(1.2);
        R = Math.min(p.width, p.height) * 0.38;
        if (p.width < 700) detail = 48;
      };
      p.windowResized = () => {
        p.resizeCanvas(mount.clientWidth, mount.clientHeight);
        R = Math.min(p.width, p.height) * 0.38;
      };
      p.draw = () => {
        // прозрачный фон, без белой подложки
        p.clear();
        // возможность вращать мышью/тачем
        p.orbitControl(1.5, 1.2, 0.1);
        // лёгкое авто-вращение
        p.rotateY(p.frameCount * 0.003);
        const t = p.frameCount * 0.01; const amp = 0.12 + 0.05 * p.sin(p.frameCount/70.0);
        for (let lat=0; lat<=detail; lat++){
          const th = p.map(lat,0,detail,0,p.PI);
          p.beginShape();
          for (let lon=0; lon<=detail; lon++){
            const ph = p.map(lon,0,detail,0,p.TWO_PI);
            let x=p.sin(th)*p.cos(ph), y=p.cos(th), z=p.sin(th)*p.sin(ph);
            let n = p.noise(x*1.2, y*1.2+t, z*1.2); let r = R*(1.0 + amp*(n-0.5));
            p.vertex(x*r, y*r, z*r);
          }
          p.endShape();
        }
        if (reduce) p.noLoop();
      };
    };
    new window.p5(sketch);
  };

  const ensureP5 = () => new Promise((res) => {
    if (window.p5) return res();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.3/lib/p5.min.js';
    s.onload = () => res(); document.head.appendChild(s);
  });

  const mount = document.getElementById('hero-sphere');
  if (!mount) return;
  const io = new IntersectionObserver(async (entries) => {
    for (const e of entries){
      if (e.isIntersecting){ io.disconnect(); await ensureP5(); init(); break; }
    }
  }, { rootMargin: '100px' });
  io.observe(mount);
})();


