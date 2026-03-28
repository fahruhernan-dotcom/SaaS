export const BUSINESS_MODELS = {
  sembako_broker: {
    label: 'Distributor Sembako',
    icon: '🛒',
    color: '#EA580C',
    description: 'Distribusi sembako ke toko-toko. Kelola stok, invoice, piutang & gaji pegawai.',
    fabPath: '/broker/sembako/penjualan?action=new',
    fabLabel: 'Catat Penjualan',
    bottomNav: [
      { path: '/broker/sembako/beranda',   icon: 'Home',         label: 'Beranda'   },
      { path: '/broker/sembako/penjualan', icon: 'ShoppingCart', label: 'Penjualan' },
      { path: '/broker/sembako/gudang',    icon: 'Package',      label: 'Gudang'    },
      { path: '/broker/sembako/produk',    icon: 'LayoutGrid',   label: 'Produk'    },
    ],
    drawerMenu: [
      { path: '/broker/sembako/produk',   icon: 'Package',   label: 'Manajemen Produk' },
      { path: '/broker/sembako/pegawai',  icon: 'Users',     label: 'Pegawai'          },
      { path: '/broker/sembako/laporan',  icon: 'BarChart2', label: 'Laporan'          },
      { path: '/broker/sembako/akun',     icon: 'User',      label: 'Akun & Profil'    },
    ],
  },

  broker: {
    label: 'Broker / Pedagang',
    icon: '🤝',
    color: '#10B981',
    description: 'Beli dari kandang, jual ke RPA. Kelola margin, piutang & pengiriman.',
    fabPath: '/broker/transaksi?action=new',
    fabLabel: 'Tambah Transaksi',
    bottomNav: [
      { path: '/broker/beranda',     icon: 'Home',           label: 'Beranda'   },
      { path: '/broker/transaksi',   icon: 'ArrowLeftRight', label: 'Transaksi' },
      { path: '/broker/rpa',         icon: 'Building2',      label: 'RPA'       },
      { path: '/broker/pengiriman',  icon: 'Truck',          label: 'Kirim'     },
    ],
    drawerMenu: [
      { path: '/broker/pengiriman',  icon: 'Truck',           label: 'Pengiriman & Loss' },
      { path: '/broker/cashflow',    icon: 'Wallet',          label: 'Cash Flow'         },
      { path: '/harga-pasar',       icon: 'BarChart2',       label: 'Harga Pasar'       },
      { path: '/broker/armada',      icon: 'Car',             label: 'Armada & Sopir'    },
      { path: '/broker/simulator',   icon: 'Calculator',      label: 'Simulator Margin'  },
      { path: '/broker/tim',         icon: 'User',            label: 'Tim & Akses'       },
      { path: '/market',             icon: 'Store',           label: 'TernakOS Market'   },
      { path: '/broker/akun',        icon: 'User',            label: 'Akun & Profil'     },
    ]
  },

  peternak: {
    label: 'Peternak',
    icon: '🏚️',
    color: '#7C3AED',
    description: 'Pelihara ayam, pantau FCR & deplesi, catat biaya produksi per kg.',
    fabPath: '/peternak/beranda?action=tambah-kandang',
    fabLabel: 'Tambah Kandang',
    bottomNav: [
      { path: '/peternak/beranda', icon: 'Home',      label: 'Overview' },
      { path: '/peternak/siklus',  icon: 'RefreshCw', label: 'Siklus'   },
      { path: '/peternak/pakan',   icon: 'Package',   label: 'Pakan'    },
      { path: '/peternak/laporan', icon: 'BarChart2',  label: 'Laporan' },
    ],
    drawerMenu: [
      { path: '/peternak/pakan',   icon: 'Package',    label: 'Stok & Pakan'    },
      { path: '/market',           icon: 'Store',      label: 'TernakOS Market' },
      { path: '/harga-pasar',     icon: 'BarChart2',  label: 'Harga Pasar'     },
      { path: '/peternak/akun',    icon: 'User',       label: 'Akun & Profil'   },
    ]
  },

  rpa: {
    label: 'RPA / Buyer',
    icon: '🏭',
    color: '#F59E0B',
    description: 'Beli ayam dari broker, kelola order dan pantau hutang pembelian.',
    fabPath: '/rpa-buyer/order?action=new',
    fabLabel: 'Order Baru',
    bottomNav: [
      { path: '/rpa-buyer/beranda',    icon: 'Home',         label: 'Beranda'   },
      { path: '/rpa-buyer/order',      icon: 'ShoppingCart', label: 'Order'     },
      { path: '/rpa-buyer/hutang',     icon: 'CreditCard',   label: 'Hutang'    },
      { path: '/rpa-buyer/distribusi', icon: 'Store',        label: 'Distribusi'},
    ],
    drawerMenu: [
      { path: '/rpa-buyer/distribusi', icon: 'Store',      label: 'Distribusi & Invoice' },
      { path: '/rpa-buyer/laporan',    icon: 'BarChart3',  label: 'Laporan Margin'       },
      { path: '/market',               icon: 'Store',      label: 'TernakOS Market'      },
      { path: '/harga-pasar',         icon: 'BarChart2',  label: 'Harga Pasar'          },
      { path: '/rpa-buyer/akun',       icon: 'User',       label: 'Akun & Profil'        },
    ]
  }
}

export function getBusinessModel(userType, subType) {
  if (subType && BUSINESS_MODELS[SUB_TYPE_TO_VERTICAL[subType]]) {
    return BUSINESS_MODELS[SUB_TYPE_TO_VERTICAL[subType]]
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
  rpa_ayam:              'rpa',
  rph:                   'rpa',
}

export const SUB_TYPE_TO_VERTICAL = {
  broker_ayam:           'poultry_broker',
  broker_telur:          'egg_broker',
  distributor_daging:    'poultry_broker',
  distributor_sembako:   'sembako_broker',
  peternak_broiler:      'peternak',
  peternak_layer:        'peternak',
  rpa_ayam:              'rpa',
  rph:                   'rpa',
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
