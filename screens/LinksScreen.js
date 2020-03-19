import { ScrollView, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { Asset } from "expo-asset";
import { AR } from "expo";
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { THREE } from "expo-three";
import * as ThreeAR from "expo-three-ar";
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from "expo-graphics";

export default function LinksScreen() {
  useEffect(() => {
    THREE.suppressExpoWarnings(true);

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
      height
    });

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

    const fontJSON = require("../node_modules/three/examples/fonts/helvetiker_regular.typeface.json");
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
    this.points = new ThreeAR.Points();
    // Add the points to our scene...
    this.scene.add(this.points);
  };

  const createText = text => {
    const geometry = new THREE.TextGeometry(text, {
      font: this.font,
      size: 0.1,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0.1,
      bevelSegments: 0
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
        width: 0.2
      },
      {
        name: "Mountain",
        file: require("../assets/images/mountains.jpg"),
        height: 0.2,
        width: 0.287
      }
    ];

    console.log("image array", a4Images);

    // loop through, load each imageonto device,
    // assign uri to new property localUri
    await Promise.all(
      a4Images.map(async image => {
        const asset = Asset.fromModule(image.file);
        await asset.downloadAsync();
        image.localUri = asset.localUri;
      })
    );

    console.log("array", a4Images);

    // loop through, create structure of all images to look for
    let detectionImages = {};
    a4Images.map(image => {
      detectionImages[image.name] = {
        uri: image.localUri,
        name: image.name,
        height: image.height,
        width: image.width
      };
    });

    console.log("detection ", detectionImages);

    const result = await AR.setDetectionImagesAsync(detectionImages);

    //setting up
    AR.onAnchorsDidUpdate(({ anchors, eventType }) => {
      console.log("inside  ", anchors);
      for (let anchor of anchors) {
        if (anchor.type === AR.AnchorTypes.Image) {
          const { identifier, image, transform } = anchor;
          console.log("image", image.name);
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
      this.points.update();
      // Finally render the scene with the AR Camera
      this.renderer.render(this.scene, this.camera);
    }
  };

  // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
  // `isArRunningStateEnabled` Will show us the play/pause button in the corner.
  // `isArCameraStateEnabled` Will render the camera tracking information on the screen.
  // `arTrackingConfiguration` denotes which camera the AR Session will use.
  // World for rear, Face for front (iPhone X only)
  return (
    <GraphicsView
      style={{ flex: 1 }}
      onContextCreate={onContextCreate}
      onRender={onRender}
      onResize={onResize}
      isArEnabled
      isArRunningStateEnabled
      isArCameraStateEnabled
      arTrackingConfiguration={"ARWorldTrackingConfiguration"}
    />
  );
}
