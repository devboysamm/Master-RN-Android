// Content routes are shared by the stacks that can open a module/lesson, so a
// screen typed against one stack ports unchanged to another (matches the
// reference app's structure).
export type ContentRoutes = {
  ModuleDetail: { moduleId: number };
  LessonReader: { lessonId: number; moduleId?: number };
};

export type HomeStackParamList = ContentRoutes & {
  HomeMain: undefined;
};

export type ExploreStackParamList = ContentRoutes & {
  Modules: undefined;
};

export type ProgressStackParamList = ContentRoutes & {
  Bookmarks: undefined;
};

export type ChatStackParamList = {
  AIChat: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

export type AppTabName = 'Home' | 'Explore' | 'Progress' | 'Chat' | 'Profile';

export type AppTabParamList = {
  Home: undefined;
  Explore: undefined;
  Progress: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  AuthMain: { mode?: 'signup' | 'signin'; returnTo?: AppTabName } | undefined;
  VerifyOtp: { email: string; name: string; password: string };
  Forgot: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
