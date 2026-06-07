import React from 'react';
import { View, StyleSheet } from 'react-native';
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

import Auth from '../screens/auth/Auth';
import VerifyOtp from '../screens/auth/VerifyOtp';
import Forgot from '../screens/auth/Forgot';

import TabBar from '../components/TabBar';
import AtomLogo from '../components/AtomLogo';
import { useAuth } from '../context/AuthContext';
import {
  HomeStackParamList,
  ExploreStackParamList,
  ProgressStackParamList,
  ChatStackParamList,
  ProfileStackParamList,
  AppTabParamList,
  AuthStackParamList,
  RootStackParamList,
} from './types';
import { colors } from '../theme/tokens';

// One native stack per tab — exactly like the reference. ModuleDetail and
// LessonReader live inside the Home/Explore/Progress stacks.
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

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

// Auth flow. The app is guest-first, so there is no Splash/Welcome wall — the
// flow opens directly on the Auth screen (sign in / sign up), reached when a
// guest taps a gate (requestAuth) or "Sign in / Sign up" from Profile.
function AuthFlow({ pendingAuthMode }: { pendingAuthMode: 'signin' | 'signup' | null }) {
  return (
    <AuthStack.Navigator
      initialRouteName="AuthMain"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.splashBg } }}>
      <AuthStack.Screen
        name="AuthMain"
        component={Auth}
        initialParams={pendingAuthMode ? { mode: pendingAuthMode } : undefined}
      />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtp} />
      <AuthStack.Screen name="Forgot" component={Forgot} />
    </AuthStack.Navigator>
  );
}

// Paint every navigation surface in the app's cream rather than the default
// white, so a scene that ever fails to render shows a branded background.
const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.cream, card: colors.cream },
};

// Guest-first: a real session → the tabs; otherwise the app defaults to guest
// (also the tabs). The Auth flow only appears when requestAuth() clears guest.
export default function RootNavigator() {
  const { user, isGuest, hydrated, pendingAuthMode } = useAuth();

  if (!hydrated) {
    // Brand splash while we restore the session.
    return (
      <View style={styles.splash}>
        <AtomLogo size={120} />
      </View>
    );
  }

  const authed = !!user || isGuest;

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
        {authed ? (
          <RootStack.Screen name="App" component={AppTabs} />
        ) : (
          <RootStack.Screen name="Auth">
            {() => <AuthFlow pendingAuthMode={pendingAuthMode} />}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.splashBg, alignItems: 'center', justifyContent: 'center' },
});
