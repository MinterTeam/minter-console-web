/**
 * Calculates time offset based on response date header
 * NTP-like
 */

let averageOffset = 0;
let offsetArray = [];

// minimum offsets count to calculate average
const MIN_OFFSET_COUNT = 3;
// maximum offsets count to store
const MAX_OFFSET_COUNT = 100;

/**
 * @return {number} - milliseconds
 */
export function getTimeOffset() {
    return averageOffset;
}

export function addTimeInterceptor(instance) {
    instance.interceptors.request.use((request) => {
        request.ts = Date.now();
        return request;
    });

    instance.interceptors.response.use((response) => {
        const responseTime = new Date(response.headers.date).getTime();
        updateOffset(response.config.ts, responseTime);
        return response;
    });
}

function updateOffset(requestTime, responseTime) {
    // responseTime = performance.now() + 10 * 1000;
    if (!responseTime || isNaN(responseTime)) {
        return;
    }
    const currentOffset = ntpOffset(requestTime, responseTime, responseTime, Date.now());
    if (offsetArray.length === MAX_OFFSET_COUNT) {
        offsetArray.shift();
    }
    offsetArray.push(currentOffset);

    if (offsetArray.length >= MIN_OFFSET_COUNT) {
        const offsetSum = offsetArray.reduce((a, b) => a + b);
        averageOffset = Math.round(offsetSum / offsetArray.length);
    }
}

// the NTP algorithm
// t0 is the client's timestamp of the request packet transmission,
// t1 is the server's timestamp of the request packet reception,
// t2 is the server's timestamp of the response packet transmission and
// t3 is the client's timestamp of the response packet reception.
function ntpOffset(t0, t1, t2, t3) {
    return Math.round(((t1 - t0) + (t2 - t3)) / 2);
}
