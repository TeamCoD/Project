import React from "react";
// import { ExpoConfigView } from "@expo/samples";
import { View, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}

SettingsScreen.navigationOptions = {
  title: "app.json"
};
