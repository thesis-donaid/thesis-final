'use client'
import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { ADMIN_LINKS, BENEFICIARY_LINKS, PUBLIC_LINK, REGISTERD_LINKS } from '@/constants/public-links';
import useScrollDirection from '@/hooks/useScrollDirection';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, Heart, CircleUser, LogOut, User, Settings } from 'lucide-react'
import { Button } from '../ui/button';
import { signOut, useSession } from 'next-auth/react';
import { hasChildren } from '@/types/links';
import { Loading } from '../ui/loading';

export default function Header(){
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const scrollDirection = useScrollDirection();
    const [activeLogoutDropdown, setActiveLogoutDropdown] = useState(false);
    const logoutDropdownRef = useRef<HTMLDivElement>(null);
    const [switchMode, setSwitchMode] = useState<boolean>(() => {
        const authPrefixes = ['/beneficiary', '/admin', '/donor', '/profile'];
        if (authPrefixes.some(prefix => pathname.startsWith(prefix))) {
            return true;
        }
        if (pathname === '/') {
            return false;
        }
        return false;
    });
    const [loading, setLoading] = useState(false);
    const mounted = useRef(false);
    const [prevPathname, setPrevPathname] = useState(pathname);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        }
    }, [])

    // Adjust switchMode when pathname changes during render
    // Uses the "store previous value in state" pattern allowed by React:
    // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);

        const authPrefixes = ['/beneficiary', '/admin', '/donor', '/profile'];
        const isAuthSection = authPrefixes.some(prefix => pathname.startsWith(prefix));

        if (isAuthSection) {
            setSwitchMode(true);
        } else if (pathname === '/') {
            setSwitchMode(false);
        }

        if (loading) {
            setLoading(false);
        }
    }


    // useEffect(() => {
    //     const authPrefixes = ['/beneficiary', '/admin', '/profile', '/settings'];
    //     const isAuthSection = authPrefixes.some(prefix => pathname.startsWith(prefix));

    //     // determine the new mode based on pathname
    //     let newMode = false;
    //     if (pathname === '/') {
    //         newMode = false;
    //     } else if (isAuthSection) {
    //         newMode = true;
    //     } else {
    //         newMode = switchMode;
    //     }

    //     // Only update if the value actually changed
    //     if (newMode !== switchMode) {
    //         setSwitchMode(newMode);
    //     }

    //     setLoading(false);
    // }, [pathname])

    useEffect(() => {
        localStorage.setItem('header_switch_mode', JSON.stringify(switchMode));
    }, [switchMode]);



    const translateY = scrollDirection === 'down' ? -100 : 0

    // Get Session of the user
    const { data: session, status } = useSession();

    // Close logout dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (logoutDropdownRef.current && !logoutDropdownRef.current.contains(event.target as Node)) {
                setActiveLogoutDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll)
    }, []);

    const handleClick = () => {
        setIsOpen(false);
        setActiveDropdown(null);
    }

    const toggleDropDown = (index: number) => {
        if(activeDropdown === index) {
            setActiveDropdown(null)
        } else {
            setActiveDropdown(index);
        }
    }

    const handleSignOut = async () => {
        // Clear session cookie via API
        await fetch("/api/auth/logout", { method: "POST" });
        // Also sign out from NextAuth if needed
        signOut({ callbackUrl: "/" });
    };

    const user = session?.user;
    // const links = PUBLIC_LINK;

    const links = useMemo(() => {
        if (!mounted || !switchMode) {
            return PUBLIC_LINK;
        } else if (switchMode) {
            if (user?.role === "admin") return ADMIN_LINKS;
            if (user?.role === "registered") return REGISTERD_LINKS;
            if (user?.role === "beneficiary") return BENEFICIARY_LINKS;
        }

        return PUBLIC_LINK
    }, [switchMode, user?.role, mounted]);


    const toggleSwitchMode = () => {
        const nextMode = !switchMode;
        setLoading(true);
        setSwitchMode(nextMode);
        
        if (nextMode) {
            // Get the links that will be active in the next mode
            let nextLinks = PUBLIC_LINK;
            if (user?.role === "admin") nextLinks = ADMIN_LINKS;
            else if (user?.role === "registered") nextLinks = REGISTERD_LINKS;
            else if (user?.role === "beneficiary") nextLinks = BENEFICIARY_LINKS;

            if (nextLinks && nextLinks.length > 0) {
                router.push(nextLinks[0].href);
            }
        }

        if(!nextMode) {
            router.push('/');
        }
    }

    return (
        <>
        {loading && <Loading variant="fullscreen" loadingName="Switching Mode..." className="text-red-600" />}
        <header className={`fixed flex flex-col top-0 md:top-8 left-0 right-0 z-100 transition-all duration-500 ease-out ${isScrolled ? 'bg-white/98 shadow-lg py-2' : 'bg-white/95 shadow-sm py-3'} backdrop-blur-md border-b border-gray-100`}
            style={{ transform: `translateY(${translateY}%)`}}
        >
            <nav className='w-full px-3 sm:px-4 flex justify-between items-center gap-8'>
                {/* Logo */}
                <Link 
                    href="/"
                    className='flex items-center space-x-2 sm:space-x-3 group hover:drop-shadow-xl flex-shrink-0'
                >
                    <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0'>
                        <Image
                            src="/logo.jpg"
                            fill
                            alt="PNA Logo"
                            className='w-full h-full object-cover rounded-full ring-2 ring-red-100 group-hover:ring-red-200 transition-all'
                        />
                    </div>

                    <div className='transition-all duration-300 group-hover:translate-x-1 truncate'>
                        <h1 className='text-sm sm:text-base md:text-xl font-bold text-gray-900 truncate'>
                            Puso ng Ama Foundation
                        </h1>
                        <p className='text-[10px] sm:text-xs md:text-sm text-gray-600 flex items-center'>
                            Spreading love and hope
                        </p>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className='hidden md:flex items-center justify-center flex-1 space-x-1'>
                    {links.map((link,index) => (
                        <div key={link.href}
                            className='relative group'
                        >
                            <Link href={link.href}
                                className={`relative px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 flex items-center text-sm lg:text-base ${pathname === link.href ? 'text-red-600' : 'text-gray-700'} hover:text-red-400`}
                                onMouseEnter={() => hasChildren(link) && setActiveDropdown(index)}
                                onMouseLeave={() => hasChildren(link) && setActiveDropdown(null)}
                                onClick={() => !hasChildren(link) && setActiveDropdown(index)}
                            >
                                {link.label}
                                {hasChildren(link) && (
                                    <ChevronDown
                                        className={`ml-1 h-3 w-3 lg:h-4 lg:w-4 transition-transform duration-300 ${activeDropdown === index ? 'rotate-180' : ''}`}
                                    />
                                )}
                                {pathname === link.href && (
                                    <span className='absolute bottom-0 left-3 lg:left-4 right-3 lg:right-4 h-0.5 bg-red-600 rounded-full'></span>
                                )}
                                <span className='absolute inset-0 scale-0 rounded-lg bg-red-50 group-hover:scale-100 transition-transform duration-300 -z-10'></span>
                            </Link>

                            {/* Dropdown for desktop */}
                            {hasChildren(link) && (
                                <div className={`absolute top-full left-0 mt-1 w-48 bg-white max-h-100 overflow-y-auto rounded-lg shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top ${activeDropdown === index ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}
                                scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-50 scrollbar-thumb-rounded-full hover:scrollbar-thumb-red-400
                                `}>
                                    {link.children.map((child) => (
                                        <Link key={child.href}
                                            href={child.href}
                                            className={`block px-4 py-3 text-sm transition-colors duration-300 ${pathname === child.href ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-red-500'}`}
                                            onMouseEnter={() => setActiveDropdown(index)}
                                            onMouseLeave={() => setActiveDropdown(null)}
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {(!user || user.role === "registered") && (

                        <Link 
                            href="/donation"
                            className='ml-2 px-3 lg:px-4 py-2 text-gray-700 cursor-pointer flex items-center justify-center transition-all duration-300 rounded-lg hover:shadow-md transform hover:-translate-y-0.5 hover:bg-red-50'
                        >
                            <Heart className='text-red-600 h-4 w-4 lg:h-5 lg:w-5'/>
                            <span className='text-sm lg:text-base font-light ml-1.5'>Donate</span>
                        </Link>
                    )

                    }
                </div>

                {/* Mobile Toggle Button */}
                <button className='md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all active:bg-gray-200'
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label='Toggle menu'
                >
                    {isOpen ? (
                        <X className='h-5 w-5 sm:h-6 sm:w-6 text-red-600 transition-transform duration-100'/>
                    ): (
                        <Menu className='h-5 w-5 sm:h-6 sm:w-6 text-gray-700 transition-transform duration-100'/>
                    )}
                </button>

                {/* User Section - Desktop */}
                {user ? (
                    <div className='hidden md:flex items-center space-x-6 ml-4 relative' ref={logoutDropdownRef}>
                        <div className="flex items-center space-x-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {switchMode ? 'Switch Original Page' : `Switch ${user.role} Mode`}
                            </span>
                            <label className="inline-flex items-center cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={switchMode}
                                    onChange={toggleSwitchMode}
                                />
                                <div className="relative w-11 h-6 bg-gray-300 rounded-full peer 
                                                peer-focus:ring-4 peer-focus:ring-red-100 
                                                peer-checked:after:translate-x-full peer-checked:after:border-white 
                                                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                                after:bg-white after:border-gray-300 after:border after:rounded-full 
                                                after:h-5 after:w-5 after:transition-all 
                                                peer-checked:bg-red-600">
                                </div>
                            </label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                                {user?.name}
                            </span>
                            {/* User Avatar Button */}
                            <button 
                                onClick={() => setActiveLogoutDropdown(!activeLogoutDropdown)} 
                                className='hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full'
                                aria-expanded={activeLogoutDropdown}
                                aria-haspopup="true"
                            >
                                <CircleUser className='w-9 h-9 text-red-600'/>
                            </button>
                        </div>

                        {/* Logout Dropdown - FIXED: using activeLogoutDropdown instead of activeDropdown */}
                        {activeLogoutDropdown && (
                            <div className={`absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top-right ${
                                activeLogoutDropdown ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                            }`}
                            role="menu"
                            aria-orientation="vertical"
                            >
                                {/* User Info Section */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                                </div>

                                {/* Menu Items */}
                                <div className="p-2">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                        role="menuitem"
                                        onClick={() => setActiveLogoutDropdown(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>


                                    <div className="border-t border-gray-100 my-2"></div>

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        role="menuitem"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Button onClick={() => router.push('/login')} className='hidden md:inline-flex text-white px-4 py-2 bg-red-500 hover:bg-red-600 transition-all hover:shadow-md'>
                        Login
                    </Button>
                )}
            </nav>

            {/* Mobile Menu */}
            <div className={`md:hidden w-full bg-white/95 backdrop-blur-md border-t border-gray-100 transition-all duration-500 ease-in-out overflow-hidden ${
                isOpen ? 'max-h-[80vh] opacity-100 visible' : 'max-h-0 opacity-0 invisible'
            }`}>
                <div className='px-3 py-3 space-y-1 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-50'>
                    {links.map((link, index) => (
                        <div key={link.href} className='opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]' style={{ animationDelay: `${index * 50}ms` }}>
                            {hasChildren(link) ? (
                                <div className='mb-1'>
                                    <button 
                                        onClick={() => toggleDropDown(index)}
                                        className={`flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all duration-300 ${
                                            pathname.startsWith(link.href) 
                                                ? 'bg-red-50 text-red-600 font-medium' 
                                                : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                                        }`}
                                    >
                                        <span className='text-sm font-medium'>{link.label}</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${
                                            activeDropdown === index ? 'rotate-180' : ''
                                        }`}/>
                                    </button>
                                    <div className={`pl-4 overflow-hidden transition-all duration-500 ease-in-out ${
                                        activeDropdown === index ? 'max-h-96 mt-1' : 'max-h-0'
                                    }`}>
                                        {link.children.map((child, childIndex) => (
                                            <Link 
                                                key={child.href}
                                                href={child.href}
                                                onClick={handleClick}
                                                className={`block py-2.5 px-4 my-0.5 rounded-lg text-sm transition-all duration-300 ${
                                                    pathname === child.href 
                                                        ? 'bg-red-50 text-red-600 font-medium border-l-4 border-red-600' 
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-500 active:bg-gray-100'
                                                }`}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link 
                                    href={link.href}
                                    onClick={handleClick}
                                    className={`block py-3 px-4 rounded-xl text-sm transition-all duration-300 ${
                                        pathname === link.href 
                                            ? 'bg-red-50 text-red-600 font-medium border-l-4 border-red-600' 
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-red-500 active:bg-gray-100'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            )}
                        </div>
                    ))}
                    
                    {/* Mobile Donate Button */}
                    <div className='pt-3 mt-2 border-t border-gray-100'>
                        <Link 
                            href="/donation"
                            onClick={handleClick}
                            className='w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 font-medium shadow-md flex items-center justify-center active:scale-[0.98]'
                        >
                            <Heart className='mr-2 h-5 w-5'/>
                            Donate Now
                        </Link>
                    </div>

                    {/* Mobile User Section */}
                    {user ? (
                        <div className='pt-3 mt-2 border-t border-gray-100 space-y-2'>
                            {/* User info row */}
                            <div className='flex items-center gap-3 py-2 px-2'>
                                <CircleUser className='w-8 h-8 text-red-600 shrink-0'/>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm font-semibold text-gray-900 truncate'>{user?.name}</p>
                                    <p className='text-xs text-gray-400 truncate'>{user?.email}</p>
                                </div>
                            </div>

                            {/* Switch mode row */}
                            <div className='flex items-center justify-between py-2 px-2 bg-gray-50 rounded-xl'>
                                <span className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
                                    {switchMode ? 'Switch Original Page' : `Switch ${user.role} Mode`}
                                </span>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={switchMode}
                                        onChange={() => {
                                            setIsOpen(false);
                                            toggleSwitchMode();
                                        }}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-300 rounded-full
                                                    peer-focus:ring-4 peer-focus:ring-red-100
                                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                                    after:bg-white after:border-gray-300 after:border after:rounded-full
                                                    after:h-5 after:w-5 after:transition-all
                                                    peer-checked:bg-red-600">
                                    </div>
                                </label>
                            </div>

                            {/* Profile & Settings links */}
                            <Link
                                href="/profile"
                                onClick={handleClick}
                                className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors'
                            >
                                <User className='w-4 h-4' />
                                Profile
                            </Link>
                            <Link
                                href="/settings"
                                onClick={handleClick}
                                className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors'
                            >
                                <Settings className='w-4 h-4' />
                                Settings
                            </Link>

                            {/* Sign Out */}
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className='pt-3 mt-2 border-t border-gray-100'>
                            <button
                                onClick={() => { setIsOpen(false); router.push('/login'); }}
                                className='w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]'
                            >
                                <CircleUser className='w-5 h-5' />
                                Login
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add this to your global CSS file instead */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </header>
        </>
    )
}