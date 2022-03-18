import { CommandInteraction } from 'discord.js';
import { Observable, observable, Observer, OperatorFunction, Subscription, UnaryFunction } from 'rxjs';
import { SafeSubscriber, Subscriber } from 'rxjs/internal/Subscriber';
import { isSubscription } from 'rxjs/internal/Subscription';

// global error handling (before shutdown)

type GlobalErrorHandler = (exitCode?: number, signal?: string, exception?: Error) => boolean

function globalHandler(exitCode?: number, signal?: string, exception?: Error) {
    if (currentGlobalErrorHandler(exitCode, signal, exception)) {
        removeGlobalErrorHandlers();
        process.kill(process.pid, signal);
    }
}

export const globalDefaultHandler: GlobalErrorHandler = (exitCode?: number, signal?: string, exception?: Error) => {
    console.log(`Program is about to exit${exitCode == undefined ? "" : ` with code "${exitCode}"`}${signal == undefined ? "" : ` with signal "${signal}"`}${exception == undefined ? "" : ` with exception "${exception}"`}`)
    return true;
}
let currentGlobalErrorHandler: GlobalErrorHandler = globalDefaultHandler;

export function initGlobalErrorHandlers(errorHandler: GlobalErrorHandler = globalDefaultHandler): void {
    currentGlobalErrorHandler = errorHandler;
    process.on('SIGINT', globalHandlers.SIGINT);
    process.on('SIGHUP', globalHandlers.SIGHUP);
    process.on('SIGQUIT', globalHandlers.SIGQUIT);
    process.on('SIGTERM', globalHandlers.SIGTERM);
    process.on('SIGUSR1', globalHandlers.SIGUSR1);
    process.on('SIGUSR2', globalHandlers.SIGUSR2);
    process.on('uncaughtException', globalHandlers.uncaughtException);
    process.on('exit', globalHandlers.exit);
}

export function removeGlobalErrorHandlers() {
    process.removeListener('SIGINT', globalHandlers.SIGINT);
    process.removeListener('SIGHUP', globalHandlers.SIGHUP);
    process.removeListener('SIGQUIT', globalHandlers.SIGQUIT);
    process.removeListener('SIGTERM', globalHandlers.SIGTERM);
    process.removeListener('SIGUSR1', globalHandlers.SIGUSR1);
    process.removeListener('SIGUSR2', globalHandlers.SIGUSR2);
    process.removeListener('uncaughtException', globalHandlers.uncaughtException);
    process.removeListener('exit', globalHandlers.exit);
}

const globalHandlers = {
    SIGINT: globalHandler.bind(undefined, undefined, "SIGINT", undefined),
    SIGHUP: globalHandler.bind(undefined, undefined, "SIGHUP", undefined),
    SIGQUIT: globalHandler.bind(undefined, undefined, "SIGQUIT", undefined),
    SIGTERM: globalHandler.bind(undefined, undefined, "SIGTERM", undefined),
    SIGUSR1: globalHandler.bind(undefined, undefined, "SIGUSR1", undefined),
    SIGUSR2: globalHandler.bind(undefined, undefined, "SIGUSR2", undefined),
    uncaughtException: (e: Error) => globalHandler.bind(undefined, undefined, undefined, e)(),
    exit: (code: number, signal: string) => globalHandler.bind(undefined, code, signal, undefined)()
}
// action error handling (just sends error message to user/logs)
export class BotError extends Error {
    public readonly errorType = "BOT_ERROR";

    constructor(message?: string, private userMessage?: string, public log: boolean | "WITH_STACK" = false) {
        super(message)
    }

