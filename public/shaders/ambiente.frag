// Simple textured fragment shader
precision mediump float;
varying vec2 vUV;
uniform sampler2D texture_diffuse1;
void main(void) {
  gl_FragColor = texture2D(texture_diffuse1, vUV);
}
