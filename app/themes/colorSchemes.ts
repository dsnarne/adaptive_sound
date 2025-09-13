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
    primary: 'rgb(132, 148, 132)', // sage green
    secondary: 'rgb(159, 175, 159)', // lighter sage
    accent: 'rgb(186, 202, 186)', // very light sage
    background: 'rgb(247, 249, 247)', // sage-tinted white
    surface: 'rgb(255, 255, 255)',
    text: {
      primary: 'rgb(45, 55, 45)', // dark sage
      secondary: 'rgb(75, 85, 75)', // medium sage
      muted: 'rgb(105, 115, 105)' // muted sage
    },
    border: 'rgb(220, 230, 220)', // light sage border
    hover: 'rgb(105, 121, 105)' // darker sage
  },

  orange: {
    name: 'Muted Orange',
    primary: 'rgb(180, 130, 90)', // muted orange
    secondary: 'rgb(160, 115, 80)', // darker muted orange
    accent: 'rgb(200, 150, 110)', // lighter muted orange
    background: 'rgb(252, 249, 246)', // warm off-white
    surface: 'rgb(255, 255, 255)',
    text: {
      primary: 'rgb(80, 60, 40)', // dark brown
      secondary: 'rgb(110, 85, 65)', // medium brown
      muted: 'rgb(140, 110, 90)' // light brown
    },
    border: 'rgb(235, 225, 215)', // warm beige border
    hover: 'rgb(150, 110, 75)' // darker muted orange
  }
};
