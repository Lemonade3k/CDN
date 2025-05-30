/**
 * Lunar Calendar Conversion Module
 * Based on Ho Ngoc Duc's algorithm
 */
export class LunarDateConverter {
    static getNewMoonDay(k, timeZone) {
        const T = k / 1236.85;
        const T2 = T * T;
        const T3 = T2 * T;
        let jd = 2451550.09765 + 29.530588853 * k + 0.0001337 * T2 - 0.000000150 * T3 + 0.00000073 * Math.sin(this.toRadians(166.56 + 132.87 * T - 0.009173 * T2));
        jd += (timeZone - (-7)) * 29.530588853 / (1236.85 * 24);
        return Math.round(jd);
    }

    static getSunLongitude(jd, timeZone) {
        const T = (jd - 2451545.0 - timeZone / 24) / 36525;
        const T2 = T * T;
        const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
        const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
        const C = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(this.toRadians(M)) +
                  (0.019993 - 0.000101 * T) * Math.sin(this.toRadians(2 * M)) +
                  0.000290 * Math.sin(this.toRadians(3 * M));
        return this.normalizeAngle(L0 + C);
    }

    static getLunarMonth11(yy, timeZone) {
        const off = Math.floor((yy - 2000) * 12.3685);
        let k = off - 5;
        let nmPrev = 0;
        while (true) {
            const nm = this.getNewMoonDay(k, timeZone);
            if (nmPrev > 0 && nm > nmPrev && this.getSunLongitude(nm, timeZone) >= 240 && this.getSunLongitude(nmPrev, timeZone) < 240) {
                return nmPrev;
            }
            nmPrev = nm;
            k++;
            if (k > off + 17) break;
        }
        return 0;
    }

    static getLeapMonthOffset(a11, timeZone) {
        let k = Math.floor((a11 - 2451545.0) / 29.530588853) + 1;
        let lastLon = 0;
        let lastSLon = 0;
        for (let i = 0; i < 14; i++) {
            const nm = this.getNewMoonDay(k + i, timeZone);
            const lon = this.getSunLongitude(nm, timeZone);
            const sLon = Math.floor(lon / 30);
            if (i > 0 && sLon === lastSLon) return i;
            lastLon = lon;
            lastSLon = sLon;
        }
        return 0;
    }

    static julianToDate(jd) {
        let j = jd + 0.5;
        let z = Math.floor(j);
        let f = j - z;
        let a = z;
        if (z >= 2299161) {
            const alpha = Math.floor((z - 1867216.25) / 36524.25);
            a = z + 1 + alpha - Math.floor(alpha / 4);
        }
        const b = a + 1524;
        const c = Math.floor((b - 122.1) / 365.25);
        const d = Math.floor(365.25 * c);
        const e = Math.floor((b - d) / 30.6001);
        const day = b - d - Math.floor(30.6001 * e) + f;
        const month = (e < 14) ? (e - 1) : (e - 13);
        const year = (month > 2) ? (c - 4716) : (c - 4715);
        return { day: Math.floor(day), month: month, year: year };
    }

    static dateToJulian(day, month, year) {
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
        if (year > 1582 || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15)) {
            return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        }
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    }

    static solarToLunar(dd, mm, yy, timeZone = 7) {
        const jd = this.dateToJulian(dd, mm, yy);
        const lunarMonth11 = this.getLunarMonth11(yy, timeZone);
        const leapOffset = this.getLeapMonthOffset(lunarMonth11, timeZone);
        let k = Math.floor((jd - lunarMonth11) / 29.530588853);
        if (k < 0) k = 0;
        const newMoonDay = this.getNewMoonDay(Math.floor((lunarMonth11 - 2451545.0) / 29.530588853) + k, timeZone);
        const lunarDay = jd - newMoonDay + 1;
        let lunarMonth = k + 11;
        let isLeap = 0;
        if (leapOffset > 0 && k >= leapOffset) {
            lunarMonth = k + 11 - 1;
            if (k === leapOffset) isLeap = 1;
        }
        const lunarYear = (lunarMonth > 10) ? (yy - 1) : yy;
        if (lunarMonth > 12) lunarMonth -= 12;
        return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap: isLeap };
    }

    static lunarToSolar(lunarDay, lunarMonth, lunarYear, isLeapLunarMonth, timeZone = 7) {
        const refSolarYearForAnchor = lunarYear - 1;
        const newMoon11 = this.getLunarMonth11(refSolarYearForAnchor, timeZone);
        const leapOff = this.getLeapMonthOffset(newMoon11, timeZone);
        let monthSteps = lunarMonth + 1;

        if (leapOff > 0) {
            if (isLeapLunarMonth && (lunarMonth + 1 === leapOff)) {
                monthSteps = leapOff;
            } else if ((lunarMonth + 1) >= leapOff) {
                monthSteps++;
            }
        }
        const kAnchor = Math.floor((newMoon11 - 2451545.0) / 29.530588853);
        const newMoonDay = this.getNewMoonDay(kAnchor + monthSteps, timeZone);
        const solarDate = this.julianToDate(newMoonDay + lunarDay - 1);
        return solarDate;
    }

    static toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    static normalizeAngle(degrees) {
        degrees = degrees % 360;
        return (degrees < 0) ? (degrees + 360) : degrees;
    }
}