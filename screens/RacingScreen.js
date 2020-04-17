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

export default function RacingScreen() {
  const [far, setFar] = useState(5 * -0.1);
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
    this.scene.add(new THREE.AmbientLight(0xffffff));
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

  const addTrack = async () => {
    const texture = await ExpoTHREE.loadAsync(
      require("../assets/images/track.png")
    );

    var material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.PlaneGeometry(2, 0.5);

    this.track = new THREE.Mesh(geometry, material);
    this.track.overdraw = true;

    this.track.position.z = far + -0.4;
    this.track.position.y = -0.4;
    this.track.rotateX((Math.PI / 4) * 6);

    this.scene.add(this.track);
  };

  const addPlayers = () => {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    const material = new THREE.MeshPhongMaterial({
      color: "red",
    });

    this.cube = new THREE.Mesh(geometry, material);

    this.cube.position.z = far + -0.25;
    this.cube.position.x = -0.85;
    this.cube.position.y = -0.3;

    this.scene.add(this.cube);

    const geometry1 = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    const material1 = new THREE.MeshPhongMaterial({
      color: "blue",
    });

    this.cube2 = new THREE.Mesh(geometry1, material1);

    this.cube2.position.z = far + -0.45;
    this.cube2.position.x = -0.85;
    this.cube2.position.y = -0.3;

    this.scene.add(this.cube2);
  };

  const startGame = () => {
    addTrack();
    addPlayers();
    makeDice();
    setStarted(true);
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

    this.dice.position.z = far + -0.05;
    // this.dice.position.x = -0.2;
    this.dice.position.y = -0.4;

    this.scene.add(this.dice);
    return this.dice;
  };

  const roll = async () => {
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
    let turn = true;
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

          counterX++;
        } else {
          if (counterY !== sides[random].y) {
            setTimeout(() => {
              dice.rotateY(Math.PI / 4);
            }, 250);
            setTimeout(() => {
              dice.rotateY(Math.PI / 4);
            }, 500);

            counterY++;
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

  const [started, setStarted] = useState(false);

  useEffect(() => {
    this.player1 = true;
  }, []);

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

  const reset = () => {
    this.scene.remove(this.cube);
    this.scene.remove(this.cube2);
    this.scene.remove(this.track);
    this.scene.remove(this.dice);
    startGame();
  };

  return (
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
          flexWrap: "wrap",
          backgroundColor: "transparent",
          // flex: 1,
          position: "absolute",
          top: "95%",
          zIndex: 1,
          alignItems: "center",
        }}
      >
        {!started && (
          <TouchableOpacity onPress={() => startGame()}>
            <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
              Start Game
            </Text>
          </TouchableOpacity>
        )}

        {started && (
          <TouchableOpacity onPress={() => roll()}>
            <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
              Roll
            </Text>
          </TouchableOpacity>
        )}

        {started && (
          <TouchableOpacity onPress={() => reset()}>
            <Text style={{ fontSize: 18, margin: 10, color: "white" }}>
              Reset
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
