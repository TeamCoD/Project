import React from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "react-navigation-stack";
import { createBottomTabNavigator } from "react-navigation-tabs";
import { Icon } from "react-native-elements";
import TabBarIcon from "../components/TabBarIcon";
import HomeScreen from "../screens/HomeScreen";
import LinksScreen from "../screens/LinksScreen";
import SettingsScreen from "../screens/SettingsScreen";
import BarCodeScreen from "../screens/BarCodeScreen";
import RacingScreen from "../screens/RacingScreen";
import MathScreen from "../screens/MathScreen";
import Colors from "../constants/Colors";
const config = Platform.select({
  web: { headerMode: "screen" },
  default: {},
});

const HomeStack = createStackNavigator(
  {
    Home: HomeScreen,
  },
  config
);

HomeStack.navigationOptions = {
  tabBarLabel: "Home",
  tabBarIcon: ({ focused }) => (
    <Icon
      name="home"
      type="antdesign"
      size={26}
      color={focused ? Colors.tabIconSelected : Colors.tabIconDefault}
    />
  ),
};

HomeStack.path = "";

const LinksStack = createStackNavigator(
  {
    Links: LinksScreen,
  },
  config
);

LinksStack.navigationOptions = {
  tabBarLabel: "Links",
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === "ios" ? "ios-link" : "md-link"}
    />
  ),
};

LinksStack.path = "";

const SettingsStack = createStackNavigator(
  {
    Settings: MathScreen,
  },
  config
);

SettingsStack.navigationOptions = {
  tabBarLabel: "Math",
  tabBarIcon: ({ focused }) => (
    <Icon
      name="calculator"
      type="antdesign"
      size={24}
      color={focused ? Colors.tabIconSelected : Colors.tabIconDefault}
    />
  ),
};

SettingsStack.path = "";

const BarCodeStack = createStackNavigator(
  {
    BarCode: BarCodeScreen,
  },
  config
);

BarCodeStack.navigationOptions = {
  tabBarLabel: "BarCode",
  tabBarIcon: ({ focused }) => (
    <Icon
      name="barcode"
      type="antdesign"
      size={24}
      color={focused ? Colors.tabIconSelected : Colors.tabIconDefault}
    />
  ),
};

BarCodeStack.path = "";

const RacingStack = createStackNavigator(
  {
    Racing: RacingScreen,
  },
  config
);

RacingStack.navigationOptions = {
  tabBarLabel: "Racing",
  tabBarIcon: ({ focused }) => (
    <Icon
      name="car-sports"
      type="material-community"
      size={30}
      color={focused ? Colors.tabIconSelected : Colors.tabIconDefault}
    />
  ),
};

RacingStack.path = "";

const tabNavigator = createBottomTabNavigator({
  HomeStack,
  SettingsStack,
  RacingStack,
  LinksStack,
  BarCodeStack,
});

tabNavigator.path = "";

export default tabNavigator;
