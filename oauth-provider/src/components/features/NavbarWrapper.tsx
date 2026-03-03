"use client"

import { usePathname } from "next/navigation"
import HeaderContact from "./HeaderContact";
import Header from "./Header";


export default function NavbarWrapper() {
    const pathname = usePathname();

    // Add all paths where you want to HIDS the header
    const hiddenRoutes = ["/login", "/signup", "/auth/verify"]

    if(hiddenRoutes.includes(pathname)) {
        return null;
    }

    return (
        <>
            <HeaderContact/>
            <Header/>
        </>
    )
}