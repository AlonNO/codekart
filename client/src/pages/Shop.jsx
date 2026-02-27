import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { buyItem, equipItem } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Shop() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState(new Set());
  const [tab, setTab] = useState('theme'); // 'theme' | 'particles'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(i => i.type === tab).sort((a, b) => a.price - b.price);
  }, [items, tab]);

  const equippedTheme = profile?.equipped_theme || 'vs-dark';
  const equippedParticles = profile?.equipped_particles || 'none';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAll() {
    setLoading(true);
    setError('');

    const { data: storeItems, error: storeErr } = await supabase
      .from('store_items')
      .select('*');

    if (storeErr) {
      setError(storeErr.message);
      setLoading(false);
      return;
    }

    const { data: inv, error: invErr } = await supabase
      .from('inventory')
      .select('item_key');

    if (invErr) {
      setError(invErr.message);
      setLoading(false);
      return;
    }

    setItems(storeItems || []);
    setInventory(new Set((inv || []).map(x => x.item_key)));
    setLoading(false);
  }

  function isOwned(item) {
    if (item.price === 0) return true;
    return inventory.has(item.key);
  }

function isEquipped(item) {
  if (item.type === 'theme') return (item.meta?.themeKey || item.meta?.themeId) === equippedTheme;
  if (item.type === 'particles') return item.meta?.particleId === equippedParticles;
  if (item.type === 'border') return item.meta?.borderId === (profile?.equipped_border || 'default');
  return false;
}

  async function onBuy(item) {
    setActionLoading(true);
    setError('');
    try {
      const res = await buyItem(item.key);
      if (!res.ok) throw new Error(res.error || 'Buy failed');
      await refreshProfile();
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function onEquip(item) {
    setActionLoading(true);
    setError('');
    try {
      const res = await equipItem(item.key);
      if (!res.ok) throw new Error(res.error || 'Equip failed');
      await refreshProfile();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-black">
          🛒 <span className="text-white">Kart</span><span className="text-yellow-400">Shop</span>
        </h1>

        <div className="text-right">
          <p className="text-gray-500 text-xs">Balance</p>
          <p className="text-yellow-400 font-black text-xl">💰 {profile.kart_coins}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-3xl flex gap-2 mb-4">
        <button
          onClick={() => setTab('theme')}
          className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
            tab === 'theme' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🎨 Themes
        </button>
        <button
          onClick={() => setTab('particles')}
          className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
            tab === 'particles' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          ✨ Particles
        </button>
        <button
          onClick={() => setTab('border')}
          className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
            tab === 'border' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🖼️ Borders
        </button>
      </div>

      {error && (
        <div className="w-full max-w-3xl mb-4 p-3 rounded-xl border border-red-700 bg-red-900/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Items */}
      <div className="w-full max-w-3xl">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const owned = isOwned(item);
              const equipped = isEquipped(item);

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border ${
                    equipped ? 'border-yellow-500 bg-yellow-900/10' : 'border-gray-800 bg-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-black text-lg">{item.name}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {item.type === 'theme' && `Monaco theme: ${item.meta?.themeKey || item.meta?.themeId}`}
                        {item.type === 'particles' && `Effect: ${item.meta?.particleId}`}
                        {item.type === 'border' && `Avatar Border: ${item.meta?.borderId}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Price</p>
                      <p className={`font-black ${item.price === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {item.price === 0 ? 'FREE' : `💰 ${item.price}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {!owned && (
                      <button
                        disabled={actionLoading}
                        onClick={() => onBuy(item)}
                        className={`flex-1 py-2 rounded-xl font-bold transition-colors ${
                          actionLoading
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-green-500 text-black hover:bg-green-400'
                        }`}
                      >
                        Buy
                      </button>
                    )}

                    <button
                      disabled={actionLoading || (!owned && item.price > 0)}
                      onClick={() => onEquip(item)}
                      className={`flex-1 py-2 rounded-xl font-bold transition-colors ${
                        equipped
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      } ${(!owned && item.price > 0) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {equipped ? 'Equipped' : 'Equip'}
                    </button>
                  </div>

                  <p className="text-gray-600 text-xs mt-3">
                    {owned ? 'Owned ✅' : 'Not owned'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Shop;