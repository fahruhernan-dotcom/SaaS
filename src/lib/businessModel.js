/**
 * BUSINESS CATEGORIES
 * Used for Step 1 of the onboarding overlay
 */
export const BUSINESS_CATEGORIES = [
  {
    key: 'broker',
    label: 'Broker / Pedagang',
    icon: '🤝',
    description: 'Jual beli ayam, telur, atau sembako antar pelaku usaha.',
  },
  {
    key: 'peternak',
    label: 'Peternak',
    icon: '🏚️',
    description: 'Budidaya ayam broiler atau layer, pantau produksi & biaya.',
  },
  {
    key: 'rumah_potong',
    label: 'Rumah Potong',
    icon: '🏭',
    description: 'Beli & potong ayam atau hewan ternak, kelola distribusi.',
  },
]

/**
 * NAV GENERATOR
 * Dynamically builds bottomNav paths based on the model's base path and sub_type
 */
const createNav = (base, subType, items) => {
  return items.map(item => ({
    ...item,
    path: `/${base}/${subType}/${item.slug}`
  }))
}

/**
 * PRIMARY BUSINESS MODELS
 * These are the master configurations displayed in the UI cards
 */
export const BUSINESS_MODELS = {
  poultry_broker: {
    key: 'poultry_broker',
    category: 'broker',
    name: 'Broker Ayam',
    label: 'Broker / Pedagang',
    categoryLabel: 'Broker',
    icon: '🤝',
    description: 'Beli dari kandang, jual ke RPA. Kelola margin, piutang & pengiriman.',
    color: '#10B981',
    themeColor: 'emerald',
    user_type: 'broker',
    sub_type: 'broker_ayam',
    comingSoon: false,
    bottomNav: createNav('broker', 'broker_ayam', [
      { slug: 'beranda',   icon: 'Home',           label: 'Beranda'   },
      { slug: 'transaksi', icon: 'ArrowLeftRight', label: 'Transaksi' },
      { slug: 'rpa',       icon: 'Building2',      label: 'RPA'       },
      { slug: 'pengiriman',icon: 'Truck',           label: 'Kirim'     },
    ]),
    drawerMenu: [
      { path: '/broker/broker_ayam/pengiriman', icon: 'Truck',      label: 'Pengiriman & Loss' },
      { path: '/broker/broker_ayam/cashflow',   icon: 'Wallet',     label: 'Cash Flow'         },
      { path: '/harga-pasar',                   icon: 'BarChart2',  label: 'Harga Pasar'       },
      { path: '/broker/broker_ayam/armada',     icon: 'Car',        label: 'Armada & Sopir'    },
      { path: '/broker/broker_ayam/simulator',  icon: 'Calculator', label: 'Simulator Margin'  },
      { path: '/broker/broker_ayam/tim',        icon: 'User',       label: 'Tim & Akses'       },
      { path: '/market',                        icon: 'Store',      label: 'TernakOS Market'   },
      { path: '/broker/broker_ayam/akun',       icon: 'User',       label: 'Akun & Profil'     },
    ],
    fabPath: '/broker/broker_ayam/transaksi?action=new',
  },
  distributor_sembako: {
    key: 'distributor_sembako',
    category: 'broker',
    name: 'Distributor Sembako',
    label: 'Distributor Sembako',
    categoryLabel: 'Sembako',
    icon: '🛒',
    description: 'Distribusi sembako ke toko-toko. Kelola stok, invoice, piutang & gaji pegawai.',
    color: '#EA580C',
    themeColor: 'orange',
    user_type: 'broker',
    sub_type: 'distributor_sembako',
    comingSoon: false,
    bottomNav: createNav('broker', 'distributor_sembako', [
      { slug: 'beranda',      icon: 'Home',           label: 'Beranda'   },
      { slug: 'penjualan',    icon: 'ShoppingCart',   label: 'Jual'      },
      { slug: 'toko-supplier',icon: 'Store',          label: 'Toko'      },
      { slug: 'pengiriman',   icon: 'Truck',          label: 'Kirim'     },
    ]),
    drawerMenu: [
      { path: '/broker/distributor_sembako/produk',        icon: 'Package',  label: 'Manajemen Produk' },
      { path: '/broker/distributor_sembako/toko-supplier', icon: 'Store',    label: 'Toko & Supplier'  },
      { path: '/broker/distributor_sembako/pengiriman',    icon: 'Truck',    label: 'Pengiriman'       },
      { path: '/broker/distributor_sembako/karyawan',      icon: 'Users',    label: 'Karyawan'         },
      { path: '/broker/distributor_sembako/laporan',       icon: 'BarChart2',label: 'Laporan'          },
      { path: '/broker/distributor_sembako/akun',          icon: 'User',     label: 'Akun & Profil'    },
    ],
    fabPath: '/broker/distributor_sembako/penjualan?action=new',
  },
  egg_broker: {
    key: 'egg_broker',
    category: 'broker',
    name: 'Broker Telur',
    label: 'Broker Telur',
    categoryLabel: 'Broker',
    icon: '🥚',
    description: 'Beli telur dari peternak, jual ke agen/pasar. Kelola stok tray.',
    color: '#7C3AED',
    themeColor: 'violet',
    user_type: 'broker',
    sub_type: 'broker_telur',
    comingSoon: false,
    bottomNav: createNav('broker', 'broker_telur', [
      { slug: 'beranda',   icon: 'Home',           label: 'Beranda'   },
      { slug: 'pos',       icon: 'ShoppingCart',   label: 'POS'       },
      { slug: 'inventori', icon: 'Warehouse',      label: 'Gudang'    },
      { slug: 'transaksi', icon: 'ArrowLeftRight', label: 'Transaksi' },
    ]),
    drawerMenu: [
      { path: '/broker/broker_telur/beranda', icon: 'Home', label: 'Dashboard'    },
      { path: '/broker/broker_telur/akun',    icon: 'User', label: 'Akun & Profil'},
    ],
    fabPath: '/broker/broker_telur/pos',
  },
  peternak: {
    key: 'peternak',
    category: 'peternak',
    name: 'Peternak Broiler',
    label: 'Peternak Broiler',
    categoryLabel: 'Peternak',
    icon: '🐔',
    description: 'Pelihara ayam broiler, pantau FCR & deplesi, catat biaya produksi per kg.',
    color: '#10B981',
    themeColor: 'emerald',
    user_type: 'peternak',
    sub_type: 'peternak_broiler',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_broiler', [
      { slug: 'beranda',   icon: 'Home',      label: 'Beranda'   },
      { slug: 'siklus',    icon: 'RefreshCw', label: 'Siklus'    },
      { slug: 'vaksinasi', icon: 'Syringe',   label: 'Vaksin'    },
      { slug: 'akun',      icon: 'User',      label: 'Profil'    },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_broiler/pakan',     icon: 'Package', label: 'Stok & Pakan'    },
      { path: '/peternak/peternak_broiler/vaksinasi', icon: 'Syringe', label: 'Program Vaksin'  },
      { path: '/peternak/peternak_broiler/tim',       icon: 'Users',   label: 'Tim & Akses'     },
      { path: '/market',                              icon: 'Store',   label: 'TernakOS Market' },
      { path: '/peternak/peternak_broiler/akun',      icon: 'User',    label: 'Akun & Profil'   },
    ],
    fabPath: null,
  },
  peternak_layer: {
    key: 'peternak_layer',
    category: 'peternak',
    name: 'Peternak Layer',
    label: 'Peternak Layer',
    categoryLabel: 'Peternak',
    icon: '🥚',
    description: 'Pelihara ayam petelur, pantau produksi telur harian dan inventori pakan.',
    color: '#7C3AED',
    themeColor: 'violet',
    user_type: 'peternak',
    sub_type: 'peternak_layer',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [
      { path: '/market',                         icon: 'Store', label: 'TernakOS Market' },
      { path: '/peternak/peternak_layer/akun',   icon: 'User',  label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  rumah_potong_rpa: {
    key: 'rumah_potong_rpa',
    category: 'rumah_potong',
    name: 'RPA (Rumah Potong Ayam)',
    label: 'RPA (Rumah Potong Ayam)',
    categoryLabel: 'Industri',
    icon: '🏭',
    description: 'Beli ayam dari broker, kelola order dan pantau hutang pembelian.',
    color: '#F59E0B',
    themeColor: 'amber',
    user_type: 'rumah_potong',
    sub_type: 'rpa_ayam',
    comingSoon: false,
    bottomNav: createNav('rumah_potong', 'rpa_ayam', [
      { slug: 'beranda',   icon: 'Home',           label: 'Beranda'   },
      { slug: 'transaksi', icon: 'ArrowLeftRight', label: 'Produksi'  },
      { slug: 'stok',      icon: 'Warehouse',      label: 'Gudang'    },
      { slug: 'pengiriman',icon: 'Truck',          label: 'Kirim'     },
    ]),
    drawerMenu: [
      { path: '/rumah_potong/rpa_ayam/distribusi', icon: 'Store',    label: 'Distribusi & Invoice' },
      { path: '/rumah_potong/rpa_ayam/laporan',    icon: 'BarChart2',label: 'Laporan Margin'       },
      { path: '/market',                           icon: 'Store',    label: 'TernakOS Market'      },
      { path: '/rumah_potong/rpa_ayam/akun',       icon: 'User',     label: 'Akun & Profil'        },
    ],
    fabPath: '/rumah_potong/rpa_ayam/order?action=new',
  },
  peternak_kambing_domba_penggemukan: {
    key: 'peternak_kambing_domba_penggemukan',
    category: 'peternak',
    name: 'Penggemukan Kambing & Domba',
    label: 'Penggemukan Kambing & Domba',
    categoryLabel: 'Peternak',
    icon: '🐐',
    description: 'Penggemukan (feedlot) kambing & domba. Pantau ADG, FCR, mortalitas, dan laba per ekor per batch.',
    color: '#16A34A',
    themeColor: 'green',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_domba_penggemukan',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_domba_penggemukan', [
      { slug: 'beranda',   icon: 'Home',      label: 'Beranda'  },
      { slug: 'batch',     icon: 'RefreshCw', label: 'Batch'    },
      { slug: 'ternak',    icon: 'Tag',       label: 'Ternak'   },
      { slug: 'kesehatan', icon: 'Syringe',   label: 'Sehat'    },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_domba_penggemukan/pakan',    icon: 'Wheat',    label: 'Log Pakan'      },
      { path: '/peternak/peternak_kambing_domba_penggemukan/laporan',  icon: 'BarChart2',label: 'Laporan Batch'  },
      { path: '/peternak/peternak_kambing_domba_penggemukan/tim',      icon: 'Users',    label: 'Tim & Akses'    },
      { path: '/market',                                               icon: 'Store',    label: 'TernakOS Market'},
      { path: '/peternak/peternak_kambing_domba_penggemukan/akun',     icon: 'User',     label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  peternak_kambing_domba_breeding: {
    key: 'peternak_kambing_domba_breeding',
    category: 'peternak',
    name: 'Breeding Kambing & Domba',
    label: 'Breeding Kambing & Domba',
    categoryLabel: 'Peternak',
    icon: '🐑',
    description: 'Pembibitan (breeding) kambing & domba. Kelola pedigree, reproduksi, kelahiran, dan seleksi bibit unggul.',
    color: '#0D9488',
    themeColor: 'teal',
    user_type: 'peternak',
    sub_type: 'peternak_kambing_domba_breeding',
    comingSoon: false,
    bottomNav: createNav('peternak', 'peternak_kambing_domba_breeding', [
      { slug: 'beranda',    icon: 'Home',    label: 'Beranda'   },
      { slug: 'ternak',     icon: 'Tag',     label: 'Ternak'    },
      { slug: 'reproduksi', icon: 'Heart',   label: 'Reproduksi'},
      { slug: 'kesehatan',  icon: 'Syringe', label: 'Sehat'     },
    ]),
    drawerMenu: [
      { path: '/peternak/peternak_kambing_domba_breeding/pakan',   icon: 'Wheat',    label: 'Log Pakan'      },
      { path: '/peternak/peternak_kambing_domba_breeding/laporan', icon: 'BarChart2',label: 'Laporan Farm'   },
      { path: '/peternak/peternak_kambing_domba_breeding/tim',     icon: 'Users',    label: 'Tim & Akses'    },
      { path: '/market',                                           icon: 'Store',    label: 'TernakOS Market'},
      { path: '/peternak/peternak_kambing_domba_breeding/akun',   icon: 'User',     label: 'Akun & Profil'  },
    ],
    fabPath: null,
  },
  rumah_potong_rph: {
    key: 'rumah_potong_rph',
    category: 'rumah_potong',
    name: 'RPH (Rumah Potong Hewan)',
    label: 'RPH (Rumah Potong Hewan)',
    categoryLabel: 'Industri',
    icon: '🐄',
    description: 'Pemotongan sapi/kambing. Kelola stok dan distribusi daging.',
    color: '#F59E0B',
    themeColor: 'amber',
    user_type: 'rumah_potong',
    sub_type: 'rph',
    comingSoon: true,
    bottomNav: [],
    drawerMenu: [
      { path: '/market',                icon: 'Store', label: 'TernakOS Market' },
      { path: '/rumah_potong/rph/akun', icon: 'User',  label: 'Akun & Profil'  },
    ],
    fabPath: null,
  }
}

/**
 * LEGACY ALIASES
 * Used for resolving old vertical names or sub_types to primary model keys.
 * Kept separate to prevent duplication in UI card listings.
 */
export const VERTICAL_ALIASES = {
  // Vertical aliases
  'sembako_broker':    'distributor_sembako',
  'broker':            'poultry_broker',
  
  // Sub-type aliases
  'broker_ayam':        'poultry_broker',
  'broker_telur':       'egg_broker',
  'distributor_sembako':'distributor_sembako',
  'distributor_daging': 'poultry_broker',
  'peternak_broiler':        'peternak',
  'peternak_layer':          'peternak_layer',
  'peternak_kambing_domba_penggemukan': 'peternak_kambing_domba_penggemukan',
  'peternak_kambing_domba_breeding':    'peternak_kambing_domba_breeding',
  'rpa_ayam':           'rumah_potong_rpa',
  'rph':                'rumah_potong_rph',
}

/**
 * PATH GENERATORS
 */
export const getXBasePath = (tenant, profile) => {
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]
  
  if (!model) return '/broker/broker_ayam'

  const base = model.category === 'peternak' ? 'peternak' 
             : model.category === 'rumah_potong' ? 'rumah_potong' 
             : 'broker'
             
  return `/${base}/${model.sub_type}`
}

/**
 * COMPAT: Maps old (userType, subType) API to the new flat BUSINESS_MODELS
 */
export function getBusinessModel(userType, subType) {
  const profile = { user_type: userType, sub_type: subType }
  const vertical = resolveBusinessVertical(profile, null)
  return BUSINESS_MODELS[vertical] || BUSINESS_MODELS.poultry_broker
}

/**
 * COMPAT: Legacy sub_type → vertical key mapping (was SUB_TYPE_TO_VERTICAL)
 */
export const SUB_TYPE_TO_VERTICAL = VERTICAL_ALIASES

/**
 * CENTRALIZED RESOLUTION LOGIC
 */
export function resolveBusinessVertical(profile, tenant) {
  // 1. Forced Sembako logic (Highest priority)
  const isSembakoName = tenant?.business_name?.toLowerCase().includes('sembako') || 
                       profile?.business_name?.toLowerCase().includes('sembako')
  if (isSembakoName) return 'distributor_sembako'

  // 2. Direct vertical field check
  const directVertical = tenant?.business_vertical || profile?.business_vertical
  if (directVertical) {
    if (BUSINESS_MODELS[directVertical]) return directVertical
    if (VERTICAL_ALIASES[directVertical]) return VERTICAL_ALIASES[directVertical]
  }

  // 3. Sub-type mapping check
  const subType = tenant?.sub_type || profile?.sub_type
  if (subType && VERTICAL_ALIASES[subType]) {
    return VERTICAL_ALIASES[subType]
  }

  // 4. Default Fallback
  return 'poultry_broker'
}
