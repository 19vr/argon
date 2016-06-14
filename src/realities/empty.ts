
import {inject, All} from 'aurelia-dependency-injection'
import {Matrix4, JulianDate} from '../cesium/cesium-imports'

import {Role, RealityView, SerializedFrameState, SubviewType} from '../common'
import {SessionService, SessionPort} from '../session'
import {DeviceService} from '../device'
import {TimerService} from '../timer'
import {RealityLoader} from '../reality'
import {getSerializedEntityPose} from '../utils'

@inject(SessionService, DeviceService, TimerService)
export class EmptyRealityLoader implements RealityLoader {

    public type = 'empty';

    constructor(
        private sessionService: SessionService,
        private deviceService: DeviceService,
        private timer: TimerService) {
    }

    public load(reality: RealityView) {
        const realitySession = this.sessionService.addManagedSessionPort();
        const remoteRealitySession = this.sessionService.createSessionPort();
        let doUpdate = true;
        remoteRealitySession.connectEvent.addEventListener(() => {
            const update = (time: JulianDate, index: number) => {
                if (doUpdate) {
                    this.deviceService.update();
                    const w = document.documentElement.clientWidth;
                    const h = document.documentElement.clientHeight;
                    const frameState: SerializedFrameState = {
                        time,
                        index,
                        view: {
                            viewport: {
                                x: 0,
                                y: 0,
                                width: w,
                                height: h
                            },
                            pose: getSerializedEntityPose(this.deviceService.interfaceEntity, time),
                            subviews: [
                                {
                                    type: SubviewType.SINGULAR,
                                    projectionMatrix: Matrix4.computePerspectiveFieldOfView(
                                        Math.PI / 3, w / h, 0.2, 10000000000, <any>[]
                                    )
                                }
                            ]
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
        const messageChannel = this.sessionService.createSynchronousMessageChannel();
        realitySession.open(messageChannel.port1, this.sessionService.configuration);
        remoteRealitySession.open(messageChannel.port2, { role: Role.REALITY_VIEW, name: 'empty' });
        return realitySession;
    }
}
