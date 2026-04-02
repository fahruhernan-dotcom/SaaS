export const BUSINESS_MODELS = {
  distributor_sembako: {
    label: 'Distributor Sembako',
    icon: '🛒',
    color: '#EA580C',
    description: 'Distribusi sembako ke toko-toko. Kelola stok, invoice, piutang & gaji pegawai.',
    basePath: '/broker/distributor_sembako',
    redirectAfterLogin: '/broker/distributor_sembako/beranda',
    fabPath: '/broker/distributor_sembako/penjualan?action=new',
    fabLabel: 'Catat Penjualan',
    bottomNav: [
      { path: '/broker/distributor_sembako/beranda',   icon: 'Home',         label: 'Beranda'   },
      { path: '/broker/distributor_sembako/penjualan', icon: 'ArrowLeftRight', label: 'Penjualan' },
      { path: '/broker/distributor_sembako/gudang',    icon: 'Package',      label: 'Gudang'    },
      { path: '/broker/distributor_sembako/produk',    icon: 'LayoutGrid',   label: 'Produk'    },
    ],
    drawerMenu: [
      { path: '/broker/distributor_sembako/produk',        icon: 'Package',   label: 'Manajemen Produk' },
      { path: '/broker/distributor_sembako/toko-supplier', icon: 'Store',     label: 'Toko & Supplier'  },
      { path: '/broker/distributor_sembako/pengiriman',    icon: 'Truck',     label: 'Pengiriman'       },
      { path: '/broker/distributor_sembako/karyawan',      icon: 'Users',     label: 'Karyawan'         },
      { path: '/broker/distributor_sembako/laporan',       icon: 'BarChart2', label: 'Laporan'          },
      { path: '/broker/distributor_sembako/akun',          icon: 'User',      label: 'Akun & Profil'    },
    ],
  },
  // Legacy alias for Sembako
  sembako_broker: null, // assigned below
  
  egg_broker: {
    label: 'Broker Telur',
    icon: '🥚',
    color: '#7C3AED',
    description: 'Beli telur dari peternak, jual ke agen/pasar. Kelola stok tray dan penyusutan.',
    basePath: '/broker/broker_telur',
    redirectAfterLogin: '/broker/broker_telur/beranda',
    fabPath: '/broker/broker_telur/transaksi?action=new',
    fabLabel: 'Catat Penjualan',
    bottomNav: [
      { path: '/broker/broker_telur/beranda',   icon: 'Home',           label: 'Beranda'   },
      { path: '/broker/broker_telur/pos',       icon: 'ShoppingCart',   label: 'Jual'      },
      { path: '/broker/broker_telur/inventori', icon: 'Package',        label: 'Stok'      },
      { path: '/broker/broker_telur/akun',      icon: 'User',           label: 'Akun'      },
    ],
    drawerMenu: [
      { path: '/broker/broker_telur/beranda',   icon: 'Home',           label: 'Dashboard' },
      { path: '/broker/broker_telur/akun',      icon: 'User',           label: 'Akun & Profil' },
    ]
  },

  broker: {
    label: 'Broker / Pedagang',
    icon: '🤝',
    color: '#10B981',
    description: 'Beli dari kandang, jual ke RPA. Kelola margin, piutang & pengiriman.',
    basePath: '/broker/broker_ayam',
    redirectAfterLogin: '/broker/broker_ayam/beranda',
    fabPath: '/broker/broker_ayam/transaksi?action=new',
    fabLabel: 'Tambah Transaksi',
    bottomNav: [
      { path: '/broker/broker_ayam/beranda',     icon: 'Home',           label: 'Beranda'   },
      { path: '/broker/broker_ayam/transaksi',   icon: 'ArrowLeftRight', label: 'Transaksi' },
      { path: '/broker/broker_ayam/rpa',         icon: 'Building2',      label: 'RPA'       },
      { path: '/broker/broker_ayam/pengiriman',  icon: 'Truck',          label: 'Kirim'     },
    ],
    drawerMenu: [
      { path: '/broker/broker_ayam/pengiriman',  icon: 'Truck',           label: 'Pengiriman & Loss' },
      { path: '/broker/broker_ayam/cashflow',    icon: 'Wallet',          label: 'Cash Flow'         },
      { path: '/harga-pasar',                   icon: 'BarChart2',       label: 'Harga Pasar'       },
      { path: '/broker/broker_ayam/armada',      icon: 'Car',             label: 'Armada & Sopir'    },
      { path: '/broker/broker_ayam/simulator',   icon: 'Calculator',      label: 'Simulator Margin'  },
      { path: '/broker/broker_ayam/tim',         icon: 'User',            label: 'Tim & Akses'       },
      { path: '/market',                         icon: 'Store',           label: 'TernakOS Market'   },
      { path: '/broker/broker_ayam/akun',        icon: 'User',            label: 'Akun & Profil'     },
    ]
  },

  peternak: {
    peternak_broiler: {
      label: 'Peternak Broiler',
      icon: '🏚️',
      color: '#7C3AED',
      description: 'Pelihara ayam broiler, pantau FCR & deplesi, catat biaya produksi per kg.',
      basePath: '/peternak/peternak_broiler',
      redirectAfterLogin: '/peternak/peternak_broiler/beranda',
      fabPath: '/peternak/peternak_broiler/beranda?action=tambah-kandang',
      fabLabel: 'Tambah Kandang',
      bottomNav: [
        { path: '/peternak/peternak_broiler/beranda', icon: 'Home',      label: 'Overview' },
        { path: '/peternak/peternak_broiler/siklus',  icon: 'RefreshCw', label: 'Siklus'   },
        { path: '/peternak/peternak_broiler/pakan',   icon: 'Package',   label: 'Pakan'    },
        { path: '/peternak/peternak_broiler/laporan', icon: 'BarChart2',  label: 'Laporan' },
      ],
      drawerMenu: [
        { path: '/peternak/peternak_broiler/pakan',   icon: 'Package',    label: 'Stok & Pakan'    },
        { path: '/market',           icon: 'Store',      label: 'TernakOS Market' },
        { path: '/peternak/peternak_broiler/akun',    icon: 'User',       label: 'Akun & Profil'   },
      ]
    },
    peternak_layer: {
      label: 'Peternak Layer',
      icon: '🥚',
      color: '#7C3AED',
      description: 'Pelihara ayam petelur, pantau produksi telur harian dan inventori pakan.',
      basePath: '/peternak/peternak_layer',
      redirectAfterLogin: '/peternak/peternak_layer/beranda',
      bottomNav: [
        { path: '/peternak/peternak_layer/beranda', icon: 'Home',      label: 'Overview' },
      ],
      drawerMenu: [
        { path: '/market',           icon: 'Store',      label: 'TernakOS Market' },
        { path: '/peternak/peternak_layer/akun',    icon: 'User',       label: 'Akun & Profil'   },
      ]
    }
  },

  rumah_potong: {
    rpa: {
      label: 'RPA (Rumah Potong Ayam)',
      icon: '🏭',
      color: '#F59E0B',
      description: 'Beli ayam dari broker, kelola order dan pantau hutang pembelian.',
      basePath: '/rumah_potong/rpa',
      redirectAfterLogin: '/rumah_potong/rpa/beranda',
      fabPath: '/rumah_potong/rpa/order?action=new',
      fabLabel: 'Order Baru',
      bottomNav: [
        { path: '/rumah_potong/rpa/beranda',    icon: 'Home',         label: 'Beranda'   },
        { path: '/rumah_potong/rpa/order',      icon: 'ShoppingCart', label: 'Order'     },
        { path: '/rumah_potong/rpa/hutang',     icon: 'CreditCard',   label: 'Hutang'    },
        { path: '/rumah_potong/rpa/distribusi', icon: 'Store',        label: 'Distribusi'},
      ],
      drawerMenu: [
        { path: '/rumah_potong/rpa/distribusi', icon: 'Store',      label: 'Distribusi & Invoice' },
        { path: '/rumah_potong/rpa/laporan',    icon: 'BarChart2',  label: 'Laporan Margin'       },
        { path: '/market',               icon: 'Store',      label: 'TernakOS Market'      },
        { path: '/rumah_potong/rpa/akun',       icon: 'User',       label: 'Akun & Profil'        },
      ]
    },
    rph: {
      label: 'RPH (Rumah Potong Hewan)',
      icon: '🐄',
      color: '#F59E0B',
      description: 'Pemotongan hewan ternak (sapi/kambing). Kelola stok dan distribusi daging.',
      basePath: '/rumah_potong/rph',
      redirectAfterLogin: '/rumah_potong/rph/beranda',
      bottomNav: [
        { path: '/rumah_potong/rph/beranda',    icon: 'Home',         label: 'Beranda'   },
      ],
      drawerMenu: [
        { path: '/rumah_potong/rph/beranda',    icon: 'Home',         label: 'Beranda'   },
        { path: '/market',               icon: 'Store',      label: 'TernakOS Market'      },
        { path: '/rumah_potong/rph/akun',       icon: 'User',       label: 'Akun & Profil'        },
      ]
    }
  }
}

