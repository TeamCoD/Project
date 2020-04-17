import { AppLoading } from "expo";
import { Asset } from "expo-asset";
import * as Font from "expo-font";
import React, { useState, useEffect } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import * as Permissions from "expo-permissions";
import * as FaceDetector from "expo-face-detector";
import * as ImageManipulator from "expo-image-manipulator";
import AppNavigator from "./navigation/AppNavigator";
import Clarifai from "clarifai";

const app = new Clarifai.App({
  apiKey: "53f2015ac28941f391f9acf6116309f6",
});
process.nextTick = setImmediate;

import Auth from "./auth";

//adding the inputs
const makeInput = async (base64) => {
  //create a new array based on inputs to use below
  const response = await app.inputs.create({
    base64,
    concepts: [{ id: "Mouse" }],
  });
  console.log("response ", response);
  return response;
};

//testing();

const makeModel = async () => {
  const response = await app.models.create("Mouse", [{ id: "Mouse" }]);
  console.log("model res", response);
  return response;
};

const trainModel = async () => {
  const response = await app.models.train("Mouse");
  console.log(response);
  return response;
};

const predictModel = async (base64) => {
  // let lists = await app.models.list();
  // let listArray = Object.entries(lists);
  // listArray = listArray.slice(0, 2);
  // let modelNames = [];
  // listArray.map((item) => {
  //   modelNames.push(item[1].name);
  // });

  // modelNames.map((item) => {

  // });

  const response = app.models.predict({ id: "Mouse" }, base64);
  console.log("predict res ", response);
  return response;
};

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [allowedIn, setAllowedIn] = useState(false);
  Auth.init(setAllowedIn);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [FACES, setFACES] = useState(false); // the model
  const [numInputs, setNumInputs] = useState(0); //number of inputs
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const permission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    setHasCameraPermission(status === "granted");
  };

  useEffect(() => {
    permission();
  }, []);

  //let FACES = null;
  const findModel = async () => {
    try {
      setFACES(await app.models.get("Mouse"));
    } catch (error) {
      setFACES(null);
      console.log("faces model ", FACES);
    }
    //setHaveModel(true);
  };

  useEffect(() => {
    findModel();
  }, []);

  const handleFacesDetected = async ({ faces }) => {
    //alert("hello");
    setUploadInProgress(true);
    if (FACES) {
      console.log("faces model already exists");
      const uri = await capturePhoto();
      const base64 = await resize(uri);
      const predict = await predictModel(base64);
      const result = 1 * predict.outputs[0].data.concepts[0].value;
      console.log(
        "prediction result ",
        predict.outputs[0].data.concepts[0].value
      );
      if (result > 0.9) {
        setAllowedIn(true);
      }
      //then set isAllowed or not
    } else {
      console.log("no model");
      if (numInputs >= 10) {
        const modelResponse = await makeModel();
        const trainResponse = await trainModel();
        const findModelResponse = await findModel();
        console.log("Finished making, training, finding model");
      } else {
        const uri = await capturePhoto();
        const base64 = await resize(uri);
        console.log("txt", base64.length);
        const inputResponse = await makeInput(base64);
        setNumInputs(numInputs + 1);
        console.log("number of inputs", numInputs);
      }
    }
    setUploadInProgress(false);
  };

  const capturePhoto = async () => {
    if (this.camera) {
      const photo = await this.camera.takePictureAsync();
      console.log("photo", photo.uri);
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
    console.log("exiting resize");
    return manipulatedImage.base64;
  };

  if (FACES === false || (!isLoadingComplete && !props.skipLoadingScreen)) {
    return (
      <AppLoading
        startAsync={loadResourcesAsync}
        onError={handleLoadingError}
        onFinish={() => handleFinishLoading(setLoadingComplete)}
      />
    );
  } else if (allowedIn) {
    //use camera, show the pic to the user
    //include a "Take Photo" button.
    //keep track of how many, after 10, train the model
    return (
      <Camera
        style={{ flex: 1 }}
        type={Camera.Constants.Type.back}
        ref={(ref) => {
          this.camera = ref;
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
          <TouchableOpacity
            style={{
              // flex: 0.1,
              alignSelf: "flex-end",
              alignItems: "center",
            }}
            onPress={handleFacesDetected}
          >
            <Text style={{ fontSize: 18, marginBottom: 10, color: "white" }}>
              {FACES ? "Recognize me" : `Take Photo ${numInputs + 1}`}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    );
  } else {
    return (
      <View style={styles.container}>
        {Platform.OS === "ios" && <StatusBar barStyle="default" />}
        <AppNavigator setAllowedIn={setAllowedIn} />
      </View>
    );
  }
}

async function loadResourcesAsync() {
  await Promise.all([
    // Asset.loadAsync([
    //   require("./assets/images/robot-dev.png"),
    //   require("./assets/images/robot-prod.png"),
    // ]),
    // Font.loadAsync({
    //   // This is the font that we are using for our tab bar
    //   ...Ionicons.font,
    //   // We include SpaceMono because we use it in HomeScreen.js. Feel free to
    //   // remove this if you are not using it in your app
    //   "space-mono": require("./assets/fonts/SpaceMono-Regular.ttf"),
    // }),
  ]);
}

function handleLoadingError(error) {
  // In this case, you might want to report the error to your error reporting
  // service, for example Sentry
  console.warn(error);
}

function handleFinishLoading(setLoadingComplete) {
  setLoadingComplete(true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
