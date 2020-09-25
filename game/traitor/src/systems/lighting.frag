uniform vec2 position;
float lightSize = 0.2;

void main() {
    // gl_FragCoord.xy / resoliction.xt
    float dist = distance(gl_FragCoord.xy, vec2(1280.0 / 2.0, 720.0 / 2.0)) / 1280.0;
    float feather = 0.02;
    float color = 1.0 - smoothstep(lightSize, lightSize + feather, dist);
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.4);
}