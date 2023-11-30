class FlexMenu {
    constructor(flexDom, X, Y, MIN_X, MIN_Y, MAX_X, MAX_Y, config) {
        const defaultConfig = {
            'defaultX': X,
            'defaultY': Y,
            'minX': MIN_X,
            'minY': MIN_Y,
            'startActivityIntent': function(x, y) {
                return ActivityJs.startActivityIntent(x, y)
            },
            'changeResolution': function(x, y) {
                ActivityJs.changeResolution(x, y)
            },
            'touchMenu': true,
            'marginPercent': 7,
            'cogCallback': null,
            'infoCallback': null,
            'downCallback': null,
            'clearCallback': null
        }
        this.config = {...defaultConfig, ...config}

        this.bannerDom = img({src: 'img/wychess_arcade_banner.png', style: 'position: absolute'})
        document.body.appendChild(this.bannerDom)
        window.addEventListener('resize', this.onResize.bind(this))
        this.onResize()

        this.flexMenu = new FlexBoard(flexDom, MAX_X, MAX_Y, this.config)
    }

    fitBanner(width, height) {
        const marginFactor = 0.10
        const maxBannerWidth = width * (1 - 2 * marginFactor)
        const maxBannerHeight = height * (1 - 2 * marginFactor)
        const left = width * marginFactor
        const top = height * marginFactor
        const bannerRatio = 1350.0 / 650.0
        const placeRatio = maxBannerWidth / maxBannerHeight
        if (bannerRatio < placeRatio) {
            // fill vertical
            this.bannerDom.style.height = maxBannerHeight + 'px'
            this.bannerDom.style.top = top + 'px'

            let bannerWidth = maxBannerHeight * bannerRatio
            let extraOffset = (maxBannerWidth - bannerWidth) / 2

            this.bannerDom.style.width = bannerWidth + 'px'
            this.bannerDom.style.left = (left + extraOffset) + 'px'
        } else {
            // fill horizontal
            this.bannerDom.style.width = maxBannerWidth + 'px'
            this.bannerDom.style.left = left + 'px'

            let bannerHeight = maxBannerWidth / bannerRatio
            let extraOffset = (maxBannerHeight - bannerHeight) / 2

            this.bannerDom.style.height = bannerHeight + 'px'
            this.bannerDom.style.top = (top + extraOffset) + 'px'
        }
    }

    shrinkByMargin(size) {
        return size * (100 - 2 * this.config.marginPercent) / 100
    }

    onResize() {
        const outerWidth = document.body.offsetWidth
        const outerHeight = document.body.offsetHeight
        const outerRatio = outerHeight / outerWidth
        if (outerRatio > 1) {
            this.fitBanner(outerWidth, (outerHeight - this.shrinkByMargin(outerWidth)) / 2)
        } else {
            this.fitBanner((outerWidth - this.shrinkByMargin(outerHeight)) / 2, outerHeight)
        }
    }
}
