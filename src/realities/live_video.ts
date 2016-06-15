import {inject, All} from 'aurelia-dependency-injection'
import {Matrix4, JulianDate} from '../cesium/cesium-imports'

import {Role, RealityView, SerializedFrameState, SubviewType} from '../common'
import {SessionService, SessionPort} from '../session'
import {RealityLoader} from '../reality'
import {getSerializedEntityPose} from '../utils'
import {VuforiaServiceDelegate} from '../vuforia'

@inject(SessionService, VuforiaServiceDelegate)
export class LiveVideoRealityLoader implements RealityLoader {
    public type = 'live-video';

    constructor(
        private sessionService: SessionService,
        private vuforiaDelegate: VuforiaServiceDelegate) { }

    public load(reality: RealityView) {
        const realitySession = this.sessionService.addManagedSessionPort();
        const remoteRealitySession = this.sessionService.createSessionPort();

        this.vuforiaDelegate.videoEnabled = true;
        this.vuforiaDelegate.trackingEnabled = true;

        const remove = this.vuforiaDelegate.stateUpdateEvent.addEventListener((frameState) => {
            remoteRealitySession.send('ar.reality.frameState', frameState);
        });

        remoteRealitySession.closeEvent.addEventListener(() => {
            remove();
            this.vuforiaDelegate.videoEnabled = false;
            this.vuforiaDelegate.trackingEnabled = false;
        });

        const messageChannel = this.sessionService.createSynchronousMessageChannel();
        realitySession.open(messageChannel.port1, this.sessionService.configuration);
        remoteRealitySession.open(messageChannel.port2, { role: Role.REALITY_VIEW, name: 'live_video' });
        return realitySession;
    }
}
