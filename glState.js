// This should be a singleton, not sure which pattern to use for it but for now a class will do
// The class structure also requires a huge use of "this", which for now is mostly used to keep the main app file more concise, 
// but I will look for a better way to do this in the future
class glState2DOverload {

    constructor(canvas_name) {

        this.canvas = document.getElementById(canvas_name);
        this.gl = this.canvas.getContext("webgl");

        if (this.gl === null) {
            alert("Unable to initialize webgl, your browser may not support it");
        }

        // This disables the right click menu for the canvas, so the rmb can be used for camera panning
        this.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };

        this.uniformLocations = null;
        this.uniformBuffers = null;
        this.attributeLocations = null;
        this.attributeBuffers = null;
        this.indexBuffers = null;
        this.textures = null;

        this.camera = null;
        this.draw_list = null;
    }

    // Mozilla tutorial code
    initShaderProgram(vsSource, fsSource) {

        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);

            // This error check doesnt make much sense yet
            return null;
        }

        this.gl.useProgram(program);
        this.populateShaderVariables(program);
    }

    // Right now this function is completely hardcoded so whenever a uniform, varying, or other variable is added to the shader program
    // I create these values accordingly. In a better system there would be a function to create this data by parsing the shader programs,
    // and there are utility libraries to do this, but to keep this prototype program small I add them manually
    populateShaderVariables(program) {

        this.uniformLocations = {
            modelMatrixLocation: this.gl.getUniformLocation(program, "u_modelMatrix"),
            viewProjectionMatrixLocation: this.gl.getUniformLocation(program, "u_viewProjectionMatrix"),
            colorLocation: this.gl.getUniformLocation(program, "u_color"),
            lightDirectionLocation: this.gl.getUniformLocation(program, "u_lightDirection"),
        }

        this.uniformBuffers = {

        }

        this.attributeLocations = {

            vertexPositionLocation: this.gl.getAttribLocation(program, "a_vertexPosition"),
            vertexNormalLocation: this.gl.getAttribLocation(program, "a_vertexNormal"),
            texCoordLocation: this.gl.getAttribLocation(program, "a_texCoord"),

        }

        this.attributeBuffers = {
            vertexPositionBuffer: this.gl.createBuffer(),
            vertexNormalBuffer: this.gl.createBuffer(),
            texCoordBuffer: this.gl.createBuffer()
        }

        this.indexBuffers = {
            indexBuffer: this.gl.createBuffer(),
        }

        this.textures = {
            //texture: gl.createTexture()
        }
    }

    // Mozilla tutorial code
    // creates a shader of the given type, uploads the source and compiles it
    loadShader(type, source) {

        const shader = this.gl.createShader(type);

        // Send the source to the shader object
        this.gl.shaderSource(shader, source);

        // Compile the shader program
        this.gl.compileShader(shader);

        // See if it compiled successfully
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    bufferData(buffer_name, data) {

        let buffer = this.attributeBuffers[buffer_name];
        if (buffer === null) {
            console.log("Buffer: " + buffer_name + " not found");
            return null;
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
    }

    bufferIndexData(buffer_name, data) {
        let buffer = this.indexBuffers[buffer_name];
        if (buffer === null) {
            console.log("Buffer: " + buffer_name + " not found");
        }
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    enableAttribArray(buffer_name, location_name, size, type, normalize, stride, offset) {

        let buffer = this.attributeBuffers[buffer_name];
        let location = this.attributeLocations[location_name];

        if (buffer === null) {
            console.log("Buffer: " + buffer_name + " not found");
            return 1;
        }

        if (location === null) {
            console.log("Location: " + location_name + " not found");
            return 1;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attributeBuffers[buffer_name]);
        this.gl.enableVertexAttribArray(this.attributeLocations[location_name]);
        // binds the current ARRAY_BUFFER to the attribute (vertexposition)
        this.gl.vertexAttribPointer(this.attributeLocations[location_name], size, type, normalize, stride, offset);
        return 0;
    }

    setTexture(texture_name, data) {

        tex = textures[texture_name];
        if (tex === null) {
            console.log("Texture: " + texture_name + " not found");
            return;
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        // todo: this only accepts 2 by 2 textures, change this to get width and height of the texture, maybe using the data dimensions or a texture object
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 2, 2, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    }

    /*
    // Just one pixel for now
    function modifyTexture(x, y, r, g, b, a) {
    
        this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([r, g, b, a]));
    }
    */

    // In order to initialize the attribute buffers, we need to buffer all of the vertices and indices combined
    // so we can then buffer in sub data
    init(draw_list) {

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffers.indexBuffer);

        // Not sure where to put this
        this.gl.uniform4fv(this.uniformLocations.colorLocation, [0.0, 1.0, 0.0, 1.0]);

        let combined_vertices = new Array();
        let combined_indices = new Array();
        let combined_normals = new Array();
        let combined_colors = new Array();

        let index_offset = 0;

        for (let i = 0; i < draw_list.length; i++) {

            // Note: you have to use Array.from because javascript concat does not work with typed arrays
            // You could also write your own concat function, but this is a one time step so it shouldn't affect performance
            combined_vertices = combined_vertices.concat(Array.from(draw_list[i].getVertexPositions()));
            combined_normals = combined_normals.concat(Array.from(draw_list[i].getVertexNormals()));
            combined_colors = combined_colors.concat(Array.from(draw_list[i].getColors()));


            // The indices can't be simply combined because they have to have an offset based on the objects before them
           for (let j = 0; j < draw_list[i].getNumIndices(); j++) {
                combined_indices.push(draw_list[i].getIndices()[j] + index_offset);
                
            }

            index_offset += draw_list[i].getNumVertices();
        }

        // The custom buffer functions use glBufferData instead of BufferSubData, which is slower but more simple for a one time at start function
        this.bufferData("vertexPositionBuffer", new Float32Array(combined_vertices));
        this.bufferData("vertexNormalBuffer", new Float32Array(combined_normals));

        // This is not a texture yet but the name will eventually make sense when textures are added
        this.bufferData("texCoordBuffer", new Float32Array(combined_colors));

        this.bufferIndexData("indexBuffer", new Uint16Array(combined_indices));

        let ret = 0;

        ret += this.enableAttribArray("vertexPositionBuffer", "vertexPositionLocation", 3, this.gl.FLOAT, false, 0, 0);
        ret += this.enableAttribArray("vertexNormalBuffer", "vertexNormalLocation", 3, this.gl.FLOAT, false, 0, 0);
        ret += this.enableAttribArray("texCoordBuffer", "texCoordLocation", 4, this.gl.FLOAT, false, 0, 0);

        if (ret != 0) {
            // TODO: proper error checking
            console.log("Enabling the attribute arrays went wrong");
            return;
        }

        // Map the -1 +1 clip space to 0, canvas width, 0, canvas height
        this.gl.viewport = (0, 0, this.canvas.width, this.canvas.height);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.enable(this.gl.CULL_FACE);

        this.gl.clearColor(0, 0, 0, 0);
    }

    draw(objList) {

        //console.time("draw");

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        let v_offset = 0;
        let i_offset = 0;

        for (let i = 0; i < objList.length; i++) {

            let obj = objList[i];

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffers.indexBuffer);

            // There used to be code for only buffering the vertices that were changed here, for now the performance cost is not as important
            // as the other issues, so this could be a future thing to implement
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attributeBuffers["vertexPositionBuffer"]);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, v_offset, obj.getVertexPositions());

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attributeBuffers["vertexNormalBuffer"]);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, v_offset, obj.getVertexNormals());

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attributeBuffers["texCoordBuffer"]);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, v_offset, obj.getColors());

            this.gl.uniformMatrix4fv(this.uniformLocations.modelMatrixLocation, false, obj.getModelMatrix());
            this.gl.uniformMatrix4fv(this.uniformLocations.viewProjectionMatrixLocation, false, this.camera.getVP());

            // Use the camera's current direction for the light source direction
            this.gl.uniform3fv(this.uniformLocations.lightDirectionLocation, this.camera.getDirection());

            let i_size = obj.getNumIndices();
            let v_size = obj.getNumVertices();

            // The * 2 is because the size of the unsigned short is 2 bytes
            this.gl.drawElements(obj.primitiveType, i_size, this.gl.UNSIGNED_SHORT, i_offset * 2);

            v_offset += v_size;
            i_offset += i_size;
        }
    }
}