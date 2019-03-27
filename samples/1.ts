type ReturnObjects<T> = {
    [K in keyof T]: T[K] extends ((...args: any[]) => any) ?
    T[K] & Returnable<T[K]> :
    never
}

type Returnable<Fun extends (...args: any[]) => any> = {
    returnValue(val: ReturnType<Fun>): void;
}

interface I {
    f(): string;
    f(x: any): number;
}

let argsObj: ReturnObjects<I>;
argsObj.f.returnValue(1) // OK
argsObj.f.returnValue('1') // ERROR?!



type MapStrings<T> = {
    [K in keyof T]: T[K] extends ((...args: any[]) => string) ?
    T[K] & Returnable<T[K]> :
    never
}

type MapNumbers<T> = {
    [K in keyof T]: T[K] extends ((...args: any[]) => number) ?
    T[K] & Returnable<T[K]> :
    never
}

let tester: MapStrings<I> & MapNumbers<I>;
tester.f() as string; // OK
tester.f(1) as number; // OK
tester.f.returnValue(123); // OK
tester.f.returnValue('123'); // ERROR?!

// This seems to work when manually wiring up the union types

let a1 = { returnValue: (arg: string) => { } }
let a2 = { returnValue: (arg: number) => { } }
let manualUnion: typeof a1 & typeof a2;
manualUnion.returnValue(3) // OK
manualUnion.returnValue('3') // OK

// The function doesn't seem to be the cause since this works as well
interface A {
    (): number
    returnValue: (arg: number) => void
}

interface B {
    (x: any): string
    returnValue: (arg: string) => void
}

let ab: A & B;
ab() as number; // OK
ab({}) as string; // OK
ab.returnValue(1) // OK
ab.returnValue('1') // OK