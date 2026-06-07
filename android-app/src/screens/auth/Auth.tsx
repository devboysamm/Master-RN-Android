import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AtomLogo from '../../components/AtomLogo';
import RadialGlow from '../../components/RadialGlow';
import Icon from '../../components/Icon';
import { I } from '../../theme/icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/tokens';
import { font } from '../../theme/fonts';
import { AuthStackParamList } from '../../navigation/types';

type Mode = 'signup' | 'signin';

// All values: design × 1.2.
const GLOW_SIZE = 336;
const GLOW_TOP = -96;
const GLOW_RIGHT = -72;

const PAD_H = 24;
const PAD_TOP = 17;
const PAD_BOTTOM = 22;

const BACK_SIZE = 46;
const BACK_R = 23;
const BACK_ICON = 19;
const ATOM = 72;
const ATOM_SW = 8;

const HEAD_MT = 26;
const KICKER_FS = 12;
const KICKER_LS = 1.7;
const TITLE_FS = 34;
const TITLE_LS = -0.72;
const TITLE_LH = 42;
const TITLE_MT = 7;

const TABS_MT = 26;
const TABS_PAD = 5;
const TABS_R = 17;
const TAB_PAD_V = 12;
const TAB_R = 12;
const TAB_FS = 14;

const FORM_MT = 22;
const FIELD_GAP = 12;

const LABEL_FS = 11;
const LABEL_LS = 1.4;
const LABEL_MB = 7;

const INPUT_R = 17;
const INPUT_PAD_V = 16;
const INPUT_PAD_H = 17;
const INPUT_FS = 17;
const EYE_ICON = 19;

const STR_MT = 7;
const STR_GAP = 10;
const STR_BAR_GAP = 4;
const STR_BAR_H = 4;
const STR_LABEL_FS = 12;

const CTA_MT = 22;
const CTA_R = 22;
const CTA_PAD_V = 19;
const CTA_PAD_H = 22;
const CTA_FS = 17;
const CTA_ARROW = 19;

const GUEST_MT = 22;
const GUEST_PAD = 8;
const GUEST_FS = 14;

