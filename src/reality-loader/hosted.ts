
import {inject, singleton} from 'aurelia-dependency-injection'

import {Role, SerializedFrameState, SubviewType} from '../common'
import {SessionService, SessionPort} from '../session'
import {RealityLoader, RealityView} from '../reality'
import {ViewService} from '../view'

@inject(SessionService, ViewService)
export class HostedRealityLoader extends RealityLoader {

    public type = 'hosted';

    public iframeElement: HTMLIFrameElement;

    constructor(
        private sessionService: SessionService,
        private viewService: ViewService) {
        super();
        this.iframeElement = document.createElement('iframe');
        this.iframeElement.style.border = '0';
        this.iframeElement.width = '100%';
        this.iframeElement.height = '100%';
        viewService.element.insertBefore(this.iframeElement, viewService.element.firstChild);
    }

    public load(reality: RealityView, callback: (realitySession: SessionPort) => void): void {
        let handleConnectMessage = (ev) => {
            if (ev.data.type !== 'ARGON_SESSION') return;

            const messagePort: MessagePort = ev.ports && ev.ports[0];

            if (!messagePort)
                throw new Error('Received an ARGON_SESSION message without a MessagePort object');

            // get the event.source iframe
            let i = 0;
            let frame: HTMLIFrameElement | undefined;
            while (i < window.frames.length && !frame) {
                if (window.frames[i] == ev.source)
                    frame = document.getElementsByTagName('iframe')[i];
            }

            if (frame !== this.iframeElement) return;

            window.removeEventListener('message', handleConnectMessage);

            const realitySession = this.sessionService.addManagedSessionPort();
            callback(realitySession);
            realitySession.open(messagePort, this.sessionService.configuration);
        };
        window.addEventListener('message', handleConnectMessage);
        this.iframeElement.src = '';
        this.iframeElement.src = reality['url'];
        this.iframeElement.style.pointerEvents = 'auto';
    }

    private _handleMessage(ev: MessageEvent) {
    }
}

// @singleton()
// @inject(SessionFactory)
// export class DOMSessionListenerService {

// 	public sessionEvent = new Event<Session>();

// 	constructor(sessionFactory:SessionFactory) {
// 		window.addEventListener('message', ev => {
// 			if (ev.data.type != 'ARGON_SESSION') return;

// 			const messagePort:MessagePortLike = ev.ports && ev.ports[0];
// 			if (!messagePort) 
// 				throw new Error('Received an ARGON_SESSION message without a MessagePort object');

// 			// get the event.source iframe
// 			let i = 0;
// 			let frame:HTMLIFrameElement = null;
// 			while (i < window.frames.length && frame != null) {
// 				if (window.frames[i] == ev.source)
// 					frame = document.getElementsByTagName( 'iframe' )[i];
// 			}			

// 			const session = sessionFactory.create();
// 			session.frame = frame;

// 			if (frame) frame.addEventListener('load', function close() {
// 				frame.removeEventListener('load', close);
// 				console.log('IFrameSessionHandler: frame load detected, closing current session.', frame, session)
// 				session.close()
// 			});

// 			this.sessionEvent.raiseEvent(session);
// 		});
// 	}
// }
