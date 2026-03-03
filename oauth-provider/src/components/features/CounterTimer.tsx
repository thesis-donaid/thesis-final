"use client"


type CountdownTimerProps = {
    // Initial time in seconds (default size)
    initialSeconds?: number;
    // Auto-start when mounted (default false)
    autoStart?: boolean;
    // callback when timer reaches zero
    onComplete?: () => void;
    // optional: classname forstyling
    className?: string
}

export default function CountdownTimerProps({
    initialSeconds = 120,
    autoStart = false,
    onComplete,
    className
}: CountdownTimerProps) {
    
    return(
        <div className={className}>

        </div>
    )
}