import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import {
  Box,
  Palette,
  Type,
  MousePointerClick,
  Layout,
  Bell,
} from "lucide-react-native";
import { View } from "@/tw";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SECTIONS = [
  {
    icon: Box,
    title: "Components",
    description: "30+ pre-installed reusables — cards, dialogs, sheets.",
    tag: "UI",
  },
  {
    icon: Type,
    title: "Typography",
    description: "System font scale with h1–h4, body, and muted styles.",
    tag: "Text",
  },
  {
    icon: Palette,
    title: "Theme tokens",
    description: "Semantic colors that flip automatically with dark mode.",
    tag: "Design",
  },
  {
    icon: Layout,
    title: "Layout",
    description: "Native tabs, stack, safe areas, and toolbars built in.",
    tag: "Nav",
  },
  {
    icon: MousePointerClick,
    title: "Interactions",
    description: "Haptic-ready pressables and spring animations.",
    tag: "Motion",
  },
  {
    icon: Bell,
    title: "System",
    description: "Notifications, portal, and gesture handler wired up.",
    tag: "Native",
  },
];

export default function ExploreScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Browse" }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="gap-5 px-5 pt-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold tracking-tight text-foreground">
              Browse
            </Text>
            <Text className="text-base text-muted-foreground">
              A quick tour of everything that ships with the template.
            </Text>
          </View>

          <View className="gap-3">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title}>
                  <CardHeader className="flex-row items-start gap-4">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <Icon size={22} className="text-foreground" />
                    </View>
                    <View className="flex-1 gap-1.5">
                      <View className="flex-row items-center gap-2">
                        <CardTitle>{section.title}</CardTitle>
                        <Badge variant="outline">
                          <Text>{section.tag}</Text>
                        </Badge>
                      </View>
                      <CardDescription>{section.description}</CardDescription>
                    </View>
                  </CardHeader>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
