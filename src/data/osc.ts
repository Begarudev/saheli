// Sample One-Stop Centre (Sakhi) entries. Real district routing is wave-3.
// Numbers are illustrative; UI shows them as tap-to-call cards.

export type OSC = {
  id: string;
  name: string;
  district: string;
  state: string;
  phone: string;
};

export const OSCS: OSC[] = [
  {
    id: 'osc-delhi-cnt',
    name: 'Sakhi One-Stop Centre, Nirmal Chhaya',
    district: 'New Delhi',
    state: 'Delhi',
    phone: '01124673366',
  },
  {
    id: 'osc-mum-bandra',
    name: 'OSC Mumbai (Bandra Bhabha Hospital)',
    district: 'Mumbai',
    state: 'Maharashtra',
    phone: '02226422775',
  },
  {
    id: 'osc-blr',
    name: 'Santwana OSC, Vanivilas Hospital',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    phone: '08026700700',
  },
  {
    id: 'osc-luck',
    name: 'OSC Lucknow, Avantibai Hospital',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    phone: '05222625000',
  },
  {
    id: 'osc-jaipur',
    name: 'Aparajita OSC, Mahila Thana',
    district: 'Jaipur',
    state: 'Rajasthan',
    phone: '01412744000',
  },
];
