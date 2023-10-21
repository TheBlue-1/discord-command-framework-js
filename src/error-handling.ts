import type { CommandInteraction } from "discord.js";
import {
  Observable,
  type Observer,
  type OperatorFunction,
  type Subscription,
  type UnaryFunction,
} from "rxjs";
import { SafeSubscriber, Subscriber } from "rxjs/internal/Subscriber";
import { isSubscription } from "rxjs/internal/Subscription";

// global error handling (before shutdown)

type GlobalErrorHandler = (
  exitCode?: number,
  signal?: string,
  exception?: Error,
  kill?: boolean,
) => boolean;

export const globalDefaultHandler: GlobalErrorHandler = (
  exitCode?: number,
  signal?: string,
  exception?: Error,
  kill?: boolean,
) => {
  console.log(
    `Program is about to ${!(kill ?? false) ? "(NOT) " : ""}exit${
      exitCode === undefined ? "" : ` with code "${exitCode}"`
    }${signal === undefined ? "" : ` with signal "${signal}"`}${
      exception === undefined
        ? ""
        : ` with exception "${exception}" ${exception.stack}`
    }`,
  );
  return kill;
};
let currentGlobalErrorHandler: GlobalErrorHandler = globalDefaultHandler;

function globalHandler(
  exitCode?: number,
  signal?: string,
  exception?: Error,
  kill = true,
) {
  if (currentGlobalErrorHandler(exitCode, signal, exception, kill)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    removeGlobalErrorHandlers();
    process.kill(process.pid, signal);
  }
}

const globalHandlers = {
  SIGINT: globalHandler.bind(undefined, undefined, "SIGINT", undefined),
  SIGHUP: globalHandler.bind(undefined, undefined, "SIGHUP", undefined),
  SIGQUIT: globalHandler.bind(undefined, undefined, "SIGQUIT", undefined),
  SIGTERM: globalHandler.bind(undefined, undefined, "SIGTERM", undefined),
  SIGUSR1: globalHandler.bind(undefined, undefined, "SIGUSR1", undefined),
  SIGUSR2: globalHandler.bind(undefined, undefined, "SIGUSR2", undefined),
  uncaughtException: (e: Error) =>
    globalHandler.bind(undefined, undefined, undefined, e, false)(),
  exit: (code: number, signal: string) =>
    globalHandler.bind(undefined, code, signal, undefined, false)(),
};

export function initGlobalErrorHandlers(
  errorHandler: GlobalErrorHandler = globalDefaultHandler,
): void {
  currentGlobalErrorHandler = errorHandler;
  process.on("SIGINT", globalHandlers.SIGINT);
  process.on("SIGHUP", globalHandlers.SIGHUP);
  process.on("SIGQUIT", globalHandlers.SIGQUIT);
  process.on("SIGTERM", globalHandlers.SIGTERM);
  process.on("SIGUSR1", globalHandlers.SIGUSR1);
  process.on("SIGUSR2", globalHandlers.SIGUSR2);
  process.on("uncaughtException", globalHandlers.uncaughtException);
  process.on("exit", globalHandlers.exit);
}

export function removeGlobalErrorHandlers() {
  process.removeListener("SIGINT", globalHandlers.SIGINT);
  process.removeListener("SIGHUP", globalHandlers.SIGHUP);
  process.removeListener("SIGQUIT", globalHandlers.SIGQUIT);
  process.removeListener("SIGTERM", globalHandlers.SIGTERM);
  process.removeListener("SIGUSR1", globalHandlers.SIGUSR1);
  process.removeListener("SIGUSR2", globalHandlers.SIGUSR2);
  process.removeListener("uncaughtException", globalHandlers.uncaughtException);
  process.removeListener("exit", globalHandlers.exit);
}

// action error handling (just sends error message to user/logs)
export class BotError extends Error {
  public readonly errorType = "BOT_ERROR";

  public constructor(
    private readonly userMessage?: string,
    message: string = userMessage,
    public log: boolean | "WITH_STACK" = false,
  ) {
    super(message);
  }

