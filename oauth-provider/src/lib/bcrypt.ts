import bcrypt from "bcryptjs";

interface Bcrypthash {
    text: string,
    number: number,
}

interface BcryptCompare {
    value: string,
    storedValue: string
}

export async function setStringToHash(text: string, number: number) {
    const hashed = await bcrypt.hash(text, number);

    return hashed;
}

export async function compareHash({ value, storedValue }: BcryptCompare) {
    const compared = await bcrypt.compare(value, storedValue);
    return compared;
}