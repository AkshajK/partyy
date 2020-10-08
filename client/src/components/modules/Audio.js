var windowW = window.innerWidth,windowH = Math.max(600, window.innerHeight);
var body = document.body;
body.classList.add("color");

window.onload = function () {
  var webgl = new Webgl();
  var audio = new Audio(webgl);
};

class Audio {
  constructor(_webgl) {
    this.webgl = _webgl;
    this.source = null;
    this.audioContext = window.AudioContext ? new AudioContext() : new webkitAudioContext();
    this.fileReader = new FileReader();
    this.init();
    this.isReady = false;
    this.count = 0;
    this.render();
  }

  init() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.minDecibels = -70;
    this.analyser.maxDecibels = 10;
    this.analyser.smoothingTimeConstant = .75;

    document.getElementById('file').addEventListener('change', function (e) {
      this.fileReader.readAsArrayBuffer(e.target.files[0]);
    }.bind(this));

    var _this = this;

    this.fileReader.onload = function () {
      _this.audioContext.decodeAudioData(_this.fileReader.result, function (buffer) {
        if (_this.source) {
          _this.source.stop();
        }
        _this.source = _this.audioContext.createBufferSource();
        _this.source.buffer = buffer;

        _this.source.loop = true;

        _this.source.connect(_this.analyser);

        _this.gainNode = _this.audioContext.createGain();

        _this.source.connect(_this.gainNode);
        _this.gainNode.connect(_this.audioContext.destination);
        _this.source.start(0);

        _this.frequencyArray = _this.webgl.sphereG.attributes.aFrequency.array;
        _this.indexPosArray = _this.webgl.indexPosArray;
        _this.indexPosLength = _this.webgl.indexPosArray.length;
        _this.isReady = true;
      });
    };
  }

  _render() {
    if (!this.isReady) return;
    this.count++;

    this.spectrums = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(this.spectrums);

    var num,mult,frequency,maxNum = 255,frequencyAvg = 0;

    for (var i = 0; i < this.indexPosLength; i++) {
      mult = Math.floor(i / maxNum);

      if (mult % 2 === 0) {
        num = i - maxNum * mult;
      } else {
        num = maxNum - (i - maxNum * mult);
      }

      var spectrum = num > 150 ? 0 : this.spectrums[num + 20];
      frequencyAvg += spectrum * 1.2;

      var indexPos = this.indexPosArray[i];
      spectrum = Math.max(0, spectrum - i / 80);

      for (var j = 0, len = indexPos.length; j < len; j++) {
        var vectorNum = indexPos[j];
        this.frequencyArray[vectorNum] = spectrum;
      }
    }

    frequencyAvg /= this.indexPosLength;
    frequencyAvg *= 1.7;
    this.webgl.sphereM.uniforms["uScale"].value = this.webgl.sphereM_2.uniforms["uScale"].value = frequencyAvg * 1.7;
    this.webgl.sphereM.uniforms["uTime"].value += 0.015;

    this.webgl.mesh_2.scale.x = 1 + frequencyAvg / 290;
    this.webgl.mesh_2.scale.y = 1 + frequencyAvg / 290;
    this.webgl.mesh_2.scale.z = 1 + frequencyAvg / 290;

  }

  render() {
    this._render();
    this.webgl.render();
    requestAnimationFrame(this.render.bind(this));
  }}


