/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Theme = 'light' | 'dark';

type ThemeProps = { light?: string; dark?: string };

type ColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

export function useThemeColor(
  props: ThemeProps,
  colorName: ColorName
) {
  const theme: Theme = (useColorScheme() as Theme) ?? 'light';
  const colorFromProps = (props as Record<Theme, string | undefined>)[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return (Colors as Record<Theme, Record<ColorName, string>>)[theme][colorName];
  }
}
