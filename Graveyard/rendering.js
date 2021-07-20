// THIS FILE UNUSED RIGHT NOW

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

/**
 * let gl = createGLContext("blockchain-canvas");



// testing
const UI_SQUARE_CLIP_SIZE = 0.05;



function drawTree(root) {



    let gl_data = createInstancedSquaresFromTree(root);


    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl_data.translations), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl_data.colors), gl.DYNAMIC_DRAW);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArraysInstanced(gl.LINE_LOOP, 0, 4, gl_data.translations.length / 2);

    * 
    * TODO: rewrite or fix this function with a much better tree drawing algorithm
    * 
    * 
    * 
    * This function creates the clip space translations (and colors, todo remove) for a given tree root
    * The root clip space coordiantes are (0.5, 1), centered at the top of the clip space
    * The algorithm then recursively calculates the children node translations to fit them to the clip space
    * 
    * Each child can only take up the space that is allocated to its parent based on the number of siblings a parent has,
    * which is not ideal and something to fix with a better tree drawing algorithm in the future
    * --right now this is mostly used for debugging
     function createInstancedSquaresFromTree(root) {

        let max_depth = treeDepth(root);

        // draw this
        // draw a line to children

        let translations = [];
        let colors = [];

        function recursiveDraw(current_node, depth, num_blocks_on_row, current_index, parent_width_fraction, total_canvas_offset) {


            // clip space
            let vertical_position = -(2 - UI_SQUARE_CLIP_SIZE) * (depth / max_depth) + 1;

            // also should have ui square clip size for horizontal, debug function for now
            let horizontal_multiplier = (current_index / (num_blocks_on_row + 1));

            // This is between 0 and 1;
            let x = (horizontal_multiplier * parent_width_fraction) + total_canvas_offset;

            // This is in clip coordinates, from -1 to 1;
            let horizontal_position = 2 * x - 1;

            // question here about functional programming, shouldn't have any changes, could fix
            current_node.nd_coords = [horizontal_position, vertical_position];

            translations.push(horizontal_position, vertical_position);
            colors.push(0, 1, 1, 1);

            // The children array should always be initialized to empty
            for (let i = 0; i < current_node.children.length; i++) {


                recursiveDraw(
                    current_node.children[i],
                    depth + 1,
                    current_node.children.length,
                    i + 1, // reason for this explain
                    (1 / num_blocks_on_row) * parent_width_fraction,
                    (current_index - 1) * (1 / num_blocks_on_row) * parent_width_fraction + total_canvas_offset
                );

            }


        }

        recursiveDraw(root, 0, 1, 1, 1, 0);


        return {
            translations: translations,
            colors: colors
        }

    }
}
const program = initShaderProgram(gl, vsSource, fsSource);

gl.useProgram(program);

// Create locations and buffers
const positionLoc = gl.getAttribLocation(program, 'a_position');
const translationLoc = gl.getAttribLocation(program, 'translation');
const colorLoc = gl.getAttribLocation(program, 'color');

const positionBuffer = gl.createBuffer();
const translationBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();

// Set the parameters for each attribute
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
gl.enableVertexAttribArray(translationLoc);
gl.vertexAttribPointer(translationLoc, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

gl.vertexAttribDivisor(translationLoc, 1);
gl.vertexAttribDivisor(colorLoc, 1);

// Buffer data that is not decided at runtime
const square_vertices = new Float32Array([0, 0, UI_SQUARE_CLIP_SIZE, 0, UI_SQUARE_CLIP_SIZE, -UI_SQUARE_CLIP_SIZE, 0, -UI_SQUARE_CLIP_SIZE]);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, square_vertices, gl.STATIC_DRAW);
 */