class Webgl {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, windowW / windowH, 0.1, 10000);
    this.camera.position.set(20, 200, -80);

    this.camera.lookAt(this.scene.position);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true });


    this.renderer.setPixelRatio(1.5);

    this.renderer.setClearColor(0x20c5d4, 0);
    this.renderer.setSize(windowW, windowH);
    var div = document.getElementById("wrapper");
    div.appendChild(this.renderer.domElement);
    div.style.width = windowW + "px";
    div.style.height = window.innerHeight + "px";

    this.renderer.domElement.style.width = windowW + "px";
    this.renderer.domElement.style.height = windowH + "px";



    var orbit = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.windowW = windowW;
    this.windowH = window.innerHeight;

    this.mouse = {
      x: 0,
      y: 0,
      old_x: 0,
      old_y: 0 };


    //     document.addEventListener( 'mousemove', function(event){
    //       this.mouse.old_x = this.mouse.x;
    //       this.mouse.old_y = this.mouse.y;

    //       this.mouse.x = event.clientX - this.windowW / 2;
    //       this.mouse.y = event.clientY - this.windowH / 2;
    //     }.bind(this), false );

    window.onresize = function () {
      this.windowW = document.body.clientWidth;
      this.windowH = window.innerHeight;
      var _height = Math.max(600, this.windowH);
      this.renderer.setSize(this.windowW, _height);
      this.camera.aspect = this.windowW / _height;
      this.camera.updateProjectionMatrix();

      div.style.width = this.windowW + "px";
      div.style.height = window.innerHeight + "px";

    }.bind(this);

    this.createSphere();

    this.renderer.render(this.scene, this.camera);
  }



  createSphere() {
    this.createShader();

    this.sphereG = new THREE.IcosahedronBufferGeometry(40, 4);
    this.sphereM = new THREE.ShaderMaterial({
      vertexShader: this.vertex,
      fragmentShader: this.fragment,
      uniforms: {
        uTime: { type: "f", value: 0 },
        uScale: { type: "f", value: 0 },
        isBlack: { type: "i", value: 1 } },


      wireframe: true,
      transparent: true });



    this.detectIndex();
    this.sphereG.addAttribute("aFrequency", new THREE.BufferAttribute(new Float32Array(this.indexArray.length), 1));

    this.mesh = new THREE.Mesh(this.sphereG, this.sphereM);

    this.scene.add(this.mesh);

    this.createSphere2();
  }


  createSphere2() {
    this.sphereG_2 = new THREE.IcosahedronBufferGeometry(39.5, 4);
    this.sphereG_2.addAttribute("aFrequency", new THREE.BufferAttribute(new Float32Array(this.indexArray.length), 1));
    this.sphereM_2 = new THREE.ShaderMaterial({
      vertexShader: this.vertex_2,
      fragmentShader: this.fragment_2,
      uniforms: {
        uScale: { type: "f", value: 0 },
        isBlack: { type: "i", value: 1 } },


      shading: THREE.FlatShading });


    this.mesh_2 = new THREE.Mesh(this.sphereG_2, this.sphereM_2);
    this.scene.add(this.mesh_2);
  }


  detectIndex() {
    this.verticesArray = this.sphereG.attributes.position.array;
    var arrayLength = this.verticesArray.length;

    this.vecCount = 0;
    this.indexCount = 0;
    this.vec3Array = [];
    this.allVec3Array = [];
    this.indexArray = [];
    this.indexPosArray = [];
    this.frequencyNumArray = [];

    for (var i = 0; i < arrayLength; i += 3) {
      var vec3 = {};
      vec3.x = this.verticesArray[i];
      vec3.y = this.verticesArray[i + 1];
      vec3.z = this.verticesArray[i + 2];
      var detect = this.detectVec(vec3);
      this.allVec3Array.push(vec3);

      if (detect === 0 || detect > 0) {
        this.indexArray[this.indexCount] = detect;
        this.indexPosArray[detect].push(this.indexCount);

      } else {
        this.vec3Array[this.vecCount] = vec3;
        this.indexArray[this.indexCount] = this.vecCount;

        this.indexPosArray[this.vecCount] = [];
        this.indexPosArray[this.vecCount].push(this.indexCount);

        this.vecCount++;

      }

      this.indexCount++;
    }
  }


  detectVec(vec3) {
    if (this.vecCount === 0) return false;

    for (var i = 0, len = this.vec3Array.length; i < len; i++) {
      var _vec3 = this.vec3Array[i];
      var isExisted = vec3.x === _vec3.x && vec3.y === _vec3.y && vec3.z === _vec3.z;
      if (isExisted) {
        return i;
      }
    }

    return false;
  }

  createShader() {
    this.vertex = [
    "uniform float uTime;",
    "uniform float uScale;",

    "attribute float aFrequency;",
    "varying float vFrequency;",
    "varying float vPos;",


    "const float frequencyNum = 256.0;",
    "const float radius = 40.0;",
    "const float PI = 3.14159265;",
    "const float _sin15 = sin(PI / 10.0);",
    "const float _cos15 = cos(PI / 10.0);",

    "void main(){",

    "float frequency;",
    "float SquareF = aFrequency * aFrequency;",

    "frequency = smoothstep(16.0, 7200.0, SquareF) * SquareF / (frequencyNum * frequencyNum);",

    "vFrequency = frequency;",

    "float _uScale = (1.0 - uScale * 0.5 / frequencyNum) * 3.0;",

    "float _sin = sin(uTime * .5);",
    "float _cos = cos(uTime * .5);",


    "mat2 rot = mat2(_cos, -_sin, _sin, _cos);",
    "mat2 rot15 = mat2(_cos15, -_sin15, _sin15, _cos15);",

    "vec2 _pos = rot * position.xz;",
    "vec3 newPos = vec3(_pos.x, position.y, _pos.y);",
    "newPos.xy = rot15 * newPos.xy;",

    "newPos = (1.0 + uScale / (frequencyNum * 2.0) ) * newPos;",

    "vPos = (newPos.x + newPos.y + newPos.z) / (3.0 * 120.0);",


    "gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos + vFrequency * newPos * _uScale, 1.0);",
    "}"].
    join("\n");

    this.fragment = [
    "uniform float uTime;",
    "uniform float uScale;",

    "uniform int isBlack;",

    "varying float vFrequency;",
    "varying float vPos;",

    "const float frequencyNum = 256.0;",
    "const vec3 baseColor = vec3(0.95, 0.25, 0.3);",
    // "const vec3 baseColor = vec3(0.0, 0.65, 0.7);",



    "void main(){",
    "float f = smoothstep(0.0, 0.00002, vFrequency * vFrequency) * vFrequency;",
    "float red = min(1.0, baseColor.r + f * 1.9);",
    "float green = min(1.0, baseColor.g + f * 3.6);",
    "float blue = min(1.0, baseColor.b + f* 0.01);",
    "float sum = red + blue + green;",

    "blue = min(1.0, blue + 0.3);",
    "green = max(0.0, green - 0.1);",

    "float offsetSum = (sum - (red + blue + green) / 3.0) / 3.0;",

    "blue += offsetSum + min(vPos * 2.0, -0.2);",
    "red += offsetSum + min(vPos * 0.5, 0.2);",
    "green += offsetSum - vPos * max(0.3, vFrequency * 2.0);",

    "vec3 color;",

    "color = vec3(red, green, blue);",


    "gl_FragColor = vec4(color, 1.0);",
    "}"].
    join("\n");

    //color: 0xff6673,
    this.vertex_2 = [
    "varying vec3 vPosition;",

    "void main(){",
    "vPosition = position;",
    "gl_Position =projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"].
    join("\n");
    this.fragment_2 = [
    "uniform float uScale;",
    "uniform int isBlack;",


    "varying vec3 vPosition;",
    "const float frequencyNum = 256.0;",

    "const float radius = 40.0;",
    "const vec3 baseColor = vec3(1.0, 102.0 / 255.0, 115.0 / 255.0);",
    // "const vec3 baseColor = vec3(0.1, 0.8, 0.9);",




    "void main(){",
    "vec3 pos = vec3(vPosition.x, -vPosition.y, vPosition.z) / (radius * 10.0) + 0.05;",

    "vec3 _color;",

    "_color = baseColor + pos;",

    // "float _uScale = uScale / (frequencyNum * 5.0);",

    "gl_FragColor = vec4(_color, 1.0);",
    "}"].

    join("\n");
  }

  render() {
    this.sphereG.attributes.aFrequency.needsUpdate = true;
    // var d = this.mouse.x - this.mouse.old_x;
    // var theta = d * 0.1;
    // var sin = Math.sin(theta);
    // var cos = Math.cos(theta);

    // var x = this.camera.position.x;
    // var z = this.camera.position.z;


    // this.camera.position.x = x * cos - z * sin;
    //  this.camera.position.z = x * sin + z * cos;

    // this.camera.lookAt( this.scene.position );

    this.renderer.render(this.scene, this.camera);
  }}


