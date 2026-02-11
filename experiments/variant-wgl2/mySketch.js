// Размер квадрата рендера: вписывается во вьюпорт под шапкой
const getHeaderH = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : (document.querySelector('.header')?.offsetHeight || 96);
};
const getSquareCssSize = () => {
  const w = window.innerWidth;
  const h = window.innerHeight - getHeaderH();
  return Math.max(200, Math.floor(Math.min(w, h)));
};

const main = async () => {
  const canvasWebGL2 = document.getElementById('canvasWebGL2');
  const canvas2D = document.getElementById('canvas2D');

  const gl = canvasWebGL2.getContext('webgl2');
  const program = gl.createProgram();
  setShader(gl, program, vert, frag);
  gl.linkProgram(program); gl.useProgram(program);

  const setupSizes = () => {
    const cssSide = getSquareCssSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const side = Math.floor(cssSide * dpr);
    resizeCanvas(canvasWebGL2, gl, side, side);
    canvas2D.width = side; canvas2D.height = side;
    const css = (side / dpr) + 'px';
    canvas2D.style.width = css; canvas2D.style.height = css;
  };
  setupSizes();

  const randomVec2 = [Math.random()*300, Math.random()*300];
  const randomVec2Loc = gl.getUniformLocation(program,'uRandomVec2');
  gl.uniform2fv(randomVec2Loc, randomVec2);

  // grid of points
  // высокая плотность
  const buildGeometry = () => {
    // сохраняем оригинальную плотность: cols=rows=side/2
    const side = canvas2D.width; // физический размер
    const cols = Math.max(2, Math.floor(side / 2));
    const rows = cols;
    const xOff = 2/cols, yOff = 2/rows; const uOff=1/cols, vOff=1/rows;
    const positionData = []; const texCoordData = [];
    for(let c=0;c<cols;c++){
      for(let r=0;r<rows;r++){
        positionData.push(-1 + xOff*c + 1/cols);
        positionData.push( 1 - yOff*r - 1/rows);
        texCoordData.push((c + 1/cols)*uOff);
        texCoordData.push((r + 1/rows)*vOff);
      }
    }
    setAttributeVec2(gl, program, 'aPosition', positionData);
    setAttributeVec2(gl, program, 'aTexCoord', texCoordData);
    return cols*rows;
  };
  let pointsCount = buildGeometry();

  let time = 0; const timeLoc = gl.getUniformLocation(program, 'uTime');
  const draw = () => {
    gl.clearColor(1,1,1,1); // белый фон
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, time);
    gl.drawArrays(gl.POINTS, 0, pointsCount);
    time += 0.02;
    // копируем без изменения масштаба
    drawImage(canvasWebGL2, canvas2D);
    // синхронизируем фон страницы с оттенком центра
    if (time < 0.05) {
      const col = sampleCenterColor(canvas2D);
      if (col) document.documentElement.style.setProperty('--wgl-bg', col);
    }
    requestAnimationFrame(draw);
  };
  draw();

  const reflow = () => {
    setupSizes();
    pointsCount = buildGeometry();
  };
  window.addEventListener('resize', reflow);
  window.addEventListener('orientationchange', reflow);
}
main();


