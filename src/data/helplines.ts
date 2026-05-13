export type Helpline = {
  id: string;
  number: string;
  hi: string;
  en: string;
};

export const HELPLINES: Helpline[] = [
  { id: '181', number: '181', hi: 'महिला हेल्पलाइन', en: 'Women Helpline (24x7)' },
  { id: '112', number: '112', hi: 'आपातकालीन सहायता', en: 'All Emergencies' },
  { id: '1091', number: '1091', hi: 'महिला पुलिस', en: 'Women in Distress (Police)' },
  { id: '1098', number: '1098', hi: 'चाइल्डलाइन', en: 'Childline (Children in distress)' },
  { id: '14416', number: '14416', hi: 'मानसिक स्वास्थ्य', en: 'Tele-MANAS Mental Health' },
  { id: '15100', number: '15100', hi: 'मुफ्त कानूनी सहायता', en: 'NALSA Legal Aid' },
];
