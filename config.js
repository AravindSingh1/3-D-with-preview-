class Config {
    constructor() {
        this.directionalLight,
            this.webGlRendererP,
            this.shadowRecievingPlane,
            this.ctrls
    }

    directionalLight = {
        castShadow: true,
        shadowMapSizeWidth: 512,        // to set the resolution in shadow
        shadowMapSizeheight: 512,       // default is 512
        shadowCameraNear: 0.5,          // nearest point to get light while camera is coming near
        shadowCameraFar: 100,
        shadowRadius: 1                // to make the shadow round at corners
    }

    webGlRendererP = {
        toneMappingExposure: 0.5,       // mapping of colors default is 0 ranges between 0-1
        shadowMapEnabled: true          // to enable mapping of shadow
    }

    shadowRecievingPlane = {
        recieveShadow: true,           // recieve shadow    default is false

    }

    ctrls = {
        minDistance: 0.1,               // min distance upto which camera go(zoom-in)
        maxDistance: 900,              // max distance (zoom-out)
    }
}

export { Config };