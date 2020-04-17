import {
  View,
  Text,
  TouchableOpacity,
  Picker,
  ImageBackground,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";

import React, { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { AR } from "expo";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Audio } from "expo-av";
import { Icon, Button } from "react-native-elements";

import ExpoTHREE, { THREE } from "expo-three";
import * as ThreeAR from "expo-three-ar";

import { View as GraphicsView } from "expo-graphics";
import ReactNativePickerModule from "react-native-picker-module";
import Clarifai from "clarifai";
console.disableYellowBox = true;
const app = new Clarifai.App({
  apiKey: "53f2015ac28941f391f9acf6116309f6",
});
process.nextTick = setImmediate;

export default function HomeScreen() {
  let pickerRef = null;

  const sounds = {
    fr: require("../assets/sound/Mouse.mp3"),
    en: require("../assets/sound/mouseEn.mp3"),
  };
  useEffect(() => {
    THREE.suppressExpoWarnings(true);

    // ThreeAR.suppressWarnings();
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

    // createGroupImage();
    createMouseImage();
  };

  const createText = (text) => {
    const geometry = new THREE.TextGeometry(text, {
      font: this.font,
      size: 0.04,
      height: 0.005,
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

  const createGroupImage = async () => {
    const texture = await ExpoTHREE.loadAsync(
      require("../assets/images/background2.png")
    );

    var material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(0.2, 0.4);

    this.group = new THREE.Mesh(geometry, material);
    this.group.position.z = -0.4;

    this.scene.add(this.group);
  };

  const createMouseImage = async () => {
    const texture = await ExpoTHREE.loadAsync(
      require("../assets/images/Mouse.png")
    );

    var material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(0.3, 0.4);

    this.mouseImage = new THREE.Mesh(geometry, material);
    this.mouseImage.position.z = -0.4;
    this.mouseImage.position.x = 0.1;
    this.mouseImage.position.y = 0.2;

    this.scene.add(this.mouseImage);
  };

  const text = async () => {
    console.log("WE IN TEXT", word);
    this.text = createText(word);
    this.text.position.z = -0.4;
    // this.text.position.x = 0.8;
    this.text.position.y = -0.1;

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

  const playSound = async () => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(sounds[language]);
      await soundObject.playAsync();
    } catch (error) {
      console.log("error", error);
    }
  };

  const scan = async () => {
    setNotDetected(false);
    console.log("Scanning");
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
      console.log("result", result);
      if (result > 0.9) {
        setWord(modelName);
        setScanned(true);
        return;
      }
    });
  };

  const [scanned, setScanned] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [word, setWord] = useState(null);
  const [camera, setCamera] = useState(null);
  const [notDetected, setNotDetected] = useState(null);

  useEffect(() => {
    if (scanned && word !== null) {
      setTimeout(() => {
        text();
      }, 2000);
    }
  }, [scanned, word]);

  useEffect(() => {
    if (!scanned) {
      console.log("useEffect scan");
      scan();
      // text();
      setTimeout(() => {
        setNotDetected(true);
      }, 5000);
    }
  }, [scanned]);
  const [home, setHome] = useState(true);

  return home ? (
    <ImageBackground
      source={require("../assets/images/background2.png")}
      style={{ flex: 1, alignItems: "center" }}
    >
      <View style={{ top: "60%" }}>
        <Button title="Enter" onPress={() => setHome(false)} />
      </View>
    </ImageBackground>
  ) : scanned ? (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
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
          // flexWrap: "wrap",
          backgroundColor: "transparent",
          position: "absolute",
          top: "95%",
          zIndex: 1,
        }}
      >
        <TouchableOpacity onPress={() => setScanned(false)}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>Scan</Text>
        </TouchableOpacity>

        {word && (
          <TouchableOpacity onPress={() => translate()}>
            <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
              Translate
            </Text>
          </TouchableOpacity>
        )}

        {word && (
          <TouchableOpacity
            onPress={() => playSound()}
            style={{ marginLeft: 15, marginRight: 15 }}
          >
            <Icon
              name="ios-microphone"
              type="ionicon"
              size={30}
              color="white"
            />
          </TouchableOpacity>
        )}

        {word && (
          <TouchableOpacity
            onPress={() => {
              pickerRef.show();
            }}
          >
            <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
              {language ? `Selected ${language} ▼` : "Show Language Picker ▼"}
            </Text>
          </TouchableOpacity>
        )}
        <ReactNativePickerModule
          pickerRef={(e) => (pickerRef = e)}
          selectedValue={language}
          title={"Select a language"}
          items={["fr", "en"]}
          onValueChange={(valueText, index) => {
            setLanguage(valueText);
          }}
        />

        {/* <Picker
          selectedValue={language}
          style={{ height: 300, width: 150 }}
          onValueChange={(itemValue, itemIndex) => setLanguage(itemValue)}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="French" value="fr" />
        </Picker> */}
      </View>
    </View>
  ) : (
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

        {notDetected && (
          <TouchableOpacity
            style={{
              // flex: 0.1,
              alignSelf: "flex-end",
              alignItems: "center",
            }}
            onPress={() => scan()}
          >
            <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
              Scan Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Camera>
  );
}
