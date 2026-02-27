const THEME_IMPORTS = {
  dracula: () => import('../themes/Dracula.json'),
  nightOwl: () => import('../themes/Night Owl.json'),
  monokai: () => import('../themes/Monokai.json'),
  githubDark: () => import('../themes/GitHub Dark.json'),
  pastelsOnDark: () => import('../themes/Pastels on Dark.json'),
  solarizedDark: () => import('../themes/Solarized-dark.json'),
  monokaiBright: () => import('../themes/Monokai Bright.json'),
  oneDarkPro: () => import('../themes/One Dark Pro.json'),
  tokyoNight: () => import('../themes/Tokyo Night.json'),
  synthwave84: () => import("../themes/SynthWave '84.json"),
};

const BUILT_IN = new Set(['vs-dark', 'vs', 'hc-black']);
const loaded = new Set();

export function isBuiltInTheme(themeKey) {
  return BUILT_IN.has(themeKey);
}

export async function ensureMonacoTheme(monaco, themeKey) {
  if (!themeKey) return;
  if (isBuiltInTheme(themeKey)) return;
  if (loaded.has(themeKey)) return;

  const importer = THEME_IMPORTS[themeKey];
  if (!importer) {
    console.warn(`Theme ${themeKey} not found in THEME_IMPORTS`);
    return;
  }

  try {
    const themeJson = (await importer()).default || await importer();

    // Map rules carefully so we don't pass empty strings which crash Monaco
    const rules = (themeJson.tokenColors || themeJson.rules || []).flatMap((t) => {
      const scope = t.scope || t.token || '';
      const settings = t.settings || { 
        foreground: t.foreground, 
        background: t.background, 
        fontStyle: t.fontStyle 
      };
      
      // Some themes have comma-separated scopes, some have arrays
      const scopes = Array.isArray(scope) ? scope : scope.split(',');

      return scopes.map((s) => {
        const rule = { token: s.trim() };
        
        // ONLY add these if they actually exist (no empty strings!)
        if (settings.foreground) rule.foreground = settings.foreground.replace('#', '');
        if (settings.background) rule.background = settings.background.replace('#', '');
        if (settings.fontStyle) rule.fontStyle = settings.fontStyle;
        
        return rule;
      });
    });

    monaco.editor.defineTheme(themeKey, {
      base: themeJson.base || 'vs-dark',
      inherit: true,
      rules: rules,
      colors: themeJson.colors || {},
    });

    loaded.add(themeKey);
    console.log(`✅ Successfully loaded theme: ${themeKey}`);
  } catch (error) {
    console.error(`❌ Failed to load theme ${themeKey}:`, error);
  }
}