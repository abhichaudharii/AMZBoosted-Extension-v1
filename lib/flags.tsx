import React from 'react';

// Reusable Flag Component using flagcdn
export const FlagIcon: React.FC<{ countryCode: string; className?: string }> = ({ countryCode, className = 'w-5 h-4' }) => (
    <img 
        src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} 
        srcSet={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png 2x`}
        width="20" 
        alt={countryCode} 
        className={`rounded-sm object-cover ${className}`}
    />
);

export const FlagUS: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="US" className={className} />;
export const FlagUK: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="GB" className={className} />; // UK is GB in flagcdn
export const FlagCA: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="CA" className={className} />;
export const FlagIN: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="IN" className={className} />;
export const FlagDE: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="DE" className={className} />;
export const FlagFR: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="FR" className={className} />;
export const FlagIT: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="IT" className={className} />;
export const FlagES: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="ES" className={className} />;

export const FlagIE: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="IE" className={className} />;
export const FlagZA: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="ZA" className={className} />;
export const FlagAU: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="AU" className={className} />;
export const FlagBE: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="BE" className={className} />;
export const FlagBR: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="BR" className={className} />;
export const FlagEG: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="EG" className={className} />;
export const FlagJP: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="JP" className={className} />;
export const FlagMX: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="MX" className={className} />;
export const FlagNL: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="NL" className={className} />;
export const FlagPL: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="PL" className={className} />;
export const FlagSA: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="SA" className={className} />;
export const FlagSG: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="SG" className={className} />;
export const FlagSE: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="SE" className={className} />;
export const FlagTR: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="TR" className={className} />;
export const FlagAE: React.FC<{ className?: string }> = ({ className }) => <FlagIcon countryCode="AE" className={className} />;

export const flags = {
  us: FlagUS,
  uk: FlagUK,
  ca: FlagCA,
  in: FlagIN,
  de: FlagDE,
  fr: FlagFR,
  it: FlagIT,
  es: FlagES,
  ie: FlagIE,
  za: FlagZA,
  au: FlagAU,
  be: FlagBE,
  br: FlagBR,
  eg: FlagEG,
  jp: FlagJP,
  mx: FlagMX,
  nl: FlagNL,
  pl: FlagPL,
  sa: FlagSA,
  sg: FlagSG,
  se: FlagSE,
  tr: FlagTR,
  ae: FlagAE,
} as const;

export type FlagKey = keyof typeof flags;
