// Converted from OpenGL 330 to GLSL ES (WebGL1) for Babylon.js ShaderMaterial
precision mediump float;
varying vec2 vUV;
uniform sampler2D texture_diffuse1;
void main(void) {
  gl_FragColor = texture2D(texture_diffuse1, vUV);
}