// (function () {
//     var AUDIO_URL, TOTAL_BANDS, analyser, analyserDataArray, arrCircles, audio, build, buildCircles, canplay, changeMode, changeTheme, circlesContainer, cp, createCircleTex, gui, hammertime, init, initAudio, initGUI, initGestures, isPlaying, k, message, modes, mousePt, mouseX, mouseY, params, play, renderer, resize, stage, startAnimation, texCircle, themes, themesNames, update, v, windowH, windowW;
  
//     AUDIO_URL = "https://lab.ma77os.com/audio-cloud/music/paradise_circus.mp3";
  
//     modes = ["cubic", "conic"];
  
//     themes = {
//       pinkBlue: [0xFF0032, 0xFF5C00, 0x00FFB8, 0x53FF00],
//       yellowGreen: [0xF7F6AF, 0x9BD6A3, 0x4E8264, 0x1C2124, 0xD62822],
//       yellowRed: [0xECD078, 0xD95B43, 0xC02942, 0x542437, 0x53777A],
//       blueGray: [0x343838, 0x005F6B, 0x008C9E, 0x00B4CC, 0x00DFFC],
//       blackWhite: [0xFFFFFF, 0x000000, 0xFFFFFF, 0x000000, 0xFFFFFF] };
  
  
//     themesNames = [];
  
