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
  blue: {
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
  
  green: {
    name: 'Sage Green',
    primary: 'rgb(101, 128, 101)', // darker sage green for better contrast
    secondary: 'rgb(132, 148, 132)', // medium sage
    accent: 'rgb(159, 175, 159)', // light sage
    background: 'rgb(245, 248, 245)', // sage-tinted white
    surface: 'rgb(255, 255, 255)',
    text: {
      primary: 'rgb(25, 35, 25)', // much darker sage for better contrast
      secondary: 'rgb(45, 60, 45)', // dark sage
      muted: 'rgb(75, 90, 75)' // medium sage
    },
    border: 'rgb(200, 215, 200)', // sage border
    hover: 'rgb(85, 110, 85)' // darker sage hover
  },

  orange: {
    name: 'Muted Orange',
    primary: 'rgb(160, 110, 70)', // darker muted orange for better contrast
    secondary: 'rgb(140, 95, 60)', // even darker orange
    accent: 'rgb(180, 130, 90)', // medium orange
    background: 'rgb(250, 246, 242)', // warm off-white
    surface: 'rgb(255, 255, 255)',
    text: {
      primary: 'rgb(60, 40, 25)', // much darker brown for better contrast
      secondary: 'rgb(90, 65, 45)', // dark brown
      muted: 'rgb(120, 90, 70)' // medium brown
    },
    border: 'rgb(220, 205, 190)', // warm beige border
    hover: 'rgb(130, 90, 55)' // darker orange hover
  }
};
