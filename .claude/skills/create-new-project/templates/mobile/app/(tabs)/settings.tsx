import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { View, Pressable } from "@/tw";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Row = {
  label: string;
  value?: string;
  badge?: string;
};

type Section = {
  title: string;
  rows: Row[];
};

const SECTIONS: Section[] = [
  {
    title: "Account",
    rows: [
      { label: "Profile", value: "You" },
      { label: "Email", value: "you@example.com" },
      { label: "Subscription", badge: "Pro" },
    ],
  },
  {
    title: "Preferences",
    rows: [
      { label: "Appearance", value: "System" },
      { label: "Notifications", value: "On" },
      { label: "Language", value: "English" },
    ],
  },
  {
    title: "About",
    rows: [
      { label: "Version", value: "0.1.0" },
      { label: "Privacy Policy" },
      { label: "Terms of Service" },
    ],
  },
];

function SettingsRow({ row, isLast }: { row: Row; isLast: boolean }) {
  return (
    <>
      <Pressable className="flex-row items-center justify-between px-5 py-4 active:bg-accent">
        <Text className="text-base text-card-foreground">{row.label}</Text>
        <View className="flex-row items-center gap-2">
          {row.value ? (
            <Text className="text-sm text-muted-foreground">{row.value}</Text>
          ) : null}
          {row.badge ? (
            <Badge>
              <Text>{row.badge}</Text>
            </Badge>
          ) : null}
          <ChevronRight size={18} className="text-muted-foreground" />
        </View>
      </Pressable>
      {isLast ? null : <Separator className="ml-5" />}
    </>
  );
}

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="gap-6 px-5 pt-6">
          <View className="flex-row items-center gap-4">
            <Avatar alt="You" className="h-16 w-16">
              <AvatarFallback>
                <Text className="text-lg font-semibold">A</Text>
              </AvatarFallback>
            </Avatar>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-semibold text-foreground">
                Welcome
              </Text>
              <Text className="text-sm text-muted-foreground">
                you@example.com
              </Text>
            </View>
          </View>

          {SECTIONS.map((section) => (
            <View key={section.title} className="gap-2">
              <Text className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </Text>
              <View className="overflow-hidden rounded-xl border border-border bg-card">
                {section.rows.map((row, i) => (
                  <SettingsRow
                    key={row.label}
                    row={row}
                    isLast={i === section.rows.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
