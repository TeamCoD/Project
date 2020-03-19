import * as WebBrowser from "expo-web-browser";
import React, { useState, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Button
} from "react-native";

import { Camera } from "expo-camera";
import * as Permissions from "expo-permissions";
import * as FaceDetector from "expo-face-detector";
import * as ImageManipulator from "expo-image-manipulator";

import Auth from "../auth";

// import Clarifai from "clarifai";
// const app = new Clarifai.App({
//   apiKey: "53f2015ac28941f391f9acf6116309f6"
// });
// process.nextTick = setImmediate;

// const makeInput = async () => {
//   const response = await app.inputs.create({
//     url:
//       "https://www.gettyimages.pt/gi-resources/images/Homepage/Hero/PT/PT_hero_42_153645159.jpg",
//     concepts: [
//       {
//         id: "boscoe",
//         value: true
//       }
//     ]
//   });
//   console.log("response ", response);
// };

// //testing();

// const makeModel = async () => {
//   const response = await app.models.create("pets", [{ id: "hello" }]);
//   console.log("model res", response);
// };

// const trainModel = async () => {
//   const response = await app.models.train("pets");
//   console.log(response);
// };

// const predictModel = async () => {
//   const response = app.models.predict(
//     { id: "pets", version: "ba69c6f83e5e4fc49ea469ca122e5858" },
//     "https://cdn.eso.org/images/large/eso1436a.jpg"
//   );
//   console.log("predict res ", response);
// };

// predictModel();
// trainModel();
// makeModel();
import Clarifai from "clarifai";

const app = new Clarifai.App({
  apiKey: "53f2015ac28941f391f9acf6116309f6"
});
process.nextTick = setImmediate;

export default function HomeScreen({ setAllowedIn }) {
  console.log("setAllowed ", setAllowedIn);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  const permission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    setHasCameraPermission(status === "granted");
  };

  useEffect(() => {
    permission();
  }, []);

  const capturePhoto = async () => {
    if (this.camera) {
      const photo = await this.camera.takePictureAsync();
      return photo.uri;
    }
  };

  const resize = async photo => {
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      photo,
      [{ resize: { height: 300, width: 300 } }],
      { base64: true }
    );
    return manipulatedImage.base64;
  };

  const objectDetection = async () => {
    let photo = await capturePhoto();
    let resized = await resize(photo);
    let predictions = await predict(resized);
    console.log(predictions);
    //this.setState({ predictions: predictions.outputs[0].data.concepts });
  };

  const predict = async image => {
    let predictions = await app.models.predict(
      Clarifai.GENERAL_MODEL, // model need to get prediction from
      image
    );
    //console.log(predictions);
    return predictions;
  };

  const handleDeleteThings = async () => {
    // const response1 = await app.models.delete("faces1");
    // console.log("model deleted ", response1);
    // const response2 = await app.inputs.delete();
    // console.log("inputs deleted ", response2);
    Auth.setAllowedIn(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* <Camera
        ref={ref => {
          this.camera = ref;
        }}
        style={{ flex: 1 }}
        type={Camera.Constants.Type.front}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "transparent",
            flexDirection: "column",
            justifyContent: "flex-end"
          }}
        >
          <TouchableOpacity
            style={{
              flex: 0.1,
              alignItems: "center",
              backgroundColor: "black",
              height: "10%"
            }}
            onPress={takePicture}
          >
            <Text style={{ fontSize: 30, color: "white", padding: 15 }}>
              Capture Image
            </Text>
          </TouchableOpacity>
        </View>
      </Camera> */}
      <Text>HomeScreen</Text>
      <Button title="SIGN OUT" onPress={handleDeleteThings} />
    </View>
  );
}

const takePicture = () => {
  alert("hello");
};

HomeScreen.navigationOptions = {
  header: null
};

function DevelopmentModeNotice() {
  if (__DEV__) {
    const learnMoreButton = (
      <Text onPress={handleLearnMorePress} style={styles.helpLinkText}>
        Learn more
      </Text>
    );

    return (
      <Text style={styles.developmentModeText}>
        Development mode is enabled: your app will be slower but you can use
        useful development tools. {learnMoreButton}
      </Text>
    );
  } else {
    return (
      <Text style={styles.developmentModeText}>
        You are not in development mode: your app will run at full speed.
      </Text>
    );
  }
}

function handleLearnMorePress() {
  WebBrowser.openBrowserAsync(
    "https://docs.expo.io/versions/latest/workflow/development-mode/"
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    "https://docs.expo.io/versions/latest/workflow/up-and-running/#cant-see-your-changes"
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  developmentModeText: {
    marginBottom: 20,
    color: "rgba(0,0,0,0.4)",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center"
  },
  contentContainer: {
    paddingTop: 30
  },
  welcomeContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: "contain",
    marginTop: 3,
    marginLeft: -10
  },
  getStartedContainer: {
    alignItems: "center",
    marginHorizontal: 50
  },
  homeScreenFilename: {
    marginVertical: 7
  },
  codeHighlightText: {
    color: "rgba(96,100,109, 0.8)"
  },
  codeHighlightContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 3,
    paddingHorizontal: 4
  },
  getStartedText: {
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    lineHeight: 24,
    textAlign: "center"
  },
  tabBarInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3
      },
      android: {
        elevation: 20
      }
    }),
    alignItems: "center",
    backgroundColor: "#fbfbfb",
    paddingVertical: 20
  },
  tabBarInfoText: {
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    textAlign: "center"
  },
  navigationFilename: {
    marginTop: 5
  },
  helpContainer: {
    marginTop: 15,
    alignItems: "center"
  },
  helpLink: {
    paddingVertical: 15
  },
  helpLinkText: {
    fontSize: 14,
    color: "#2e78b7"
  }
});
