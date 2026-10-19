// Eleven personalization config
// Edit the values below to change names, wording and defaults.
// These are DEFAULTS. Once the user saves a setting in the app,
// the saved value (in localStorage) takes precedence.

export const appConfig = {
  appName: 'Eleven',
  recipientName: 'Jaanu',
  tagline: 'A gentle little space, just for you.',

  welcomeHeading: 'Hey, Jaanu 💖🐶👀🎈',
  welcomeMessage:
    'I made this little space just for you, so you always have one place to check in with yourself, keep track of your days, and remember to be a little gentle with yourself.\n\nSome days will feel easy, and some might feel a little harder. Take things at your own pace, listen to your body, and remember that you deserve care on every kind of day. 💗',
  signOff: 'Made with lots of care, just for you✨️',

  // "system" | "light" | "dark"
  defaultTheme: 'dark',

  cycle: {
    defaultCycleLength: 29,
    defaultPeriodDuration: 5,
    // Date format YYYY-MM-DD. Set to null to make the app ask instead.
    defaultLastPeriodStart: '2026-10-14',
    // "fixed" | "adaptive"
    defaultPredictionMode: 'fixed',
  },

  reminders: {
    inAppReminders: true,
    // How many days before the expected date to show a heads-up.
    daysBefore: 2,
  },

  // Gentle in-app alerts. Placeholders: {when} = "tomorrow" / "in about N days",
  // {day} = day number.
  // Everything is phrased as an estimate, never as certain.
  alerts: {
    soon: 'Get ready, lovely🌹. Your period may start {when}. Maybe set out a little comfort kit and plan a softer day?',
    today:
      'Around today, gentle reminder to be kind to yourself💗. It may start any time now, and a little early or late is normal.',
    during: 'Day {day}. Take it slow today🫶. Warm drinks and rest are always allowed.',
    ending: 'Nearly there✨️. Today is likely the last day. You are doing great.',
  },

  encouragements: [
    "A tiny reminder: you don't have to be productive every single day.🌸",
    'Take a breath, drink some water, and be kind to yourself today.💗',
    "It's okay to slow down when you need to.🫶",
    "One day at a time. You've got this.✨️",
    'You are allowed to rest without earning it.🌹',
    'Small, gentle steps still count.🦋',
  ],

  selfCare: [
    { id: 'water', title: 'Sip some water', text: 'A glass of water is an easy little kindness for your body.' },
    { id: 'rest', title: 'Make room to rest', text: 'If you can, give yourself a slower pace today.' },
    { id: 'warmth', title: 'Something cozy', text: 'A warm drink or a soft blanket can feel comforting.' },
    { id: 'move', title: 'Gentle movement', text: 'A short stretch or walk, only if it feels good.' },
    { id: 'treat', title: 'A small treat', text: 'Choose something you enjoy, just because.' },
  ],
};

export default appConfig;