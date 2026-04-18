import { styled } from "react-native-css";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
} from "react-native";
import { Link as ExpoLink } from "expo-router";

export const View = styled(RNView, { className: "style" });

export const Text = styled(RNText, { className: "style" });

export const Pressable = styled(RNPressable, { className: "style" });

export const ScrollView = styled(RNScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

export const Link = styled(ExpoLink as never, { className: "style" });