  public toString() {
    return this.userMessage ?? "an unknown error ocurred";
  }
}
export function errorHandler(error: unknown, args?: unknown[]) {
  let interaction: CommandInteraction;
  const arg0 = args?.[0];
  if (("isCommand" in arg0) & arg0.isCommand?.()) {
    interaction = arg0;
  }

  if (error?.errorType === "BOT_ERROR") {
    const botError: BotError = error;

    interaction.reply(`${botError}`).catch(() => {
      console.warn("couldn't reply after error");
    });

    if (botError.log !== false) {
      console.warn(
        `An error occurred in a request: ${botError.message} (${botError})${
          botError.log === "WITH_STACK" ? `\n${botError.stack}` : ""
        }`,
      );
    }
  } else {
    console.error(
      `An unknown error occurred in a request: ${error}${
        "stack" in error ? `\n${error.stack}` : ""
      }`,
    );
    interaction.reply("an unexpected error ocurred").catch(() => {
      console.warn("couldn't reply after error");
    });
  }
}

export class ErrorHandlingSubscriber<T> extends SafeSubscriber<T> {
  public constructor(
    observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null,
    error?: ((e?: unknown) => void) | null,
    complete?: (() => void) | null,
  ) {
    super();

    let next: ((value: T) => void) | undefined;
    if (typeof observerOrNext === "function") {
      next = observerOrNext;
    } else if (observerOrNext) {
      ({ next, error, complete } = observerOrNext);
      const context = observerOrNext;

      next = next?.bind(context);
      error = error?.bind(context);
      complete = complete?.bind(context);
    }

    const noop = () => {
      // does nothing
    };
    const defaultErrorHandler = (err: unknown) => {
      throw err;
    };

    this.destination = {
      next: next
        ? ErrorHandlingSubscriber.wrapForErrorHandling(next, this)
        : noop,
      error: ErrorHandlingSubscriber.wrapForErrorHandling(
        error ?? defaultErrorHandler,
        this,
      ),
      complete: complete
        ? ErrorHandlingSubscriber.wrapForErrorHandling(complete, this)
        : noop,
    };
  }

  public static wrapForErrorHandling(
    handler: (arg?: unknown) => void,
    instance: SafeSubscriber<unknown>,
  ) {
    return async (...args: unknown[]) => {
      try {
        handler(...args);
      } catch (err) {
        setTimeout(() => errorHandler(err, args));
      }
    };
  }
}
export class ErrorHandlingObservable<T> extends Observable<T> {
  protected _subscribe: unknown;
  protected _trySubscribe: unknown;

  public static fromObservable<T>(
    observable: Observable<T>,
  ): ErrorHandlingObservable<T> {
    const errorHandlingObservable = new ErrorHandlingObservable(
      (subscriber) => {
        observable.subscribe((value) => {
          subscriber.next(value);
        });
      },
    );
    return errorHandlingObservable as ErrorHandlingObservable<T>;
  }

  public static isObserver<T>(value: unknown): value is Observer<T> {
    return (
      typeof value.next === "function" &&
      typeof value.error === "function" &&
      typeof value.complete === "function"
    );
  }

  public static isSubscriber<T>(value: unknown): value is Subscriber<T> {
    return (
      value instanceof Subscriber ||
      (ErrorHandlingObservable.isObserver(value) && isSubscription(value))
    );
  }

  public identity<T>(x: T): T {
    return x;
  }

  public pipe(
    ...operations: OperatorFunction<unknown, unknown>[]
  ): Observable<unknown> {
    return ErrorHandlingObservable.fromObservable(
      this.pipeFromArray(operations)(this),
    );
  }

  public pipeFromArray<T, R>(fns: UnaryFunction<T, R>[]): UnaryFunction<T, R> {
    if (fns.length === 0) {
      return this.identity as UnaryFunction<unknown, unknown>;
    }

    if (fns.length === 1) {
      return fns[0];
    }

    return function piped(input: T): R {
      return fns.reduce<unknown>(
        (prev: unknown, fn: UnaryFunction<T, R>) => fn(prev),
        input,
      );
    };
  }

  public subscribe(
    observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null,
    error?: ((error: unknown) => void) | null,
    complete?: (() => void) | null,
  ): Subscription {
    const subscriber = ErrorHandlingObservable.isSubscriber(observerOrNext)
      ? new ErrorHandlingSubscriber(observerOrNext)
      : new ErrorHandlingSubscriber(observerOrNext, error, complete);

    const { operator, source } = this;

    subscriber.add(
      operator
        ? operator.call(subscriber, source)
        : source
        ? this._subscribe(subscriber)
        : this._trySubscribe(subscriber),
    );

    return subscriber;
  }
}

export function handleObservableErrors<T>(
  observable: Observable<T>,
): ErrorHandlingObservable<T> {
  return ErrorHandlingObservable.fromObservable(observable);
}
