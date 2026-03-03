'use client'
import {useEffect, useState} from 'react'

type ScrollDirection = 'up' | 'down' | null
export default function useScrollDirection(): ScrollDirection {
    const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
    const [prevScrollPos, setPrevScrollPos] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.pageYOffset;

            if(currentScrollPos > prevScrollPos + 5){
                setScrollDirection('down');
            } else if (currentScrollPos < prevScrollPos - 5){
                setScrollDirection('up');
            }

            setPrevScrollPos(currentScrollPos);
        }

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos])
    return scrollDirection
}
 