export function getBusinessModel(userType, subType) {
  if (userType === 'rumah_potong' && subType) {
    const rpType = subType.startsWith('rpa') ? 'rpa' : 'rph'
    return BUSINESS_MODELS.rumah_potong[rpType]
  }

  if (userType === 'peternak' && subType) {
    return BUSINESS_MODELS.peternak[subType] || BUSINESS_MODELS.peternak.peternak_broiler
  }
  
  if (subType && BUSINESS_MODELS[SUB_TYPE_TO_VERTICAL[subType]]) {
    const vertical = SUB_TYPE_TO_VERTICAL[subType]
    if (vertical === 'rumah_potong' || vertical === 'peternak') {
       return BUSINESS_MODELS[vertical][subType] || BUSINESS_MODELS[vertical][Object.keys(BUSINESS_MODELS[vertical])[0]]
    }
    return BUSINESS_MODELS[vertical]
  }
  return BUSINESS_MODELS[userType] || BUSINESS_MODELS.broker
}

export const SUB_TYPE_TO_USER_TYPE = {
  broker_ayam:           'broker',
  broker_telur:          'broker',
  distributor_daging:    'broker',
  distributor_sembako:   'broker',
  peternak_broiler:      'peternak',
  peternak_layer:        'peternak',
  rpa_ayam:              'rumah_potong',
  rph:                   'rumah_potong',
}

