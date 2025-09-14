export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  hover: string;
}

export const colorSchemes: Record<string, ColorScheme> = {
  dark: {
    name: 'Dark Mode',
    primary: 'rgb(71, 85, 105)', // slate-600
    secondary: 'rgb(100, 116, 139)', // slate-500
    accent: 'rgb(148, 163, 184)', // slate-400
    background: 'rgb(15, 23, 42)', // slate-900 (dark background)
    surface: 'rgb(30, 41, 59)', // slate-800 (dark surface)
    text: {
      primary: 'rgb(248, 250, 252)', // slate-50 (light text)
      secondary: 'rgb(203, 213, 225)', // slate-300 (medium light text)
      muted: 'rgb(148, 163, 184)' // slate-400 (muted light text)
    },
    border: 'rgb(51, 65, 85)', // slate-700 (dark border)
    hover: 'rgb(100, 116, 139)' // slate-500
  },
  
  light: {
    name: 'Light Mode',
    primary: 'rgb(30, 215, 96)', // Spotify green
    secondary: 'rgb(25, 200, 85)', // darker Spotify green
    accent: 'rgb(40, 230, 110)', // lighter Spotify green
    background: 'rgb(255, 255, 255)', // pure white
    surface: 'rgb(248, 249, 250)', // very light gray
    text: {
      primary: 'rgb(0, 0, 0)', // black text
      secondary: 'rgb(40, 40, 40)', // dark gray
      muted: 'rgb(100, 100, 100)' // medium gray
    },
    border: 'rgb(220, 220, 220)', // light gray border
    hover: 'rgb(20, 180, 75)' // darker green hover
  }
};
