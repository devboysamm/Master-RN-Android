module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-worklets is reanimated v4's worklet runtime; its babel plugin
  // (the renamed reanimated plugin) MUST be the last entry in this list.
  plugins: ['react-native-worklets/plugin'],
};
