import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export function HelloWorldScreen() {
  return (
    <View className="flex-1 bg-[#1B1B1B]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-7">
          <Text className="text-center text-[34px] font-black tracking-normal text-white">
            Hello world
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
