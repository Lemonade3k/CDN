import dayjs from 'dayjs';

export class TimeSync {
    constructor() {
        this.timeOffset = 0;
        this.isInitialized = false;
        this.syncInterval = null;
    }

    async syncWithAPI() {
        try {
            const response = await fetch('https://worldtimeapi.org/api/ip');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            const serverTime = dayjs(data.datetime).valueOf();
            const clientTime = Date.now();
            this.timeOffset = serverTime - clientTime;
            
            console.log(`Time synced with WorldTimeAPI (${data.timezone}). Offset: ${this.timeOffset}ms`);
            
            if (!this.isInitialized) {
                this.isInitialized = true;
            }
            
            return true;
        } catch (error) {
            console.error("Could not sync time with WorldTimeAPI, using system time:", error);
            this.timeOffset = 0;
            
            if (!this.isInitialized) {
                this.isInitialized = true;
                console.warn("Using client's system time due to API error.");
            }
            
            return false;
        }
    }

    startPeriodicSync(interval = 300000) { // 5 minutes default
        this.syncInterval = setInterval(() => this.syncWithAPI(), interval);
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    getCurrentTime() {
        return dayjs(Date.now() + this.timeOffset);
    }

    getTimeOffset() {
        return this.timeOffset;
    }

    isTimeInitialized() {
        return this.isInitialized;
    }
}