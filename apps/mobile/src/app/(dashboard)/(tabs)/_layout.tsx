import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function DashboardTabsLayout() {
  return (
    <NativeTabs
      backgroundColor="#1C1D1E"
      blurEffect="systemChromeMaterialDark"
      disableTransparentOnScrollEdge
      iconColor={{ default: "#858585", selected: "#A594F7" }}
      indicatorColor="#A594F7"
      labelStyle={{
        default: {
          color: "#8B8B8B",
          fontSize: 11,
          fontWeight: "800",
        },
        selected: {
          color: "#A594F7",
          fontSize: 11,
          fontWeight: "800",
        },
      }}
      labelVisibilityMode="labeled"
      shadowColor="#2B2E2C"
      tintColor="#A594F7"
    >
      <NativeTabs.Trigger name="wallet">
        <NativeTabs.Trigger.Icon
          md="home"
          sf={{ default: "house", selected: "house.fill" }}
        />
        <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trade">
        <NativeTabs.Trigger.Icon
          md="swap_horiz"
          sf="arrow.left.arrow.right"
        />
        <NativeTabs.Trigger.Label>Trade</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          md="person"
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
