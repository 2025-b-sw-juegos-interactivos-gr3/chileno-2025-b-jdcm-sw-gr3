// Mansion lit fragment shader (dir/point/spot, diffuse only + fog height)
precision mediump float;
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

uniform sampler2D texture_diffuse1;

struct DirLight { vec3 direction; vec3 ambient; vec3 diffuse; };
struct PointLight { vec3 position; float constant; float linear; float quadratic; vec3 ambient; vec3 diffuse; };
struct SpotLight { vec3 position; vec3 direction; float cutOff; float outerCutOff; float constant; float linear; float quadratic; vec3 ambient; vec3 diffuse; };

uniform int numPointLights;
uniform int numSpotLights;
uniform vec3 viewPos;
uniform DirLight dirLight;
uniform PointLight pointLights[10];
uniform SpotLight spotLights[10];

uniform vec3 fogColor;
uniform float fogDensity;

vec3 calcDir(DirLight l, vec3 N, vec3 albedo){
  vec3 L = normalize(-l.direction);
  float diff = max(dot(N,L),0.0);
  vec3 ambient = l.ambient * albedo;
  vec3 diffuse = l.diffuse * diff * albedo;
  return ambient + diffuse;
}

vec3 calcPoint(PointLight l, vec3 N, vec3 P, vec3 albedo){
  vec3 L = normalize(l.position - P);
  float diff = max(dot(N,L),0.0);
  float d = length(l.position - P);
  float att = 1.0 / (l.constant + l.linear*d + l.quadratic*d*d);
  vec3 ambient = l.ambient * albedo * att;
  vec3 diffuse = l.diffuse * diff * albedo * att;
  return ambient + diffuse;
}

vec3 calcSpot(SpotLight l, vec3 N, vec3 P, vec3 albedo){
  vec3 L = normalize(l.position - P);
  float diff = max(dot(N,L),0.0);
  float d = length(l.position - P);
  float att = 1.0 / (l.constant + l.linear*d + l.quadratic*d*d);
  float theta = dot(L, normalize(-l.direction));
  float eps = l.cutOff - l.outerCutOff;
  float inten = clamp((theta - l.outerCutOff) / eps, 0.0, 1.0);
  vec3 ambient = l.ambient * albedo * att * inten;
  vec3 diffuse = l.diffuse * diff * albedo * att * inten;
  return ambient + diffuse;
}

void main(void){
  vec3 N = normalize(vNormalW);
  vec3 albedo = texture2D(texture_diffuse1, vUV).rgb;
  vec3 color = calcDir(dirLight, N, albedo);
  for(int i=0;i<numPointLights && i<10;i++) color += calcPoint(pointLights[i], N, vPositionW, albedo);
  for(int i=0;i<numSpotLights && i<10;i++) color += calcSpot(spotLights[i], N, vPositionW, albedo);

  float heightFactor = exp(-pow(fogDensity * vPositionW.y, 2.0));
  heightFactor = clamp(heightFactor, 0.0, 1.0);
  vec3 fogged = mix(fogColor, color, heightFactor);
  gl_FragColor = vec4(fogged, 1.0);
}
