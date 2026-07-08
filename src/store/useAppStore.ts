import { create } from 'zustand';
import type {
  AppRole, Lang, Theme, Cafe, CoffeeItem, Order, Transaction, PartnerOrder, User,
  InventoryItem, StaffMember, Promo, Badge, Reward, Notification, AuditLogEntry,
  Campaign, Partner, MenuItem, CurrentUser, Addon
} from '../types';
import {
  supabase, getCafes, getMenuItems, getOrders, getTransactions, getNotifications, getAuditLogs,
  getProfile, createProfile, signInWithEmail as supabaseSignIn, signUp as supabaseSignUp,
  signOut as supabaseSignOut, getBadges, getRewards, getUserRedemptions, getSubscriptionPlans,
  getCampaigns, getSystemSettings, getAllProfiles, createFullOrder, toggleFavorite,
  getInventory, getEmployees, getPromotions,
  createCafe, createMenuItem, createCampaign, updateOrderStatus, addAuditLog,
  createNotification, updateSystemSetting,
} from '../lib/supabase';
import {
  pushOrder, pushNotification as fbPushNotif, pushTransaction as fbPushTxn,
  watchOrders, watchNotifications, watchTransactions, watchAllCafeStatus,
} from '../lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';
import { t } from '../i18n';

interface AppState {
  lang: Lang;
  role: AppRole;
  theme: Theme;
  isLoggedIn: boolean;
  currentUser: CurrentUser | null;
  wallet: number;
  cart: CoffeeItem[];
  selectedCafe: Cafe | null;
  selectedPickupSlot: string | null;
  selectedPayment: string;
  selectedGender: string | null;
  menuFilter: string;
  lastOrder: Order | null;

  cafes: Cafe[];
  orders: Order[];
  transactions: Transaction[];
  partnerOrders: PartnerOrder[];
  partners: Partner[];
  menuItems: MenuItem[];
  users: User[];
  inventory: InventoryItem[];
  staff: StaffMember[];
  promos: Promo[];
  badges: Badge[];
  rewards: Reward[];
  notifications: Notification[];
  auditLog: AuditLogEntry[];
  campaigns: Campaign[];
  addons: Addon[];
  currency: string;
  userPosition: { lat: number; lng: number } | null;

  setLang: (lang: Lang) => void;
  setCurrency: (currency: string) => void;
  setRole: (role: AppRole) => void;
  toggleTheme: () => void;
  setLoggedIn: (v: boolean, user?: CurrentUser | null) => void;
  setWallet: (w: number) => void;
  setCart: (cart: CoffeeItem[]) => void;
  setSelectedCafe: (cafe: Cafe | null) => void;
  setSelectedPickupSlot: (slot: string | null) => void;
  setSelectedPayment: (m: string) => void;
  setSelectedGender: (g: string | null) => void;
  setMenuFilter: (f: string) => void;
  setAddons: (addons: Addon[]) => void;
  setUserPosition: (pos: { lat: number; lng: number } | null) => void;

