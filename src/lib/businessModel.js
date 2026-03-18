export const BUSINESS_MODELS = {
  broker: {
    label: 'Broker / Pedagang',
    icon: '🤝',
    color: '#10B981',
    description: 'Beli dari kandang, jual ke RPA. Kelola margin, piutang & pengiriman.',
    bottomNav: [
      { path: '/broker/beranda',   icon: 'Home',            label: 'Beranda'   },
      { path: '/broker/transaksi',   icon: 'ArrowLeftRight',  label: 'Transaksi' },
      { path: '/broker/rpa',         icon: 'Building2',       label: 'RPA'       },
      { path: '/broker/akun',        icon: 'User',            label: 'Akun'      },
    ],
    drawerMenu: [
      { path: '/broker/pengiriman',  icon: 'Truck',           label: 'Pengiriman & Loss' },
      { path: '/broker/cashflow',    icon: 'Wallet',          label: 'Cash Flow'         },
      { path: '/harga-pasar',       icon: 'BarChart2',       label: 'Harga Pasar'       },
      { path: '/broker/armada',      icon: 'Car',             label: 'Armada & Sopir'    },
      { path: '/broker/simulator',   icon: 'Calculator',      label: 'Simulator Margin'  },
      { path: '/broker/tim',         icon: 'User',            label: 'Tim & Akses'       },
      { path: '/broker/akun',        icon: 'User',            label: 'Akun & Profil'     },
    ]
  },

  peternak: {
    label: 'Peternak',
    icon: '🏚️',
    color: '#7C3AED',
    description: 'Pelihara ayam, pantau FCR & deplesi, catat biaya produksi per kg.',
    bottomNav: [
      { path: '/peternak/beranda',        icon: 'Home',          label: 'Beranda'      },
      { path: '/peternak/siklus',          icon: 'RefreshCw',     label: 'Siklus'       },
      { path: '/peternak/input',           icon: 'ClipboardList', label: 'Input Harian' },
      { path: '/peternak/akun',            icon: 'User',          label: 'Akun'         },
    ],
    drawerMenu: [
      { path: '/peternak/pakan',   icon: 'Package',    label: 'Stok & Pakan' },
      { path: '/harga-pasar',     icon: 'BarChart2',  label: 'Harga Pasar'  },
      { path: '/peternak/akun',    icon: 'User',       label: 'Akun & Profil'},
    ]
  },

  rpa: {
    label: 'RPA / Buyer',
    icon: '🏭',
    color: '#F59E0B',
    description: 'Beli ayam dari broker, kelola order dan pantau hutang pembelian.',
    bottomNav: [
      { path: '/rpa-buyer/beranda', icon: 'Home',           label: 'Beranda' },
      { path: '/rpa-buyer/order',   icon: 'ShoppingCart',   label: 'Order'   },
      { path: '/rpa-buyer/hutang',  icon: 'CreditCard',     label: 'Hutang'  },
      { path: '/rpa-buyer/akun',    icon: 'User',           label: 'Akun'    },
    ],
    drawerMenu: [
      { path: '/rpa-buyer/akun',      icon: 'User',       label: 'Akun & Profil'     },
      { path: '/harga-pasar',        icon: 'BarChart2',  label: 'Harga Pasar'       },
    ]
  }
}

export function getBusinessModel(userType) {
  return BUSINESS_MODELS[userType] || BUSINESS_MODELS.broker
}