    public toString() {
        return this.userMessage ?? "an unknown error ocurred";
    }
}
export function errorHandler(error: any, args?: any[]) {
    let interaction: CommandInteraction;
    const arg0 = args?.[0]
    if (arg0 && arg0.isCommand && arg0.isCommand()) {
        interaction = arg0
    }

    if (error?.errorType == "BOT_ERROR") {
        const botError: BotError = error;

        interaction?.reply("" + botError)

        if (botError.log)
            console.warn(`An error occurred in a request: ${botError.message} (${botError})${botError.log == "WITH_STACK" ? "\n" + botError.stack : ""}`)
    }
    else {
        console.error(`An unknown error occurred in a request: ${error}${error?.stack ? "\n" + error.stack : ""}`)
        interaction?.reply("an unexpected error ocurred")
    }
}
export function handleObservableErrors<T>(observable: Observable<T>): Observable<T> {
    return ErrorHandlingObservable.fromObservable(observable)
}

export class ErrorHandlingSubscriber<T> extends SafeSubscriber<T>{
    constructor(
        observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null,
        error?: ((e?: any) => void) | null,
        complete?: (() => void) | null
    ) {
        super();

        let next: ((value: T) => void) | undefined;
        if (typeof observerOrNext === 'function') {
            next = observerOrNext;
        } else if (observerOrNext) {
            ({ next, error, complete } = observerOrNext);
            const context = observerOrNext;

            next = next?.bind(context);
            error = error?.bind(context);
            complete = complete?.bind(context);
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const noop = () => { }
        const defaultErrorHandler = (err: any) => { throw err }

        this.destination = {
            next: next ? ErrorHandlingSubscriber.wrapForErrorHandling(next, this) : noop,
            error: ErrorHandlingSubscriber.wrapForErrorHandling(error ?? defaultErrorHandler, this),
            complete: complete ? ErrorHandlingSubscriber.wrapForErrorHandling(complete, this) : noop,
        };
    }

    public static wrapForErrorHandling(handler: (arg?: any) => void, instance: SafeSubscriber<any>) {
        return (...args: any[]) => {
            try {
                handler(...args);
            } catch (err) {
                setTimeout(() =>
                    errorHandler(err, args))
            }
        }
    }
}
export class ErrorHandlingObservable<T> extends Observable<T>{
    protected _subscribe: any;
    protected _trySubscribe: any;

    static fromObservable<T>(observable: Observable<T>): ErrorHandlingObservable<T> {
        const errorHandlingObservable = new ErrorHandlingObservable((subscriber) => {
            observable.subscribe(value => { subscriber.next(value); });
        });
        return <ErrorHandlingObservable<T>>errorHandlingObservable;
    }

    static isObserver<T>(value: any): value is Observer<T> {
        return value && typeof (value.next) === 'function' && typeof (value.error) === 'function' && typeof (value.complete) === 'function';
    }

    static isSubscriber<T>(value: any): value is Subscriber<T> {
        return (value && value instanceof Subscriber) || (ErrorHandlingObservable.isObserver(value) && isSubscription(value));
    }

    identity<T>(x: T): T {
        return x;
    }

    public pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
        return ErrorHandlingObservable.fromObservable(this.pipeFromArray(operations)(this));
    }

    pipeFromArray<T, R>(fns: Array<UnaryFunction<T, R>>): UnaryFunction<T, R> {
        if (fns.length === 0) {
            return this.identity as UnaryFunction<any, any>;
        }

        if (fns.length === 1) {
            return fns[0];
        }

        return function piped(input: T): R {
            return fns.reduce((prev: any, fn: UnaryFunction<T, R>) => fn(prev), input as any);
        };
    }

    public subscribe(
        observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null,
        error?: ((error: any) => void) | null,
        complete?: (() => void) | null
    ): Subscription {
        const subscriber = ErrorHandlingObservable.isSubscriber(observerOrNext) ? new ErrorHandlingSubscriber(observerOrNext) : new ErrorHandlingSubscriber(observerOrNext, error, complete);

        const { operator, source } = this;

        subscriber.add(
            operator
                ?
                operator.call(subscriber, source)
                : source
                    ?
                    this._subscribe(subscriber)
                    :
                    this._trySubscribe(subscriber)
        );

        return subscriber;
    }
}