  signIn: (email: string, pass: string, name?: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  processPayment: (method: string, selectedAddons?: Addon[]) => void;
  updatePrices: (cafeId: number, items: { id: string; price: number }[]) => void;
  loadFromSupabase: () => Promise<void>;
  refreshCafes: () => Promise<void>;
  clearHistory: () => void;
  sendNotification: (userId: string, title: string, body: string, icon?: string, priority?: string) => void;
}

const defaultCafes: Cafe[] = [];
const fbCleanups: (() => void)[] = [];

function startFirebaseWatchers(userId: string) {
  fbCleanups.forEach((fn) => fn());
  fbCleanups.length = 0;

  fbCleanups.push(
    watchOrders(userId, (orders) => {
      const current = useAppStore.getState().orders;
      if (orders.length > 0 || current.length === 0) {
        useAppStore.setState({ orders });
      }
    })
  );
  fbCleanups.push(
    watchTransactions(userId, (txns) => {
      const current = useAppStore.getState().transactions;
      if (txns.length > 0 || current.length === 0) {
        useAppStore.setState({ transactions: txns as any[] });
      }
    })
  );

  const notifRef = ref(db, 'notifications');
  const notifFn = onValue(notifRef, (snap) => {
    const val = snap.val();
    useAppStore.setState({ notifications: val ? Object.values(val) as any[] : [] });
  });
  fbCleanups.push(() => off(notifRef, 'value', notifFn));

  fbCleanups.push(
    watchAllCafeStatus((statuses) => {
      const cafes = useAppStore.getState().cafes;
      if (cafes.length === 0) return;
      let changed = false;
      const updated = cafes.map((c) => {
        if (c.cafe_uuid && statuses[c.cafe_uuid] !== undefined && c.isOpen !== statuses[c.cafe_uuid]) {
          changed = true;
          return { ...c, isOpen: statuses[c.cafe_uuid] };
        }
        return c;
      });
      if (changed) useAppStore.setState({ cafes: updated });
    })
  );
}

function stopFirebaseWatchers() {
  fbCleanups.forEach((fn) => fn());
  fbCleanups.length = 0;
}

export const useAppStore = create<AppState>((set, get) => {
  let saved: Partial<AppState> = {};
  try {
    const raw = localStorage.getItem('sabaa_state');
    if (raw) saved = JSON.parse(raw);
  } catch {}

  return {
    lang: (saved.lang as Lang) || 'ar',
    role: saved.isLoggedIn ? ((saved.role as AppRole) || 'customer') : 'customer',
    theme: (saved.theme as Theme) || 'light',
    isLoggedIn: saved.isLoggedIn || false,
    currentUser: saved.currentUser || null,
    wallet: saved.isLoggedIn ? (saved.wallet ?? 0) : 0,
    cart: saved.cart || [],
    selectedCafe: null,
    selectedPickupSlot: null,
    selectedPayment: 'wallet',
    selectedGender: null,
    menuFilter: 'all',
    lastOrder: null,

    cafes: defaultCafes,
    orders: [],
    transactions: [],
    partnerOrders: [],
    partners: [],
    menuItems: [],
    users: [],
    inventory: [],
    staff: [],
    promos: [],
    badges: [],
    rewards: [],
    notifications: [],
    auditLog: [],
    campaigns: [],
    addons: [
      { id: 'water', name: 'ماء', nameEn: 'Water', price: 1, icon: '💧' },
      { id: 'chocolate', name: 'شوكولاتة', nameEn: 'Chocolate', price: 5, icon: '🍫' },
      { id: 'croissant', name: 'كرواسون', nameEn: 'Croissant', price: 4, icon: '🥐' },
    ],
    userPosition: null,
    currency: 'SAR',

    setLang: (lang) => set((s) => { saveState({ ...s, lang }); return { lang }; }),
    setCurrency: (currency) => set({ currency }),
    setRole: (role) => set({ role }),
    toggleTheme: () => set((s) => {
      const theme = s.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      saveState({ ...s, theme });
      return { theme };
    }),
    setLoggedIn: (v, user) => set((s) => {
      saveState({ ...s, isLoggedIn: v, currentUser: user ?? null });
      return { isLoggedIn: v, currentUser: user ?? null };
    }),
    setWallet: (wallet) => {
      const pid = useAppStore.getState().currentUser?.profileId;
      if (pid) {
        supabase.from('profiles').update({ wallet_balance: wallet }).eq('id', pid).then(() => {});
      }
      set((s) => {
        saveState({ ...s, wallet });
        return { wallet };
      });
    },
    setCart: (cart) => set((s) => {
      saveState({ ...s, cart });
      return { cart };
    }),
    setSelectedCafe: (cafe) => set({ selectedCafe: cafe }),
    setSelectedPickupSlot: (slot) => set({ selectedPickupSlot: slot }),
    setSelectedPayment: (m) => set({ selectedPayment: m }),
    setSelectedGender: (g) => set({ selectedGender: g }),
    setMenuFilter: (f) => set({ menuFilter: f }),
    setAddons: (addons) => set({ addons }),
    setUserPosition: (pos) => set({ userPosition: pos }),

    signIn: async (email, pass, name?) => {
      try {
        const lang = get().lang;
        let profile: any = null;

        // Try Supabase Auth first
        const { data: authData, error: authError } = await supabaseSignIn(email, pass);
        if (authError || !authData?.user) {
          // Fallback: check password from profiles table directly (legacy accounts)
          const { data: profileByEmail } = await supabase.from('profiles')
            .select('*').eq('email', email).maybeSingle();
          if (!profileByEmail) throw new Error(t('error_email_not_found', lang));

          // Compare — if password column doesn't exist, this will fail
          if (profileByEmail.password === undefined) {
            throw new Error(t('error_password_not_stored', lang));
          }
          if (profileByEmail.password !== pass) {
            throw new Error(t('error_incorrect_password', lang));
          }
          profile = profileByEmail;
        } else {
          const { data: p } = await getProfile(authData.user.id);
          if (!p) throw new Error(t('error_profile_not_found', lang));
          profile = p;
        }

        if (!profile) throw new Error(t('error_user_not_found', lang));

        if (profile.role === 'Partner' && profile.status === 'pending') {
          throw new Error('Your account is pending admin approval');
        }

        const roleName = String(profile.role || '').toLowerCase();
        if (roleName.includes('admin')) {
          throw new Error(t('error_email_not_found', lang));
        }

        const user: CurrentUser = {
          name: `${profile.first_name} ${profile.last_name}`,
          phone: profile.phone,
          email: profile.email || email,
          profileId: profile.id,
          points: profile.loyalty_points || 0,
          orders: 0,
          tier: profile.loyalty_tier || 'bronze',
          streak: profile.streak || 0,
        };

        const roleMap: Record<string, AppRole> = {
          Customer: 'customer',
          Partner: 'partner',
        };

        set((s) => {
          saveState({ ...s, isLoggedIn: true, currentUser: user, role: roleMap[profile.role] || 'customer', wallet: profile.wallet_balance || 0 });
          return { isLoggedIn: true, currentUser: user, role: roleMap[profile.role] || 'customer', wallet: profile.wallet_balance || 0 };
        });

        startFirebaseWatchers(user.profileId);
        get().loadFromSupabase();
      } catch (e: any) {
        throw new Error(e.message || 'فشل تسجيل الدخول');
      }
    },

    signUp: async (email, pass, name, phone) => {
      try {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ');

        // 1) Create auth user via Supabase Auth (password hashed server-side)
        const { data: authData, error: authError } = await supabaseSignUp(email, pass, {
          first_name: firstName,
          last_name: lastName,
        });

        if (authError) throw new Error(authError.message);

        const authUserId = authData?.user?.id;
        if (!authUserId) throw new Error('لم يتم إنشاء المستخدم');

        // 2) Create a profile row linked to the auth user
        const { error: profileError } = await createProfile({
          auth_id: authUserId,
          phone: phone || '',
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'Customer',
        });

        if (profileError) throw new Error(profileError.message);

        // 3) Store password in profiles table for legacy fallback
        const { error: pwError } = await supabase
          .from('profiles')
          .update({ password: pass })
          .eq('auth_id', authUserId);
        if (pwError) console.warn('⚠️ Could not store password in profiles table:', pwError.message);

        const user: CurrentUser = {
          name: lastName ? `${firstName} ${lastName}` : firstName,
          phone: phone || '+966500000000',
          email,
          profileId: authUserId,
          points: 0,
          orders: 0,
          tier: 'bronze',
          streak: 0,
        };

        set((s) => {
          saveState({ ...s, isLoggedIn: true, currentUser: user });
          return { isLoggedIn: true, currentUser: user };
        });
      } catch (e: any) {
        throw new Error(e.message || 'فشل إنشاء الحساب');
      }
    },

    signOut: async () => {
      stopFirebaseWatchers();
      try {
        await supabaseSignOut();
      } catch {}
      set((s) => {
        saveState({ ...s, isLoggedIn: false, currentUser: null, cart: [], wallet: 0, role: 'customer', orders: [], transactions: [], notifications: [] });
        return { isLoggedIn: false, currentUser: null, cart: [], wallet: 0, role: 'customer', orders: [], transactions: [], notifications: [] };
      });
    },

    processPayment: async (method, selectedAddons) => {
      const s = useAppStore.getState();
      const total = s.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
      const addonTotal = (selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
      const grandTotal = (total + addonTotal) * 1.15;
      const pickupCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderId = `SB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
      const pickupTime = s.selectedPickupSlot || new Date(Date.now() + 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const pid = s.currentUser?.profileId;
      let cafeUuid = '';
      try {
        if (pid && s.selectedCafe) {
          const { data: cafeRow } = await supabase.from('cafes')
            .select('id').eq('name_ar', s.selectedCafe.name).maybeSingle();
          cafeUuid = cafeRow?.id || '';
        }
      } catch {}

      const newOrder: Order & { cafeId?: string; customerName?: string } = {
        id: orderId,
        cafe: s.selectedCafe?.name || '',
        cafeId: cafeUuid || s.selectedCafe?.id?.toString() || '',
        coffee: s.cart.map((c) => c.type).join(', '),
        coffeeAr: s.cart.map((c) => c.type).join(', '),
        amount: grandTotal,
        base: grandTotal / 1.15,
        vat: grandTotal - grandTotal / 1.15,
        status: 'pending',
        date: dateStr,
        icon: '☕',
        pickupCode,
        pickupTime,
        items: [...s.cart],
        customerName: s.currentUser?.name || '',
      };

      // Try to save to Supabase
      try {
        if (pid) {
          const { data: orderData } = await createFullOrder({
            customer_id: pid,
            cafe_id: cafeUuid || '00000000-0000-0000-0000-000000000000',
            subtotal: grandTotal / 1.15,
            vat_amount: grandTotal - grandTotal / 1.15,
            platform_fee: 0,
            total_amount: grandTotal,
            payment_method: method === 'wallet' ? 'wallet' : method === 'stcpay' ? 'stcpay' : 'credit',
            items: [...s.cart.map((c) => ({
              item_name_ar: c.name || c.type,
              icon: c.icon,
              quantity: c.qty,
              unit_price: c.price,
              total_price: c.price * c.qty,
            })), ...(selectedAddons || []).map((a) => ({
              item_name_ar: a.name,
              icon: a.icon,
              quantity: 1,
              unit_price: a.price,
              total_price: a.price,
            }))],
          });

          if (orderData?.data?.id) {
            await supabase.from('orders').update({ pickup_time: pickupTime }).eq('id', orderData.data.id);
          }
        }
      } catch (e) {
        console.warn('Failed to save order to Supabase:', e);
      }

      // Save to Firebase
      if (pid) {
        fbPushTxn(pid, {
          title: `طلب ${s.selectedCafe?.name || ''}`,
          titleEn: `Order ${s.selectedCafe?.nameEn || ''}`,
          amount: -grandTotal,
          type: 'debit',
          date: dateStr,
        });
        fbPushNotif(pid, {
          title: s.lang === 'ar' ? `☕ طلب جديد ${orderId}` : `☕ New Order ${orderId}`,
          body: s.lang === 'ar'
            ? `تم تأكيد طلبك من ${s.selectedCafe?.name || ''} — كود الاستلام: ${pickupCode}`
            : `Order confirmed at ${s.selectedCafe?.nameEn || ''} — Pickup code: ${pickupCode}`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          read: false,
          icon: '☕',
          priority: 'high',
        });
        pushOrder(pid, newOrder);
      }

      const totalDrinks = s.cart.reduce((sum, i) => sum + i.qty, 0);
      const earnedPoints = totalDrinks * 10;
      const newPoints = (s.currentUser?.points || 0) + earnedPoints;
      const updatedUser = s.currentUser ? { ...s.currentUser, points: newPoints } : null;

      const newWallet = method === 'wallet' ? s.wallet - grandTotal : s.wallet;
      const newOrders = [newOrder, ...s.orders];
      const txn: Transaction = {
        title: `طلب ${s.selectedCafe?.name || ''}`,
        titleEn: `Order ${s.selectedCafe?.nameEn || ''}`,
        amount: -grandTotal,
        type: 'debit',
        date: dateStr,
      };
      const newTransactions = [...s.transactions, txn];

      if (updatedUser?.profileId) {
        try {
          await supabase.from('profiles').update({
            loyalty_points: newPoints,
            wallet_balance: newWallet,
          }).eq('id', updatedUser.profileId);
        } catch {}
      }

      set({ currentUser: updatedUser, wallet: newWallet, orders: newOrders, transactions: newTransactions, cart: [], lastOrder: newOrder });
    },

    updatePrices: (_cafeId, _items) => {
      // prices updated in DB (simulated)
    },

    clearHistory: () => {
      set((s) => {
        const cleared = { ...s, orders: [], transactions: [] };
        saveState(cleared);
        return { orders: [], transactions: [] };
      });
    },

    sendNotification: (userId, title, body, icon = '🔔', priority = 'normal') => {
      const notifId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const r = ref(db, `notifications/${notifId}`);
      import('firebase/database').then(({ set }) => {
        set(r, {
          id: notifId, title, body, icon,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          read: false, priority,
          createdAt: new Date().toISOString(),
        });
      });
    },

    loadFromSupabase: async () => {
      const safeFetch = async <T>(fn: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> => {
        try { const { data, error } = await fn(); if (error) return fallback; return data || fallback; } catch { return fallback; }
      };

      const cafesData = await safeFetch(() => getCafes(), []);
      const menuData = await safeFetch(() => getMenuItems(), []);
      const logsData = await safeFetch(() => getAuditLogs(), []);
      const badgesData = await safeFetch(() => getBadges(), []);
      const rewardsData = await safeFetch(() => getRewards(), []);
      const campaignsData = await safeFetch(() => getCampaigns(), []);
      const usersData = await safeFetch(() => getAllProfiles(), []);

      if (cafesData.length > 0) {
        const mapped: Cafe[] = cafesData.map((c: any, i: number) => ({
          id: i + 1,
          cafe_uuid: c.id,
          name: c.name_ar, nameEn: c.name_en, sub: c.location,
          rating: c.rating || 0, isOpen: c.is_open, dist: '—', emoji: c.emoji || '☕',
          x: 120 + i * 60, y: 80 + i * 40,
          lat: c.lat || 24.7136 + (i * 0.01),
          lng: c.lng || 46.6753 + (i * 0.01),
          logo_url: c.logo_url || null,
          favorites: c.total_favorites || 0,
          waitTime: `${c.avg_wait_min || 5} دق`, favorited: false,
          email: c.email || '', serviceType: 'قهوة', status: c.status,
        }));
        set({ cafes: mapped });
        set({
          partners: cafesData.map((c: any) => ({
            name: c.name_ar, location: c.location, status: c.status === 'active' ? 'active' : 'pending',
            earnings: '0 ⃁', rating: c.rating || 0, inventory: c.inventory_enabled ? 92 : 0, inventoryEnabled: c.inventory_enabled,
          })),
        });
      }

      if (menuData.length > 0) {
        const mapped: MenuItem[] = menuData.map((m: any) => ({
          name: m.name_ar, nameEn: m.name_en || m.name_ar, cat: 'عام',
          base: m.base_price, total: m.base_price * (1 + (m.vat_rate || 15) / 100),
          status: m.status, sales: m.sales_count || 0, desc: m.description,
          featured: m.is_featured, spicy: m.is_spicy, vegan: m.is_vegan,
        }));
        set({ menuItems: mapped });
      }

      if (logsData.length > 0) {
        set({ auditLog: logsData.map((l: any) => ({
          time: l.created_at, user: l.user_name || 'System', action: l.action_ar,
          type: l.action_type, details: l.details || '',
        }))});
      }

      if (badgesData.length > 0) {
        set({ badges: badgesData.map((b: any) => ({
          id: b.badge_key, icon: b.icon, name: b.name_ar, desc: b.description_ar || '', earned: false,
        }))});
      }

      if (rewardsData.length > 0) {
        set({ rewards: rewardsData.map((r: any) => ({
          id: r.id, icon: r.icon || '🎁', title: r.title_ar, desc: r.description_ar || '',
          cost: r.points_cost, redeemed: false,
        }))});
      }

      if (campaignsData.length > 0) {
        set({ campaigns: campaignsData.map((c: any) => ({
          name: c.name_ar, segment: c.segment || 'الجميع', reach: c.reach_count || 0,
          status: c.status || 'draft', time: c.created_at || '',
        }))});
      }

      if (usersData.length > 0) {
        set({ users: usersData.map((u: any) => ({
          name: `${u.first_name} ${u.last_name}`, phone: u.phone, email: u.email || '',
          role: u.role, status: u.status, wallet: u.wallet_balance,
          lastLogin: u.last_login || '', city: u.city,
        }))});
      }

      const state = useAppStore.getState();
      const pid = state.currentUser?.profileId;
      if (state.isLoggedIn && pid) {
        startFirebaseWatchers(pid);
        try {
          const { data: profile } = await supabase.from('profiles')
            .select('id, loyalty_points, loyalty_tier, streak, wallet_balance')
            .eq('id', pid).maybeSingle();
          if (profile) set({ wallet: profile.wallet_balance || 0 });

          // Load existing orders & transactions from Supabase
          const [ordersRes, txnsRes] = await Promise.all([
            getOrders(pid),
            getTransactions(pid),
          ]);
          const cafeMap = Object.fromEntries(
            (useAppStore.getState().cafes || []).map((c: any) => [c.cafe_uuid, c.name])
          );
          const mappedOrders = (ordersRes.data || []).map((o: any) => ({
              id: o.order_number || o.id,
              cafe: cafeMap[o.cafe_id] || o.cafe_id,
              coffee: (o.order_items || []).map((i: any) => i.item_name_ar).join(', '),
              coffeeAr: (o.order_items || []).map((i: any) => i.item_name_ar).join(', '),
              amount: o.total_amount || 0,
              base: o.subtotal || 0,
              vat: o.vat_amount || 0,
              status: o.status || 'pending',
              date: o.created_at ? new Date(o.created_at).toLocaleDateString('en-CA') : '',
              icon: '☕',
              pickupCode: o.pickup_code || '----',
              items: (o.order_items || []).map((i: any) => ({
                type: i.item_name_ar,
                qty: i.quantity,
                price: i.unit_price,
                name: i.item_name_ar,
                icon: i.icon || '☕',
              })),
            }));
          set({ orders: mappedOrders });

          const mappedTxns = (txnsRes.data || []).map((t: any) => ({
              title: t.description_ar || t.description_en || '',
              titleEn: t.description_en || t.description_ar || '',
              amount: Math.abs(t.amount || 0),
              type: t.type || 'debit',
              date: t.created_at ? new Date(t.created_at).toLocaleDateString('en-CA') : '',
            }));
          set({ transactions: mappedTxns });
        } catch {}
      }
    },
    refreshCafes: async () => {
      const { data } = await supabase.from('cafes').select('*').eq('status', 'active');
      if (data && data.length > 0) {
        const mapped: Cafe[] = data.map((c: any, i: number) => ({
          id: i + 1,
          cafe_uuid: c.id,
          name: c.name_ar, nameEn: c.name_en, sub: c.location,
          rating: c.rating || 0, isOpen: c.is_open, dist: '—', emoji: c.emoji || '☕',
          x: 120 + i * 60, y: 80 + i * 40,
          lat: c.lat || 24.7136 + (i * 0.01),
          lng: c.lng || 46.6753 + (i * 0.01),
          logo_url: c.logo_url || null,
          favorites: c.total_favorites || 0,
          waitTime: `${c.avg_wait_min || 5} دق`, favorited: false,
          email: c.email || '', serviceType: 'قهوة', status: c.status,
        }));
        set({ cafes: mapped });
      }
    },
  };
});

function saveState(state: Partial<AppState>) {
  try {
    const minimal = {
      isLoggedIn: state.isLoggedIn,
      currentUser: state.currentUser,
      wallet: state.wallet,
      lang: state.lang,
      theme: state.theme,
      currency: state.currency,
      cart: state.cart,
    };
    localStorage.setItem('sabaa_state', JSON.stringify(minimal));
  } catch {}
}
