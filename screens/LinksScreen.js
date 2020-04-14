import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  Picker,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { AR } from "expo";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Audio } from "expo-av";
import { Icon } from "react-native-elements";

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
    this.text.position.z = -0.4;
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
      require("../assets/images/Mouse.png")
    );
    // var texture = new THREE.TextureLoader().load(
    //   "https://miro.medium.com/max/10368/1*o8tTGo3vsocTKnCUyz0wHA.jpeg"
    // );

    // immediately use the texture for material creation
    var material = new THREE.MeshBasicMaterial({ map: texture });

    // const geometry = new THREE.PlaneGeometry(0.3, 0.3);
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
    this.plane.position.y = -0.2;

    // this.text.position.z = -0.5;

    this.scene.add(this.plane);
    // this.scene.add(this.text);
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

  const rayCaster = () => {
    var raycaster = new THREE.Raycaster(); // create once
    var mouse = new THREE.Vector2(); // create once

    console.log("---RAYCASTER---", raycaster);
    console.log("--MOUSE--", mouse);

    // mouse.x = 0;
    // mouse.y = 0;

    raycaster.setFromCamera(mouse, this.camera);

    console.log("---this.text---", this.text);
    var intersects = raycaster.intersectObjects([this.text]);
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
      intersects[0].object.material.color.set(0xffff00);
    }
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
    this.cube.position.z = -0.8;

    // Add the cube to the scene
    this.scene.add(this.cube);
  };

  const up = () => {
    // this.text.position.z = -0.4;
    // this.scene.remove(this.text);
    this.cube.position.y = this.cube.position.y + 0.1;

    // this.scene.add(this.text);
  };

  const rotate = () => {
    // this.cube.remove();
    this.cube.position.y = this.cube.position.y + 0.1;

    this.cube.rotateZ(2);
    this.cube.rotateY(2);
    this.cube.rotateX(2);
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

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "transparent",
          // flex: 1,
          position: "absolute",
          top: "95%",
          zIndex: 1,
        }}
      >
        <TouchableOpacity onPress={() => setScanned(false)}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Scan Again
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => text()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Text</Text>
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
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            addCube
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => rotate()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            rotate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => up()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Up</Text>
        </TouchableOpacity>

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
