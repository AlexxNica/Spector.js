namespace SPECTOR {
    export interface ICanvasSpy {
        readonly onContextRequested: IEvent<IContextInformation>;
    }

    export interface ICanvasSpyOptions {
        readonly canvas?: HTMLCanvasElement;
        readonly eventConstructor: EventConstructor;
    }

    export type CanvasSpyConstructor = {
        new (options: ICanvasSpyOptions, logger: ILogger): ICanvasSpy,
    };
}

namespace SPECTOR.Spies {
    export class CanvasSpy implements ICanvasSpy {
        public readonly onContextRequested: IEvent<IContextInformation>;

        private readonly canvas: HTMLCanvasElement;

        private spiedGetContext: (contextId: string, contextAttributes?: {}) =>
            CanvasRenderingContext2D | WebGLRenderingContexts | undefined;

        constructor(private readonly options: ICanvasSpyOptions, private readonly logger: ILogger) {
            this.onContextRequested = new options.eventConstructor<IContextInformation>();
            this.canvas = options.canvas;

            this.init();
        }

        private init(): void {
            const self = this;
            const getContextSpied = function (this: HTMLCanvasElement) {
                const context = self.spiedGetContext.apply(this, arguments);

                if (arguments.length > 0 && arguments[0] === "2d") {
                    return context;
                }

                if (context) {
                    const contextAttributes = Array.prototype.slice.call(arguments);
                    const isWebgl2 = (contextAttributes[0] === "webgl2" ||
                        contextAttributes[0] === "experimental-webgl2");

                    const version = isWebgl2 ? 2 : 1;

                    self.onContextRequested.trigger({
                        context,
                        contextVersion: version,
                    });
                }

                return context;
            };

            if (this.canvas) {
                this.spiedGetContext = this.canvas.getContext;
                this.canvas.getContext = getContextSpied;
            }
            else {
                this.spiedGetContext = HTMLCanvasElement.prototype.getContext;
                (HTMLCanvasElement as any).prototype.getContext = getContextSpied;
            }
        }
    }
}
