
import {inject} from 'aurelia-dependency-injection'
import {Matrix4, JulianDate} from '../cesium/cesium-imports'

import {Role, SerializedPartialFrameState, SubviewType} from '../common'
import {SessionService, SessionPort} from '../session'
import {DeviceService} from '../device'
import {TimerService} from '../timer'
import {RealityLoader, RealityView} from '../reality'
import {ViewService} from '../view'
import {getSerializedEntityPose} from '../utils'

@inject(SessionService, DeviceService, TimerService)
export class EmptyRealityLoader extends RealityLoader {

    public type = 'empty';

    constructor(
        private sessionService: SessionService,
        private deviceService: DeviceService,
        private timer: TimerService) {
        super();
    }

    public load(reality: RealityView, callback: (realitySession: SessionPort) => void): void {
        const realitySession = this.sessionService.addManagedSessionPort();
        const remoteRealitySession = this.sessionService.createSessionPort();
        let doUpdate = true;
        remoteRealitySession.on['ar.context.update'] = () => { };
        remoteRealitySession.connectEvent.addEventListener(() => {
            let update = (time: JulianDate, index: number) => {
                if (doUpdate) {
                    this.deviceService.update();
                    const frameState: SerializedPartialFrameState = {
                        time,
                        index,
                        eye: {
                            pose: getSerializedEntityPose(this.deviceService.displayEntity, time)
                        }
                    }
                    remoteRealitySession.send('ar.reality.frameState', frameState);
                    this.timer.requestFrame(update);
                }
            }
            this.timer.requestFrame(update);
        })
        remoteRealitySession.closeEvent.addEventListener(() => {
            doUpdate = false;
        });

        callback(realitySession);
        // Only connect after the caller is able to attach connectEvent handlers
        const messageChannel = this.sessionService.createSynchronousMessageChannel();
        realitySession.open(messageChannel.port1, this.sessionService.configuration);
        remoteRealitySession.open(messageChannel.port2, { role: Role.REALITY_VIEW, name: 'empty' });
    }
}
