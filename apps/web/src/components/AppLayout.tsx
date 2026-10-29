import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.js';
import { useEffect, useRef, useState } from 'react';

const REPO_URL = 'https://github.com/omanshchoudhary/rasbur';
const NPM_URL = 'https://www.npmjs.com/org/rasbur';

type NavItem = {
    to: string;
    label: string;
    auth?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { to: '/decode', label: 'Workspace' },
    { to: '/compare', label: 'Compare', auth: true },
    { to: '/history', label: 'History', auth: true },
    { to: '/docs', label: 'Docs' },
    { to: '/about', label: 'About' },
];

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function AppLayout() {
    // Getting context about User state
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const visibleItems = NAV_ITEMS.filter((item) => !item.auth || isAuthenticated);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);

        if (!location.hash) return;
        const target = document.getElementById(location.hash.slice(1));
        if (!target) return;
        const timer = window.setTimeout(() => target.scrollIntoView({ block: 'start' }), 60);
        return () => window.clearTimeout(timer);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (!isUserMenuOpen) return;

        function onPointerDown(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsUserMenuOpen(false);
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isUserMenuOpen]);

    function handleSignOut() {
        setIsUserMenuOpen(false);
        logout();
        navigate('/');
    }

    return (
        <div className="sh">
            <header className="sh-header">
                <div className="sh-header-inner">
                    <NavLink to="/" className="sh-brand" aria-label="Rasbur home">
                        rasbur
                    </NavLink>

                    <nav className="sh-nav" aria-label="Main">
                        {visibleItems.map((item) => (
                            <NavLink key={item.to} to={item.to} className="sh-nav-link">
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sh-actions">
                        <a
                            className="sh-action-link"
                            href={REPO_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub
                        </a>
                        <a
                            className="sh-action-link"
                            href={NPM_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            npm
                        </a>

                        {isAuthenticated && user ? (
                            <div className="sh-user" ref={userMenuRef}>
                                <button
                                    type="button"
                                    className="sh-user-button"
                                    aria-haspopup="menu"
                                    aria-expanded={isUserMenuOpen}
                                    onClick={() => setIsUserMenuOpen((open) => !open)}
                                >
                                    {user.avatar ? (
                                        <img className="sh-avatar" src={user.avatar} alt="" />
                                    ) : (
                                        <span className="sh-avatar sh-avatar--initials">
                                            {initials(user.name)}
                                        </span>
                                    )}
                                    <span className="sh-user-name">{user.name}</span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="sh-user-menu" role="menu">
                                        <div className="sh-user-meta">
                                            <span className="sh-user-meta-name">{user.name}</span>
                                            <span className="sh-user-meta-email">{user.email}</span>
                                        </div>
                                        <NavLink
                                            to="/settings/profile"
                                            className="sh-user-item"
                                            role="menuitem"
                                        >
                                            Profile
                                        </NavLink>
                                        <NavLink
                                            to="/settings/api-keys"
                                            className="sh-user-item"
                                            role="menuitem"
                                        >
                                            API keys
                                        </NavLink>
                                        <button
                                            type="button"
                                            className="sh-user-item sh-user-item--button"
                                            role="menuitem"
                                            onClick={handleSignOut}
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <NavLink to="/login" className="sh-sign-in">
                                Sign in
                            </NavLink>
                        )}

                        <button
                            type="button"
                            className="sh-menu-toggle"
                            aria-expanded={isMenuOpen}
                            aria-controls="sh-mobile-nav"
                            onClick={() => setIsMenuOpen((open) => !open)}
                        >
                            {isMenuOpen ? 'Close' : 'Menu'}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <nav id="sh-mobile-nav" className="sh-mobile-nav" aria-label="Main">
                        {visibleItems.map((item) => (
                            <NavLink key={item.to} to={item.to} className="sh-mobile-link">
                                {item.label}
                            </NavLink>
                        ))}
                        <a
                            className="sh-mobile-link"
                            href={REPO_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub
                        </a>
                        <a
                            className="sh-mobile-link"
                            href={NPM_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            npm
                        </a>
                    </nav>
                )}
            </header>

            <div className="sh-content">
                <Outlet />
            </div>

            <footer className="sh-footer">
                <div className="sh-footer-inner">
                    <p className="sh-footer-text">
                        Rasbur is free and open source under the MIT license.
                    </p>
                    <div className="sh-footer-links">
                        <a href={REPO_URL} target="_blank" rel="noreferrer">
                            GitHub
                        </a>
                        <a
                            href="https://www.npmjs.com/package/@rasbur/decoders"
                            target="_blank"
                            rel="noreferrer"
                        >
                            @rasbur/decoders
                        </a>
                        <a
                            href="https://www.npmjs.com/package/@rasbur/mcp"
                            target="_blank"
                            rel="noreferrer"
                        >
                            @rasbur/mcp
                        </a>
                        <NavLink to="/privacy">Privacy</NavLink>
                        <NavLink to="/terms">Terms</NavLink>
                    </div>
                </div>
            </footer>
        </div>
    );
}
