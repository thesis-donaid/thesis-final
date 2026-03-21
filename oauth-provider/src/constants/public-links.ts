const PUBLIC_LINK = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  // {
  //   href: '',
  //   label: 'Programs',
  //   children:[
  //       {href: '/program/misyonero', label: 'Misyonero', image: ''},
  //       {href: '/program/youthalive', label: 'Youth Alive'},
  //       {href: '/program/kids-activity', label: 'Kid\'s Activity'},
  //       {href: '/program/gap-year', label: 'Gap Year'}
  //   ]
  // },
  // { href: '/Our Impact', label: 'Our Impact',
  //   children:[
  //     {href: '/OurImpact/CollegeGraduates', label: 'College Graduates', image: ''},
  //     {href: '/OurImpact/ScholarsStories', label: 'Scholars Stories', image: ''},
  //     {href: '/OurImpact/Testimonials', label: 'Testimonials', image: ''},

  //   ]
  //  }
];

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/requests', label: 'Requests' },
  { href: '/admin/pools',  label: 'Pool' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/reports', label: "Reports" },
  { href: '/admin/ledger', label: 'Ledger' }
]

const REGISTERD_LINKS = [
  { href: '/donor', label: 'Dashboard'},
  { href: '/donor/impacts', label: 'Impacts'},
  { href: '/donor/transactions', label: 'Transactions'},
  { href: '/donor/ledger', label: 'Ledger' }
]

const BENEFICIARY_LINKS = [
  { href: '/beneficiary', label: 'Dashboard'},
  { href: '/beneficiary/requests', label: 'Requests' }
]


export {PUBLIC_LINK, ADMIN_LINKS, REGISTERD_LINKS, BENEFICIARY_LINKS};