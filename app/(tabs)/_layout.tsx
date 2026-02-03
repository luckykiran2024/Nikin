import { Tabs } from "expo-router";
import { Home, Package, User, MessageSquareQuote, Wallet, LayoutDashboard } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user } = useAuth();
  const isTraveler = user?.activeRole === 'traveler';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          href: isTraveler ? null : '/',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          href: isTraveler ? '/dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: isTraveler ? "Requests" : "Shipments",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="quotations"
        options={{
          title: "Quotations",
          tabBarIcon: ({ color, size }) => <MessageSquareQuote color={color} size={size} />,
          href: isTraveler ? null : '/quotations',
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: "Routes",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          href: isTraveler ? '/earnings' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