//     for (k in themes) {
//       v = themes[k];
//       themesNames.push(k);
//     }
  
//     // PARAMETERS
//     params = {
//       // public
//       mode: modes[0],
//       theme: themesNames[0],
//       radius: 3,
//       distance: 600,
//       size: .5,
//       // private
//       numParticles: 5000,
//       sizeW: 1,
//       sizeH: 1,
//       radiusParticle: 60,
//       themeArr: themes[this.theme] };
  
  
//     TOTAL_BANDS = 256;
  
//     cp = new PIXI.Point();
  
//     mouseX = 0;
  
//     mouseY = 0;
  
//     mousePt = new PIXI.Point();
  
//     windowW = 0;
  
//     windowH = 0;
  
//     stage = null;
  
//     renderer = null;
  
//     texCircle = null;
  
//     circlesContainer = null;
  
//     arrCircles = [];
  
//     hammertime = null;
  
//     message = null;
  
//     // audio
//     audio = null;
  
//     analyser = null;
  
//     analyserDataArray = null;
  
//     isPlaying = false;
  
//     canplay = false;
  
//     // gui
//     gui = null;
  
//     init = function () {
//       initGestures();
//       message = $(".message");
//       message.on("click", play);
//       resize();
//       build();
//       resize();
//       mousePt.x = cp.x;
//       mousePt.y = cp.y;
//       $(window).resize(resize);
//       startAnimation();
//       return initGUI();
//     };
  
//     play = function () {
//       if (isPlaying) {
//         return;
//       }
//       initAudio();
//       message.css("cursor", "default");
//       if (canplay) {
//         message.hide();
//       } else {
//         message.html("LOADING MUSIC...");
//       }
//       audio.play();
//       return isPlaying = true;
//     };
  
