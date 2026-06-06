import React from 'react';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/app/Home';
import ModuleDetail from '../screens/app/ModuleDetail';
import LessonReader from '../screens/app/LessonReader';
import Modules from '../screens/app/Modules';     // placeholder
import Bookmarks from '../screens/app/Bookmarks';  // placeholder
import AIChat from '../screens/app/AIChat';        // placeholder
import Profile from '../screens/app/Profile';      // placeholder

import TabBar from '../components/TabBar';
import {
  HomeStackParamList,
  ExploreStackParamList,
  ProgressStackParamList,
  ChatStackParamList,
  ProfileStackParamList,
  AppTabParamList,
} from './types';
import { colors } from '../theme/tokens';

// One native stack per tab — exactly like the reference. ModuleDetail lives
// inside the Home/Explore/Progress stacks, so it pushes over the tab content
// with the floating tab bar staying visible and a working back action.
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();

const stackOptions = { headerShown: false } as const;

function HomeTab() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={Home} />
      <HomeStack.Screen name="ModuleDetail" component={ModuleDetail} />
      <HomeStack.Screen name="LessonReader" component={LessonReader} />
    </HomeStack.Navigator>
  );
}

function ExploreTab() {
  return (
    <ExploreStack.Navigator screenOptions={stackOptions}>
      <ExploreStack.Screen name="Modules" component={Modules} />
      <ExploreStack.Screen name="ModuleDetail" component={ModuleDetail} />
      <ExploreStack.Screen name="LessonReader" component={LessonReader} />
    </ExploreStack.Navigator>
  );
}

function ProgressTab() {
  return (
    <ProgressStack.Navigator screenOptions={stackOptions}>
      <ProgressStack.Screen name="Bookmarks" component={Bookmarks} />
      <ProgressStack.Screen name="ModuleDetail" component={ModuleDetail} />
      <ProgressStack.Screen name="LessonReader" component={LessonReader} />
    </ProgressStack.Navigator>
  );
}

function ChatTab() {
  return (
    <ChatStack.Navigator screenOptions={stackOptions}>
      <ChatStack.Screen name="AIChat" component={AIChat} />
    </ChatStack.Navigator>
  );
}

function ProfileTab() {
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen name="ProfileMain" component={Profile} />
    </ProfileStack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.cream } }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="Home" component={HomeTab} />
      <Tabs.Screen name="Explore" component={ExploreTab} />
      <Tabs.Screen name="Progress" component={ProgressTab} />
      <Tabs.Screen name="Chat" component={ChatTab} />
      <Tabs.Screen name="Profile" component={ProfileTab} />
    </Tabs.Navigator>
  );
}

// Paint every navigation surface in the app's cream rather than the default
// white, so a scene that ever fails to render shows a branded background.
const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.cream, card: colors.cream },
};

// Phase 2: bottom tabs (Home, Explore, Progress, Chat, Profile), each a native
// stack. Auth flow and the remaining screens land in later tasks; the app is
// guest-first, so the tabs render directly.
export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <AppTabs />
    </NavigationContainer>
  );
}
