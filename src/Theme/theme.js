
import { createTheme } from '@mui/material/styles';
import componentStyleOverrides from './componentStyleOverrides';
import colors from '../assets/scss/theme-vars.module.scss';
import palette from './palette';
import typography from './typography';
import defaultStyles from './defaultStyles';

export const theme = () => {
    const color = colors;    
    const styles = defaultStyles;
    
    const themeOption = {
        colors: color,
        styles : styles,
    };

    const themeOptions = {
        direction: 'ltr',
        palette: palette(themeOption),    
        typography: typography(themeOption)
    };

    const themes = createTheme(themeOptions);
    themes.components = componentStyleOverrides(themeOptions);

    return themes;
};
