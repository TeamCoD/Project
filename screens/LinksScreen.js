import React, { useState, useEffect } from "react";
import { Asset } from "expo-asset";
import { AR } from "expo";
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { THREE } from "expo-three";
import * as ThreeAR from "expo-three-ar";
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from "expo-graphics";
import { StyleSheet } from "react-native";

export default function LinksScreen() {
  const font = new THREE.Font(
    require("../node_modules/three/examples/fonts/helvetiker_regular.typeface.json")
  );
  const scene = new THREE.Scene();
  const a4Images = [
    {
      name: "Plane",
      file: require("../assets/images/plane.png"),
      height: 0.287,
      width: 0.2,
    },
    {
      name: "Mountains",
      file: require("../assets/images/mountains.jpg"),
      height: 0.2,
      width: 0.287,
    },
  ];

  const [ready, setReady] = useState(false);
  //const [detectionImages, setDetectionImages] = useState({})

  useEffect(() => {
    THREE.suppressExpoWarnings(true);
    setup();
  }, []);

  const setup = async () => {
    console.log(1);
    // loop through, load each image onto device, assign uri to new property localUri
    for (const image of a4Images) {
      const asset = Asset.fromModule(image.file);
      await asset.downloadAsync();
      image.localUri = asset.localUri;
    }
    console.log(2);

    // loop through, create structure of all images to look for
    this.detectionImages = {};
    for (const image of a4Images) {
      this.detectionImages[image.name] = {
        uri: image.localUri,
        name: image.name,
        height: image.height,
        width: image.width,
      };
    }

    console.log(3, this.detectionImages);
    setReady(true);
  };

  // When our context is built we can start coding 3D things.
  const onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    console.log("onContextCreate", ready);
    // This will allow ARKit to collect Horizontal surfaces
    AR.setPlaneDetection(AR.PlaneDetectionTypes.Horizontal);

    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });

    // This will create a camera texture and use it as the background for our scene
    scene.background = new ThreeAR.BackgroundTexture(this.renderer);
    // Now we make a camera that matches the device orientation.
    // Ex: When we look down this camera will rotate to look down too!
    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);

    scene.add(new THREE.AmbientLight(0xffffff));

    // setting the image(s) to look for
    const result = await AR.setDetectionImagesAsync(this.detectionImages);
    console.log(4, this.detectionImages);

    // setting up a listener once image is recognized
    AR.onAnchorsDidUpdate(({ anchors, eventType }) => {
      for (let anchor of anchors) {
        if (anchor.type === AR.AnchorTypes.Image) {
          const { identifier, image, transform } = anchor;
          console.log("image", image.name);
          console.log("transform", transform);
          console.log("eventType", eventType);
          // first event will be Add, subsequent will be updates
          if (eventType === AR.AnchorEventTypes.Add) {
            // Add some node
            // Place the box 0.4 meters in front of us.
            const label = createLabel(image.name);
            label.position.x = transform[12];
            label.position.y = transform[13];
            label.position.z = transform[14];
            // Add the cube to the scene
            scene.add(label);
          } else if (eventType === AR.AnchorEventTypes.Remove) {
            // Remove that node
          } else if (eventType === AR.AnchorEventTypes.Update) {
            // Update whatever node
          }
        }
      }
    });
  };

  const createLabel = (text) => {
    const geometry = new THREE.TextGeometry(text, {
      font,
      size: 0.1,
      height: 0.01,
    });

    // Simple color material
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
    });

    // Combine our geometry and material
    const shape = new THREE.Mesh(geometry, material);
    shape.scale.x = shape.scale.y = shape.scale.z = 1;
    return shape;
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
    if (this.camera) {
      // This will make the points get more rawDataPoints from Expo.AR
      // this.points.update();
      // Finally render the scene with the AR Camera
      this.renderer.render(scene, this.camera);
    }
  };

  // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
  // `isArRunningStateEnabled` Will show us the play/pause button in the corner.
  // `isArCameraStateEnabled` Will render the camera tracking information on the screen.
  // `arTrackingConfiguration` denotes which camera the AR Session will use.
  // World for rear, Face for front (iPhone X only)
  if (ready) {
    console.log("ready");
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
  } else {
    console.log("not ready");
    return null;
  }
}

LinksScreen.navigationOptions = {
  title: "Links",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: "#fff",
  },
});
