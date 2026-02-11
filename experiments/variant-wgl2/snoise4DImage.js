// простая «картинка» из шума: 4D шум возвращает vec4
const snoise4DImage = `
vec4 snoise4DImage(vec2 uv, float scal, float gain, float ofst, vec4 move){
  vec4 p = vec4(uv*scal, move.zw);
  float n = snoise(p + move);
  n = pow(0.5 + 0.5*n, gain) + ofst;
  return vec4(n, n, n, 1.0);
}
`


