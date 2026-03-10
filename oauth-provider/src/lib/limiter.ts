
import { RateLimiterMemory } from "rate-limiter-flexible";

const loginRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60
})