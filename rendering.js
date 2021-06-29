// Vertex shader program
// Using webglfundamentals instanced rendering tutorial
const vsSource = `

    precision lowp float;

    attribute vec2 a_position;
    attribute vec2 translation;

    attribute vec4 color;
    varying vec4 v_color;

    void main() {
        
        gl_Position = vec4(translation.x + a_position.x, translation.y + a_position.y, 0, 1);
        //float x = t.x;
        //gl_Position = vec4(a_position.x, a_position.y, 0, 1);
        
        v_color = color;
    }
`;

// Fragment shader program
const fsSource = `

    precision lowp float;

    varying vec4 v_color;

    void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
`;

function createGLContext(canvas_id) {

    let gl = document.getElementById(canvas_id).getContext("webgl2");

    if (gl === null) {
        alert("Unable to initialize webgl, your browser may not support it");
        return null;
    }

    return gl;
}

// Mozilla tutorial code
function initShaderProgram (gl, vsSource, fsSource) {

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        gl.deleteProgram(program);

        return null;
    }

    gl.useProgram(program);

    return program;
}

// Mozilla tutorial code
// creates a shader of the given type, uploads the source and compiles it
function loadShader(gl, type, source) {

    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}