//     initGUI = function () {
//       var modeController, sizeController, themeController;
//       gui = new dat.GUI();
//       // if window.innerWidth < 500
//       gui.close();
//       modeController = gui.add(params, 'mode', modes);
//       modeController.onChange(function (value) {
//         return changeMode(value);
//       });
//       themeController = gui.add(params, 'theme', themesNames);
//       themeController.onChange(function (value) {
//         return changeTheme(params.theme);
//       });
//       gui.add(params, 'radius', 1, 8);
//       gui.add(params, 'distance', 100, 1000);
//       sizeController = gui.add(params, 'size', 0, 1);
//       return sizeController.onChange(function (value) {
//         return resize(value);
//       });
//     };
  
//     initAudio = function () {
//       var context, source;
//       context = new (window.AudioContext || window.webkitAudioContext)();
//       analyser = context.createAnalyser();
//       //   analyser.smoothingTimeConstant = 0.5
//       source = null;
//       audio = new Audio();
//       audio.crossOrigin = "anonymous";
//       audio.src = AUDIO_URL;
//       return audio.addEventListener('canplay', function () {
//         var bufferLength;
//         if (isPlaying) {
//           message.hide();
//         }
//         canplay = true;
//         source = context.createMediaElementSource(audio);
//         source.connect(analyser);
//         source.connect(context.destination);
//         analyser.fftSize = TOTAL_BANDS * 2;
//         bufferLength = analyser.frequencyBinCount;
//         return analyserDataArray = new Uint8Array(bufferLength);
//       });
//     };
  
//     startAnimation = function () {
//       return requestAnimFrame(update);
//     };
  
//     initGestures = function () {
//       return $(window).on('mousemove touchmove', function (e) {
//         if (e.type === 'mousemove') {
//           mouseX = e.clientX;
//           return mouseY = e.clientY;
//         } else {
//           mouseX = e.originalEvent.changedTouches[0].clientX;
//           return mouseY = e.originalEvent.changedTouches[0].clientY;
//         }
//       });
//     };
  
//     build = function () {
//       stage = new PIXI.Stage(0x000000);
//       renderer = PIXI.autoDetectRenderer({
//         width: $(window).width(),
//         height: $(window).height(),
//         antialias: true,
//         resolution: window.devicePixelRatio });
  
//       $(document.body).append(renderer.view);
//       texCircle = createCircleTex();
//       return buildCircles();
//     };
  
//     buildCircles = function () {
//       var circle, i, j, ref;
//       circlesContainer = new PIXI.DisplayObjectContainer();
//       stage.addChild(circlesContainer);
//       for (i = j = 0, ref = params.numParticles - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {if (window.CP.shouldStopExecution(0)) break;
//         circle = new PIXI.Sprite(texCircle);
//         circle.anchor.x = 0.5;
//         circle.anchor.y = 0.5;
//         circle.position.x = circle.xInit = cp.x;
//         circle.position.y = circle.yInit = cp.y;
//         circle.mouseRad = Math.random();
//         circlesContainer.addChild(circle);
//         arrCircles.push(circle);
//       }window.CP.exitedLoop(0);
//       return changeTheme(params.theme);
//     };
  
//     createCircleTex = function () {
//       var gCircle;
//       gCircle = new PIXI.Graphics();
//       gCircle.beginFill(0xFFFFFF);
//       gCircle.drawCircle(0, 0, params.radiusParticle);
//       gCircle.endFill();
//       return gCircle.generateTexture();
//     };
  
//     resize = function () {
//       windowW = $(window).width();
//       windowH = $(window).height();
//       cp.x = windowW * .5;
//       cp.y = windowH * .5;
//       params.sizeW = windowH * params.size;
//       params.sizeH = windowH * params.size;
//       changeMode(params.mode);
//       if (renderer) {
//         return renderer.resize(windowW, windowH);
//       }
//     };
  