export default function Auth() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'AuthMain'>>();
  const initialMode: Mode = route.params?.mode === 'signin' ? 'signin' : 'signup';
  const returnTo = route.params?.returnTo;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn, signUp, continueAsGuest, cancelAuth } = useAuth();

  // When `returnTo` is set we entered AuthFlow from inside the app — cancel and
  // return to the tabs. Otherwise fall back to back / continue-as-guest.
  const handleBack = () => {
    if (returnTo) { cancelAuth(); return; }
    if (nav.canGoBack()) nav.goBack();
    else continueAsGuest();
  };

  // Hardware back (Android) — when `returnTo` is set, cancel back into the tabs.
  useEffect(() => {
    if (!returnTo) return;
    const sub = nav.addListener('beforeRemove', (e) => {
      e.preventDefault();
      cancelAuth();
    });
    return sub;
  }, [nav, returnTo, cancelAuth]);

  const { control, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { name: '', email: '', password: '' },
  });

  const password = watch('password');
  const strength = strengthOf(password);

  const onSubmit = handleSubmit(async (vals) => {
    setServerError(null);
    try {
      if (mode === 'signup') {
        await signUp(vals.email.trim(), vals.name.trim(), vals.password);
        nav.navigate('VerifyOtp', {
          email: vals.email.trim(),
          name: vals.name.trim(),
          password: vals.password,
        });
      } else {
        await signIn(vals.email.trim(), vals.password);
      }
    } catch (e: any) {
      setServerError(e?.message || 'Something went wrong. Please try again.');
    }
  });

  const switchMode = (next: Mode) => { setServerError(null); setMode(next); };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <View style={styles.glowWrap} pointerEvents="none">
        <RadialGlow size={GLOW_SIZE} intensity={0.08} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={styles.backBtn}>
              <Icon d={I.arrowL} size={BACK_ICON} color={colors.white} strokeWidth={2.2} />
            </Pressable>
            <AtomLogo size={ATOM} strokeWidth={ATOM_SW} />
          </View>

          <Text style={styles.kicker}>
            {mode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}
          </Text>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Create your\naccount' : 'Sign in to\ncontinue'}
          </Text>

          <View style={styles.tabs}>
            <TabBtn label="Sign up" active={mode === 'signup'} onPress={() => switchMode('signup')} />
            <TabBtn label="Sign in" active={mode === 'signin'} onPress={() => switchMode('signin')} />
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <Field
                label="NAME"
                error={errors.name?.message}
                control={control}
                name="name"
                rules={{ required: 'Name is required' }}
                placeholder="Your name"
              />
            )}

            <Field
              label="EMAIL"
              error={errors.email?.message}
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Invalid email' },
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              mono
            />

            <Field
              label="PASSWORD"
              error={errors.password?.message}
              control={control}
              name="password"
              rules={{ required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } }}
              placeholder="••••••••"
              secureTextEntry={!showPw}
              rightIcon={showPw ? I.eyeOff : I.eye}
              onRightIcon={() => setShowPw((v) => !v)}
              mono
              mb={0}
            />

            {mode === 'signup' && password ? (
              <View style={styles.strength}>
                <View style={styles.strengthBars}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i < strength.score ? strength.color : 'rgba(255,255,255,0.12)' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            ) : null}

            {mode === 'signin' && (
              <Pressable
                onPress={() => nav.navigate('Forgot')}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
                hitSlop={6}
                style={styles.forgotWrap}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>
            )}
          </View>

          {serverError ? (
            <View style={styles.serverErrWrap}>
              <Text style={styles.serverErr}>{serverError}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
            accessibilityLabel={mode === 'signup' ? 'Create account' : 'Sign in'}
            style={({ pressed }) => [styles.cta, isSubmitting && { opacity: 0.7 }, pressed && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </Text>
            {isSubmitting
              ? <ActivityIndicator color={colors.white} />
              : <Icon d={I.arrowR} size={CTA_ARROW} color={colors.white} strokeWidth={2.2} />}
          </Pressable>

          <Pressable onPress={continueAsGuest} accessibilityRole="link" accessibilityLabel="Continue as guest" style={styles.guestWrap}>
            <Text style={styles.guest}>
              Just looking around?{' '}
              <Text style={styles.guestLink}>Continue as guest</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = {
  label: string;
  control: any;
  name: string;
  rules?: object;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  rightIcon?: string;
  onRightIcon?: () => void;
  error?: string;
  mono?: boolean;
  mb?: number;
};

function Field({
  label, control, name, rules, placeholder,
  secureTextEntry, keyboardType, autoCapitalize, rightIcon, onRightIcon, error, mono, mb = FIELD_GAP,
}: FieldProps) {
  return (
    <View style={{ marginBottom: mb }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Controller
          control={control}
          name={name}
          rules={rules}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              placeholderTextColor="rgba(255,255,255,0.35)"
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              style={[styles.input, mono && { fontFamily: font('400', 'mono') }]}
            />
          )}
        />
        {rightIcon && (
          <Pressable
            onPress={onRightIcon}
            accessibilityRole="button"
            accessibilityLabel="Toggle visibility"
            hitSlop={8}
            style={styles.eye}>
            <Icon d={rightIcon} size={EYE_ICON} color="rgba(255,255,255,0.55)" />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

function strengthOf(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: colors.mute };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels  = ['Weak', 'Okay', 'Good', 'Strong'];
  const palette = [colors.coralDeep, colors.yellow, colors.mint, colors.coral];
  return {
    score,
    label: labels[Math.max(0, score - 1)] || 'Weak',
    color: palette[Math.max(0, score - 1)] || colors.coralDeep,
  };
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.splashBg },
  glowWrap: { position: 'absolute', top: GLOW_TOP, right: GLOW_RIGHT, width: GLOW_SIZE, height: GLOW_SIZE },
  scroll: { paddingHorizontal: PAD_H, paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: BACK_SIZE, height: BACK_SIZE, borderRadius: BACK_R,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  kicker: {
    marginTop: HEAD_MT,
    color: colors.coral,
    fontFamily: font('700', 'mono'),
    fontSize: KICKER_FS,
    letterSpacing: KICKER_LS,
  },
  title: {
    marginTop: TITLE_MT,
    color: colors.white,
    fontFamily: font('800'),
    fontSize: TITLE_FS,
    letterSpacing: TITLE_LS,
    lineHeight: TITLE_LH,
  },
  tabs: {
    marginTop: TABS_MT,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: TABS_R,
    padding: TABS_PAD,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tab: { flex: 1, paddingVertical: TAB_PAD_V, alignItems: 'center', borderRadius: TAB_R },
  tabActive: { backgroundColor: colors.coral },
  tabText: { color: 'rgba(255,255,255,0.55)', fontFamily: font('700'), fontSize: TAB_FS },
  tabTextActive: { color: colors.white, fontFamily: font('800') },
  form: { marginTop: FORM_MT },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: font('700', 'mono'),
    fontSize: LABEL_FS,
    letterSpacing: LABEL_LS,
    marginBottom: LABEL_MB,
  },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: INPUT_R,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: INPUT_PAD_H,
    paddingVertical: INPUT_PAD_V,
    color: colors.white,
    fontFamily: font('600'),
    fontSize: INPUT_FS,
  },
  eye: { paddingHorizontal: INPUT_PAD_H, justifyContent: 'center', alignSelf: 'stretch' },
  err: { color: colors.coral, fontFamily: font('600'), fontSize: 13, marginTop: 5 },
  serverErrWrap: {
    marginTop: CTA_MT,
    backgroundColor: 'rgba(242,106,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,106,74,0.35)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  serverErr: { color: colors.coral, fontFamily: font('700'), fontSize: 14 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: STR_GAP, marginTop: STR_MT },
  strengthBars: { flex: 1, flexDirection: 'row', gap: STR_BAR_GAP },
  strengthBar: { flex: 1, height: STR_BAR_H, borderRadius: 2 },
  strengthLabel: { fontFamily: font('700', 'mono'), fontSize: STR_LABEL_FS, letterSpacing: 0.6 },
  forgotWrap: { marginTop: STR_MT, alignSelf: 'flex-end' },
  forgot: { color: colors.coral, fontFamily: font('700'), fontSize: 14, textDecorationLine: 'underline' },
  cta: {
    marginTop: CTA_MT,
    backgroundColor: colors.coral,
    borderRadius: CTA_R,
    paddingVertical: CTA_PAD_V,
    paddingHorizontal: CTA_PAD_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: { color: colors.white, fontFamily: font('800'), fontSize: CTA_FS },
  guestWrap: { marginTop: GUEST_MT, padding: GUEST_PAD, alignItems: 'center' },
  guest: { color: 'rgba(255,255,255,0.55)', fontFamily: font('600'), fontSize: GUEST_FS },
  guestLink: { color: colors.coral, fontFamily: font('800'), textDecorationLine: 'underline' },
});
