import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  Picker,
  PanResponder,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { AR } from "expo";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Audio } from "expo-av";
import { Icon } from "react-native-elements";
import { DiceManager, DiceD6 } from "threejs-dice";
import { World } from "cannon";

// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { THREE } from "expo-three";
import * as ThreeAR from "expo-three-ar";
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from "expo-graphics";
import HomeScreen from "./HomeScreen";
// this.value = "";
const { width, height } = Dimensions.get("window");
import Clarifai from "clarifai";

const app = new Clarifai.App({
  apiKey: "53f2015ac28941f391f9acf6116309f6",
});
process.nextTick = setImmediate;

export default function LinksScreen() {
  const [scanned, setScanned] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [word, setWord] = useState(null);
  const [camera, setCamera] = useState(null);
  const [notDetected, setNotDetected] = useState(null);

  const sounds = {
    Mouse: require("../assets/sound/Mouse.mp3"),
    Pen: require("../assets/sound/pen.mp3"),
  };
  // const [scanned, setScanned] = useState(false);
  useEffect(() => {
    THREE.suppressExpoWarnings(true);

    // this.value = "";
    // ThreeAR.suppressWarnings();
    this.player1 = true;
    setUpImages();
  }, []);

  // When our context is built we can start coding 3D things.
  const onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    // This will allow ARKit to collect Horizontal surfaces
    AR.setPlaneDetection(AR.PlaneDetectionTypes.Vertical);

    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });
    // console.log("this.render =>", this.renderer);
    // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);
    // Now we make a camera that matches the device orientation.
    // Ex: When we look down this camera will rotate to look down too!
    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);

    // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    // const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // // Simple color material
    // const material = new THREE.MeshPhongMaterial({
    //   color: "red"
    // });

    // // Combine our geometry and material
    // this.cube = new THREE.Mesh(geometry, material);
    // // Place the box 0.4 meters in front of us.
    // this.cube.position.z = -0.8;

    // // Add the cube to the scene
    // this.scene.add(this.cube);

    // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    // const geometry1 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // // Simple color material
    // const material1 = new THREE.MeshPhongMaterial({
    //   color: "green"
    // });

    // // Combine our geometry and material
    // this.cube1 = new THREE.Mesh(geometry1, material1);
    // // Place the box 0.4 meters in front of us.
    // this.cube1.position.z = -0.4;

    // // Add the cube to the scene
    // this.scene.add(this.cube1);

    // const geometry = new THREE.SphereGeometry(0.1, 0.1, 0.1);
    // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    // this.sphere = new THREE.Mesh(geometry, material);
    // this.sphere.position.z = -0.4;
    // this.scene.add(this.sphere);

    const fontJSON = require("../node_modules/three/examples/fonts/gentilis_regular.typeface.json");
    this.font = new THREE.Font(fontJSON);
    // const geometry = new THREE.TextGeometry("plane", {
    //   font: font,
    //   size: 0.1,
    //   height: 0.1,
    //   curveSegments: 12,
    //   bevelEnabled: false,
    //   bevelThickness: 0,
    //   bevelSize: 0,
    //   bevelOffset: 0.1,
    //   bevelSegments: 0
    // });
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // this.text = new THREE.Mesh(geometry, material);

    // Setup a light so we can see the cube color
    // AmbientLight colors all things in the scene equally.
    this.scene.add(new THREE.AmbientLight(0xffffff));

    // Create this cool utility function that let's us see all the raw data points.
    // this.points = new ThreeAR.Points();
    // // Add the points to our scene...
    // this.scene.add(this.points);
  };

  const createText = (text) => {
    const geometry = new THREE.TextGeometry(text, {
      font: new THREE.Font(
        require("../node_modules/three/examples/fonts/gentilis_regular.typeface.json")
      ),
      size: 0.02,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0.1,
      bevelSegments: 0,
    });
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    return new THREE.Mesh(geometry, material);
  };

  const setUpImages = async () => {
    const a4Images = [
      {
        name: "Plane",
        file: require("../assets/images/plane.png"),
        height: 0.287,
        width: 0.2,
      },
      {
        name: "Mountain",
        file: require("../assets/images/mountains.jpg"),
        height: 0.2,
        width: 0.287,
      },
    ];

    // ---------JOSE--------console.log("image array", a4Images);

    // loop through, load each imageonto device,
    // assign uri to new property localUri
    await Promise.all(
      a4Images.map(async (image) => {
        const asset = Asset.fromModule(image.file);
        await asset.downloadAsync();
        image.localUri = asset.localUri;
      })
    );

    // ---------JOSE--------console.log("array", a4Images);

    // loop through, create structure of all images to look for
    let detectionImages = {};
    a4Images.map((image) => {
      detectionImages[image.name] = {
        uri: image.localUri,
        name: image.name,
        height: image.height,
        width: image.width,
      };
    });

    // ---------JOSE--------console.log("detection ", detectionImages);

    const result = await AR.setDetectionImagesAsync(detectionImages);

    //setting up
    AR.onAnchorsDidUpdate(({ anchors, eventType }) => {
      // ---------JOSE--------console.log("inside  ", anchors);
      for (let anchor of anchors) {
        if (anchor.type === AR.AnchorTypes.Image) {
          const { identifier, image, transform } = anchor;
          // ---------JOSE--------console.log("image", image.name);
          if (eventType === AR.AnchorEventTypes.Add) {
            const text = createText(image.name);
            text.position.x = transform[12];
            text.position.y = transform[13];
            text.position.z = transform[14];
            this.scene.add(text);
            // Add some node
          } else if (eventType === AR.AnchorEventTypes.Remove) {
            // Remove that node
          } else if (eventType === AR.AnchorEventTypes.Update) {
            // Update whatever node
          }
        }
      }
    });
  };

  // When the phone rotates, or the view changes size, this method will be called.
  const onResize = ({ x, y, scale, width, height }) => {
    // Let's stop the function if we haven't setup our scene yet
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  // Called every frame.
  const onRender = () => {
    if (this.scene && this.camera) {
      // This will make the points get more rawDataPoints from Expo.AR
      // this.points.update();
      // Finally render the scene with the AR Camera
      this.renderer.render(this.scene, this.camera);
    }
  };

  const text = async () => {
    //const text = createText("Hello");
    //console.log("testing() =========================> ", text);
    const apiKey =
      "trnsl.1.1.20200405T190411Z.3952e7ff33c5cc91.6fe34ca177fffee6eba1a6656ab45f443284c9f0";

    const response = await fetch(
      `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${apiKey}&text=Hello&lang=fr`
    );

    const json = await response.json();
    this.text = createText(word);
    this.text.position.z = -0.2;
    this.text.position.x = 0;

    this.scene.add(this.text);
    // showDetails();

    // this.scene.add(...json.text);

    // const apiKey =
    // "trnsl.1.1.20200405T190411Z.3952e7ff33c5cc91.6fe34ca177fffee6eba1a6656ab45f443284c9f0";

    // yandex.translate("hello ", { to: "fr" }, function (err, res) {
    //   console.log(res.text);
    // });

    // // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    // const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // // // Simple color material
    // const material = new THREE.MeshPhongMaterial({
    //   color: "red",
    // });

    // // // Combine our geometry and material
    // this.cube = new THREE.Mesh(geometry, material);
    // // // Place the box 0.4 meters in front of us.
    // this.cube.position.z = -0.8;

    // // // Add the cube to the scene
    // this.scene.add(this.cube);
  };

  const translate = async () => {
    if (this.text2) {
      this.scene.remove(this.text2);
    }
    //const text = createText("Hello");
    //console.log("testing() =========================> ", text);
    const apiKey =
      "trnsl.1.1.20200405T190411Z.3952e7ff33c5cc91.6fe34ca177fffee6eba1a6656ab45f443284c9f0";

    const response = await fetch(
      `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${apiKey}&text=${word}&lang=${language}`
    );

    const json = await response.json();
    this.text2 = createText(json.text[0]);
    this.text2.position.z = -0.4;
    this.text2.position.x = 0;
    this.text2.position.y = -0.2;

    // const soundObject = new Audio.Sound();
    // try {
    //   await soundObject.loadAsync(sounds[word]);
    //   await soundObject.playAsync();
    //   // Your sound is playing!
    // } catch (error) {
    //   // An error occurred!
    //   console.log("error", error);
    // }

    this.scene.add(this.text2);
  };

  const scan = async () => {
    // if (!camera) {
    //   setCamera(this.camera2);
    // } else {
    //   this.camera2 = camera;
    // }
    setNotDetected(false);

    let lists = await app.models.list();
    let listArray = Object.entries(lists);
    listArray = listArray.slice(0, 2);
    let modelNames = [];
    listArray.map((item) => {
      modelNames.push(item[1].name);
    });
    console.log("model names ", modelNames);
    const uri = await capturePhoto();
    const base64 = await resize(uri);

    modelNames.forEach(async (modelName) => {
      const predict = await predictModel(base64, modelName);
      const result = 1 * predict.outputs[0].data.concepts[0].value;
      if (result > 0.9) {
        console.log("Result: ", result);
        setWord(modelName);
        setScanned(true);
        return;
      }
    });
    // console.log("listArray =>", listArray);
    // lists.forEach((list) => console.log(list.name));
    // var str = JSON.stringify(obj, null, 2);
    // console.log("list", JSON.stringify(lists, null, 2));
    // console.log("model Size", Object.entries(lists).length);
    // console.log("model Length", lists.length);
  };

  useEffect(() => {
    if (!scanned && word) {
      console.log("UseEffect: Scanning Again");
      scan();
      setTimeout(() => {
        setNotDetected(true);
      }, 5000);
    }
  }, [scanned]);

  const capturePhoto = async () => {
    if (this.camera2) {
      const photo = await this.camera2.takePictureAsync();
      return photo.uri;
    }
  };

  const resize = async (uri) => {
    console.log("entering resize");
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { height: 150, width: 150 } }],
      { compress: 0, base64: true }
    );
    // console.log("exiting resize");
    return manipulatedImage.base64;
  };

  const predictModel = async (base64, modelName) => {
    const response = await app.models.predict({ id: modelName }, base64);
    // console.log("predict res ", response);
    return response;
  };

  const showDetails = async () => {
    // var img = new THREE.MeshBasicMaterial({
    //   //CHANGED to MeshBasicMaterial
    //   map: THREE.TextureLoader.load(require("../assets/images/plane.png")),
    // });
    // img.map.needsUpdate = true;
    const texture = await ExpoTHREE.loadAsync(
      require("../assets/images/track.png")
    );
    // var texture = new THREE.TextureLoader().load(
    //   "https://miro.medium.com/max/10368/1*o8tTGo3vsocTKnCUyz0wHA.jpeg"
    // );

    // immediately use the texture for material creation
    var material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.PlaneGeometry(2, 0.5);
    // // Simple color material
    // const material = new THREE.MeshPhongMaterial({
    //   color: "white",
    // });

    // // Combine our geometry and material
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.overdraw = true;
    // this.text = createText("Hello World");
    // // Place the box 0.4 meters in front of us.
    this.plane.position.z = -0.4;
    this.plane.position.y = -0.4;
    this.plane.rotateX((Math.PI / 4) * 6);

    // this.text.position.z = -0.5;

    this.scene.add(this.plane);
    // this.scene.add(this.text);
  };

  const addCube = () => {
    // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // Simple color material
    const material = new THREE.MeshPhongMaterial({
      color: "red",
    });

    // Combine our geometry and material
    this.cube = new THREE.Mesh(geometry, material);
    // Place the box 0.4 meters in front of us.
    // this.cube.position.z = -0.4;
    this.cube.position.z = -0.25;
    this.cube.position.x = -0.85; //-0.85
    this.cube.position.y = -0.3;
    // this.cube.position.z = -0.3;

    // Add the cube to the scene
    this.scene.add(this.cube);

    // console.log("width ", width);
    // console.log("height ", height);

    // ---------------------------------------------------

    const geometry1 = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    const material1 = new THREE.MeshPhongMaterial({
      color: "blue",
    });

    this.cube2 = new THREE.Mesh(geometry1, material1);

    this.cube2.position.z = -0.45;
    this.cube2.position.x = -0.85;
    this.cube2.position.y = -0.3;

    this.scene.add(this.cube2);
  };

  const playSound = async () => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(sounds[word]);
      await soundObject.playAsync();
      // Your sound is playing!
    } catch (error) {
      // An error occurred!
      console.log("error", error);
    }
  };

  const up = () => {
    // this.text.position.z = -0.4;
    // this.scene.remove(this.text);
    this.cube.position.y = this.cube.position.y + 0.1;

    // this.scene.add(this.text);
  };

  const rayCaster = (newX, newY) => {
    //Check RayCaster Length
    var raycaster = new THREE.Raycaster(); // create once
    var mouse = new THREE.Vector2(
      (newX / width) * 2 - 1,
      -(newY / height) * 2 + 1
    ); // create once
    // var mouse = new THREE.Vector2(0, 0.99);

    this.x = mouse.x;
    this.y = mouse.y;

    console.log("---RAYCASTER---", raycaster);
    console.log("--MOUSE--", mouse);
    // (355/375 * -1)
    // this.mouse.x = (event.clientX / width) * 2 - 1;
    // this.mouse.y = -(event.clientY / height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    console.log("---this.text---", this.text);
    var intersects = raycaster.intersectObjects([this.cube]);
    // this.scene.remove(intersects);
    // console.log(
    //   "---INTERSECTS---",
    //   // intersects[0].object.getObjectByName("geometries")
    //   JSON.stringify(intersects, null, 2)
    // );
    if (intersects.length !== 0) {
      console.log(
        "---INTERSECTS---",
        intersects[0].object
        // intersects[0].object.geometries[0].parameters.depth
      );
      this.detect = true;
      intersects[0].object.material.color.set(0xffff00);

      // this.cube.position.x = 0.07;
    }
  };

  useEffect(() => {
    this.detected = false;
    this.onStopNativeX = null;
    this.onStopNativeY = null;
  }, []);

  const handleTouch = (newX, newY) => {
    this.onTouchNativeX = newX;
    this.onTouchNativeY = newY;
    var raycaster = new THREE.Raycaster(); // create once
    var mouse = new THREE.Vector2(
      (newX / width) * 2 - 1,
      -(newY / height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, this.camera);

    this.intersects = raycaster.intersectObjects(this.scene.children);

    if (this.intersects.length !== 0) {
      if (this.boi) {
        this.boi.material.color.set("red");
      }
      for (var i = 0; i < intersects.length; i++) {
        // intersects[i].object.material.color.set(0xff0000);
        this.intersects[i].object.material.color.set("green");
        this.boi = this.intersects[i].object;
      }
      // let gurl = { ...intersects[0].object };
      // console.log(
      //   "---INTERSECTS---",
      //   this.scene.children
      //   // gurl
      //   // intersects[0].object
      //   // intersects[0].object.geometries[0].parameters.depth
      // );

      this.detected = true;
      // this.boi = intersects[0].object;
      // intersects[0].object.material.color.set("green");
      // this.cube.position.x = 0.07;
    }
  };

  //if (this.onStopNativeX !== newX || this.onStopNativeY !== newY)

  const handleMove = (newX, newY, newDX, newDY) => {
    if (!this.onStopNativeX && !this.onStopNativeY) {
      this.onStopNativeX = newX;
      this.onStopNativeY = newY;
    } else if (
      Math.abs(this.onStopNativeX - newX) > 10 ||
      Math.abs(this.onStopNativeY - newY) > 10
    ) {
      this.onStopNativeX = newX;
      this.onStopNativeY = newY;
      console.log("----------------onMOVE-ELSEIF");
      console.log("this.onTouchNativeX", this.onTouchNativeX);
      console.log("this.onTouchNativeY", this.onTouchNativeY);
      console.log("this.onStopNativeY", this.onStopNativeY);
      console.log("this.onStopNativeY", this.onStopNativeY);
      console.log("newDX", newDX);
      console.log("newDY", newDY);
      console.log(
        "cube before",
        this.cube.position.x,
        " ",
        this.cube.position.y
      );

      this.boi.position.x += newDX * 0.000352778;
      this.boi.position.y -= newDY * 0.000352778;
      this.boi.material.color.set("green");
      console.log(
        "cube after",
        this.cube.position.x,
        " ",
        this.cube.position.y
      );
    } else {
      console.log("----------------onMOVE-ELSE");
      console.log("this.onTouchNativeX", this.onTouchNativeX);
      console.log("this.onTouchNativeY", this.onTouchNativeY);
      console.log("this.onStopNativeY", this.onStopNativeY);
      console.log("this.onStopNativeY", this.onStopNativeY);
      console.log("newDX", newDX);
      console.log("newDY", newDY);
      console.log(
        "cube before",
        this.cube.position.x,
        " ",
        this.cube.position.y
      );
    }
  };

  const handleRelease = (newX, newY, newDX, newDY) => {
    this.onStopNativeX = newX;
    this.onStopNativeY = newY;
    console.log("----------------onRELEASE");
    console.log("this.onTouchNativeX", this.onTouchNativeX);
    console.log("this.onTouchNativeY", this.onTouchNativeY);
    console.log("this.onStopNativeY", this.onStopNativeY);
    console.log("this.onStopNativeY", this.onStopNativeY);
    console.log("newDX", newDX);
    console.log("newDY", newDY);
    console.log("cube before", this.cube.position.x, " ", this.cube.position.y);

    // if (this.onTouchNativeX > this.onStopNativeX) {
    //   this.cube.position.x += -newDX * 0.000352778;
    // }
    // if (this.onTouchNativeY > this.onStopNativeY) {
    //   this.cube.position.y += -newDY * 0.000352778;
    // }

    // if (this.onTouchNativeX < this.onStopNativeX) {
    //   this.cube.position.x += newDX * 0.000352778;
    // }

    // if (this.onTouchNativeY < this.onStopNativeY) {
    //   this.cube.position.y += newDY * 0.000352778;
    // }

    this.boi.position.x += newDX * 0.000352778;
    this.boi.position.y -= newDY * 0.000352778;
    this.boi.material.color.set("yellow");
    console.log("cube after", this.cube.position.x, " ", this.cube.position.y);
  };

  this.panResponder = PanResponder.create({
    // Ask to be the responder:
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    // onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    // onMoveShouldSetPanResponder: (evt, gestureState) => true,
    // onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

    onPanResponderGrant: ({ nativeEvent }, gestureState) => {
      handleTouch(nativeEvent.locationX, nativeEvent.locationY);
      // ---------------------------------------
      // var oldLength = this.mouse.length();

      // if (oldLength !== 0) {
      //   vector.multiplyScalar(1 + len / oldLength);
      // }
      // console.log("------gestureState", gestureState);
      // console.log("------NativeEvent", nativeEvent);
      // rayCaster(nativeEvent.locationX, nativeEvent.locationY);
      // this.mouse.set(gestureState.x0, gestureState.y0);

      // var oldLength = this.mouse.length();
      //
      // console.log("length =------------------< ", oldLength);
      // this.mouse.x = gestureState.x0; //(gestureState.x0 / width) - 1;
      // this.mouse.y = 1; //(gestureState.y0 / height)  + 1;
      // console.log("this.mouse ====> ", this.mouse);

      // The gesture has started. Show visual feedback so the user knows
      // what is happening!
      // gestureState.d{x,y} will be set to zero now
    },
    onPanResponderMove: ({ nativeEvent }, gestureState) => {
      if (this.detected) {
        handleMove(
          nativeEvent.locationX,
          nativeEvent.locationY,
          gestureState.dx,
          gestureState.dy
        );
      }
      // this.cube.position.x += gestureState.dx;
      // this.cube.position.y += gestureState.dy;
      // rayCaster(gestureState.dx, gestureState.dy);
      // (newX+dx / width) * 2 - 1,
      // -(newY+dy / height) * 2 + 1
      // ----------------
      // console.log("--------------onMove-gestureState", gestureState);
      // console.log("--------------onMove-nativeEvent", nativeEvent);
      // this.cube.position.x = (this.x + gestureState.dx / width) * 2 - 1;
      // this.cube.position.y = -(this.y + gestureState.dy / height) * 2 + 1;
      // ------------------
      // The most recent move distance is gestureState.move{X,Y}
      // The accumulated gesture distance since becoming responder is
      // gestureState.d{x,y}
    },
    onPanResponderRelease: ({ nativeEvent }, gestureState) => {
      if (this.detected) {
        handleRelease(
          nativeEvent.locationX,
          nativeEvent.locationY,
          gestureState.dx,
          gestureState.dy
        );
        checkShape();
        // this.detected = false;
      }
      // ---------------------------------
      // console.log("hello from onPanResponderRelease");
      //------------------------------------------
      // console.log("--------------onRelease-gestureState", gestureState);
      // console.log("--------------onRelease-nativeEvent", nativeEvent);
      // this.cube.position.x += gestureState.dx * 0.000352778;
      // this.cube.position.y += gestureState.dy * 0.000352778;
      //------------------------------------------
      // this.x = this.cube.position.x;
      // this.cube.position.y = gestureState.dy;
      // The user has released all touches while this view is the
      // responder. This typically means a gesture has succeeded
    },
  });

  const handleStartGame = () => {
    const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: "blue",
    });
    this.cube1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
    const boi = { ...this.cube1 };
    console.log("this.cube => ", this.cube1);
    console.log("this.cube => ", boi.geometry);
    this.cube1.position.x = Math.random();
    this.cube1.position.y = Math.random();
    this.cube1.position.z = -0.4;
    this.scene.add(this.cube1);

    const sphereGeometry = new THREE.SphereGeometry(0.1, 0.1, 0.1);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: "orange",
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphere.position.x = Math.random();
    this.sphere.position.y = Math.random();
    this.sphere.position.z = -0.4;
    this.scene.add(this.sphere);

    const coneGeometry = new THREE.ConeGeometry(0.1, 0.1, 0.1);
    const coneMaterial = new THREE.MeshPhongMaterial({
      color: "blue",
    });
    this.cone = new THREE.Mesh(coneGeometry, coneMaterial);
    this.cone.position.x = Math.random();
    this.cone.position.y = Math.random();
    this.cone.position.z = -0.4;
    this.scene.add(this.cone);
  };

  const checkShape = () => {
    let boi = { ...this.cube };
    let gurl = { ...this.boi };

    // console.log(
    //   "--------x difference",
    //   Math.abs(boi.position.x - gurl.position.x)
    // );
    // console.log(
    //   "--------y difference",
    //   Math.abs(boi.position.y - gurl.position.y)
    // );
    if (
      Math.abs(boi.position.x - gurl.position.x) < 0.04 &&
      Math.abs(boi.position.y - gurl.position.y) < 0.04
    ) {
      if (boi.geometry.type === gurl.geometry.type) {
        // alert("You WIN!");
      }
      // alert("NOICE");
    }
  };

  const makeDice = async () => {
    if (this.dice) {
      this.scene.remove(this.dice);
    }
    var materials = [
      new THREE.MeshBasicMaterial({
        map: await ExpoTHREE.loadAsync(require("../assets/images/1.png")),
      }),
      new THREE.MeshBasicMaterial({
        map: await ExpoTHREE.loadAsync(require("../assets/images/2.png")),
      }),
      new THREE.MeshBasicMaterial({
        map: await ExpoTHREE.loadAsync(require("../assets/images/3.png")),
      }),
      new THREE.MeshBasicMaterial({
        map: await ExpoTHREE.loadAsync(require("../assets/images/4.png")),
      }),
      new THREE.MeshBasicMaterial({
        map: await ExpoTHREE.loadAsync(require("../assets/images/5.png")),
      }),
      new THREE.MeshBasicMaterial({
        map: await ExpoTHREE.loadAsync(require("../assets/images/6.png")),
      }),
    ];

    this.dice = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1, 1, 1, 1),
      materials
    );

    // console.log("------------------When created", this.dice);

    this.dice.position.z = -0.2;
    this.dice.position.x = -0.2;
    this.dice.position.y = -0.2;

    this.scene.add(this.dice);
    return this.dice;
  };

  const random = async () => {
    const dice = await makeDice();
    const sides = [
      { id: 1, x: 7, y: 7 },
      { id: 2, x: 5, y: 6 },
      { id: 3, x: 6, y: 6 },
      { id: 4, x: 5, y: 3 },
      { id: 5, x: 7, y: 8 },
      { id: 6, x: 7, y: 6 },
    ];

    const random = Math.floor(Math.random() * 6);
    console.log("random", random);

    let counter = 0;
    let counterX = 0;
    let counterY = 0;
    let turn = true; //true = x; false = y
    const id = setInterval(() => {
      if (counter === sides[random].x + sides[random].y) {
        rollDice(sides[random].id); //
        clearInterval(id);
      } else {
        console.log("---------this.cube", this.cube.position.x);
        if (turn && counterX !== sides[random].x) {
          setTimeout(() => {
            dice.rotateX(Math.PI / 4);
          }, 250);
          setTimeout(() => {
            dice.rotateX(Math.PI / 4);
          }, 500);
          turn = false;
          // console.log("======================================");
          // console.log("before X", counterX);
          counterX++;
          // console.log("after X", counterX);
        } else {
          if (counterY !== sides[random].y) {
            setTimeout(() => {
              dice.rotateY(Math.PI / 4);
            }, 250);
            setTimeout(() => {
              dice.rotateY(Math.PI / 4);
            }, 500);

            // console.log("======================================");
            // console.log("before Y", counterY);
            counterY++;
            // console.log("after Y", counterY);
          } else {
            setTimeout(() => {
              dice.rotateX(Math.PI / 4);
            }, 250);
            setTimeout(() => {
              dice.rotateX(Math.PI / 4);
            }, 500);
          }
          turn = true;
        }
        counter++;
      }
    }, 500);
    return sides[random].id;
  };

  const rollDice = async (steps) => {
    console.log("steps before ", steps);

    if (this.player1) {
      if (this.cube.position.x + steps * 0.1 >= 0.8) {
        this.cube.position.x = 0.8;
        alert("YOU WIN Player 1!");
      } else {
        let counter = 0;
        let id = setInterval(() => {
          if (counter === steps - 1) {
            clearInterval(id);
          }
          this.cube.position.x += 0.1;
          counter++;
        }, 1000);
      }
      this.player1 = false;
      // console.log("steps * 0.01 ", steps * 0.01);
      // this.cube.position.x += steps * 0.1;

      // if (steps !== 1) {
      //   steps -= 1;
      // }
      // console.log("steps after ", steps);
    } else {
      if (this.cube2.position.x + steps * 0.1 >= 0.8) {
        this.cube2.position.x = 0.8;
        alert("YOU WIN Player 2!");
      } else {
        let counter = 0;
        let id = setInterval(() => {
          if (counter === steps - 1) {
            clearInterval(id);
          }
          this.cube2.position.x += 0.1;
          counter++;
        }, 1000);
      }
      this.player1 = true;
    }
  };

  const rotateX = () => {
    this.dice.rotateX(Math.PI / 4);
  };

  const rotateY = () => {
    this.plane.rotateX(Math.PI / 4);
  };

  const rotateZ = () => {
    this.dice.rotateZ(0.5);
  };

  const diceInfo = async () => {
    // console.log("rotateX", this.dice.rotation.x);
    // console.log("rotateY", this.dice.rotation.y);

    // random = 0
    // roll = [{id:1, rotateX:4, rotateY:5},
    // {id:2, rotateX:7, rotateY:3},]
    const yo = { ...this.dice };
    console.log("----this.dice", yo);
  };

  // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
  // `isArRunningStateEnabled` Will show us the play/pause button in the corner.
  // `isArCameraStateEnabled` Will render the camera tracking information on the screen.
  // `arTrackingConfiguration` denotes which camera the AR Session will use.
  // World for rear, Face for front (iPhone X only)
  return !scanned ? (
    <Camera
      style={{ flex: 1 }}
      type={Camera.Constants.Type.back}
      ref={(ref) => {
        this.camera2 = ref;
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "50%",
        }}
      >
        {word && (
          <Text
            style={{
              position: "absolute",
              top: "20%",
              left: "20%",
              fontSize: 30,
              color: "white",
            }}
          >
            Keep Camera Still Scanning....
          </Text>
        )}
        <TouchableOpacity
          style={{
            // flex: 0.1,
            alignSelf: "flex-end",
            alignItems: "center",
          }}
          onPress={() => scan()}
        >
          {!word && (
            <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
              Scan Photo
            </Text>
          )}
          {notDetected && (
            <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
              Scan Again
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Camera>
  ) : (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} {...this.panResponder.panHandlers}>
        <GraphicsView
          style={{
            height: "100%",
            width: "100%",
            alignItems: "stretch",
            // position: "absolute",
            // zIndex: -1,
          }}
          onContextCreate={onContextCreate}
          onRender={onRender}
          onResize={onResize}
          isArEnabled
          // isArRunningStateEnabled
          isArCameraStateEnabled
          arTrackingConfiguration={"ARWorldTrackingConfiguration"}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          backgroundColor: "transparent",
          // flex: 1,
          position: "absolute",
          top: "95%",
          zIndex: 1,
        }}
      >
        <TouchableOpacity onPress={() => setScanned(false)}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Scan</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => handleStartGame()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Start Game
          </Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity onPress={() => text()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Text</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => dice()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Dice</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => translate()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Translate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => showDetails()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => playSound()}>
          <Icon name="ios-microphone" type="ionicon" size={30} color="white" />
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => addCube()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Cube</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => rayCaster()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            raycaster
          </Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => random()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Roll</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => rotateY()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            rotateY
          </Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => showDetails()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Details
          </Text>
        </TouchableOpacity>
        {/* 
        <TouchableOpacity onPress={() => rotateZ()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            rotateZ
          </Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity onPress={() => up()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Up</Text>
        </TouchableOpacity> */}

        {/* 
        <TouchableOpacity onPress={() => translate()}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>Translate</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>Text</Text>
        </TouchableOpacity> */}
        {/* <Button title="Text" onPress={() => text()} />
        <Button title="Translate" onPress={() => translate()} />
        <Button title="Model" onPress={() => getModels()} />
        <Button title="Scan Again" onPress={() => setScanned(false)} /> */}
        {/* <Picker
          selectedValue={language}
          style={{ height: 150, width: 150 }}
          onValueChange={(itemValue, itemIndex) => setLanguage(itemValue)}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="French" value="fr" />
        </Picker> */}
      </View>
    </View>
  );
}
