import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';

const ALL_POWERUPS = [
  { id: 'blur', emoji: '🌫️', name: 'Smoke Screen', desc: 'Blurs opponent\'s editor for 5s' },
  { id: 'shake', emoji: '📳', name: 'Earthquake', desc: 'Violently shakes their screen for 5s' },
  { id: 'light_theme', emoji: '☀️', name: 'Flashbang', desc: 'Forces light theme for 8s' },
  { id: 'reverse_typing', emoji: '🔀', name: 'Dyslexia', desc: 'Scrambles keyboard keys for 5s' },
  { id: 'tiny_font', emoji: '🔍', name: 'Ant Font', desc: 'Shrinks font to 8px for 5s' },
  { id: 'vim_curse', emoji: '🟢', name: 'Vim Curse', desc: 'Injects vim commands while typing for 8s' },
  { id: 'censor_bar', emoji: '█', name: 'Censor Bar', desc: 'Blacks out keywords for 6s' },
  { id: 'ghost_typist', emoji: '👻', name: 'Ghost Typist', desc: 'Injects troll comments for 10s' },
];

const MAX_LOADOUT = 3;

function LoadoutEditor({ profile, onUpdate }) {
  const [loadout, setLoadout] = useState(profile?.loadout || ['blur', 'shake', 'reverse_typing']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.loadout) {
      setLoadout(profile.loadout);
    }
  }, [profile]);

  const togglePowerup = (id) => {
    setSaved(false);
    if (loadout.includes(id)) {
      // Remove it (minimum 1)
      if (loadout.length <= 1) return;
      setLoadout(loadout.filter(p => p !== id));
    } else {
      // Add it (maximum 3)
      if (loadout.length >= MAX_LOADOUT) return;
      setLoadout([...loadout, id]);
    }
  };

  const saveLoadout = async () => {
    if (!profile?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ loadout, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    setSaving(false);

    if (!error) {
      setSaved(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const hasChanges = JSON.stringify(loadout) !== JSON.stringify(profile?.loadout || ['blur', 'shake', 'reverse_typing']);

  return (
    <div className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700 w-80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">
          ⚡ Loadout
        </h3>
        <span className="text-xs text-gray-500">
          {loadout.length}/{MAX_LOADOUT}
        </span>
      </div>

      <p className="text-gray-500 text-xs mb-3">
        Pick 3 sabotages for your Item Box
      </p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {ALL_POWERUPS.map((pw) => {
          const selected = loadout.includes(pw.id);
          const disabled = !selected && loadout.length >= MAX_LOADOUT;

          return (
            <motion.button
              key={pw.id}
              whileHover={{ scale: disabled ? 1 : 1.1 }}
              whileTap={{ scale: disabled ? 1 : 0.9 }}
              onClick={() => togglePowerup(pw.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer
                ${selected
                  ? 'border-yellow-400 bg-yellow-900/30'
                  : disabled
                    ? 'border-gray-800 bg-gray-900/50 opacity-30 cursor-not-allowed'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
              title={`${pw.name}: ${pw.desc}`}
            >
              <span className="text-lg">{pw.emoji}</span>
              <span className="text-[8px] text-gray-400 mt-0.5 leading-tight text-center">
                {pw.name.split(' ')[0]}
              </span>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                >
                  <span className="text-[8px] text-black font-black">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected loadout preview */}
      <div className="flex items-center justify-center gap-2 mb-3 min-h-[40px]">
        <AnimatePresence mode="popLayout">
          {loadout.map((id) => {
            const pw = ALL_POWERUPS.find(p => p.id === id);
            return (
              <motion.div
                key={id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="w-10 h-10 rounded-lg bg-purple-900 border-2 border-purple-500 flex items-center justify-center"
                title={pw?.name}
              >
                <span className="text-lg">{pw?.emoji}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {loadout.length === 0 && (
          <p className="text-gray-600 text-xs italic">Select at least 1</p>
        )}
      </div>

      {/* Save button */}
      {hasChanges && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={saveLoadout}
          disabled={saving || loadout.length === 0}
          className={`w-full py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            saving
              ? 'bg-gray-700 text-gray-500'
              : 'bg-yellow-400 text-black hover:bg-yellow-300'
          }`}
        >
          {saving ? '⏳ Saving...' : '💾 Save Loadout'}
        </motion.button>
      )}

      {saved && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-400 text-xs text-center mt-2 font-bold"
        >
          ✅ Loadout saved!
        </motion.p>
      )}
    </div>
  );
}

export default LoadoutEditor;