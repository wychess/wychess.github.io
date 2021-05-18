class EmbedChannel {
    constructor(onMessage, writer) {
        this.writer = writer
        this.onMessage = onMessage
    }

    write(message, delay=0) {
        let that = this
        setTimeout(function(){ that.doWrite(message) }, delay)
    }

    doWrite(message) {
        const rep = this.writer(message)
        const lines = rep.split('\n')
        for(let index in lines) {
            this.onMessage(lines[index])
        }
    }
}
