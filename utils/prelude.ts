
export type Language =
    | 'English'

export const languages = {
    English: 'English'
}

export type Message =
    | 'ErrUnexpected'
    | 'ErrMissingSymbol'

export const errors = {
    ErrUnexpected: 'ErrUnexpected',
    ErrMissingSymbol: 'ErrMissingSymbol'
}

export function to_string(message: Message, lang: Language): string {
    switch (lang) {
        case 'English': {
            switch (message) {
                case 'ErrUnexpected': return 'Unexpected Error'
                case 'ErrMissingSymbol': return 'Symbol not found'
                default: {
                    const _exhaustiveCheck: never = message
                    return _exhaustiveCheck
                }
            }
        }
        default: {
            const _exhaustiveCheck: never = lang
            return _exhaustiveCheck
        }
    }
}

export class CustomError {
    value: Message | Record<string, CustomError>

    constructor(value: Message | Record<string, CustomError>) {
        this.value = value
    }
}

export class Ok<T> {
    readonly value: T

    constructor(value: T) {
        this.value = value
    }
}

export class Err {
    readonly value: CustomError

    constructor(value: CustomError) {
        this.value = value
    }
}

export type Result<T> = Ok<T> | Err

export function unwrap<T>(result: Result<T>): result is Ok<T> {
    return result instanceof Ok
}

export type Option<T> = Ok<T> | undefined
