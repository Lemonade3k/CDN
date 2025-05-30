import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LunarDateConverter } from './LunarDateConverter.js';
import { getElement, hideElement, showElement } from '../utils/dom.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export class CountdownManager {
    constructor(timeSync) {
        this.timeSync = timeSync;
        this.countdowns = [];
        this.intervals = {};
        this.customCounterId = 1000;
    }

    addCountdown(countdownData) {
        this.countdowns.push(countdownData);
    }

    removeCountdown(idPrefix) {
        this.countdowns = this.countdowns.filter(c => c.idPrefix !== idPrefix);
        if (this.intervals[idPrefix]) {
            clearInterval(this.intervals[idPrefix]);
            delete this.intervals[idPrefix];
        }
    }

    updateCountdown(idPrefix, originalTargetDateString, showMinuteSecond) {
        if (!this.timeSync.isTimeInitialized()) return;

        const now = this.timeSync.getCurrentTime();
        let currentTarget = dayjs(originalTargetDateString);

        const countdownItem = this.countdowns.find(c => c.idPrefix === idPrefix);
        if (!countdownItem) {
            console.error(`Countdown data not found for ${idPrefix}`);
            this.updateDOM(idPrefix, '--', '--', '--', '--', '--', showMinuteSecond);
            this.updateVisibility(idPrefix, 0, 0, 0, 0, 0, showMinuteSecond);
            return;
        }

        const isCustom = idPrefix.startsWith('custom');

        // Auto-advance predefined holidays to next year if past
        if (!isCustom && currentTarget.isBefore(now)) {
            while (currentTarget.isBefore(now)) {
                currentTarget = currentTarget.add(1, 'year');
            }
        }

        const diff = currentTarget.diff(now);

        if (diff <= 0) {
            this.updateDOM(idPrefix, 0, 0, 0, 0, 0, showMinuteSecond);
            this.updateVisibility(idPrefix, 0, 0, 0, 0, 0, showMinuteSecond);
            return;
        }

        const durationObj = dayjs.duration(diff);

        // Calculate display values
        let displayMonths = 0;
        let displayDays = 0;
        let tempTargetForDisplay = dayjs(currentTarget);
        let tempNowForDisplay = dayjs(now);

        displayMonths = tempTargetForDisplay.diff(tempNowForDisplay, 'month');
        tempNowForDisplay = tempNowForDisplay.add(displayMonths, 'month');
        displayDays = tempTargetForDisplay.diff(tempNowForDisplay, 'day');

        if (displayDays < 0) {
            displayMonths = Math.max(0, displayMonths - 1);
            tempNowForDisplay = dayjs(now).add(displayMonths, 'month');
            displayDays = tempTargetForDisplay.diff(tempNowForDisplay, 'day');
        }
        displayMonths = Math.max(0, displayMonths);
        displayDays = Math.max(0, displayDays);

        const hours = durationObj.hours();
        const minutes = durationObj.minutes();
        const seconds = durationObj.seconds();

        this.updateDOM(idPrefix, displayMonths, displayDays, hours, minutes, seconds, showMinuteSecond);
        this.updateVisibility(idPrefix, displayMonths, displayDays, hours, minutes, seconds, showMinuteSecond);
    }

    updateDOM(idPrefix, months, days, hours, minutes, seconds, showMinuteSecond) {
        const monthEl = getElement(`${idPrefix}-month`);
        const dayEl = getElement(`${idPrefix}-day`);
        const hourEl = getElement(`${idPrefix}-hour`);
        const minuteEl = getElement(`${idPrefix}-minute`);
        const secondEl = getElement(`${idPrefix}-second`);

        if (monthEl) monthEl.textContent = months;
        if (dayEl) dayEl.textContent = days;
        if (hourEl) hourEl.textContent = hours.toString().padStart(2, '0');
        if (minuteEl) minuteEl.textContent = minutes.toString().padStart(2, '0');
        if (secondEl && showMinuteSecond) secondEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateVisibility(idPrefix, months, days, hours, minutes, seconds, showMinuteSecond) {
        const monthBlock = getElement(`${idPrefix}-month`)?.closest('.time-block');
        const dayBlock = getElement(`${idPrefix}-day`)?.closest('.time-block');
        const hourBlock = getElement(`${idPrefix}-hour`)?.closest('.time-block');
        const minuteBlock = getElement(`${idPrefix}-minute`)?.closest('.time-block');
        const secondBlock = getElement(`${idPrefix}-second`)?.closest('.time-block');

        if (months <= 0) {
            hideElement(monthBlock);
            if (days <= 0) {
                hideElement(dayBlock);
                if (hours <= 0) {
                    hideElement(hourBlock);
                    if (minutes <= 0) {
                        hideElement(minuteBlock);
                        if (!showMinuteSecond || seconds <= 0) {
                            hideElement(secondBlock);
                        } else {
                            showElement(secondBlock);
                        }
                    } else {
                        showElement(minuteBlock);
                        showElement(secondBlock);
                    }
                } else {
                    showElement(hourBlock);
                    showElement(minuteBlock);
                    showElement(secondBlock);
                }
            } else {
                showElement(dayBlock);
                showElement(hourBlock);
                showElement(minuteBlock);
                showElement(secondBlock);
            }
        } else {
            showElement(monthBlock);
            showElement(dayBlock);
            showElement(hourBlock);
            showElement(minuteBlock);
            showElement(secondBlock);
        }

        if (!showMinuteSecond) {
            hideElement(secondBlock);
        }
    }

    updateAllCountdowns() {
        if (!this.timeSync.isTimeInitialized()) return;
        
        this.countdowns.forEach(({ idPrefix, targetDate, showMinuteSecond }) => {
            const targetDayjs = dayjs(targetDate);
            if (targetDayjs.isValid()) {
                this.updateCountdown(idPrefix, targetDate, showMinuteSecond);
            } else {
                console.warn(`Invalid date format for ${idPrefix}: ${targetDate}`);
                this.updateDOM(idPrefix, '--', '--', '--', '--', '--', showMinuteSecond);
            }
        });
    }

    startAllCountdowns() {
        this.clearAllIntervals();
        this.updateAllCountdowns();

        this.intervals['mainUpdate'] = setInterval(() => this.updateAllCountdowns(), 1000);
    }

    clearAllIntervals() {
        for (const id in this.intervals) {
            clearInterval(this.intervals[id]);
        }
        this.intervals = {};
    }

    createTimeBlocks(containerId, idPrefix, showMinuteSecond = false) {
        const container = getElement(containerId);
        if (!container) return;

        const timeBlocks = [
            { id: `${idPrefix}-month`, label: 'Tháng', show: true },
            { id: `${idPrefix}-day`, label: 'Ngày', show: true },
            { id: `${idPrefix}-hour`, label: 'Giờ', show: true },
            { id: `${idPrefix}-minute`, label: 'Phút', show: true },
            { id: `${idPrefix}-second`, label: 'Giây', show: showMinuteSecond }
        ];

        container.innerHTML = timeBlocks
            .filter(block => block.show)
            .map(block => `
                <div class="time-block text-center min-w-[120px]">
                    <span id="${block.id}" class="text-5xl font-bold block mb-2">0</span>
                    <span class="text-sm">${block.label}</span>
                </div>
            `).join('');
    }

    generateCustomId() {
        return 'custom' + this.customCounterId++;
    }
}