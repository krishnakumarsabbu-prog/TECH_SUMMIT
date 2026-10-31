import { HomeIcon, GridIcon, ScanLineIcon, HelpCircleIcon, UserIcon } from './Icons';

export type NavItem = 'home' | 'booths' | 'passport' | 'faqs' | 'profile';

interface MobileNavProps {
  activeItem?: NavItem;
  onHome?: () => void;
  onBooths?: () => void;
  onPassport?: () => void;
  onFaqs?: () => void;
  onProfile?: () => void;
}

export function MobileNav({
  activeItem = 'home',
  onHome,
  onBooths,
  onPassport,
  onFaqs,
  onProfile,
}: MobileNavProps) {
  return (
    <nav className="ts-mobile-nav" aria-label="Showcase navigation">
      <button
        type="button"
        className={`ts-mobile-nav__item ${activeItem === 'home' ? 'ts-mobile-nav__item--active' : ''}`}
        onClick={onHome}
        aria-label="Home"
      >
        <span className="ts-mobile-nav__icon"><HomeIcon size={22} /></span>
        <small>Home</small>
      </button>

      <button
        type="button"
        className={`ts-mobile-nav__item ${activeItem === 'booths' ? 'ts-mobile-nav__item--active' : ''}`}
        onClick={onBooths}
        aria-label="Booths"
      >
        <span className="ts-mobile-nav__icon"><GridIcon size={22} /></span>
        <small>Booths</small>
      </button>

      <button
        type="button"
        className="ts-mobile-nav__item ts-mobile-nav__item--passport"
        onClick={onPassport}
        aria-label="Passport"
      >
        <div className="ts-mobile-nav__passport-bubble">
          <ScanLineIcon size={26} />
        </div>
      </button>

      <button
        type="button"
        className={`ts-mobile-nav__item ${activeItem === 'faqs' ? 'ts-mobile-nav__item--active' : ''}`}
        onClick={onFaqs}
        aria-label="FAQs"
      >
        <span className="ts-mobile-nav__icon"><HelpCircleIcon size={22} /></span>
        <small>FAQs</small>
      </button>

      <button
        type="button"
        className={`ts-mobile-nav__item ${activeItem === 'profile' ? 'ts-mobile-nav__item--active' : ''}`}
        onClick={onProfile}
        aria-label="Profile"
      >
        <span className="ts-mobile-nav__icon"><UserIcon size={22} /></span>
        <small>Profile</small>
      </button>
    </nav>
  );
}
