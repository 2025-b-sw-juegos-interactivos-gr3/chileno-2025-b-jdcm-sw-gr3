// Skybox fragment shader (GLSL ES WebGL1)
precision mediump float;
varying vec3 vDirection;
uniform samplerCube skybox;
void main(void) {
  gl_FragColor = textureCube(skybox, normalize(vDirection));
}
