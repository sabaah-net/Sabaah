import { create } from 'zustand';
import type {
  AppRole, Lang, Theme, Cafe, CoffeeItem, Order, Transaction, PartnerOrder, User,
  InventoryItem, StaffMember, Promo, Badge, Reward, Notification, AuditLogEntry,
  Campaign, Partner, MenuItem, CurrentUser
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

  setLang: (lang: Lang) => void;
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

  signIn: (email: string, pass: string, name?: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  processPayment: (method: string) => void;
  updatePrices: (cafeId: number, items: { id: string; price: number }[]) => void;
  loadFromSupabase: () => Promise<void>;
  clearHistory: () => void;
}

const defaultCafes: Cafe[] = [
  { id: 1, name: "Brew92", nameEn: "Brew92", sub: "شارع التحلية، الرياض", rating: 4.8, isOpen: true, dist: "1.2 كم", emoji: "☕", x: 120, y: 80, favorites: 1240, waitTime: "4 دق", favorited: false, email: "info@brew92.com", serviceType: "متخصصة", status: "active" },
  { id: 2, name: "قهوة السعودية", nameEn: "Saudi Coffee", sub: "طريق الملك فهد", rating: 4.5, isOpen: true, dist: "2.5 كم", emoji: "🇸🇦", x: 300, y: 150, favorites: 890, waitTime: "6 دق", favorited: false, email: "info@saudicoffee.com", serviceType: "سعودية", status: "active" },
  { id: 3, name: "إيليفن", nameEn: "Eleven", sub: "شارع الأمير محمد", rating: 4.9, isOpen: false, dist: "3.1 كم", emoji: "🔟", x: 200, y: 220, favorites: 2100, waitTime: "8 دق", favorited: false, email: "hello@eleven.sa", serviceType: "متخصصة", status: "inactive" },
  { id: 4, name: "المختصة", nameEn: "Al-Moktasah", sub: "حي العليا", rating: 4.7, isOpen: true, dist: "0.8 كم", emoji: "🎯", x: 180, y: 100, favorites: 567, waitTime: "3 دق", favorited: false, email: "info@almoktasah.com", serviceType: "مختصة", status: "active" },
];

const defaultOrders: Order[] = [];

export const useAppStore = create<AppState>((set, get) => {
  let saved: Partial<AppState> = {};
  try {
    const raw = localStorage.getItem('sabaa_state');
    if (raw) saved = JSON.parse(raw);
  } catch {}

  return {
    lang: (saved.lang as Lang) || 'ar',
    role: (saved.role as AppRole) || 'customer',
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
    orders: saved.orders || defaultOrders,
    transactions: saved.transactions || [],
    partnerOrders: [
      { id: "SB-1043", customer: "أحمد محمد", coffee: "Black", coffeeAr: "سوداء", time: "08:45 AM", status: "pending", pickupCode: "K9P2" },
      { id: "SB-1044", customer: "سارة علي", coffee: "Iced", coffeeAr: "مثلجة", time: "09:00 AM", status: "ready", pickupCode: "L3W8" },
      { id: "SB-1045", customer: "فهد سعد", coffee: "Spanish", coffeeAr: "إسباني", time: "09:15 AM", status: "preparing", pickupCode: "M7N1" },
    ],
    partners: saved.partners || [
      { name: "Brew92", location: "الرياض", status: "active", earnings: "4,500 ⃁", rating: 4.8, inventory: 92, inventoryEnabled: true },
      { name: "قهوة السعودية", location: "جدة", status: "active", earnings: "3,200 ⃁", rating: 4.5, inventory: 78, inventoryEnabled: false },
      { name: "مقهى جديد", location: "الدمام", status: "pending", earnings: "0 ⃁", rating: "-", inventory: 100, inventoryEnabled: true },
    ],
    menuItems: saved.menuItems || [
      { name: "قهوة سوداء", nameEn: "Black Coffee", cat: "قهوة ساخنة", base: 7.00, total: 8.05, status: "active", sales: 1240 },
      { name: "قهوة بيضاء", nameEn: "White Coffee", cat: "قهوة ساخنة", base: 7.00, total: 8.05, status: "active", sales: 980 },
      { name: "قهوة مثلجة", nameEn: "Iced Coffee", cat: "قهوة باردة", base: 7.00, total: 8.05, status: "active", sales: 1560 },
      { name: "قهوة إسباني", nameEn: "Spanish Latte", cat: "قهوة ساخنة", base: 9.00, total: 10.35, status: "active", sales: 890 },
    ],
    users: [
      { name: "محمد علي", phone: "+966501234567", email: "mohammed@sabaa.com", role: "Super Admin", status: "active", wallet: 150.00, lastLogin: "2026-06-13 00:15", city: "riyadh" },
      { name: "سارة أحمد", phone: "+966559876543", email: "sara@test.com", role: "Customer", status: "active", wallet: 45.00, lastLogin: "2026-06-12 18:30", city: "jeddah" },
      { name: "خالد العمري", phone: "+966541112233", email: "khaled@brew92.com", role: "Admin", status: "active", wallet: 0.00, lastLogin: "2026-06-12 09:00", city: "riyadh" },
    ],
    inventory: [
      { name: "حبوب عربية", level: 85, unit: "كجم" }, { name: "حليب طازج", level: 12, unit: "لتر" },
      { name: "كوب ورقي", level: 45, unit: "قطعة" }, { name: "سكر", level: 90, unit: "كجم" },
      { name: "مكعبات ثلج", level: 8, unit: "كجم" }, { name: "شوكولاتة", level: 23, unit: "كجم" },
    ],
    staff: saved.staff || [
      { name: "أحمد", role: "باريستا", shift: "صباحي", status: "active" },
      { name: "نورة", role: "كاشير", shift: "صباحي", status: "active" },
      { name: "خالد", role: "باريستا", shift: "مسائي", status: "off" },
    ],
    promos: [
      { name: "ساعة الصباح", discount: 20, start: "07:00", end: "10:00", active: true },
      { name: "عروض الجمعة", discount: 15, start: "14:00", end: "18:00", active: false },
    ],
    badges: [
      { id: "first", icon: "🎯", name: "القهوة الأولى", desc: "أكمل طلبك الأول", earned: true },
      { id: "streak7", icon: "🔥", name: "أسبوع كامل", desc: "7 أيام متتالية", earned: true },
      { id: "explorer", icon: "🗺️", name: "المكتشف", desc: "جرب 5 مقاهي مختلفة", earned: true },
      { id: "vip", icon: "👑", name: "VIP", desc: "وصل إلى 5000 نقطة", earned: false },
      { id: "group", icon: "👥", name: "منسق المجموعة", desc: "أنشئ طلب جماعي", earned: false },
      { id: "night", icon: "🌙", name: "سهران", desc: "اطلب بعد منتصف الليل", earned: false },
      { id: "voice", icon: "🎙️", name: "صوتي", desc: "استخدم الطلب الصوتي", earned: false },
      { id: "sub", icon: "📅", name: "مشترك دائم", desc: "فعل اشتراك أسبوعي", earned: false },
    ],
    rewards: [
      { id: "r1", icon: "☕", title: "قهوة مجانية", desc: "أي نوع قهوة في أي مقهى", cost: 100, redeemed: false },
      { id: "r2", icon: "🥐", title: "كرواسان مجاني", desc: "مع أي طلب قهوة", cost: 50, redeemed: false },
      { id: "r3", icon: "💰", title: "خصم 50%", desc: "على الطلب التالي", cost: 200, redeemed: false },
      { id: "r4", icon: "📅", title: "أسبوع مجاني", desc: "اشتراك الباس لأسبوع", cost: 500, redeemed: false },
    ],
    notifications: [
      { id: 1, title: "طلبك جاهز!", body: "قهوتك من Brew92 جاهزة للاستلام. الكود: B2M4", time: "منذ 5 دقائق", read: false, icon: "☕", priority: "high" },
      { id: 2, title: "🎉 مكافأة جديدة", body: "لقد حصلت على شارة 'المكتشف'!", time: "منذ ساعة", read: false, icon: "🏆", priority: "normal" },
      { id: 3, title: "عرض خاص", body: "خصم 20% على القهوة المثلجة اليوم فقط", time: "منذ 3 ساعات", read: false, icon: "🎉", priority: "normal" },
    ],
    auditLog: [
      { time: "2026-06-13 00:10", user: "محمد علي", action: "تسجيل دخول", type: "login", details: "IP: 192.168.1.1" },
      { time: "2026-06-12 23:45", user: "System", action: "إنشاء طلب جديد", type: "order", details: "SB-1046" },
      { time: "2026-06-12 22:30", user: "سارة أحمد", action: "شحن محفظة", type: "finance", details: "+50 ⃁" },
      { time: "2026-06-12 20:15", user: "خالد العمري", action: "تحديث حالة الطلب", type: "order", details: "SB-1043 → جاهز" },
      { time: "2026-06-12 18:00", user: "محمد علي", action: "إضافة مستخدم جديد", type: "user", details: "فهد سعد → Customer" },
      { time: "2026-06-12 14:20", user: "System", action: "تنبيه مخزون منخفض", type: "inventory", details: "حليب طازج: 12 لتر" },
    ],
    campaigns: [
      { name: "عرض نهاية الأسبوع", segment: "العملاء النشطون في الرياض (إناث)", reach: 1240, status: "sent", time: "منذ ساعتين" },
      { name: "تذكير شحن المحفظة", segment: "رصيد منخفض (< 20 ⃁)", reach: 450, status: "scheduled", time: "غداً 9:00 ص" },
      { name: "تحديث شروط الشركاء", segment: "جميع الشركاء النشطين", reach: 42, status: "sent", time: "أمس" },
    ],

    setLang: (lang) => set((s) => { saveState({ ...s, lang }); return { lang }; }),
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
          Admin: 'superadmin',
          'Super Admin': 'superadmin',
        };

        set((s) => {
          saveState({ ...s, isLoggedIn: true, currentUser: user, role: roleMap[profile.role] || 'customer', wallet: profile.wallet_balance || 0 });
          return { isLoggedIn: true, currentUser: user, role: roleMap[profile.role] || 'customer', wallet: profile.wallet_balance || 0 };
        });
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
      try {
        await supabaseSignOut();
      } catch {}
      set((s) => {
        saveState({ ...s, isLoggedIn: false, currentUser: null, cart: [], wallet: 0 });
        return { isLoggedIn: false, currentUser: null, cart: [], wallet: 0 };
      });
    },

    processPayment: async (method) => {
      const s = useAppStore.getState();
      const total = s.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
      const pickupCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderId = `SB-${1000 + s.orders.length + 1}`;
      const pickupTime = s.selectedPickupSlot || new Date(Date.now() + 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      const newOrder: Order = {
        id: orderId,
        cafe: s.selectedCafe?.name || '',
        coffee: s.cart.map((c) => c.type).join(', '),
        coffeeAr: s.cart.map((c) => c.type).join(', '),
        amount: total,
        base: total / 1.15,
        vat: total - total / 1.15,
        status: 'pending',
        date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
        icon: '☕',
        pickupCode,
        pickupTime,
        items: [...s.cart],
      };

      // Try to save to Supabase
      try {
        const pid = s.currentUser?.profileId;
        if (pid) {
          const cafe = s.selectedCafe ? await supabase.from('cafes')
            .select('id').eq('name_ar', s.selectedCafe.name).maybeSingle() : null;

          const { data: orderData } = await createFullOrder({
            customer_id: pid,
            cafe_id: cafe?.data?.id || '00000000-0000-0000-0000-000000000000',
            subtotal: total / 1.15,
            vat_amount: total - total / 1.15,
            platform_fee: 0,
            total_amount: total,
            payment_method: method === 'wallet' ? 'wallet' : 'card',
            items: s.cart.map((c) => ({
              item_name_ar: c.name || c.type,
              icon: c.icon,
              quantity: c.qty,
              unit_price: c.price,
              total_price: c.price * c.qty,
            })),
          });

          if (orderData?.data?.id) {
            await supabase.from('orders').update({ pickup_time: pickupTime }).eq('id', orderData.data.id);
          }
        }
      } catch (e) {
        console.warn('Failed to save order to Supabase, saving locally:', e);
      }

      // Create notification for new order
      const notifItem: Notification = {
        id: Date.now(),
        title: s.lang === 'ar' ? `☕ طلب جديد ${orderId}` : `☕ New Order ${orderId}`,
        body: s.lang === 'ar'
          ? `تم تأكيد طلبك من ${s.selectedCafe?.name || ''} — كود الاستلام: ${pickupCode}`
          : `Order confirmed at ${s.selectedCafe?.nameEn || ''} — Pickup code: ${pickupCode}`,
        time: s.lang === 'ar' ? 'الآن' : 'Just now',
        read: false,
        icon: '☕',
        priority: 'high',
      };

      // Save notification to Supabase if logged in
      try {
        const pid = s.currentUser?.profileId;
        if (pid) {
          await createNotification({
            user_id: pid,
            title: notifItem.title,
            body: notifItem.body,
            icon: '☕',
            priority: 'high',
          }).catch(() => {});
        }
      } catch {}

      const totalDrinks = s.cart.reduce((sum, i) => sum + i.qty, 0);
      const earnedPoints = totalDrinks * 10;
      const newPoints = (s.currentUser?.points || 0) + earnedPoints;
      const updatedUser = s.currentUser ? { ...s.currentUser, points: newPoints } : null;

      const newWallet = method === 'wallet' ? s.wallet - total : s.wallet;
      const newOrders = [newOrder, ...s.orders];
      const txn: Transaction = {
        title: `طلب ${s.selectedCafe?.name || ''}`,
        titleEn: `Order ${s.selectedCafe?.nameEn || ''}`,
        amount: -total,
        type: 'debit',
        date: new Date().toISOString().split('T')[0],
      };
      const newTransactions = [...s.transactions, txn];
      const newNotifs = [notifItem, ...s.notifications];

      if (updatedUser?.profileId) {
        try {
          await supabase.from('profiles').update({
            loyalty_points: newPoints,
            wallet_balance: newWallet,
          }).eq('id', updatedUser.profileId);
        } catch {}
      }

      saveState({ ...s, currentUser: updatedUser, wallet: newWallet, orders: newOrders, transactions: newTransactions, cart: [], notifications: newNotifs });
      set({ currentUser: updatedUser, wallet: newWallet, orders: newOrders, transactions: newTransactions, cart: [], lastOrder: newOrder, notifications: newNotifs });
    },

    updatePrices: (_cafeId, _items) => {
      // prices updated in DB (simulated)
    },

    clearHistory: () => {
      set((s) => {
        const cleared = { ...s, orders: [], transactions: [] };
        saveState(cleared);
        localStorage.setItem('sabaa_state', JSON.stringify({
          isLoggedIn: cleared.isLoggedIn,
          currentUser: cleared.currentUser,
          wallet: cleared.wallet,
          orders: [],
          transactions: [],
          lang: cleared.lang,
          theme: cleared.theme,
          cart: cleared.cart,
          staff: cleared.staff,
          partners: cleared.partners,
          menuItems: cleared.menuItems,
          notifications: cleared.notifications,
        }));
        return { orders: [], transactions: [] };
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
          name: c.name_ar, nameEn: c.name_en, sub: c.location,
          rating: c.rating || 0, isOpen: c.is_open, dist: '—', emoji: c.emoji || '☕',
          x: 120 + i * 60, y: 80 + i * 40, favorites: c.total_favorites || 0,
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
      if (state.isLoggedIn && state.currentUser?.profileId) {
        try {
          const { data: profile } = await supabase.from('profiles')
            .select('id, loyalty_points, loyalty_tier, streak, wallet_balance')
            .eq('id', state.currentUser.profileId).maybeSingle();
          if (profile) set({ wallet: profile.wallet_balance || 0 });
        } catch {}
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
      orders: state.orders,
      transactions: state.transactions,
      lang: state.lang,
      theme: state.theme,
      partners: state.partners,
      cart: state.cart,
      staff: state.staff,
      menuItems: state.menuItems,
      notifications: state.notifications,
    };
    localStorage.setItem('sabaa_state', JSON.stringify(minimal));
  } catch {}
}
