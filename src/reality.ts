import {JulianDate} from './cesium/cesium-imports.ts'
import {inject, factory, Container} from 'aurelia-dependency-injection'
import {FrameState} from './context.ts'
import {TimerService} from './timer.ts'
import {Role, Session, SessionFactory, MessageChannelFactory, MessagePortLike} from './session.ts'
import {calculatePose} from './utils.ts'

/**
* Describes a Reality
*/
export interface Reality {
    type: string;
    id?: string;
    [option: string]: any
}

/**
* Assists in setting up a reality and stores the mappings from realities to their handler functions
*/
@inject(TimerService, MessageChannelFactory, SessionFactory)
export class RealityService {

    /**
     * A map of reality types and their respective setup functions.
     * In order to support a new type of reality, the setup function must be added to this map.
     */
    public handlers = new Map<string, (reality: Reality, port: MessagePortLike) => void>();

    /**
    * Assigns a timer, messageChannelFactory, and sessionFactory to this reality setup service. Sets up an empty reality
    */
    constructor(
        public timer: TimerService,
        public messageChannelFactory: MessageChannelFactory,
        public sessionFactory: SessionFactory) {
        this.handlers.set('empty', this.setupEmptyReality);
    }


    /**
     * Setup a reality (a handler for the provided reality type must 
     * exist or an error will be thrown)
     * @param reality the reality to setup
     * @param port the port to pass to the setup function
     */
    public setup(reality: Reality, port: MessagePortLike) {
        const handler = this.handlers.get(reality.type);
        if (!handler) throw new Error("Cannot setup an unsupported reality");
        handler.call(this, reality, port);
    }

    /**
    * Check if a type of reality is supported by this ArgonSystem. 
    * @param type reality type
    * @return true if a handler exists and false otherwise
    */
    public isSupported(type: string): boolean {
        return !!this.handlers.get(type)
    }

    private setupEmptyReality(reality: Reality, port: MessagePortLike) {
        const channel = this.messageChannelFactory.create();
        const remoteRealitySession = this.sessionFactory.create();
        let doUpdate = true;
        remoteRealitySession.openEvent.addEventListener(() => {
            const update = (time: JulianDate, frameNumber: number) => {
                if (doUpdate) {
                    const frameState: FrameState = {
                        time,
                        frameNumber
                    }
                    remoteRealitySession.send('ar.context.update', frameState);
                    this.timer.requestFrame(update);
                }
            }
            this.timer.requestFrame(update);
        })
        remoteRealitySession.closeEvent.addEventListener(() => {
            doUpdate = false;
        });
        remoteRealitySession.open(port, { role: Role.REALITY });
    }

}
