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

import ExpoTHREE, { THREE } from "expo-three";
import * as ThreeAR from "expo-three-ar";

import { View as GraphicsView } from "expo-graphics";
import HomeScreen from "./HomeScreen";

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
  useEffect(() => {
    THREE.suppressExpoWarnings(true);

    // ThreeAR.suppressWarnings();
    this.player1 = true;
    setUpImages();
  }, []);

  const onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    AR.setPlaneDetection(AR.PlaneDetectionTypes.Vertical);

    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });

    this.scene = new THREE.Scene();
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);

    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);

    const fontJSON = require("../node_modules/three/examples/fonts/gentilis_regular.typeface.json");
    this.font = new THREE.Font(fontJSON);

    this.scene.add(new THREE.AmbientLight(0xffffff));
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

    await Promise.all(
      a4Images.map(async (image) => {
        const asset = Asset.fromModule(image.file);
        await asset.downloadAsync();
        image.localUri = asset.localUri;
      })
    );

    let detectionImages = {};
    a4Images.map((image) => {
      detectionImages[image.name] = {
        uri: image.localUri,
        name: image.name,
        height: image.height,
        width: image.width,
      };
    });

    const result = await AR.setDetectionImagesAsync(detectionImages);

    AR.onAnchorsDidUpdate(({ anchors, eventType }) => {
      for (let anchor of anchors) {
        if (anchor.type === AR.AnchorTypes.Image) {
          const { identifier, image, transform } = anchor;

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

  const onResize = ({ x, y, scale, width, height }) => {
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  const onRender = () => {
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  const text = async () => {
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
  };

  const translate = async () => {
    if (this.text2) {
      this.scene.remove(this.text2);
    }

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
    this.scene.add(this.text2);
  };

  const scan = async () => {
    setNotDetected(false);

    let lists = await app.models.list();
    let listArray = Object.entries(lists);
    listArray = listArray.slice(0, 2);
    let modelNames = [];
    listArray.map((item) => {
      modelNames.push(item[1].name);
    });
    const uri = await capturePhoto();
    const base64 = await resize(uri);

    modelNames.forEach(async (modelName) => {
      const predict = await predictModel(base64, modelName);
      const result = 1 * predict.outputs[0].data.concepts[0].value;
      if (result > 0.9) {
        setWord(modelName);
        setScanned(true);
        return;
      }
    });
  };

  useEffect(() => {
    if (!scanned && word) {
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
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { height: 150, width: 150 } }],
      { compress: 0, base64: true }
    );
    return manipulatedImage.base64;
  };

  const predictModel = async (base64, modelName) => {
    const response = await app.models.predict({ id: modelName }, base64);
    return response;
  };

  const showDetails = async () => {
    const texture = await ExpoTHREE.loadAsync(
      require("../assets/images/track.png")
    );

    var material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.PlaneGeometry(2, 0.5);

    this.plane = new THREE.Mesh(geometry, material);
    this.plane.overdraw = true;

    this.plane.position.z = -0.4;
    this.plane.position.y = -0.4;
    this.plane.rotateX((Math.PI / 4) * 6);

    this.scene.add(this.plane);
  };

  const playSound = async () => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(sounds[word]);
      await soundObject.playAsync();
    } catch (error) {
      console.log("error", error);
    }
  };

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
        <TouchableOpacity onPress={() => dice()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Dice</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => translate()}>
            <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
              Translate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => playSound()}>
            <Icon name="ios-microphone" type="ionicon" size={30} color="white" />
          </TouchableOpacity> */}
        <TouchableOpacity onPress={() => showDetails()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Details
          </Text>
        </TouchableOpacity>

        {/* 
          <TouchableOpacity onPress={() => translate()}>
            <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>Translate</Text>
          </TouchableOpacity> */}

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