export const SUB_TYPE_TO_VERTICAL = {
  broker_ayam:           'poultry_broker',
  broker_telur:          'egg_broker',
  distributor_daging:    'poultry_broker',
  distributor_sembako:   'distributor_sembako',
  peternak_broiler:      'peternak',
  peternak_layer:        'peternak',
  rpa_ayam:              'rumah_potong',
  rph:                   'rumah_potong',
}

export const SUB_TYPE_LABELS = {
  broker_ayam:           'Broker Ayam',
  broker_telur:          'Broker Telur',
  distributor_daging:    'Distributor Daging',
  distributor_sembako:   'Distributor Sembako',
  peternak_broiler:      'Peternak Ayam Broiler',
  peternak_layer:        'Peternak Ayam Layer',
  rpa_ayam:              'RPA — Rumah Potong Ayam',
  rph:                   'RPH — Rumah Potong Hewan',
}
// Add legacy alias to BUSINESS_MODELS
BUSINESS_MODELS.sembako_broker = BUSINESS_MODELS.distributor_sembako;
SUB_TYPE_TO_VERTICAL.sembako_broker = 'distributor_sembako';

/**
 * Standardized helper for multi-vertical routing
 * Usage: navigate(`${getXBasePath(tenant)}/penjualan`)
 */
export function getXBasePath(tenant) {
  if (!tenant) return '/broker/broker_ayam'
  
  const subType = tenant.sub_type || 'broker_ayam'
  
  // Mapping based on Section 7 of CONTEXT.md
  if (['poultry_broker', 'egg_broker', 'sembako_broker', 'broker', 'distributor_sembako'].includes(tenant.business_vertical) || 
      ['broker_ayam', 'broker_telur', 'distributor_daging', 'distributor_sembako'].includes(subType)) {
    return `/broker/${subType}`
  }
  
  if (tenant.business_vertical === 'peternak' || subType.startsWith('peternak_')) {
    return `/peternak/${subType}`
  }
  
  if (tenant.business_vertical === 'rumah_potong' || ['rpa', 'rph', 'rpa_ayam'].includes(subType)) {
    return `/rumah_potong/${subType}`
  }

  return `/broker/${subType}`
}
