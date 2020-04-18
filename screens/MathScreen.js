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

import ExpoTHREE, { THREE } from "expo-three";
import * as ThreeAR from "expo-three-ar";

import { View as GraphicsView } from "expo-graphics";

const { width, height } = Dimensions.get("window");
import Clarifai from "clarifai";

const app = new Clarifai.App({
  apiKey: "53f2015ac28941f391f9acf6116309f6",
});
process.nextTick = setImmediate;

export default function MathScreen() {
  const [scanned, setScanned] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [word, setWord] = useState(null);
  const [notDetected, setNotDetected] = useState(null);

  const sounds = {
    Mouse: require("../assets/sound/Mouse.mp3"),
    Pen: require("../assets/sound/pen.mp3"),
  };

  useEffect(() => {
    THREE.suppressExpoWarnings(true);
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
      font: this.font,
      size: 0.1,
      height: 0.005,
      curveSegments: 12,
      bevelEnabled: false,
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

  const questions = [
    {
      id: "2",
      question: require("../assets/images/question1.png"),
      answer: require("../assets/images/answer1.png"),
    },
    {
      id: "5",
      question: require("../assets/images/question2.png"),
      answer: require("../assets/images/answer2.png"),
    },
    {
      id: "3",
      question: require("../assets/images/question3.png"),
      answer: require("../assets/images/answer3.png"),
    },
    {
      id: "1",
      question: require("../assets/images/question4.png"),
      answer: require("../assets/images/answer4.png"),
    },
  ];

  const createAnswers = () => {
    let answers = [
      { id: "1", x: -0.3, y: 0.2 },
      { id: "2", x: 0, y: 0.3 },
      { id: "3", x: 0.3, y: 0.2 },
      { id: "4", x: -0.2, y: -0.2 },
      { id: "5", x: 0.2, y: -0.2 },
    ];

    answers.forEach((ans) => {
      let answer = createText(ans.id);
      answer.position.z = -0.4;
      answer.position.x = ans.x;
      answer.position.y = ans.y;
      answer["textboi"] = ans.id;
      this.scene.add(answer);
    });
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

  const rayCaster = (newX, newY) => {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(
      (newX / width) * 2 - 1,
      -(newY / height) * 2 + 1
    );

    this.x = mouse.x;
    this.y = mouse.y;

    raycaster.setFromCamera(mouse, this.camera);

    var intersects = raycaster.intersectObjects([this.cube]);

    if (intersects.length !== 0) {
      this.detect = true;
      intersects[0].object.material.color.set(0xffff00);
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
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(
      (newX / width) * 2 - 1,
      -(newY / height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, this.camera);

    this.intersects = raycaster.intersectObjects(this.scene.children);

    if (this.intersects.length !== 0) {
      if (this.selected) {
        this.selected.material.color.set("red");
      }
      for (var i = 0; i < intersects.length; i++) {
        if (this.intersects[i].object !== this.question) {
          this.intersects[i].object.material.color.set("green");
          this.selected = this.intersects[i].object;

          this.detected = true;
        } else {
          this.detected = false;
        }
      }
    }
  };

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

      this.selected.position.x += newDX * 0.000352778;
      this.selected.position.y -= newDY * 0.000352778;
      this.selected.material.color.set("green");
    }
  };

  const handleRelease = (newX, newY, newDX, newDY) => {
    this.onStopNativeX = newX;
    this.onStopNativeY = newY;

    this.selected.position.x += newDX * 0.000352778;
    this.selected.position.y -= newDY * 0.000352778;
    this.selected.material.color.set("yellow");
  };

  this.panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,

    onPanResponderGrant: ({ nativeEvent }, gestureState) => {
      handleTouch(nativeEvent.locationX, nativeEvent.locationY);
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
    },
    onPanResponderRelease: ({ nativeEvent }, gestureState) => {
      if (this.detected) {
        handleRelease(
          nativeEvent.locationX,
          nativeEvent.locationY,
          gestureState.dx,
          gestureState.dy
        );
        checkSum();
      }
    },
  });

  const createQuestion = async () => {
    if (this.question) {
      this.scene.remove(this.question);
    }
    this.random = Math.floor(Math.random() * 4);
    const texture = await ExpoTHREE.loadAsync(questions[this.random].question);

    var material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.PlaneGeometry(0.3, 0.15);

    this.question = new THREE.Mesh(geometry, material);

    this.question.position.z = -0.4;
    this.question.position.x = 0.05;
    this.question.position.y = 0.1;

    this.scene.add(this.question);
  };

  const putAnswer = async () => {
    this.scene.remove(this.selected);
    const texture = await ExpoTHREE.loadAsync(questions[this.random].answer);

    var material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.PlaneGeometry(0.3, 0.15);

    this.question = new THREE.Mesh(geometry, material);

    this.question.position.z = -0.4;
    this.question.position.x = 0.05;
    this.question.position.y = 0.1;

    this.scene.add(this.question);
  };

  const reset = () => {
    deleteAll();
    startGame();
  };

  const resetAnswers = async () => {
    deleteAll();

    const texture = await ExpoTHREE.loadAsync(questions[this.random].question);

    var material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.PlaneGeometry(0.3, 0.15);

    this.question = new THREE.Mesh(geometry, material);

    this.question.position.z = -0.4;
    this.question.position.x = 0.05;
    this.question.position.y = 0.1;

    this.scene.add(this.question);

    createAnswers();
  };

  const deleteAll = () => {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.detected = false;
  };

  const checkSum = async () => {
    const question = { ...this.question };
    const selected = { ...this.selected };

    if (
      Math.abs(question.position.x - selected.position.x) < 0.15 &&
      Math.abs(question.position.y - selected.position.y) < 0.075
    ) {
      if (selected.textboi === questions[this.random].id) {
        deleteAll();
        putAnswer();
        const soundObject = new Audio.Sound();
        try {
          await soundObject.loadAsync(require("../assets/sound/victory.mp3"));
          await soundObject.playAsync();
        } catch (error) {
          console.log("error", error);
        }
      } else {
        resetAnswers();
        const soundObject = new Audio.Sound();
        try {
          await soundObject.loadAsync(require("../assets/sound/lost.mp3"));
          await soundObject.playAsync();
        } catch (error) {
          console.log("error", error);
        }
      }
    }
  };

  const startGame = () => {
    createQuestion();
    createAnswers();
  };

  return (
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
        <TouchableOpacity onPress={() => startGame()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Start Game
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => reset()}>
          <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
