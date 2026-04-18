import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Host,
  VStack,
  HStack,
  Image,
  Text,
  Button,
  Spacer,
} from "@expo/ui/swift-ui";
import {
  padding,
  font,
  foregroundColor,
  buttonStyle,
  controlSize,
  frame,
  multilineTextAlignment,
} from "@expo/ui/swift-ui/modifiers";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: "Home" }} />
      <Host style={{ flex: 1 }}>
        <VStack
          spacing={12}
          modifiers={[
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            padding({
              top: insets.top + 32,
              bottom: insets.bottom + 100,
              horizontal: 32,
            }),
          ]}
        >
          <Spacer />
          <VStack spacing={12}>
            <HStack spacing={12}>
              <Image systemName="square.fill" size={40} />
              <Image systemName="circle.fill" size={40} />
            </HStack>
            <HStack spacing={12}>
              <Image systemName="diamond.fill" size={40} />
              <Image systemName="triangle.fill" size={40} />
            </HStack>
          </VStack>
          <Text
            modifiers={[
              font({ size: 34, weight: "bold" }),
              padding({ top: 24 }),
            ]}
          >
            A Basic Template
          </Text>
          <Text
            modifiers={[
              font({ size: 16 }),
              foregroundColor("#8e8e93"),
              multilineTextAlignment("center"),
            ]}
          >
            A lil template for quick starting projects for a basic mobile app.
          </Text>
          <HStack spacing={12} modifiers={[padding({ top: 16 })]}>
            <Button
              onPress={() => {}}
              modifiers={[
                buttonStyle("borderedProminent"),
                controlSize("large"),
              ]}
            >
              <Text modifiers={[frame({ maxWidth: Infinity })]}>Start</Text>
            </Button>
            <Button
              onPress={() => {}}
              modifiers={[buttonStyle("bordered"), controlSize("large")]}
            >
              <Text modifiers={[frame({ maxWidth: Infinity })]}>Docs</Text>
            </Button>
          </HStack>
          <Spacer />
        </VStack>
      </Host>
    </>
  );
}