//     changeTheme = function (name) {
//       var circle, group, i, indexColor, j, padColor, ref, results;
//       params.themeArr = themes[name];
//       indexColor = 0;
//       padColor = Math.ceil(params.numParticles / params.themeArr.length);
//       results = [];
//       for (i = j = 0, ref = params.numParticles - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {if (window.CP.shouldStopExecution(1)) break;
//         circle = arrCircles[i];
//         group = indexColor * padColor / params.numParticles;
//         circle.blendMode = params.theme === "blackWhite" ? PIXI.blendModes.NORMAL : PIXI.blendModes.ADD;
//         circle.indexBand = Math.round(group * (TOTAL_BANDS - 56)) - 1;
//         if (circle.indexBand <= 0) {
//           circle.indexBand = 49;
//         }
//         circle.s = (Math.random() + (params.themeArr.length - indexColor) * 0.2) * 0.1;
//         circle.scale = new PIXI.Point(circle.s, circle.s);
//         if (i % padColor === 0) {
//           indexColor++;
//         }
//         results.push(circle.tint = params.themeArr[indexColor - 1]);
//       }window.CP.exitedLoop(1);
//       return results;
//     };
  
//     changeMode = function (value) {
//       var angle, circle, i, j, ref, results;
//       if (!arrCircles || arrCircles.length === 0) {
//         return;
//       }
//       if (!value) {
//         value = modes[Math.floor(Math.random() * modes.length)];
//       }
//       params.mode = value;
//       results = [];
//       for (i = j = 0, ref = params.numParticles - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {if (window.CP.shouldStopExecution(2)) break;
//         circle = arrCircles[i];
//         switch (params.mode) {
//           // cubic
//           case modes[0]:
//             circle.xInit = cp.x + (Math.random() * params.sizeW - params.sizeW / 2);
//             results.push(circle.yInit = cp.y + (Math.random() * params.sizeH - params.sizeH / 2));
//             break;
//           // circular
//           case modes[1]:
//             angle = Math.random() * (Math.PI * 2);
//             circle.xInit = cp.x + Math.cos(angle) * params.sizeW;
//             results.push(circle.yInit = cp.y + Math.sin(angle) * params.sizeH);
//             break;
//           default:
//             results.push(void 0);}
  
//       }window.CP.exitedLoop(2);
//       return results;
//     };
  
//     update = function () {
//       var a, angle, circle, dist, dx, dy, i, j, n, r, ref, scale, t, xpos, ypos;
//       requestAnimFrame(update);
//       t = performance.now() / 60;
//       if (analyserDataArray && isPlaying) {
//         analyser.getByteFrequencyData(analyserDataArray);
//       }
//       if (mouseX > 0 && mouseY > 0) {
//         mousePt.x += (mouseX - mousePt.x) * 0.03;
//         mousePt.y += (mouseY - mousePt.y) * 0.03;
//       } else {
//         a = t * 0.05;
//         mousePt.x = cp.x + Math.cos(a) * 100;
//         mousePt.y = cp.y + Math.sin(a) * 100;
//       }
//       for (i = j = 0, ref = params.numParticles - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {if (window.CP.shouldStopExecution(3)) break;
//         circle = arrCircles[i];
//         if (analyserDataArray && isPlaying) {
//           n = analyserDataArray[circle.indexBand];
//           scale = n / 256 * circle.s * 2;
//         } else {
//           scale = circle.s * .1;
//         }
//         scale *= params.radius;
//         circle.scale.x += (scale - circle.scale.x) * 0.3;
//         circle.scale.y = circle.scale.x;
//         dx = mousePt.x - circle.xInit;
//         dy = mousePt.y - circle.yInit;
//         dist = Math.sqrt(dx * dx + dy * dy);
//         angle = Math.atan2(dy, dx);
//         r = circle.mouseRad * params.distance + 30;
//         xpos = circle.xInit - Math.cos(angle) * r;
//         ypos = circle.yInit - Math.sin(angle) * r;
//         circle.position.x += (xpos - circle.position.x) * 0.1;
//         circle.position.y += (ypos - circle.position.y) * 0.1;
//       }window.CP.exitedLoop(3);
//       return renderer.render(stage);
//     };
  
//     init();
  
//   }).call(this);
  
  
//   //# sourceURL=coffeescript